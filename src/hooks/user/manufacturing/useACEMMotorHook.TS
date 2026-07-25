import { useMemo } from "react";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { useBaseStaticTestFacility } from "./useBaseStaticTestFacility";

export const useACEMMotorHook = (enabled: boolean = true) => {
  const listParams = useSubdepartmentBatches("static-test-facility");

  const baseHook = useBaseStaticTestFacility({
    listParams,
    defaultMotorType: "MAIN_MOTOR",
    facilityType: "ACEM",
    enabled,
  });

  // 1. Safely extract batches array from baseHook
  const rawBatches = baseHook?.batches ?? [];

  // 2. Filter batches whenever rawBatches updates
  const acemBatches = useMemo(() => {
    return rawBatches.filter((batch: any) => batch?.subType !== "BEM");
  }, [rawBatches]);

  // 3. Return a clean object without memoizing the object reference wrapper itself
  return {
    ...baseHook,
    batches: acemBatches,
  };
};

export default useACEMMotorHook;
