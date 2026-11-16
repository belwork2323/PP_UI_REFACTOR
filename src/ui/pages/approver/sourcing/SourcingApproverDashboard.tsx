import { Suspense, useMemo } from "react";
import { Box } from "@mui/material";

import { useThemeStore } from "@app/store/themeStore";
import useSourcingDashboardHook from "@hooks/user/sourcing/shared/useSourcingDashboardHook";
import useApproverDepartmentHeaderHook from "@hooks/approver/useApproverDepartmentHeaderHook";
import DepartmentHeader from "@ui/components/custom/DepartmentHeader";
import RouteLoadingFallback from "@ui/components/common/RouteLoadingFallback";
import { APPROVER_DASHBOARD_SECTIONS } from "@ui/pages/approver/approverDashboardSections";

const SourcingApproverDashboard = () => {
  const mode = useThemeStore((state) => state.mode);
  const department = APPROVER_DASHBOARD_SECTIONS.sourcing;
  const layout = useMemo(() => department.getLayout(mode), [department, mode]);
  const { subDept, subDeptLabel } = useSourcingDashboardHook();
  const { statItems, userName, userRole } = useApproverDepartmentHeaderHook({
    department: "sourcing",
    subDeptSlug: subDept,
  });

  const Section = department.sections[subDept ?? ""];

  return (
    <Box sx={layout.container}>
      <DepartmentHeader
        deptName={department.name}
        subDeptName={subDeptLabel || department.labels[subDept ?? ""] || subDept}
        userName={userName}
        userRole={userRole}
        statItems={statItems}
      />
      <Box sx={layout.content}>
        <Suspense fallback={<RouteLoadingFallback />}>
          {Section ? <Section /> : null}
        </Suspense>
      </Box>
    </Box>
  );
};

export default SourcingApproverDashboard;
