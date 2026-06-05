export type UserSubDepartmentDashboardStats = {
  allocated: number;
  completed: number;
  draft: number;
  pending: number;
};

export class UserSubDepartmentDashboardStatsModel {
  static empty(): UserSubDepartmentDashboardStats {
    return {
      allocated: 0,
      completed: 0,
      draft: 0,
      pending: 0,
    };
  }

  static fromApi(data: Record<string, unknown> | null | undefined): UserSubDepartmentDashboardStats {
    return {
      allocated: Number((data as any)?.allocated ?? 0),
      completed: Number((data as any)?.completed ?? 0),
      draft: Number((data as any)?.draft ?? 0),
      pending: Number((data as any)?.pending ?? 0),
    };
  }
}
