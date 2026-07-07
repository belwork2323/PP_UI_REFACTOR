import { OPERATION_STATUS, toOperationStatusApiValue, type OperationStatus } from "../../../hooks/operationStatus";
import { motorStageForApi, normalizeMotorStage } from "../admin/BatchManagement/BatchManagementModel";
import { batchTypeFilterToApiValue, SUBDEPT_STATUS_FIELD } from "../user/SubdepartmentBatchModel";

/** API status values returned by POST /approver/subdepartment/batch-list */
export const APPROVER_BATCH_STATUS = {
  INITIATED: "INITIATED",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_FOR_APPROVAL: "WAITING_FOR_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApproverBatchStatus =
  (typeof APPROVER_BATCH_STATUS)[keyof typeof APPROVER_BATCH_STATUS];

export const APPROVER_BATCH_STATUS_LABEL: Record<ApproverBatchStatus, string> = {
  INITIATED: OPERATION_STATUS.INITIATED,
  IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
  WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
  APPROVED: OPERATION_STATUS.APPROVED,
  REJECTED: OPERATION_STATUS.REJECTED,
};

/** Fixed status filter tabs for approver subdepartment batch lists */
export const APPROVER_BATCH_STATUS_TABS = Object.values(APPROVER_BATCH_STATUS_LABEL);

const CAMEL_CASE_STATUS_TO_API: Record<string, ApproverBatchStatus> = {
  initiated: APPROVER_BATCH_STATUS.INITIATED,
  inProgress: APPROVER_BATCH_STATUS.IN_PROGRESS,
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

  const upper = raw.toUpperCase().replace(/\s+/g, "_");
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
  const apiStatus = toOperationStatusApiValue(uiStatus, allLabel);
  if (!apiStatus) return null;

  if (apiStatus in APPROVER_BATCH_STATUS_LABEL) {
    return apiStatus as ApproverBatchStatus;
  }

  return null;
}

export function toApproverBatchListRequestStatus(
  uiStatus: string,
  allLabel = "All",
): string | null {
  const trimmed = String(uiStatus ?? "").trim();
  if (!trimmed || trimmed === allLabel) return null;

  const upper = trimmed.toUpperCase().replace(/\s+/g, "_");
  if (upper in APPROVER_BATCH_STATUS_LABEL) {
    return upper;
  }

  const fromLabel = LABEL_TO_API[trimmed];
  if (fromLabel) {
    return fromLabel;
  }

  return toOperationStatusApiValue(trimmed, allLabel);
}

export type ApproverBatchListRequest = {
  subDepartmentId: number;
  userId: string;
  page: number;
  limit: number;
  status?: string[];
  priority?: string[];
  search?: string;
  batchIds?: string[];
  batchTypes?: string[];
  motorStages?: number[];
  motorIds?: string[];
  formSubmittedBy?: string[];
  fromDate?: string;
  toDate?: string;
};

export type ApproverBatchListAdvancedFilters = {
  batchId?: string;
  batchType?: string;
  motorId?: string;
  motorStage?: string;
  submittedBy?: string;
  fromDate?: string;
  toDate?: string;
};

type BuildApproverPayloadArgs = {
  subDepartmentId: number;
  userId: string;
  page: number;
  limit: number;
  statusFilter?: string;
  search?: string;
  priority?: string;
  advancedFilters?: ApproverBatchListAdvancedFilters;
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
  advancedFilters,
  allLabel = "All",
}: BuildApproverPayloadArgs): ApproverBatchListRequest {
  const payload: ApproverBatchListRequest = {
    subDepartmentId,
    userId,
    page,
    limit,
  };

  const requestStatus = toApproverBatchListRequestStatus(statusFilter ?? "", allLabel);
  if (requestStatus) {
    payload.status = [requestStatus];
  }

  const trimmedPriority = priority?.trim();
  if (trimmedPriority && trimmedPriority !== allLabel) {
    payload.priority = [trimmedPriority];
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    payload.search = trimmedSearch;
  }

  const advanced = advancedFilters ?? {};
  const batchId = String(advanced.batchId ?? "").trim();
  const batchType = String(advanced.batchType ?? "").trim();
  const motorId = String(advanced.motorId ?? "").trim();
  const motorStage = String(advanced.motorStage ?? "").trim();
  const submittedBy = String(advanced.submittedBy ?? "").trim();
  let fromDate = String(advanced.fromDate ?? "").trim();
  let toDate = String(advanced.toDate ?? "").trim();

  if (fromDate && toDate && fromDate > toDate) {
    const swap = fromDate;
    fromDate = toDate;
    toDate = swap;
  }

  if (batchId) {
    payload.batchIds = [batchId];
  }

  if (batchType && batchType !== allLabel) {
    const apiBatchType = batchTypeFilterToApiValue(batchType);
    if (apiBatchType) {
      payload.batchTypes = [apiBatchType];
    }
  }

  if (motorId) {
    payload.motorIds = [motorId];
  }

  if (motorStage && motorStage !== allLabel) {
    const apiMotorStage = motorStageForApi(motorStage);
    if (typeof apiMotorStage === "number") {
      payload.motorStages = [apiMotorStage];
    }
  }

  if (submittedBy) {
    payload.formSubmittedBy = [submittedBy];
  }

  if (fromDate) {
    payload.fromDate = fromDate;
  }

  if (toDate) {
    payload.toDate = toDate;
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

const resolveCreatedBy = (batch: Record<string, unknown>) => {
  if (batch.createdBy && typeof batch.createdBy === "object") {
    const created = batch.createdBy as { id?: string; fullName?: string; name?: string };
    return {
      id: String(created.id ?? "").trim(),
      fullName: String(created.fullName ?? created.name ?? "").trim(),
    };
  }
  return null;
};

const resolveSystemManager = (batch: Record<string, unknown>) => {
  if (batch.systemManager && typeof batch.systemManager === "object") {
    const manager = batch.systemManager as { id?: string; fullName?: string; name?: string };
    return {
      id: String(manager.id ?? "").trim(),
      fullName: String(manager.fullName ?? manager.name ?? "").trim(),
    };
  }
  return null;
};

const resolveFormSubmittedBy = (batch: Record<string, unknown>) => {
  if (batch.formSubmittedBy && typeof batch.formSubmittedBy === "object") {
    const submitter = batch.formSubmittedBy as { id?: string; fullName?: string; name?: string };
    return {
      id: String(submitter.id ?? "").trim(),
      fullName: String(submitter.fullName ?? submitter.name ?? "").trim(),
    };
  }
  return null;
};

/** Values used for submitted-by search and client-side filter matching. */
export function resolveApproverRowSubmittedByValues(batch: Record<string, unknown>): string[] {
  const values = new Set<string>();
  const submittedBy = String(batch.submittedBy ?? "").trim();
  if (submittedBy && submittedBy !== "NA") {
    values.add(submittedBy);
  }

  const formSubmittedBy = resolveFormSubmittedBy(batch);
  if (formSubmittedBy?.id) values.add(formSubmittedBy.id);
  if (formSubmittedBy?.fullName) values.add(formSubmittedBy.fullName);

  return [...values];
};

export function approverRowMatchesSubmittedByFilter(
  row: Record<string, unknown>,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return resolveApproverRowSubmittedByValues(row).some((value) =>
    value.toLowerCase().includes(needle),
  );
}

export const APPROVER_BATCH_LIST_SEARCH_KEYS = [
  "batchId",
  "motorId",
  "submittedBy",
  "formSubmittedBy.id",
  "formSubmittedBy.fullName",
] as const;

const getNestedRowValue = (row: Record<string, unknown>, key: string) =>
  key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, row);

const isSubmittedBySearchKey = (key: string) =>
  key === "submittedBy" || key.startsWith("formSubmittedBy.");

/** Client-side search across batch ID, motor ID, and submitter id/name. */
export function approverRowMatchesSearchQuery(
  row: Record<string, unknown>,
  query: string,
  searchKeys: readonly string[] = APPROVER_BATCH_LIST_SEARCH_KEYS,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return searchKeys.some((key) => {
    if (isSubmittedBySearchKey(key)) {
      return resolveApproverRowSubmittedByValues(row).some((value) =>
        value.toLowerCase().includes(needle),
      );
    }

    return String(getNestedRowValue(row, key) ?? "")
      .toLowerCase()
      .includes(needle);
  });
}

const resolveRawBatchStatus = (batch: Record<string, unknown>) => {
  const direct = batch.status;
  if (direct != null && String(direct).trim()) {
    return direct;
  }

  for (const field of Object.values(SUBDEPT_STATUS_FIELD)) {
    const value = batch[field];
    if (value != null && String(value).trim()) {
      return value;
    }
  }

  return direct;
};

const buildSubdepartmentStatusMirrors = (workflowStatus: string) =>
  Object.fromEntries(
    [...new Set(Object.values(SUBDEPT_STATUS_FIELD))].map((field) => [field, workflowStatus]),
  );

export const mirrorApproverSubdepartmentStatusFields = buildSubdepartmentStatusMirrors;

/** Resolve list/approver status using subdepartment field with fallback to normalized `status`. */
export function resolveApproverRowStatus(
  row: Record<string, unknown>,
  statusField = "status",
): string {
  const fieldValue = String(row[statusField] ?? "").trim();
  if (fieldValue) return fieldValue;
  return String(row.status ?? "").trim();
}

export function mapApproverBatchListRow(batch: Record<string, unknown>) {
  const assignedTo = resolveAssignedTo(batch);
  const createdBy = resolveCreatedBy(batch);
  const formSubmittedBy = resolveFormSubmittedBy(batch);
  const systemManager = resolveSystemManager(batch);
  const submittedBy = String(
    batch.submittedBy ?? formSubmittedBy?.fullName ?? formSubmittedBy?.id ?? "",
  ).trim();
  const workflowStatus = normalizeApproverBatchStatus(resolveRawBatchStatus(batch));
  const motorStage = normalizeMotorStage(batch.motorStage ?? batch.motorType);
  const statusMirrors = buildSubdepartmentStatusMirrors(workflowStatus);

  return {
    ...batch,
    ...statusMirrors,
    id: batch.id ?? batch.formId ?? batch.batchId,
    batchId: batch.batchId,
    formId: batch.formId ?? null,
    batchType: batch.batchType,
    motorId: resolveMotorId(batch),
    motorIds: Array.isArray(batch.motorIds) ? batch.motorIds.map((id) => String(id)) : [],
    motorStage,
    motorType: motorStage != null ? String(motorStage) : "",
    priority: batch.priority ?? "Medium",
    assignedTo,
    createdBy,
    formSubmittedBy,
    systemManager,
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

  const initiated = pick("initiated", "INITIATED", "Initiated");
  const inProgress = pick("inProgress", "IN_PROGRESS", "In Progress");
  const waiting = pick("waitingForApproval", "WAITING_FOR_APPROVAL", "Waiting for Approval");
  const approved = pick("approved", "APPROVED", "Approved");
  const rejected = pick("rejected", "REJECTED", "Rejected");
  const pendingTotal = initiated + inProgress + waiting;
  const countedTotal = pendingTotal + approved + rejected;

  return {
    [APPROVER_BATCH_STATUS_LABEL.INITIATED]: initiated,
    [APPROVER_BATCH_STATUS_LABEL.IN_PROGRESS]: inProgress,
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
