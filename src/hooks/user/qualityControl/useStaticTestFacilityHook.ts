import { useSubdepartmentBatches } from "../useSubdepartmentBatches";
import { useBaseStaticTestFacility } from "./useBaseStaticTestFacility";

export const useStaticTestFacilityHook = () => {
  const listParams = useSubdepartmentBatches("static-test-facility");

  return useBaseStaticTestFacility({
    listParams,
    defaultMotorType: "BEM",
    facilityType: "ACEM",
    enabled: true,
  });
};

export default useStaticTestFacilityHook;
