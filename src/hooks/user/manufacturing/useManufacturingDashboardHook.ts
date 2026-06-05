import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { SUB_DEPT_LABELS } from "./manufacturingWorkflowData";

export const useManufacturingDashboardHook = () => {
  const { subDept } = useParams();

  return useMemo(() => {
    const subDeptKey = subDept ?? "";

    return {
      subDept: subDeptKey,
      subDeptLabel: SUB_DEPT_LABELS[subDeptKey] ?? subDeptKey,
      isRawMaterialPrepFlow: subDeptKey === "raw-material-prep",
      isCasePreparationFlow: subDeptKey === "case-preparation",
      isMixingFlow: subDeptKey === "mixing",
      isCastingAndCuringFlow: subDeptKey === "casting-and-curing",
      isPostCureFlow: subDeptKey === "post-cure-operations",
    };
  }, [subDept]);
};

export default useManufacturingDashboardHook;