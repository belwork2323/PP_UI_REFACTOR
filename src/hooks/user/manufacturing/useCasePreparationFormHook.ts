import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countFilledNested,
  createCasePreparationData,
} from "./casePreparationConfig";

type CasePrepData = ReturnType<typeof createCasePreparationData>;

export const useCasePreparationFormHook = (
  initialData?: Partial<CasePrepData>,
  onBlocksChange?: (payload: CasePrepData) => void
) => {
  const defaults = createCasePreparationData();
  const [motorCaseIds, setMotorCaseIdsState] = useState(initialData?.motorCaseIds ?? defaults.motorCaseIds);
  const [motorNos, setMotorNosState] = useState(initialData?.motorNos ?? defaults.motorNos);
  const [ga, setGa] = useState(initialData?.ga ?? defaults.ga);
  const [lco, setLco] = useState(initialData?.lco ?? defaults.lco);

  useEffect(() => {
    setMotorCaseIdsState(initialData?.motorCaseIds ?? defaults.motorCaseIds);
    setMotorNosState(initialData?.motorNos ?? defaults.motorNos);
    setGa(initialData?.ga ?? defaults.ga);
    setLco(initialData?.lco ?? defaults.lco);
  }, [initialData]);

  const notifyParent = useCallback(
    (nextMotorCaseIds: typeof motorCaseIds, nextMotorNos: typeof motorNos, nextGa: typeof ga, nextLco: typeof lco) => {
      onBlocksChange?.({
        motorCaseIds: nextMotorCaseIds,
        motorNos: nextMotorNos,
        ga: nextGa,
        lco: nextLco,
      });
    },
    [onBlocksChange]
  );

  const setMotorCaseIds = useCallback(
    (updater: any) => {
      setMotorCaseIdsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        notifyParent(next, motorNos, ga as any, lco as any);
        return next;
      });
    },
    [notifyParent, motorNos, ga, lco]
  );

  const setMotorNos = useCallback(
    (updater: any) => {
      setMotorNosState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        notifyParent(motorCaseIds, next, ga as any, lco as any);
        return next;
      });
    },
    [notifyParent, motorCaseIds, ga, lco]
  );

  const updateGa = useCallback(
    (field: string, motor: "m1" | "m2", value: string) => {
      setGa((prev: any) => {
        const next = { ...prev, [field]: { ...prev[field], [motor]: value } };
        notifyParent(motorCaseIds, motorNos, next, lco as any);
        return next;
      });
    },
    [lco, notifyParent, motorCaseIds, motorNos]
  );

  const updateLco = useCallback(
    (field: string, motor: "m1" | "m2", value: string) => {
      setLco((prev: any) => {
        const next = { ...prev, [field]: { ...prev[field], [motor]: value } };
        notifyParent(motorCaseIds, motorNos, ga as any, next);
        return next;
      });
    },
    [ga, notifyParent, motorCaseIds, motorNos]
  );

  const gaFilled = useMemo(() => countFilledNested(ga as any), [ga]);
  const lcoFilled = useMemo(() => countFilledNested(lco as any), [lco]);
  const gaTotal = Object.keys(defaults.ga).length * 2;
  const lcoTotal = Object.keys(defaults.lco).length * 2;

  return {
    motorCaseIds,
    setMotorCaseIds,
    motorNos,
    setMotorNos,
    ga,
    lco,
    gaFilled,
    gaTotal,
    lcoFilled,
    lcoTotal,
    updateGa,
    updateLco,
  };
};

export default useCasePreparationFormHook;
