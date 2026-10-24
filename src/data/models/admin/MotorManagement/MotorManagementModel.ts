export type MotorLinkedBatch = {
  batchId: string;
  batchType: string;
  projectId: string;
  motorStage: number | null;
  workflowStatus: string;
  workflowSubmissionType: string;
  createdAt: string;
  createdBy: string;
};

const personName = (value: any): string => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value.fullName ?? value.name ?? value.username ?? value.id ?? "").trim();
};

/** Normalize LocalDateTime from ISO string or Jackson array [y,m,d,h,min,s]. */
export const normalizeDateTime = (value: unknown): string => {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value.map(Number);
    if (![y, m, d].every((n) => Number.isFinite(n))) return "";
    const dt = new Date(y, m - 1, d, h || 0, min || 0, s || 0);
    return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
  }
  return String(value);
};

const mapLinkedBatch = (b: any): MotorLinkedBatch => ({
  batchId: b?.batchId || "",
  batchType: b?.batchType || "",
  projectId: b?.projectId || "",
  motorStage: b?.motorStage != null ? Number(b.motorStage) : null,
  workflowStatus: b?.workflowStatus || "",
  workflowSubmissionType: b?.workflowSubmissionType || "",
  createdAt: normalizeDateTime(b?.createdAt ?? b?.createdOn),
  createdBy: personName(b?.createdBy),
});

export class MotorListItemModel {
  motorId: string = "";
  batchIds: string[] = [];
  linkedBatchCount: number = 0;
  linkedBatches: MotorLinkedBatch[] = [];
  primaryBatchId: string = "";
  projectId: string = "";
  motorStage: number | null = null;
  batchType: string = "";
  workflowStatus: string = "";
  workflowSubmissionType: string = "";
  motorCasingId: string = "";
  casingStatus: string = "";
  discarded: boolean = false;
  discardReason: string = "";
  createdBy: string = "";
  createdAt: string = "";

  static fromApi(data: any): MotorListItemModel {
    const item = new MotorListItemModel();
    item.motorId = data?.motorId || "";
    item.batchIds = Array.isArray(data?.batchIds) ? data.batchIds.map(String) : [];
    item.linkedBatchCount = Number(data?.linkedBatchCount ?? item.batchIds.length) || 0;
    item.linkedBatches = Array.isArray(data?.linkedBatches)
      ? data.linkedBatches.map(mapLinkedBatch)
      : [];
    item.primaryBatchId = data?.primaryBatchId || "";
    item.projectId = data?.projectId || "";
    item.motorStage = data?.motorStage != null ? Number(data.motorStage) : null;
    item.batchType = data?.batchType || "";
    item.workflowStatus = data?.workflowStatus || "";
    item.workflowSubmissionType = data?.workflowSubmissionType || "";
    item.motorCasingId = data?.motorCasingId || "";
    item.casingStatus = data?.casingStatus || "";
    item.discarded = Boolean(data?.discarded) || item.workflowStatus === "DISCARDED";
    item.discardReason = data?.discardReason || "";
    item.createdBy =
      personName(data?.createdBy) ||
      personName(data?.createdByInfo) ||
      String(data?.createdByUsername ?? "").trim();
    item.createdAt = normalizeDateTime(data?.createdAt ?? data?.createdOn);
    return item;
  }
}

export class MotorDetailsModel {
  motorId: string = "";
  motorCasingId: string = "";
  casingStatus: string = "";
  projectId: string = "";
  motorStage: number | null = null;
  workflowStatus: string = "";
  linkedBatches: MotorLinkedBatch[] = [];
  discarded: boolean = false;
  discardReason: string = "";

  static fromApi(data: any): MotorDetailsModel {
    const item = new MotorDetailsModel();
    item.motorId = data?.motorId || "";
    item.motorCasingId = data?.motorCasingId || "";
    item.casingStatus = data?.casingStatus || "";
    item.projectId = data?.projectId || "";
    item.motorStage = data?.motorStage != null ? Number(data.motorStage) : null;
    item.workflowStatus = data?.workflowStatus || "";
    item.linkedBatches = Array.isArray(data?.linkedBatches)
      ? data.linkedBatches.map(mapLinkedBatch)
      : [];
    item.discarded =
      Boolean(data?.discarded) || item.workflowStatus === "DISCARDED";
    item.discardReason = data?.discardReason || "";
    if (!item.discarded) {
      item.discarded = item.linkedBatches.some((b) => b.workflowStatus === "DISCARDED");
    }
    return item;
  }
}

const metricCount = (metric: any): number => {
  if (metric == null) return 0;
  if (typeof metric === "number") return metric;
  return Number(metric.count ?? 0) || 0;
};

export class MotorStatsModel {
  totalMotors: number = 0;
  inProgress: number = 0;
  dispatched: number = 0;
  discarded: number = 0;

  static fromApi(data: any): MotorStatsModel {
    const stats = new MotorStatsModel();
    stats.totalMotors = metricCount(data?.totalMotors);
    stats.inProgress = metricCount(data?.inProgress);
    stats.dispatched = metricCount(data?.dispatched);
    stats.discarded = metricCount(data?.discarded);
    return stats;
  }
}

export const getMotorManagementErrorMessage = (response: any, fallback: string): string => {
  if (response?.error?.details) return response.error.details;
  if (response?.message) return response.message;
  return fallback;
};
