import { useEffect, useMemo, useState } from "react";

import { useAuthStore } from "../../app/store/authStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { getApproverSubDepartmentDashboardStats } from "../../controllers/approver/approverController";
import {
  UserSubDepartmentDashboardStatsModel,
  type UserSubDepartmentDashboardStats,
} from "../../data/models/user/UserSubDepartmentDashboardStatsModel";

type UseApproverDepartmentHeaderHookArgs = {
  department: ApproverDepartmentKey;
  subDeptSlug?: string;
};

const DEPARTMENT_SLUGS: Record<ApproverDepartmentKey, string> = {
  sourcing: "sourcing",
  manufacturing: "manufacturing",
  dispatch: "dispatch",
  qualityControl: "quality",
};

export const useApproverDepartmentHeaderHook = ({
  department,
  subDeptSlug,
}: UseApproverDepartmentHeaderHookArgs) => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<UserSubDepartmentDashboardStats>(
    UserSubDepartmentDashboardStatsModel.empty(),
  );

  const userName = user?.username || String(user?.userId || "Approver");
  const userRole = user?.role ? user.role.replace(/_/g, " ") : "Approver";

  const deptSlug = DEPARTMENT_SLUGS[department];

  const selectedSubDepartment = useMemo(
    () =>
      user?.allSubDepartments.find(
        (subDept) => subDept.slugs?.dept === deptSlug && subDept.slugs?.subDept === subDeptSlug,
      ) ?? null,
    [deptSlug, subDeptSlug, user],
  );

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (!selectedSubDepartment?.subDepartmentId) {
        if (!cancelled) setStats(UserSubDepartmentDashboardStatsModel.empty());
        return;
      }

      const response = await getApproverSubDepartmentDashboardStats(selectedSubDepartment.subDepartmentId);
      if (!cancelled) {
        setStats(response.stats ?? UserSubDepartmentDashboardStatsModel.empty());
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [selectedSubDepartment?.subDepartmentId]);

  return {
    stats,
    userName,
    userRole,
  };
};

export default useApproverDepartmentHeaderHook;