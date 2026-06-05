import { useCallback, useEffect, useMemo, useState } from "react";
import { createLinearPreparationData } from "./linearPreparationConfig";

type LinearData = ReturnType<typeof createLinearPreparationData>;

export const useLinearPreparationHook = (
  initialData?: Partial<LinearData>,
  onBlocksChange?: (payload: LinearData) => void
) => {
  const defaults = createLinearPreparationData();

  const [premix, setPremix] = useState({
    ...defaults.premix,
    ...(initialData?.premix ?? {}),
  });
  const [finalMix, setFinalMix] = useState({
    ...defaults.finalMix,
    ...(initialData?.finalMix ?? {}),
  });

  useEffect(() => {
    setPremix({
      ...defaults.premix,
      ...(initialData?.premix ?? {}),
    });
    setFinalMix({
      ...defaults.finalMix,
      ...(initialData?.finalMix ?? {}),
    });
  }, [initialData]);

  const notifyParent = useCallback(
    (nextPremix: typeof premix, nextFinalMix: typeof finalMix) => {
      onBlocksChange?.({
        premix: nextPremix,
        finalMix: nextFinalMix,
      });
    },
    [onBlocksChange]
  );

  const handlePremixChange = useCallback(
    (field: keyof typeof premix, value: string) => {
      setPremix((prev) => {
        const next = { ...prev, [field]: value };
        notifyParent(next, finalMix);
        return next;
      });
    },
    [finalMix, notifyParent]
  );

  const handleFinalMixChange = useCallback(
    (field: keyof typeof finalMix, value: string) => {
      setFinalMix((prev) => {
        const next = { ...prev, [field]: value };
        notifyParent(premix, next);
        return next;
      });
    },
    [notifyParent, premix]
  );

  return useMemo(
    () => ({
      premix,
      finalMix,
      handlePremixChange,
      handleFinalMixChange,
    }),
    [finalMix, handleFinalMixChange, handlePremixChange, premix]
  );
};

export default useLinearPreparationHook;
