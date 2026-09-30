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
import { resolveMasterDataName } from "../../../data/models/admin/BatchManagement/BatchManagementModel";

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
const NUMERIC_PROCESS_FIELDS: Set<keyof ProcessParticularRow> = new Set([
  "rpm",
  "time",
  "temp",
  "vacuum",
]);
export const useMixingFormHook = (
  initialData?: MixingFormState,
  onBlocksChange?: (payload: MixingFormState) => void,
  maxStageCount = 4,
  identificationSheet?: {
    mixerType?: string | { code?: string | null; name?: string | null } | null;
    batchSize?: string;
    date?: string;
  } | null,
) => {
  const sheetMixerType = resolveMasterDataName(identificationSheet?.mixerType);
  const [premixCards, setPremixCards] = useState<PremixEntry[]>(
    initialData?.premixCards?.length
      ? initialData.premixCards
      : buildInitialPremixCardsWithDefaults(
          maxStageCount,
          sheetMixerType,
          null,
          identificationSheet?.batchSize,
          identificationSheet?.date,
        ),
  );

  const [finalMixCards, setFinalMixCards] = useState<FinalMixEntry[]>(
    initialData?.finalMixCards?.length
      ? initialData.finalMixCards
      : buildInitialFinalMixCardsWithDefaults(
          maxStageCount,
          sheetMixerType,
          null,
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
              resolveMasterDataName(identificationSheet?.mixerType),
              null,
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
    (
      premixNo: string,
      rowId: number,
      field: keyof ProcessParticularRow,
      value: string | number,
    ) => {
      const parsedValue = value;

      setPremixCards((prev) =>
        prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;
          return {
            ...premix,
            processParticulars: premix.processParticulars.map((row) =>
              row.operationId === rowId ? { ...row, [field]: parsedValue } : row,
            ),
          };
        }),
      );
    },
    [],
  );

  const applyPremixQualityChecks = useCallback((rows: QualityCheckRow[], targetIndex?: number) => {
    if (!rows.length) return;

    setPremixCards((prev) =>
      prev.map((premix, index) => {
        // If a targetIndex is specified, only update that specific card
        if (targetIndex !== undefined && index !== targetIndex) return premix;

        return {
          ...premix,
          qualityChecks: rows.map((row) => {
            const sampleCount = Math.max(1, Number(row.noOfSamples) || 1);
            const currentRow = premix.qualityChecks.find(
              (entry) => entry.parameterId === row.parameterId,
            );

            const specification = currentRow?.specification ?? row.specification;
            const existingValues = currentRow?.observedValues ?? [];
            const observedValues = Array.from(
              { length: sampleCount },
              (_, i) => existingValues[i] ?? "",
            );

            return {
              ...row,
              specification,
              observedValues,
            };
          }),
        };
      }),
    );
  }, []);

  const applyFinalMixQualityChecks = useCallback(
    (rows: QualityCheckRow[], targetIndex?: number) => {
      if (!rows.length) return;

      setFinalMixCards((prev) =>
        prev.map((entry, index) => {
          if (targetIndex !== undefined && index !== targetIndex) return entry;

          const nextRows = rows.map((row) => {
            const sampleCount = Math.max(1, Number(row.noOfSamples) || 1);
            const currentRow = entry.qualityChecks.find(
              (item) => item.parameterId === row.parameterId,
            );

            const specification = currentRow?.specification ?? row.specification;
            const existingValues = currentRow?.observedValues ?? [];
            const observedValues = Array.from(
              { length: sampleCount },
              (_, i) => existingValues[i] ?? "",
            );

            return {
              ...row,
              specification,
              observedValues,
            };
          });

          return { ...entry, qualityChecks: nextRows };
        }),
      );
    },
    [],
  );

  const setPremixMixingCycle = useCallback(
    (
      premixNo: string | number,
      value: string,
      extras?: { mixingCycleCode?: string; mixingCycleName?: string },
    ) => {
      setPremixCards((prev) =>
        prev.map((card) =>
          String(card.premixNo) === String(premixNo)
            ? {
                ...card,
                mixingCycle: value,
                ...(extras?.mixingCycleCode != null
                  ? { mixingCycleCode: extras.mixingCycleCode }
                  : {}),
                ...(extras?.mixingCycleName != null
                  ? { mixingCycleName: extras.mixingCycleName }
                  : {}),
              }
            : card,
        ),
      );
    },
    [],
  );

  const setFinalMixMixingCycle = useCallback(
    (
      mixNo: string | number,
      value: string,
      extras?: { mixingCycleCode?: string; mixingCycleName?: string },
    ) => {
      setFinalMixCards((prev) =>
        prev.map((card) =>
          String(card.mixNo) === String(mixNo) // use mixNo, not finalMixNo
            ? {
                ...card,
                mixingCycle: value,
                ...(extras?.mixingCycleCode != null
                  ? { mixingCycleCode: extras.mixingCycleCode }
                  : {}),
                ...(extras?.mixingCycleName != null
                  ? { mixingCycleName: extras.mixingCycleName }
                  : {}),
              }
            : card,
        ),
      );
    },
    [],
  );

  const updateFinalMixProcessParticular = useCallback(
    (mixNo: string, rowId: number, field: keyof ProcessParticularRow, value: string | number) => {
      const parsedValue = value;

      setFinalMixCards((prev) =>
        prev.map((card) =>
          card.mixNo === mixNo
            ? {
                ...card,
                processParticulars: card.processParticulars.map((row) =>
                  row.operationId === rowId ? { ...row, [field]: parsedValue } : row,
                ),
              }
            : card,
        ),
      );
    },
    [],
  );

  const updateFinalMixQualityCheck = useCallback(
    (mixNo: number | string, parameterId: string | number, index: number, value: string) => {
      setFinalMixCards((prev) =>
        prev.map((entry) => {
          // Match against mixNo (converted to String for type-safe comparison)
          if (String(entry.mixNo) !== String(mixNo)) return entry;
          return {
            ...entry,
            qualityChecks: entry.qualityChecks.map((row) => {
              if (row.parameterId !== parameterId) return row;
              const updatedValues = [...(row.observedValues ?? [])];
              updatedValues[index] = value;
              return { ...row, observedValues: updatedValues };
            }),
          };
        }),
      );
    },
    [],
  );

  const updateQualityCheck = useCallback(
    (premixNo: string, parameterId: string | number, index: number, value: string) => {
      setPremixCards((prev) =>
        prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;
          return {
            ...premix,
            qualityChecks: premix.qualityChecks.map((row) => {
              if (row.parameterId !== parameterId) return row;
              const updatedValues = [...(row.observedValues ?? [])];
              updatedValues[index] = value;
              return { ...row, observedValues: updatedValues };
            }),
          };
        }),
      );
    },
    [],
  );

  const updateFinalMixField = useCallback(
    (
      mixNo: string | number,
      field: keyof Omit<FinalMixEntry, "mixNo" | "qualityChecks" | "processParticulars">,
      value: string,
    ) => {
      setFinalMixCards((prev) =>
        prev.map((entry) =>
          String(entry.mixNo) === String(mixNo) ? { ...entry, [field]: value } : entry,
        ),
      );
    },
    [],
  );

  const applyPremixOperationsAndQCs = useCallback(
    (operations: any[], qualityChecks: any[], targetPremixNo: string | number) => {
      setPremixCards((prev) =>
        prev.map((card) => {
          if (targetPremixNo != null && String(card.premixNo) !== String(targetPremixNo)) {
            return card; // leave other premixes untouched
          }
          return {
            ...card,
            processParticulars: (operations ?? []).map((op) => ({ ...op })),
            qualityChecks: (qualityChecks ?? []).map((qc) => ({ ...qc })),
          };
        }),
      );
    },
    [],
  );

  const applyFinalMixOperationsAndQCs = useCallback(
    (operations: any[], qualityChecks: any[], targetMixNo: string | number) => {
      setFinalMixCards((prev) =>
        prev.map((card) => {
          if (targetMixNo != null && String(card.mixNo) !== String(targetMixNo)) {
            return card;
          }
          return {
            ...card,
            processParticulars: (operations ?? []).map((op) => ({ ...op })),
            qualityChecks: (qualityChecks ?? []).map((qc) => ({ ...qc })),
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
    applyPremixOperationsAndQCs,
    applyFinalMixOperationsAndQCs,
    setFinalMixMixingCycle,
    setPremixMixingCycle,
  };
};

export default useMixingFormHook;
