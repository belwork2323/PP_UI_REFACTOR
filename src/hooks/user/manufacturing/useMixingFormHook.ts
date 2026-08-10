import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAvailableStageNumbers, type MixingStageValue } from "./mixingConfig";
import {
  createDefaultMixingFormState,
  createEmptyFinalMixEntry,
  createEmptyPremixEntry,
  createPremixEntryWithDefaults,
  createFinalMixEntryWithDefaults,
  type FinalMixEntry,
  type MixingFormState,
  type PremixEntry,
  type ProcessParticularRow,
  type QualityCheckRow,
} from "../../../data/models/user/MixingFormModel";

const buildInitialPremixCardsWithDefaults = (
  count: number,
  mixerType?: string | null,
  bldgNo?: string | null,
  batchSize?: string,
  mixingDate?: string,
): PremixEntry[] =>
  Array.from({ length: Math.max(1, count || 1) }, (_, index) =>
    createPremixEntryWithDefaults(index + 1, mixerType, bldgNo, batchSize, mixingDate),
  );

const buildInitialFinalMixCards = (count: number): FinalMixEntry[] =>
  Array.from({ length: Math.max(1, count || 1) }, (_, index) => {
    const card = createEmptyFinalMixEntry(index + 1);
    return { ...card, finalMixNo: String(index + 1) };
  });

const buildInitialFinalMixCardsWithDefaults = (
  count: number,
  mixerType?: string | null,
  bldgNo?: string | null,
  batchSize?: string,
  mixingDate?: string,
): FinalMixEntry[] => {
  return Array.from({ length: Math.max(1, count || 1) }, (_, index) => {
    const card = createFinalMixEntryWithDefaults(index + 1, mixerType, bldgNo);
    return { ...card, finalMixNo: String(index + 1) };
  });
};

