// src/ui/pages/user/quality_control/QualityControlDashboard.jsx

import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import DepartmentHeader from "../../../components/custom/DepartmentHeader";
import useUserDepartmentHeaderHook from "../../../../hooks/user/useUserDepartmentHeaderHook";
import { useThemeStore } from "../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { STRINGS } from "../../../../app/config/strings";

import QCDivisionPage from "./QCDivision/QCDivisionPage";
import NDTPage from "./NDT/NDTPage";
import STFPage from "./StaticTestFacility/StaticTestFacilityPage";
// import QCInProcessPage   from "./in_process/QCInProcessPage";
// import QCNDTPage         from "./ndt/QCNDTPage";
// import QCBallisticPage   from "./ballistic/QCBallisticPage";

const SUB_DEPT_LABELS = {
  "raw-material-revalidation": "Raw Material Revalidation",
  "qc-division":                "Quality Control",
  "ndt":                       "NDT",
  "static-test-facility":      "Static Test Facility",
};

export default function QualityControlDashboard() {
  const { subDept } = useParams();
  const mode = useThemeStore((state) => state.mode);
  const theme = getQualityControlTheme(mode);
  const { userName, userRole, stats, statItems } = useUserDepartmentHeaderHook({
    deptSlug: "quality",
    subDeptSlug: subDept,
  });

  return (
    <Box sx={theme.dashboard.container}>
      <DepartmentHeader
        deptName={STRINGS.QUALITY_CONTROL.DEPARTMENT_NAME}
        subDeptName={SUB_DEPT_LABELS[subDept] ?? subDept}
        userName={userName}
        userRole={userRole}
        stats={stats}
        statItems={statItems}
      />

      <Box sx={theme.dashboard.content}>
        {(subDept === "raw-material-revalidation" || subDept === "qc-division") && (
          <QCDivisionPage />
        )}
        {subDept === "ndt"        && <NDTPage />}
        {subDept === "static-test-facility"  && <STFPage />}
      </Box>
    </Box>
  );
}