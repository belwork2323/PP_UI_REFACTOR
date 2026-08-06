import { useMemo } from "react";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { useBaseStaticTestFacility } from "./useBaseStaticTestFacility";

export const useACEMMotorHook = (enabled: boolean = true) => {
  const listParams = useSubdepartmentBatches("static-test-facility");

  const baseHook = useBaseStaticTestFacility({
    listParams,
    defaultMotorType: "BEM",
    facilityType: "ACEM",
    enabled,
  });

  // 1. Safely extract batches array from baseHook
  const rawBatches = baseHook?.batches ?? [];

  // 3. Return a clean object without memoizing the object reference wrapper itself
  return {
    ...baseHook,
    batches: rawBatches,
  };
};

export default useACEMMotorHook;
