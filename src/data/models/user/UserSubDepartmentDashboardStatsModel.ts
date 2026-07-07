import { STRINGS } from "../../../app/config/strings";
import type { DepartmentHeaderStatItem } from "./RawMaterialProcurementStatsModel";

export type UserSubDepartmentDashboardStats = {
  allocated: number;
  approved: number;
  rejected: number;
  pending: number;
};

const S = STRINGS.DEPARTMENT_HEADER;

export class UserSubDepartmentDashboardStatsModel {
  static empty(): UserSubDepartmentDashboardStats {
    return {
      allocated: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
    };
  }

  static fromApi(data: Record<string, unknown> | null | undefined): UserSubDepartmentDashboardStats {
    return {
      allocated: Number(data?.allocated ?? 0),
      approved: Number(data?.approved ?? 0),
      rejected: Number(data?.rejected ?? 0),
      pending: Number(data?.pending ?? 0),
    };
  }

  static toHeaderStatItems(stats: UserSubDepartmentDashboardStats): DepartmentHeaderStatItem[] {
    return [
      { key: "allocated", label: S.STAT_ALLOCATED, value: stats.allocated },
      { key: "approved", label: S.STAT_APPROVED, value: stats.approved },
      { key: "rejected", label: S.STAT_REJECTED, value: stats.rejected },
      { key: "pending", label: S.STAT_PENDING, value: stats.pending },
    ];
  }
}
