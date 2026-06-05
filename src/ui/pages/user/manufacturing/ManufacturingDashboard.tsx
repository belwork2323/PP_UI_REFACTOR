// src/ui/pages/user/manufacturing/ManufacturingDashboard.tsx
import { useMemo } from "react";
import { Box } from "@mui/material";
import { icons } from "../../../../app/theme";
import DepartmentHeader from "../../../components/custom/DepartmentHeader";
import useUserDepartmentHeaderHook from "../../../../hooks/user/useUserDepartmentHeaderHook";
import { useThemeStore } from "../../../../app/store/themeStore";
import getOperationsTheme from "../../../../app/theme/custom_themes/shared/operations_theme";
import { STRINGS } from "../../../../app/config/strings";
import useManufacturingDashboardHook from "../../../../hooks/user/manufacturing/useManufacturingDashboardHook";

import RawMaterialPreparationPage from "./RawMaterial/RawMaterialPreparationPage";
import CasePreparationPage from "./CasePreparation/CasePreparationPage";
import MixingPage from "./Mixing/MixingPage";
import CastingCuringPage from "./CastingAndCuring/CastingAndCuringPage";
import PostCurePage from "./PostCure/PostCurePage";

export default function ManufacturingDashboard() {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getOperationsTheme(mode), [mode]);
  const FactoryIcon = icons.Factory || icons.Build;
  const {
    subDept,
    subDeptLabel,
    isRawMaterialPrepFlow,
    isCasePreparationFlow,
    isMixingFlow,
    isCastingAndCuringFlow,
    isPostCureFlow,
  } = useManufacturingDashboardHook();

  const { userName, userRole, stats } = useUserDepartmentHeaderHook({
    deptSlug: "manufacturing",
    subDeptSlug: subDept,
  });

  return (
    <Box sx={theme.dashboard.container}>
      <DepartmentHeader
        icon={FactoryIcon}
        deptName={STRINGS.MANUFACTURING.DEPARTMENT_NAME}
        subDeptName={subDeptLabel}
        userName={userName}
        userRole={userRole}
        stats={stats}
      />
      <Box sx={theme.dashboard.content}>
        {isRawMaterialPrepFlow && <RawMaterialPreparationPage />}
        {isCasePreparationFlow && <CasePreparationPage />}
        {isMixingFlow && <MixingPage />}
        {isCastingAndCuringFlow && <CastingCuringPage />}
        {isPostCureFlow && <PostCurePage />}
      </Box>
    </Box>
  );
}
