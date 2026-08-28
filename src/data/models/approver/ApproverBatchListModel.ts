import {
  OPERATION_STATUS,
  MANUFACTURING_STATUS_FILTER_VALUES,
  formatApiStatusForDisplay,
  mapApiStatusCountKeyToUiTab,
  getOperationStatusFilterLabel,
  toOperationStatusApiValue,
  type OperationStatus,
} from "../../../hooks/operationStatus";
import type { ApproverFormActionType } from "../../api/approver/approverApi";
import { motorStageForApi, normalizeMotorStage } from "../admin/BatchManagement/BatchManagementModel";
import {
  BATCH_STATUS_UNAVAILABLE,
  batchTypeFilterToApiValue,
  resolveWorkflowStatusFromBatchStages,
  SUBDEPT_STATUS_FIELD,
} from "../user/SubdepartmentBatchModel";

/** API status values returned by POST /approver/subdepartment/batch-list */
export const APPROVER_BATCH_STATUS = {
  TO_BE_INITIATED: "TO_BE_INITIATED",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_FOR_PARTIAL_APPROVAL: "WAITING_FOR_PARTIAL_APPROVAL",
  WAITING_FOR_APPROVAL: "WAITING_FOR_APPROVAL",
  APPROVED: "APPROVED",
  COMPLETELY_APPROVED: "COMPLETELY_APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApproverBatchStatus =
  (typeof APPROVER_BATCH_STATUS)[keyof typeof APPROVER_BATCH_STATUS];

export const APPROVER_BATCH_STATUS_LABEL: Record<ApproverBatchStatus, string> = {
  TO_BE_INITIATED: OPERATION_STATUS.TO_BE_INITIATED,
  IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
  WAITING_FOR_PARTIAL_APPROVAL: OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL,
  WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
  APPROVED: OPERATION_STATUS.APPROVED,
  COMPLETELY_APPROVED: OPERATION_STATUS.COMPLETELY_APPROVED,
  REJECTED: OPERATION_STATUS.REJECTED,
};

/**
 * Status filter tabs — same set/order as the user subdepartment batch list
 * (no Waiting for Approval; only Waiting for Partial Approval).
 */
export const APPROVER_BATCH_STATUS_TABS: OperationStatus[] = [
  ...MANUFACTURING_STATUS_FILTER_VALUES,
];

const LABEL_TO_API = Object.fromEntries(
  Object.entries(APPROVER_BATCH_STATUS_LABEL).map(([api, label]) => [label, api]),
) as Record<string, ApproverBatchStatus>;

/** Format API status for list display — shows server value, no remapping. */
export function normalizeApproverBatchStatus(status: unknown): string {
  const raw = String(status ?? "").trim();
  if (!raw) return BATCH_STATUS_UNAVAILABLE;
  if (raw === BATCH_STATUS_UNAVAILABLE) return BATCH_STATUS_UNAVAILABLE;
  return formatApiStatusForDisplay(raw);
}

/** Resolve batch status after approver change-status — avoid using form `status` when batchStatus is absent. */
export function resolveApproverChangeStatusFromResponse(
  response: { data?: unknown } | null | undefined,
  actionType: ApproverFormActionType,
): string {
  const data = (response?.data ?? {}) as Record<string, unknown>;
  const batchStatus = data.batchStatus ?? data.batchStageStatus;
  if (batchStatus != null && String(batchStatus).trim()) {
    return normalizeApproverBatchStatus(batchStatus);
  }

  const responseAction = String(data.actionType ?? "").trim().toUpperCase();
  if (responseAction === "REJECTED" || responseAction === "APPROVED") {
    return normalizeApproverBatchStatus(responseAction);
  }

  return normalizeApproverBatchStatus(actionType === "REJECTED" ? "REJECTED" : "APPROVED");
}

/** Display label for approver status tabs / chips (matches user batch list). */
export const getApproverBatchStatusDisplayLabel = (status: string): string =>
  getOperationStatusFilterLabel(status, { isSourcingLotSubdepartment: false });

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
  projectId?: string;
};

export type ApproverBatchListAdvancedFilters = {
  batchId?: string;
  batchType?: string;
  motorId?: string;
  motorStage?: string;
  submittedBy?: string;
  fromDate?: string;
  toDate?: string;
  projectId?: string;
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
  const projectId = String(advanced.projectId ?? "").trim();
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

  if (projectId && projectId !== allLabel) {
    payload.projectId = projectId;
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

const resolveRawBatchStatus = (
  batch: Record<string, unknown>,
  subDepartmentId?: number | null,
) => {
  const stageResolution = resolveWorkflowStatusFromBatchStages(batch, subDepartmentId);
  if (
    stageResolution.status != null &&
    String(stageResolution.status).trim()
  ) {
    return stageResolution.status;
  }

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

export function mapApproverBatchListRow(
  batch: Record<string, unknown>,
  subDepartmentId?: number | null,
) {
  const assignedTo = resolveAssignedTo(batch);
  const createdBy = resolveCreatedBy(batch);
  const formSubmittedBy = resolveFormSubmittedBy(batch);
  const systemManager = resolveSystemManager(batch);
  const submittedBy = String(
    batch.submittedBy ?? formSubmittedBy?.fullName ?? formSubmittedBy?.id ?? "",
  ).trim();
  const stageResolution = resolveWorkflowStatusFromBatchStages(batch, subDepartmentId);
  const workflowStatus = normalizeApproverBatchStatus(
    resolveRawBatchStatus(batch, subDepartmentId),
  );
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
    rejectionReason:
      stageResolution.rejectionReason ??
      (batch.rejectionReason != null ? String(batch.rejectionReason) : null),
    status: workflowStatus,
    statusApi: toApproverBatchListApiStatus(workflowStatus) ?? undefined,
  };
}

export function mapApproverBatchStatusCounts(
  server: Record<string, number> | undefined,
  allLabel: string,
  totalRecords: number,
): Record<string, number> {
  const byLabel: Record<string, number> = {
    [OPERATION_STATUS.TO_BE_INITIATED]: 0,
    [OPERATION_STATUS.IN_PROGRESS]: 0,
    [OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL]: 0,
    [OPERATION_STATUS.WAITING_FOR_APPROVAL]: 0,
    [OPERATION_STATUS.APPROVED]: 0,
    [OPERATION_STATUS.COMPLETELY_APPROVED]: 0,
    [OPERATION_STATUS.REJECTED]: 0,
  };

  Object.entries(server ?? {}).forEach(([key, value]) => {
    if (typeof value !== "number") return;
    const tab = mapApiStatusCountKeyToUiTab(key);
    if (tab) {
      byLabel[tab] += value;
    }
  });

  const countedTotal = Object.values(byLabel).reduce((sum, value) => sum + value, 0);

  return {
    ...byLabel,
    [allLabel]: countedTotal > 0 ? countedTotal : totalRecords,
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
