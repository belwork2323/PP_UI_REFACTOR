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

const mergeQualityChecksPreservingObserved = (
  incoming: QualityCheckRow[] | undefined,
  current: QualityCheckRow[] | undefined,
): QualityCheckRow[] => {
  const template = Array.isArray(incoming) ? incoming : [];
  const existing = Array.isArray(current) ? current : [];
  if (!template.length) return existing;
  return template.map((row) => {
    const paramKey = String(row.parameterId ?? "").trim();
    const prior = existing.find((item) => String(item.parameterId ?? "").trim() === paramKey);
    const sampleCount = Math.max(
      1,
      Number(row.noOfSamples) || 1,
      Number(prior?.noOfSamples) || 0,
      Array.isArray(prior?.observedValues) ? prior!.observedValues!.length : 0,
    );
    const priorValues = Array.isArray(prior?.observedValues) ? prior!.observedValues! : [];
    const templateValues = Array.isArray(row.observedValues) ? row.observedValues : [];
    return {
      ...row,
      parameterId: paramKey || String(row.parameterId ?? ""),
      noOfSamples: sampleCount,
      observedValues: Array.from({ length: sampleCount }, (_, i) => {
        const fromPrior = priorValues[i];
        if (fromPrior != null && String(fromPrior).trim() !== "") return String(fromPrior);
        const fromTemplate = templateValues[i];
        return fromTemplate == null ? "" : String(fromTemplate);
      }),
    };
  });
};

