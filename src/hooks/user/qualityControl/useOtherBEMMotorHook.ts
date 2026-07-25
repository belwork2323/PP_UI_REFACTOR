import { useMemo } from "react";
import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { useBaseStaticTestFacility } from "./useBaseStaticTestFacility";

export const useOtherBEMMotorHook = (enabled: boolean = true) => {
  const baseHook = useBaseStaticTestFacility({
    defaultMotorType: "MAIN_MOTOR",
    facilityType: "OTHER_BEM",
    enabled,
  });

  // 3. Return a clean object without memoizing the object reference wrapper itself
  return {
    ...baseHook,
  };
};

export default useOtherBEMMotorHook;
