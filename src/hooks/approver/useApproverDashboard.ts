import { useMemo } from "react";

export type ApproverDashboardSubDepartment = {
  key: string;
  label: string;
  description: string;
  pending?: number;
  approved?: number;
  rejected?: number;
  allocated?: number;
};

export const useApproverDashboard = (
  subDepartments: ApproverDashboardSubDepartment[],
) =>
  useMemo(() => {
    const totals = subDepartments.reduce(
      (summary, subDepartment) => ({
        allocated: summary.allocated + (subDepartment.allocated ?? 0),
        pending: summary.pending + (subDepartment.pending ?? 0),
        approved: summary.approved + (subDepartment.approved ?? 0),
        rejected: summary.rejected + (subDepartment.rejected ?? 0),
      }),
      { allocated: 0, pending: 0, approved: 0, rejected: 0 },
    );

    return {
      labels: Object.fromEntries(
        subDepartments.map((subDepartment) => [subDepartment.key, subDepartment.label]),
      ) as Record<string, string>,
      totals,
    };
  }, [subDepartments]);
