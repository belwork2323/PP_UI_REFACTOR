import { Suspense, useMemo } from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";

import { useThemeStore } from "@app/store/themeStore";
import DepartmentHeader from "@ui/components/custom/DepartmentHeader";
import useDepartmentHeader from "@hooks/user/useDepartmentHeader";
import { USER_DASHBOARD_SECTIONS, type UserDepartment } from "./userDashboardSections";

type UserDashboardProps = {
  dept: UserDepartment;
};

export default function UserDashboard({ dept }: UserDashboardProps) {
  const { subDept } = useParams();
  const mode = useThemeStore((state) => state.mode);
  const department = USER_DASHBOARD_SECTIONS[dept];
  const layout = useMemo(() => department.getLayout(mode), [department, mode]);
  const { userName, userRole, stats, statItems } = useDepartmentHeader(dept, subDept);

  const subDeptKey = subDept ?? "";
  const Section = department.sections[subDeptKey];

  return (
    <Box sx={layout.container}>
      <DepartmentHeader
        icon={department.icon}
        deptName={department.name}
        subDeptName={department.labels[subDeptKey] ?? subDeptKey}
        userName={userName}
        userRole={userRole}
        stats={stats}
        statItems={statItems}
      />

      <Box sx={layout.content}>
        <Suspense fallback={null}>{Section ? <Section /> : null}</Suspense>
      </Box>
    </Box>
  );
}