const mergeCardsPreservingObservedValues = <T extends PremixEntry | FinalMixEntry>(
  current: T[],
  incoming: T[],
  idKey: "premixNo" | "mixNo",
): T[] => {
  if (!Array.isArray(incoming) || !incoming.length) return current;
  return incoming.map((card) => {
    const cardId = String((card as Record<string, unknown>)[idKey] ?? "").trim();
    const prior = current.find(
      (item) => String((item as Record<string, unknown>)[idKey] ?? "").trim() === cardId,
    );
    if (!prior) return card;
    return {
      ...card,
      qualityChecks: mergeQualityChecksPreservingObserved(card.qualityChecks, prior.qualityChecks),
      // Keep process rows the user already filled when incoming is only a template seed.
      processParticulars:
        (prior.processParticulars?.length ?? 0) > 0
          ? prior.processParticulars
          : card.processParticulars,
    } as T;
  });
};

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
  /** Last payload we published upward — used to ignore parent echoes that would clobber typing. */
  const lastEmittedSerializedRef = useRef<string | null>(null);

  const publishBlocks = useCallback((nextPremix: PremixEntry[], nextFinal: FinalMixEntry[]) => {
    const payload = { premixCards: nextPremix, finalMixCards: nextFinal };
    lastEmittedSerializedRef.current = JSON.stringify(payload);
    onBlocksChangeRef.current?.(payload);
  }, []);

  // Sync state upward when cards change (skip one beat after controlled downward hydrate).
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    publishBlocks(premixCards, finalMixCards);
  }, [premixCards, finalMixCards, publishBlocks]);

  // Sync initialData downward only for *external* parent updates (load / cycle enrich).
  // Never re-apply our own upward echo — that was overwriting observed values mid-typing
  // (e.g. enter 100, parent still had 9, local got reset to 9 on save).
  useEffect(() => {
    if (!initialData) return;

    const incomingPremix = initialData.premixCards ?? [];
    const incomingFinal = initialData.finalMixCards ?? [];
    if (!incomingPremix.length) return;

    const incomingSerialized = JSON.stringify({
      premixCards: incomingPremix,
      finalMixCards: incomingFinal,
    });
    if (incomingSerialized === lastEmittedSerializedRef.current) return;

    isInternalUpdate.current = true;
    setPremixCards((prev) => mergeCardsPreservingObservedValues(prev, incomingPremix, "premixNo"));
    setFinalMixCards((prev) => {
      if (incomingFinal.length > 0) {
        return mergeCardsPreservingObservedValues(prev, incomingFinal, "mixNo");
      }
      return buildInitialFinalMixCardsWithDefaults(
        incomingPremix.length,
        resolveMasterDataName(identificationSheet?.mixerType),
        null,
        identificationSheet?.batchSize,
        identificationSheet?.date,
      );
    });
  }, [initialData, identificationSheet?.mixerType, identificationSheet?.batchSize, identificationSheet?.date]);

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
      premixNo: string | number,
      rowId: number,
      field: keyof ProcessParticularRow,
      value: string | number,
    ) => {
      const parsedValue = value;

      setPremixCards((prev) =>
        prev.map((premix) => {
          if (String(premix.premixNo) !== String(premixNo)) return premix;
          return {
            ...premix,
            processParticulars: premix.processParticulars.map((row) =>
              Number(row.operationId) === Number(rowId) ? { ...row, [field]: parsedValue } : row,
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
            const paramKey = String(row.parameterId ?? "").trim();
            const sampleCount = Math.max(1, Number(row.noOfSamples) || 1);
            const currentRow = premix.qualityChecks.find(
              (entry) => String(entry.parameterId ?? "").trim() === paramKey,
            );

            const specification = currentRow?.specification ?? row.specification;
            const existingValues = Array.isArray(currentRow?.observedValues)
              ? currentRow!.observedValues!
              : [];
            const observedValues = Array.from(
              { length: sampleCount },
              (_, i) => (existingValues[i] == null ? "" : String(existingValues[i])),
            );

            return {
              ...row,
              parameterId: paramKey,
              specification,
              noOfSamples: sampleCount,
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
            const paramKey = String(row.parameterId ?? "").trim();
            const sampleCount = Math.max(1, Number(row.noOfSamples) || 1);
            const currentRow = entry.qualityChecks.find(
              (item) => String(item.parameterId ?? "").trim() === paramKey,
            );

            const specification = currentRow?.specification ?? row.specification;
            const existingValues = Array.isArray(currentRow?.observedValues)
              ? currentRow!.observedValues!
              : [];
            const observedValues = Array.from(
              { length: sampleCount },
              (_, i) => (existingValues[i] == null ? "" : String(existingValues[i])),
            );

            return {
              ...row,
              parameterId: paramKey,
              specification,
              noOfSamples: sampleCount,
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
    (
      mixNo: string | number,
      rowId: number,
      field: keyof ProcessParticularRow,
      value: string | number,
    ) => {
      const parsedValue = value;

      setFinalMixCards((prev) =>
        prev.map((card) =>
          String(card.mixNo) === String(mixNo)
            ? {
                ...card,
                processParticulars: card.processParticulars.map((row) =>
                  Number(row.operationId) === Number(rowId) ? { ...row, [field]: parsedValue } : row,
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
      const sampleIndex = Number(index);
      if (!Number.isFinite(sampleIndex) || sampleIndex < 0) return;
      const paramKey = String(parameterId ?? "").trim();
      setFinalMixCards((prev) =>
        prev.map((entry) => {
          if (String(entry.mixNo) !== String(mixNo)) return entry;
          return {
            ...entry,
            qualityChecks: entry.qualityChecks.map((row) => {
              if (String(row.parameterId ?? "").trim() !== paramKey) return row;
              const sampleCount = Math.max(
                1,
                Number(row.noOfSamples) || 1,
                sampleIndex + 1,
                Array.isArray(row.observedValues) ? row.observedValues.length : 0,
              );
              const updatedValues = Array.from({ length: sampleCount }, (_, i) => {
                if (i === sampleIndex) return String(value ?? "");
                const existing = Array.isArray(row.observedValues) ? row.observedValues[i] : "";
                return existing == null ? "" : String(existing);
              });
              return { ...row, parameterId: paramKey, observedValues: updatedValues };
            }),
          };
        }),
      );
    },
    [],
  );

  const updateQualityCheck = useCallback(
    (premixNo: string | number, parameterId: string | number, index: number, value: string) => {
      const sampleIndex = Number(index);
      if (!Number.isFinite(sampleIndex) || sampleIndex < 0) return;
      const paramKey = String(parameterId ?? "").trim();
      setPremixCards((prev) =>
        prev.map((premix) => {
          if (String(premix.premixNo) !== String(premixNo)) return premix;
          return {
            ...premix,
            qualityChecks: premix.qualityChecks.map((row) => {
              if (String(row.parameterId ?? "").trim() !== paramKey) return row;
              const sampleCount = Math.max(
                1,
                Number(row.noOfSamples) || 1,
                sampleIndex + 1,
                Array.isArray(row.observedValues) ? row.observedValues.length : 0,
              );
              const updatedValues = Array.from({ length: sampleCount }, (_, i) => {
                if (i === sampleIndex) return String(value ?? "");
                const existing = Array.isArray(row.observedValues) ? row.observedValues[i] : "";
                return existing == null ? "" : String(existing);
              });
              return { ...row, parameterId: paramKey, observedValues: updatedValues };
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
          const nextProcess = Array.isArray(operations) ? operations.map((op) => ({ ...op })) : [];
          // Keep process rows the user already filled; only seed when empty.
          const processParticulars =
            (card.processParticulars?.length ?? 0) > 0 ? card.processParticulars : nextProcess;
          return {
            ...card,
            processParticulars,
            // Never wipe in-progress / saved observed values when cycle details arrive late.
            qualityChecks: mergeQualityChecksPreservingObserved(qualityChecks, card.qualityChecks),
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
          const nextProcess = Array.isArray(operations) ? operations.map((op) => ({ ...op })) : [];
          const processParticulars =
            (card.processParticulars?.length ?? 0) > 0 ? card.processParticulars : nextProcess;
          return {
            ...card,
            processParticulars,
            qualityChecks: mergeQualityChecksPreservingObserved(qualityChecks, card.qualityChecks),
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
