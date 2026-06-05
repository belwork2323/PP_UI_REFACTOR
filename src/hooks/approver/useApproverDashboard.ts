import { useMemo } from "react";

export type ApproverDashboardSubDepartment = {
  key: string;
  label: string;
  description: string;
  pending: number;
  approved: number;
  rejected: number;
};

export const useApproverDashboard = (
  subDepartments: ApproverDashboardSubDepartment[],
) =>
  useMemo(() => {
    const totals = subDepartments.reduce(
      (summary, subDepartment) => ({
        pending: summary.pending + subDepartment.pending,
        approved: summary.approved + subDepartment.approved,
        rejected: summary.rejected + subDepartment.rejected,
        allocated:
          summary.allocated +
          subDepartment.pending +
          subDepartment.approved +
          subDepartment.rejected,
      }),
      { pending: 0, approved: 0, rejected: 0, allocated: 0 },
    );

    return {
      labels: Object.fromEntries(
        subDepartments.map((subDepartment) => [subDepartment.key, subDepartment.label]),
      ) as Record<string, string>,
      totals,
    };
  }, [subDepartments]);
