import { STRINGS } from "../../../app/config/strings";

export type RawMaterialProcurementStats = {
  createdLots: number;
  pendingLots: number;
  waitingForApprovalLots: number;
  approvedLots: number;
  rejectedLots: number;
};

export type DepartmentHeaderStatItem = {
  key: string;
  label: string;
  value: number;
};

const S = STRINGS.SOURCING.RAW_MATERIAL.STATS;

export class RawMaterialProcurementStatsModel {
  static empty(): RawMaterialProcurementStats {
    return {
      createdLots: 0,
      pendingLots: 0,
      waitingForApprovalLots: 0,
      approvedLots: 0,
      rejectedLots: 0,
    };
  }

  static fromApi(data: Record<string, unknown> | null | undefined): RawMaterialProcurementStats {
    return {
      createdLots: Number((data as any)?.createdLots ?? 0),
      pendingLots: Number((data as any)?.pendingLots ?? 0),
      waitingForApprovalLots: Number((data as any)?.waitingForApprovalLots ?? 0),
      approvedLots: Number((data as any)?.approvedLots ?? 0),
      rejectedLots: Number((data as any)?.rejectedLots ?? 0),
    };
  }

  static toStatItems(stats: RawMaterialProcurementStats): DepartmentHeaderStatItem[] {
    return [
      { key: "createdLots", label: S.CREATED_LOTS, value: stats.createdLots },
      { key: "pendingLots", label: S.PENDING_LOTS, value: stats.pendingLots },
      { key: "waitingForApprovalLots", label: S.WAITING_FOR_APPROVAL, value: stats.waitingForApprovalLots },
      { key: "approvedLots", label: S.APPROVED_LOTS, value: stats.approvedLots },
      { key: "rejectedLots", label: S.REJECTED_LOTS, value: stats.rejectedLots },
    ];
  }
}
