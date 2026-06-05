import { Box } from "@mui/material";
import useSourcingDashboardHook from "../../../../hooks/user/sourcing/useSourcingDashboardHook";
import useApproverDepartmentHeaderHook from "../../../../hooks/approver/useApproverDepartmentHeaderHook";
import DepartmentHeader from "../../../components/custom/DepartmentHeader";
import { STRINGS } from "../../../../app/config/strings";

import RawMaterialApproverPage from "./RawMaterialProcurementApproverPage";
import RocketMotorApproverPage from "./RocketMotorCasingApproverPage";

const S = STRINGS.APPROVER.DASHBOARD.SOURCING;

const SourcingApproverDashboard = () => {
  const {subDept, subDeptLabel,isRawMaterialFlow, isRocketMotorFlow } = useSourcingDashboardHook();
  const { stats, userName, userRole } = useApproverDepartmentHeaderHook({
    department: "sourcing",
    subDeptSlug: subDept,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <DepartmentHeader
        deptName={S.DEPARTMENT_NAME}
        subDeptName={subDeptLabel}
        userName={userName}
        userRole={userRole}
        stats={stats}
      />
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {isRawMaterialFlow && <RawMaterialApproverPage />}
        {isRocketMotorFlow && <RocketMotorApproverPage />}
      </Box>
    </Box>
  );
};

export default SourcingApproverDashboard;
