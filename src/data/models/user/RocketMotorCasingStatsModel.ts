import { STRINGS } from "../../../app/config/strings";
import type { DepartmentHeaderStatItem } from "./RawMaterialProcurementStatsModel";

export type RocketMotorCasingStats = {
  createdMotors: number;
  pendingMotors: number;
  waitingForApprovalMotors: number;
  approvedMotors: number;
  rejectedMotors: number;
};

const S = STRINGS.SOURCING.CASING.STATS;

export class RocketMotorCasingStatsModel {
  static empty(): RocketMotorCasingStats {
    return {
      createdMotors: 0,
      pendingMotors: 0,
      waitingForApprovalMotors: 0,
      approvedMotors: 0,
      rejectedMotors: 0,
    };
  }

  static fromApi(data: Record<string, unknown> | null | undefined): RocketMotorCasingStats {
    return {
      createdMotors: Number((data as any)?.createdMotors ?? 0),
      pendingMotors: Number((data as any)?.pendingMotors ?? 0),
      waitingForApprovalMotors: Number((data as any)?.waitingForApprovalMotors ?? 0),
      approvedMotors: Number((data as any)?.approvedMotors ?? 0),
      rejectedMotors: Number((data as any)?.rejectedMotors ?? 0),
    };
  }

  /** Accent keys match raw material procurement so DepartmentHeader uses the same tile colors */
  static toStatItems(stats: RocketMotorCasingStats): DepartmentHeaderStatItem[] {
    return [
      { key: "createdLots", label: S.CREATED_MOTORS, value: stats.createdMotors },
      { key: "pendingLots", label: S.PENDING_MOTORS, value: stats.pendingMotors },
      { key: "waitingForApprovalLots", label: S.WAITING_FOR_APPROVAL, value: stats.waitingForApprovalMotors },
      { key: "approvedLots", label: S.APPROVED_MOTORS, value: stats.approvedMotors },
      { key: "rejectedLots", label: S.REJECTED_MOTORS, value: stats.rejectedMotors },
    ];
  }
}
