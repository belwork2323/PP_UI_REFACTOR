import { Box } from "@mui/material";
import { useMemo } from "react";
import useSourcingDashboardHook from "../../../../hooks/user/sourcing/useSourcingDashboardHook";
import useApproverDepartmentHeaderHook from "../../../../hooks/approver/useApproverDepartmentHeaderHook";
import DepartmentHeader from "../../../components/custom/DepartmentHeader";
import { STRINGS } from "../../../../app/config/strings";
import { useThemeStore } from "../../../../app/store/themeStore";
import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";

import RawMaterialApproverPage from "./RawMaterialProcurementApproverPage";
import RocketMotorApproverPage from "./RocketMotorCasingApproverPage";

const S = STRINGS.APPROVER.DASHBOARD.SOURCING;

const SourcingApproverDashboard = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const { subDept, subDeptLabel, isRawMaterialFlow, isRocketMotorFlow } = useSourcingDashboardHook();
  const { statItems, userName, userRole } = useApproverDepartmentHeaderHook({
    department: "sourcing",
    subDeptSlug: subDept,
  });

  return (
    <Box sx={theme.dashboard.container}>
      <DepartmentHeader
        deptName={S.DEPARTMENT_NAME}
        subDeptName={subDeptLabel}
        userName={userName}
        userRole={userRole}
        statItems={statItems}
      />
      <Box sx={theme.dashboard.content}>
        {isRawMaterialFlow && <RawMaterialApproverPage />}
        {isRocketMotorFlow && <RocketMotorApproverPage />}
      </Box>
    </Box>
  );
};

export default SourcingApproverDashboard;
