import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProcessParticularRows,
  getAvailableStageNumbers,
  getMixingCycleByValue,
  type MixingStageValue,
} from "./mixingConfig";
import {
  createDefaultMixingFormState,
  createEmptyFinalMixEntry,
  createEmptyPremixEntry,
  type FinalMixEntry,
  type MixingFormState,
  type PremixEntry,
  type ProcessParticularRow,
  type QualityCheckRow,
} from "../../../data/models/user/MixingFormModel";

export const useMixingFormHook = (
  initialData?: MixingFormState,
  onBlocksChange?: (payload: MixingFormState) => void,
  maxStageCount = 4,
) => {
  const [premixCards, setPremixCards] = useState<PremixEntry[]>(
    initialData?.premixCards ?? createDefaultMixingFormState().premixCards,
  );
  const [finalMixCards, setFinalMixCards] = useState<FinalMixEntry[]>(
    initialData?.finalMixCards ?? createDefaultMixingFormState().finalMixCards,
  );
  const [selectedMixingStage, setSelectedMixingStage] = useState<MixingStageValue | "">("");
  const [selectedStageNo, setSelectedStageNo] = useState<number | "">("");

  useEffect(() => {
    const next = initialData ?? createDefaultMixingFormState();
    setPremixCards(next.premixCards);
    setFinalMixCards(next.finalMixCards);
    setSelectedMixingStage("");
    setSelectedStageNo("");
  }, [initialData]);

  const notify = useCallback(
    (nextPremixCards: PremixEntry[], nextFinalMixCards: FinalMixEntry[]) => {
      onBlocksChange?.({ premixCards: nextPremixCards, finalMixCards: nextFinalMixCards });
    },
    [onBlocksChange],
  );

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
    if (!canAddStageCard || selectedStageNo === "") return;

    if (selectedMixingStage === "PREMIX") {
      if (premixCards.some((entry) => entry.premixNo === String(selectedStageNo))) return;
      const nextPremixCards = [...premixCards, createEmptyPremixEntry(selectedStageNo)].sort(
        (a, b) => Number(a.premixNo) - Number(b.premixNo),
      );
      setPremixCards(nextPremixCards);
      notify(nextPremixCards, finalMixCards);
    }

    if (selectedMixingStage === "FINAL_MIX") {
      if (finalMixCards.some((entry) => entry.mixNo === String(selectedStageNo))) return;
      const nextFinalMixCards = [...finalMixCards, createEmptyFinalMixEntry(selectedStageNo)].sort(
        (a, b) => Number(a.mixNo) - Number(b.mixNo),
      );
      setFinalMixCards(nextFinalMixCards);
      notify(premixCards, nextFinalMixCards);
    }

    setSelectedStageNo("");
  }, [
    canAddStageCard,
    finalMixCards,
    notify,
    premixCards,
    selectedMixingStage,
    selectedStageNo,
  ]);

  const removePremixCard = useCallback(
    (premixNo: string) => {
      const nextPremixCards = premixCards.filter((entry) => entry.premixNo !== premixNo);
      setPremixCards(nextPremixCards);
      notify(nextPremixCards, finalMixCards);
      if (selectedStageNo === Number(premixNo)) {
        setSelectedStageNo("");
      }
    },
    [finalMixCards, notify, premixCards, selectedStageNo],
  );

  const removeFinalMixCard = useCallback(
    (mixNo: string) => {
      const nextFinalMixCards = finalMixCards.filter((entry) => entry.mixNo !== mixNo);
      setFinalMixCards(nextFinalMixCards);
      notify(premixCards, nextFinalMixCards);
      if (selectedStageNo === Number(mixNo)) {
        setSelectedStageNo("");
      }
    },
    [finalMixCards, notify, premixCards, selectedStageNo],
  );

  const updatePremixField = useCallback(
    (
      premixNo: string,
      field: keyof Omit<PremixEntry, "premixNo" | "processParticulars" | "qualityChecks">,
      value: string,
    ) => {
      setPremixCards((prev) => {
        const next = prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;

          if (field === "mixingCycle") {
            const cycle = getMixingCycleByValue(value);
            return {
              ...premix,
              mixingCycle: value,
              processParticulars: cycle ? createProcessParticularRows(cycle.operations) : [],
            };
          }

          return { ...premix, [field]: value };
        });
        notify(next, finalMixCards);
        return next;
      });
    },
    [finalMixCards, notify],
  );

  const updateProcessParticular = useCallback(
    (
      premixNo: string,
      rowId: number,
      field: keyof ProcessParticularRow,
      value: string,
    ) => {
      setPremixCards((prev) => {
        const next = prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;
          return {
            ...premix,
            processParticulars: premix.processParticulars.map((row) =>
              row.id === rowId ? { ...row, [field]: value } : row,
            ),
          };
        });
        notify(next, finalMixCards);
        return next;
      });
    },
    [finalMixCards, notify],
  );

  const updateQualityCheck = useCallback(
    (
      premixNo: string,
      parameter: string,
      field: keyof QualityCheckRow,
      value: string,
    ) => {
      setPremixCards((prev) => {
        const next = prev.map((premix) => {
          if (premix.premixNo !== premixNo) return premix;
          return {
            ...premix,
            qualityChecks: premix.qualityChecks.map((row) =>
              row.parameter === parameter ? { ...row, [field]: value } : row,
            ),
          };
        });
        notify(next, finalMixCards);
        return next;
      });
    },
    [finalMixCards, notify],
  );

  const updateFinalMixField = useCallback(
    (
      mixNo: string,
      field: keyof Omit<FinalMixEntry, "mixNo" | "qualityChecks">,
      value: string,
    ) => {
      setFinalMixCards((prev) => {
        const next = prev.map((entry) =>
          entry.mixNo === mixNo ? { ...entry, [field]: value } : entry,
        );
        notify(premixCards, next);
        return next;
      });
    },
    [notify, premixCards],
  );

  const updateFinalMixQualityCheck = useCallback(
    (
      mixNo: string,
      parameter: string,
      field: keyof QualityCheckRow,
      value: string,
    ) => {
      setFinalMixCards((prev) => {
        const next = prev.map((entry) => {
          if (entry.mixNo !== mixNo) return entry;
          return {
            ...entry,
            qualityChecks: entry.qualityChecks.map((row) =>
              row.parameter === parameter ? { ...row, [field]: value } : row,
            ),
          };
        });
        notify(premixCards, next);
        return next;
      });
    },
    [notify, premixCards],
  );

  const formState = useMemo(
    () => ({ premixCards, finalMixCards }),
    [finalMixCards, premixCards],
  );

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
    updateQualityCheck,
    updateFinalMixField,
    updateFinalMixQualityCheck,
  };
};

export default useMixingFormHook;
