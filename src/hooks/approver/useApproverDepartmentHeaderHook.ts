import { useEffect, useMemo, useState } from "react";

import { useAuthStore } from "../../app/store/authStore";
import { useApproverListRefreshStore } from "../../app/store/approverListRefreshStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { getApproverSubDepartmentDashboardStats } from "../../controllers/approver/approverController";
import {
  ApproverSubDepartmentDashboardStatsModel,
  type ApproverSubDepartmentDashboardStats,
} from "../../data/models/approver/ApproverSubDepartmentDashboardStatsModel";

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

const resolveSubDepartmentId = (
  department: ApproverDepartmentKey,
  subDeptSlug?: string,
) => {
  if (!subDeptSlug) return null;

  const user = useAuthStore.getState().user;
  if (!user) return null;

  const deptSlug = DEPARTMENT_SLUGS[department];
  const match =
    user.allSubDepartments.find(
      (subDept) => subDept.slugs?.dept === deptSlug && subDept.slugs?.subDept === subDeptSlug,
    ) ??
    user.allSubDepartments.find((subDept) => subDept.slugs?.subDept === subDeptSlug);

  return match?.subDepartmentId ?? null;
};

export const useApproverDepartmentHeaderHook = ({
  department,
  subDeptSlug,
}: UseApproverDepartmentHeaderHookArgs) => {
  const userId = useAuthStore((state) => state.user?.userId);
  const refreshVersion = useApproverListRefreshStore((state) => state.version);
  const [stats, setStats] = useState<ApproverSubDepartmentDashboardStats>(
    ApproverSubDepartmentDashboardStatsModel.empty(),
  );

  const user = useAuthStore((state) => state.user);
  const userName = user?.username || String(user?.userId || "Approver");
  const userRole = user?.role ? user.role.replace(/_/g, " ") : "Approver";

  const subDepartmentId = useMemo(
    () => resolveSubDepartmentId(department, subDeptSlug),
    [department, subDeptSlug, userId],
  );

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (!subDepartmentId) {
        if (!cancelled) setStats(ApproverSubDepartmentDashboardStatsModel.empty());
        return;
      }

      const response = await getApproverSubDepartmentDashboardStats(subDepartmentId);
      if (!cancelled) {
        const nextStats = response.stats ?? ApproverSubDepartmentDashboardStatsModel.empty();
        setStats((current) => {
          const isSame =
            current.allocated === nextStats.allocated &&
            current.pending === nextStats.pending &&
            current.approved === nextStats.approved &&
            current.rejected === nextStats.rejected;

          return isSame ? current : nextStats;
        });
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [subDepartmentId, refreshVersion]);

  const statItems = useMemo(
    () => ApproverSubDepartmentDashboardStatsModel.toHeaderStatItems(stats),
    [stats],
  );

  return {
    stats,
    statItems,
    userName,
    userRole,
  };
};

export default useApproverDepartmentHeaderHook;
