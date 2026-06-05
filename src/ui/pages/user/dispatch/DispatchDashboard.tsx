// src/ui/pages/user/dispatch/DispatchDashboard.jsx

import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { colors } from "../../../../app/theme";
import DepartmentHeader from "../../../components/custom/DepartmentHeader";
import useUserDepartmentHeaderHook from "../../../../hooks/user/useUserDepartmentHeaderHook";

import DispatchPage from "./DispatchPage";

const SUB_DEPT_LABELS = {
  dispatch: "Dispatch",
};

export default function DispatchDashboard() {
  const { subDept } = useParams();
  const { userName, userRole, stats } = useUserDepartmentHeaderHook({
    deptSlug: "dispatch",
    subDeptSlug: subDept,
  });

  return (
    <Box sx={{ p: 3, background: colors.dashboard.light.pageBg, minHeight: "100vh" }}>
      <DepartmentHeader
        deptName="Dispatch Department"
        subDeptName={SUB_DEPT_LABELS[subDept] ?? subDept}
        userName={userName}
        userRole={userRole}
        stats={stats}
      />

      <Box sx={{ mt: 2 }}>{subDept === "dispatch" && <DispatchPage />}</Box>
    </Box>
  );
}
