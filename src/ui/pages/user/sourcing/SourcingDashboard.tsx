import { Box } from "@mui/material";
import RawMaterialProcurement from "./RawMaterialProcurementPage";
import RocketMotorCasing from "./RocketMotorCasingPage";
import DepartmentHeader from "../../../components/custom/DepartmentHeader";
import { useMemo } from "react";
import { useThemeStore } from "../../../../app/store/themeStore";
import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import useSourcingDashboardHook from "../../../../hooks/user/sourcing/useSourcingDashboardHook";
import useSourcingDepartmentHeaderHook from "../../../../hooks/user/sourcing/useSourcingDepartmentHeaderHook";

export default function SourcingDashboard() {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const { subDept, subDeptLabel, isRawMaterialFlow, isRocketMotorFlow } = useSourcingDashboardHook();
  const { userName, userRole, stats, statItems } = useSourcingDepartmentHeaderHook(subDept);

  return (
    <Box sx={theme.dashboard.container}>
      <DepartmentHeader
        deptName={theme.sourcing.dashboard.departmentName}
        subDeptName={subDeptLabel}
        userName={userName}
        userRole={userRole}
        stats={stats}
        statItems={statItems}
      />

      <Box sx={theme.dashboard.content}>
        {isRawMaterialFlow && <RawMaterialProcurement />}
        {isRocketMotorFlow && <RocketMotorCasing />}
      </Box>
    </Box>
  );
}
