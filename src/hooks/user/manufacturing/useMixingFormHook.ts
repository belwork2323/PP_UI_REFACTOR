import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAvailableStageNumbers,
  type MixingStageValue,
} from "./mixingConfig";
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

const buildInitialPremixCards = (count: number): PremixEntry[] =>
  Array.from({ length: Math.max(1, count || 1) }, (_, index) => createEmptyPremixEntry(index + 1));

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
    return { ...card, linkedPremixNo: String(index + 1) };
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
    return { ...card, linkedPremixNo: String(index + 1) };
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
  const finalMixCardsRef = useRef<FinalMixEntry[]>(finalMixCards);

  useEffect(() => {
    finalMixCardsRef.current = finalMixCards;
  }, [finalMixCards]);

  useEffect(() => {
    const next = initialData ?? createDefaultMixingFormState();
    const hasPersistedPremixCards = (next.premixCards?.length ?? 0) > 0;
    const hasPersistedFinalMixCards = (next.finalMixCards?.length ?? 0) > 0;
    const cardCount = Math.max(
      next.premixCards?.length ?? 0,
      next.finalMixCards?.length ?? 0,
      Math.max(1, Number(maxStageCount) || 1),
    );
    const bldgNo = identificationSheet?.bldgNo ?? identificationSheet?.BldgNo;

    if (hasPersistedPremixCards) {
      setPremixCards(next.premixCards);
      setFinalMixCards(
        hasPersistedFinalMixCards
          ? next.finalMixCards
          : buildInitialFinalMixCardsWithDefaults(
              next.premixCards.length,
              identificationSheet?.mixerType,
              bldgNo,
              identificationSheet?.batchSize,
              identificationSheet?.date,
            ),
      );
      setSelectedMixingStage("");
      setSelectedStageNo("");
      return;
    }

    const generatedPremixCards = buildInitialPremixCardsWithDefaults(
      cardCount,
      identificationSheet?.mixerType,
      bldgNo,
      identificationSheet?.batchSize,
      identificationSheet?.date,
    );
    const generatedFinalMixCards = buildInitialFinalMixCardsWithDefaults(
      cardCount,
      identificationSheet?.mixerType,
      bldgNo,
      identificationSheet?.batchSize,
      identificationSheet?.date,
    );

    setPremixCards(generatedPremixCards);
    setFinalMixCards(generatedFinalMixCards);
    setSelectedMixingStage("");
    setSelectedStageNo("");
  }, [initialData, maxStageCount, identificationSheet]);

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
      const nextPremixCards = premixCards.filter((entry) => entry.premixNo !== premixNo);
      setPremixCards(nextPremixCards);
      if (selectedStageNo === Number(premixNo)) {
        setSelectedStageNo("");
      }
    },
    [finalMixCards, premixCards, selectedStageNo],
  );

  const removeFinalMixCard = useCallback(
    (mixNo: string) => {
      const nextFinalMixCards = finalMixCards.filter((entry) => entry.mixNo !== mixNo);
      setFinalMixCards(nextFinalMixCards);
      if (selectedStageNo === Number(mixNo)) {
        setSelectedStageNo("");
      }
    },
    [finalMixCards, premixCards, selectedStageNo],
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
      setPremixCards((prev) => {
        const next = prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;
          return {
            ...premix,
            processParticulars: premix.processParticulars.map((row) =>
              row.operationId === rowId ? { ...row, [field]: value } : row,
            ),
          };
        });
        return next;
      });
    },
    [finalMixCards],
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
            (entry) => entry.parameterId === row.parameterId,
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
  const updateFinalMixProcessParticular = useCallback((mixNo, rowId, field, value) => {
    setFinalMixCards((prev) => {
      const next = prev.map((card) =>
        card.mixNo === mixNo
          ? {
              ...card,
              processParticulars: card.processParticulars.map((row) =>
                row.operationId === rowId ? { ...row, [field]: value } : row,
              ),
            }
          : card,
      );

      return next;
    });
  }, []);
  const updateQualityCheck = useCallback(
    (
      premixNo: string,
      parameterId: string,
      field: "observed1" | "observed2" | "observed3" | "observed4",
      value: string,
    ) => {
      setPremixCards((prev) => {
        const next = prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;
          return {
            ...premix,
            qualityChecks: premix.qualityChecks.map((row) =>
              row.parameterId === parameterId ? { ...row, [field]: value } : row,
            ),
          };
        });
        return next;
      });
    },
    [finalMixCards],
  );

  const updateFinalMixField = useCallback(
    (mixNo: string, field: keyof Omit<FinalMixEntry, "mixNo" | "qualityChecks">, value: string) => {
      setFinalMixCards((prev) => {
        const next = prev.map((entry) =>
          entry.mixNo === mixNo ? { ...entry, [field]: value } : entry,
        );
        return next;
      });
    },
    [premixCards],
  );

  const updateFinalMixQualityCheck = useCallback(
    (
      mixNo: string,
      parameterId: string,
      field: "observed1" | "observed2" | "observed3" | "observed4",
      value: string,
    ) => {
      setFinalMixCards((prev) => {
        const next = prev.map((entry) => {
          if (entry.mixNo !== mixNo) return entry;
          return {
            ...entry,
            qualityChecks: entry.qualityChecks.map((row) =>
              row.parameterId === parameterId ? { ...row, [field]: value } : row,
            ),
          };
        });
        return next;
      });
    },
    [premixCards],
  );

  const formState = useMemo(() => ({ premixCards, finalMixCards }), [finalMixCards, premixCards]);
  useEffect(() => {
    onBlocksChange?.({
      premixCards,
      finalMixCards,
    });
  }, [premixCards, finalMixCards]);
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