export const useMixingFormHook = (
  initialData?: MixingFormState,
  onBlocksChange?: (payload: MixingFormState) => void,
  maxStageCount = 4,
  identificationSheet?: {
    mixerType?: string | null;
    bldgNo?: string | null;
    BldgNo?: string | null;
    batchSize?: string;
    date?: string;
  } | null,
) => {
  const [premixCards, setPremixCards] = useState<PremixEntry[]>(
    initialData?.premixCards?.length
      ? initialData.premixCards
      : buildInitialPremixCardsWithDefaults(
          maxStageCount,
          identificationSheet?.mixerType,
          identificationSheet?.bldgNo,
          identificationSheet?.batchSize,
          identificationSheet?.date,
        ),
  );

  const [finalMixCards, setFinalMixCards] = useState<FinalMixEntry[]>(
    initialData?.finalMixCards?.length
      ? initialData.finalMixCards
      : buildInitialFinalMixCardsWithDefaults(
          maxStageCount,
          identificationSheet?.mixerType,
          identificationSheet?.bldgNo,
          identificationSheet?.batchSize,
          identificationSheet?.date,
        ),
  );

  const [selectedMixingStage, setSelectedMixingStage] = useState<MixingStageValue | "">("");
  const [selectedStageNo, setSelectedStageNo] = useState<number | "">("");

  // Ref to hold onBlocksChange to avoid triggering useEffect loops
  const onBlocksChangeRef = useRef(onBlocksChange);
  useEffect(() => {
    onBlocksChangeRef.current = onBlocksChange;
  }, [onBlocksChange]);

  // Keep a reference to prevent initialData updates from triggering cyclic re-renders
  const isInternalUpdate = useRef(false);

  // Sync state upward to parent ONLY when state changes internally
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    onBlocksChangeRef.current?.({
      premixCards,
      finalMixCards,
    });
  }, [premixCards, finalMixCards]);

  // Sync initialData downward ONLY when initialData actually changes externally
  useEffect(() => {
    if (!initialData) return;

    const hasPersistedPremixCards = (initialData.premixCards?.length ?? 0) > 0;
    const hasPersistedFinalMixCards = (initialData.finalMixCards?.length ?? 0) > 0;

    if (hasPersistedPremixCards) {
      isInternalUpdate.current = true;
      setPremixCards(initialData.premixCards);
      setFinalMixCards(
        hasPersistedFinalMixCards
          ? initialData.finalMixCards
          : buildInitialFinalMixCardsWithDefaults(
              initialData.premixCards.length,
              identificationSheet?.mixerType,
              identificationSheet?.bldgNo ?? identificationSheet?.BldgNo,
              identificationSheet?.batchSize,
              identificationSheet?.date,
            ),
      );
    }
  }, [initialData]);

  const usedPremixNumbers = useMemo(
    () => premixCards.map((entry) => Number(entry.premixNo)).filter((value) => value > 0),
    [premixCards],
  );

  const usedFinalMixNumbers = useMemo(
    () => finalMixCards.map((entry) => Number(entry.mixNo)).filter((value) => value > 0),
    [finalMixCards],
  );

  const availablePremixNumbers = useMemo(
    () => getAvailableStageNumbers(usedPremixNumbers, maxStageCount),
    [usedPremixNumbers, maxStageCount],
  );

  const availableFinalMixNumbers = useMemo(
    () => getAvailableStageNumbers(usedFinalMixNumbers, maxStageCount),
    [usedFinalMixNumbers, maxStageCount],
  );

  const availableStageNumbers =
    selectedMixingStage === "PREMIX"
      ? availablePremixNumbers
      : selectedMixingStage === "FINAL_MIX"
        ? availableFinalMixNumbers
        : [];

  const canAddStageCard = selectedMixingStage !== "" && selectedStageNo !== "";

  const handleMixingStageChange = useCallback((stage: MixingStageValue | "") => {
    setSelectedMixingStage(stage);
    setSelectedStageNo("");
  }, []);

  const handleStageNoChange = useCallback((stageNo: number | "") => {
    setSelectedStageNo(stageNo);
  }, []);

  const handleAddStageCard = useCallback(() => {
    if (!canAddStageCard) return;

    if (selectedMixingStage === "PREMIX") {
      if (premixCards.some((entry) => entry.premixNo === String(selectedStageNo))) return;
      const nextPremixCards = [...premixCards, createEmptyPremixEntry(selectedStageNo)].sort(
        (a, b) => Number(a.premixNo) - Number(b.premixNo),
      );
      setPremixCards(nextPremixCards);
    }

    if (selectedMixingStage === "FINAL_MIX") {
      if (finalMixCards.some((entry) => entry.mixNo === String(selectedStageNo))) return;
      const nextFinalMixCards = [...finalMixCards, createEmptyFinalMixEntry(selectedStageNo)].sort(
        (a, b) => Number(a.mixNo) - Number(b.mixNo),
      );
      setFinalMixCards(nextFinalMixCards);
    }

    setSelectedStageNo("");
  }, [canAddStageCard, finalMixCards, premixCards, selectedMixingStage, selectedStageNo]);

  const removePremixCard = useCallback(
    (premixNo: string) => {
      setPremixCards((prev) => prev.filter((entry) => entry.premixNo !== premixNo));
      if (selectedStageNo === Number(premixNo)) {
        setSelectedStageNo("");
      }
    },
    [selectedStageNo],
  );

  const removeFinalMixCard = useCallback(
    (mixNo: string) => {
      setFinalMixCards((prev) => prev.filter((entry) => entry.mixNo !== mixNo));
      if (selectedStageNo === Number(mixNo)) {
        setSelectedStageNo("");
      }
    },
    [selectedStageNo],
  );

  const updatePremixField = useCallback(
    (
      premixNo: string,
      field: keyof Omit<PremixEntry, "premixNo" | "processParticulars" | "qualityChecks">,
      value: string,
    ) => {
      setPremixCards((prev) =>
        prev.map((premix) =>
          premix.premixNo === premixNo ? { ...premix, [field]: value } : premix,
        ),
      );
    },
    [],
  );

  const updateProcessParticular = useCallback(
    (premixNo: string, rowId: number, field: keyof ProcessParticularRow, value: string) => {
      setPremixCards((prev) =>
        prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;
          return {
            ...premix,
            processParticulars: premix.processParticulars.map((row) =>
              row.operationId === rowId ? { ...row, [field]: value } : row,
            ),
          };
        }),
      );
    },
    [],
  );

  const applyPremixQualityChecks = useCallback((rows: QualityCheckRow[]) => {
    if (!rows.length) return;
    setPremixCards((prev) =>
      prev.map((premix) => ({
        ...premix,
        qualityChecks: rows.map((row) => {
          const currentRow = premix.qualityChecks.find(
            (entry) => entry.parameterId === row.parameterId,
          );

          return {
            ...row,
            observed1: currentRow?.observed1 ?? "",
            observed2: currentRow?.observed2 ?? "",
            observed3: currentRow?.observed3 ?? "",
            observed4: currentRow?.observed4 ?? "",
          };
        }),
      })),
    );
  }, []);

  const applyFinalMixQualityChecks = useCallback((rows: QualityCheckRow[]) => {
    setFinalMixCards((prev) =>
      prev.map((entry) => {
        if (!rows.length) return entry;

        const nextRows = rows.map((row) => {
          const currentRow = entry.qualityChecks.find(
            (item) => item.parameterId === row.parameterId,
          );
          return {
            ...row,
            observed1: currentRow?.observed1 ?? "",
            observed2: currentRow?.observed2 ?? "",
            observed3: currentRow?.observed3 ?? "",
            observed4: currentRow?.observed4 ?? "",
          };
        });

        return { ...entry, qualityChecks: nextRows };
      }),
    );
  }, []);

  const updateFinalMixProcessParticular = useCallback(
    (mixNo: string, rowId: number, field: keyof ProcessParticularRow, value: string) => {
      setFinalMixCards((prev) =>
        prev.map((card) =>
          card.mixNo === mixNo
            ? {
                ...card,
                processParticulars: card.processParticulars.map((row) =>
                  row.operationId === rowId ? { ...row, [field]: value } : row,
                ),
              }
            : card,
        ),
      );
    },
    [],
  );

  const updateQualityCheck = useCallback(
    (
      premixNo: string,
      parameterId: string,
      field: "observed1" | "observed2" | "observed3" | "observed4",
      value: string,
    ) => {
      setPremixCards((prev) =>
        prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;
          return {
            ...premix,
            qualityChecks: premix.qualityChecks.map((row) =>
              row.parameterId === parameterId ? { ...row, [field]: value } : row,
            ),
          };
        }),
      );
    },
    [],
  );

  const updateFinalMixField = useCallback(
    (mixNo: string, field: keyof Omit<FinalMixEntry, "mixNo" | "qualityChecks">, value: string) => {
      setFinalMixCards((prev) =>
        prev.map((entry) => (entry.mixNo === mixNo ? { ...entry, [field]: value } : entry)),
      );
    },
    [],
  );

  const updateFinalMixQualityCheck = useCallback(
    (
      mixNo: string,
      parameterId: string,
      field: "observed1" | "observed2" | "observed3" | "observed4",
      value: string,
    ) => {
      setFinalMixCards((prev) =>
        prev.map((entry) => {
          if (entry.mixNo !== mixNo) return entry;
          return {
            ...entry,
            qualityChecks: entry.qualityChecks.map((row) =>
              row.parameterId === parameterId ? { ...row, [field]: value } : row,
            ),
          };
        }),
      );
    },
    [],
  );

  const formState = useMemo(() => ({ premixCards, finalMixCards }), [finalMixCards, premixCards]);

  return {
    premixCards,
    finalMixCards,
    formState,
    selectedMixingStage,
    selectedStageNo,
    availablePremixNumbers,
    availableFinalMixNumbers,
    availableStageNumbers,
    canAddStageCard,
    handleMixingStageChange,
    handleStageNoChange,
    handleAddStageCard,
    removePremixCard,
    removeFinalMixCard,
    updatePremixField,
    updateProcessParticular,
    updateFinalMixProcessParticular,
    updateQualityCheck,
    updateFinalMixField,
    updateFinalMixQualityCheck,
    applyPremixQualityChecks,
    applyFinalMixQualityChecks,
  };
};

export default useMixingFormHook;
