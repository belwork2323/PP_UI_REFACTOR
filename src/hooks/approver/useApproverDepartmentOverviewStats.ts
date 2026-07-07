import { useEffect, useMemo, useState } from "react";

import { useAuthStore } from "../../app/store/authStore";
import { useApproverListRefreshStore } from "../../app/store/approverListRefreshStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { getApproverSubDepartmentDashboardStats } from "../../controllers/approver/approverController";
import {
  ApproverSubDepartmentDashboardStatsModel,
  type ApproverSubDepartmentDashboardStats,
} from "../../data/models/approver/ApproverSubDepartmentDashboardStatsModel";

const DEPARTMENT_SLUGS: Record<ApproverDepartmentKey, string> = {
  sourcing: "sourcing",
  manufacturing: "manufacturing",
  dispatch: "dispatch",
  qualityControl: "quality",
};

const resolveSubDepartmentId = (
  department: ApproverDepartmentKey,
  subDeptKey: string,
) => {
  const user = useAuthStore.getState().user;
  if (!user) return null;

  const deptSlug = DEPARTMENT_SLUGS[department];
  const match =
    user.allSubDepartments.find(
      (subDept) => subDept.slugs?.dept === deptSlug && subDept.slugs?.subDept === subDeptKey,
    ) ??
    user.allSubDepartments.find((subDept) => subDept.slugs?.subDept === subDeptKey);

  return match?.subDepartmentId ?? null;
};

const buildSubDepartmentIdsSignature = (
  department: ApproverDepartmentKey,
  subDeptKeys: string[],
) =>
  subDeptKeys
    .map((key) => `${key}:${resolveSubDepartmentId(department, key) ?? ""}`)
    .join("|");

export const useApproverDepartmentOverviewStats = (
  department: ApproverDepartmentKey,
  subDeptKeys: string[],
) => {
  const userId = useAuthStore((state) => state.user?.userId);
  const refreshVersion = useApproverListRefreshStore((state) => state.version);
  const [statsByKey, setStatsByKey] = useState<Record<string, ApproverSubDepartmentDashboardStats>>({});

  const subDepartmentIdsSignature = useMemo(
    () => buildSubDepartmentIdsSignature(department, subDeptKeys),
    [department, subDeptKeys, userId],
  );

  useEffect(() => {
    if (!subDeptKeys.length) {
      setStatsByKey((current) => (Object.keys(current).length === 0 ? current : {}));
      return;
    }

    let cancelled = false;

    const loadStats = async () => {
      const requests = subDeptKeys.map(async (key) => {
        const subDepartmentId = resolveSubDepartmentId(department, key);
        if (!subDepartmentId) {
          return [key, ApproverSubDepartmentDashboardStatsModel.empty()] as const;
        }

        const response = await getApproverSubDepartmentDashboardStats(subDepartmentId);
        return [
          key,
          response.stats ?? ApproverSubDepartmentDashboardStatsModel.empty(),
        ] as const;
      });

      const results = await Promise.all(requests);

      if (!cancelled) {
        setStatsByKey((current) => {
          const next = Object.fromEntries(results);
          const currentKeys = Object.keys(current);
          const nextKeys = Object.keys(next);
          const isSame =
            currentKeys.length === nextKeys.length &&
            nextKeys.every(
              (key) =>
                current[key]?.allocated === next[key]?.allocated &&
                current[key]?.pending === next[key]?.pending &&
                current[key]?.approved === next[key]?.approved &&
                current[key]?.rejected === next[key]?.rejected,
            );

          return isSame ? current : next;
        });
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [department, refreshVersion, subDepartmentIdsSignature, subDeptKeys]);

  return statsByKey;
};

export default useApproverDepartmentOverviewStats;
