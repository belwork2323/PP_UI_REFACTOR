import { STRINGS } from "../../../app/config/strings";

export type ApproverSubDepartmentDashboardStats = {
  allocated: number;
  approved: number;
  rejected: number;
  pending: number;
};

const S = STRINGS.APPROVER.DEPARTMENT_HEADER;

export class ApproverSubDepartmentDashboardStatsModel {
  static empty(): ApproverSubDepartmentDashboardStats {
    return {
      allocated: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
    };
  }

  static fromApi(data: Record<string, unknown> | null | undefined): ApproverSubDepartmentDashboardStats {
    return {
      allocated: Number(data?.allocated ?? 0),
      approved: Number(data?.approved ?? 0),
      rejected: Number(data?.rejected ?? 0),
      pending: Number(data?.pending ?? 0),
    };
  }

  static toHeaderStatItems(stats: ApproverSubDepartmentDashboardStats) {
    // Match user DepartmentHeader slot order and accent keys for identical tile sizing.
    return [
      { key: "allocated", label: S.STAT_ALLOCATED, value: stats.allocated },
      { key: "completed", label: S.STAT_APPROVED, value: stats.approved },
      { key: "draft", label: S.STAT_PENDING, value: stats.pending },
      { key: "pending", label: S.STAT_REJECTED, value: stats.rejected },
    ];
  }
}
