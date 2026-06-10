/** API status values returned by POST /approver/subdepartment/batch-list */
export const APPROVER_BATCH_STATUS = {
  WAITING_FOR_APPROVAL: "WAITING_FOR_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApproverBatchStatus =
  (typeof APPROVER_BATCH_STATUS)[keyof typeof APPROVER_BATCH_STATUS];

export const APPROVER_BATCH_STATUS_LABEL: Record<ApproverBatchStatus, string> = {
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/** Fixed status filter tabs for approver subdepartment batch lists */
export const APPROVER_BATCH_STATUS_TABS = Object.values(APPROVER_BATCH_STATUS_LABEL);

const CAMEL_CASE_STATUS_TO_API: Record<string, ApproverBatchStatus> = {
  waitingForApproval: APPROVER_BATCH_STATUS.WAITING_FOR_APPROVAL,
  waitingforApproval: APPROVER_BATCH_STATUS.WAITING_FOR_APPROVAL,
  approved: APPROVER_BATCH_STATUS.APPROVED,
  rejected: APPROVER_BATCH_STATUS.REJECTED,
};

const LABEL_TO_API = Object.fromEntries(
  Object.entries(APPROVER_BATCH_STATUS_LABEL).map(([api, label]) => [label, api]),
) as Record<string, ApproverBatchStatus>;

export function normalizeApproverBatchStatus(status: unknown): string {
  const raw = String(status ?? "").trim();
  if (!raw) return APPROVER_BATCH_STATUS_LABEL.WAITING_FOR_APPROVAL;

  if (raw in LABEL_TO_API) {
    return raw;
  }

  const fromCamelCase = CAMEL_CASE_STATUS_TO_API[raw];
  if (fromCamelCase) {
    return APPROVER_BATCH_STATUS_LABEL[fromCamelCase];
  }

  const upper = raw.toUpperCase();
  if (upper in APPROVER_BATCH_STATUS_LABEL) {
    return APPROVER_BATCH_STATUS_LABEL[upper as ApproverBatchStatus];
  }

  if (upper === "PENDING") {
    return APPROVER_BATCH_STATUS_LABEL.WAITING_FOR_APPROVAL;
  }

  return raw;
}

export function toApproverBatchListApiStatus(
  uiStatus: string,
  allLabel = "All",
): ApproverBatchStatus | null {
  if (!uiStatus || uiStatus === allLabel) return null;

  const fromLabel = LABEL_TO_API[uiStatus];
  if (fromLabel) return fromLabel;

  const upper = uiStatus.trim().toUpperCase().replace(/\s+/g, "_");
  if (upper in APPROVER_BATCH_STATUS_LABEL) {
    return upper as ApproverBatchStatus;
  }

  return null;
}

export type ApproverBatchListRequest = {
  subDepartmentId: number;
  userId: string;
  page: number;
  limit: number;
  status?: ApproverBatchStatus[];
  priority?: string[];
  search?: string;
};

type BuildApproverPayloadArgs = {
  subDepartmentId: number;
  userId: string;
  page: number;
  limit: number;
  statusFilter?: string;
  search?: string;
  priority?: string;
  allLabel?: string;
};

export function buildApproverBatchListPayload({
  subDepartmentId,
  userId,
  page,
  limit,
  statusFilter,
  search,
  priority,
  allLabel = "All",
}: BuildApproverPayloadArgs): ApproverBatchListRequest {
  const payload: ApproverBatchListRequest = {
    subDepartmentId,
    userId,
    page,
    limit,
  };

  const apiStatus = toApproverBatchListApiStatus(statusFilter ?? "", allLabel);
  if (apiStatus) {
    payload.status = [apiStatus];
  }

  const trimmedPriority = priority?.trim();
  if (trimmedPriority && trimmedPriority !== allLabel) {
    payload.priority = [trimmedPriority];
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    payload.search = trimmedSearch;
  }

  return payload;
}

const resolveMotorId = (batch: Record<string, unknown>) => {
  if (Array.isArray(batch.motorIds) && batch.motorIds.length > 0) {
    return batch.motorIds.map((id) => String(id)).join(", ");
  }
  return String(batch.motorId ?? "").trim();
};

const resolveAssignedTo = (batch: Record<string, unknown>) => {
  if (batch.assignedTo && typeof batch.assignedTo === "object") {
    const assigned = batch.assignedTo as { id?: string; fullName?: string; name?: string };
    return {
      id: String(assigned.id ?? "").trim(),
      fullName: String(assigned.fullName ?? assigned.name ?? "").trim(),
    };
  }
  return null;
};

export function mapApproverBatchListRow(batch: Record<string, unknown>) {
  const assignedTo = resolveAssignedTo(batch);
  const submittedBy = String(batch.submittedBy ?? assignedTo?.fullName ?? "").trim();
  const workflowStatus = normalizeApproverBatchStatus(batch.status);

  return {
    ...batch,
    id: batch.id ?? batch.formId ?? batch.batchId,
    batchId: batch.batchId,
    formId: batch.formId ?? null,
    batchType: batch.batchType,
    motorId: resolveMotorId(batch),
    motorType: String(batch.motorType ?? batch.motorStage ?? "").trim(),
    priority: batch.priority ?? "Medium",
    assignedTo,
    submittedBy: submittedBy || "NA",
    createdOn: batch.createdOn,
    rejectionReason: batch.rejectionReason ?? null,
    status: workflowStatus,
    statusApi: toApproverBatchListApiStatus(workflowStatus) ?? undefined,
  };
}

export function mapApproverBatchStatusCounts(
  server: Record<string, number> | undefined,
  allLabel: string,
  totalRecords: number,
): Record<string, number> {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = server?.[key];
      if (typeof value === "number") return value;
    }
    return 0;
  };

  const waiting = pick("waitingForApproval", "WAITING_FOR_APPROVAL", "Waiting for Approval");
  const approved = pick("approved", "APPROVED", "Approved");
  const rejected = pick("rejected", "REJECTED", "Rejected");
  const countedTotal = waiting + approved + rejected;

  return {
    [APPROVER_BATCH_STATUS_LABEL.WAITING_FOR_APPROVAL]: waiting,
    [APPROVER_BATCH_STATUS_LABEL.APPROVED]: approved,
    [APPROVER_BATCH_STATUS_LABEL.REJECTED]: rejected,
    [allLabel]: pick(allLabel, "all", "total") || totalRecords || countedTotal,
  };
}

export function resolveSubdepartmentBatchPagination(
  pagination: Record<string, unknown> | undefined,
  fallbackLimit: number,
) {
  return {
    page: Number(pagination?.page ?? 1),
    limit: Number(pagination?.limit ?? pagination?.pageSize ?? fallbackLimit),
    totalRecords: Number(pagination?.totalRecords ?? pagination?.total ?? 0),
    totalPages: Number(pagination?.totalPages ?? 1),
  };
}
