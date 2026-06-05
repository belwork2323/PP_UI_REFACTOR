import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { SUB_DEPT_LABELS } from "./sourcingWorkflowData";

export const useSourcingDashboardHook = () => {
  const { subDept } = useParams();

  return useMemo(() => {
    const subDeptKey = subDept ?? "";
    return {
      subDept: subDeptKey,
      subDeptLabel: SUB_DEPT_LABELS[subDeptKey] ?? subDeptKey,
      isRawMaterialFlow: subDeptKey === "raw-material",
      isRocketMotorFlow: subDeptKey === "rocket-motor",
    };
  }, [subDept]);
};

export default useSourcingDashboardHook;
