import { STRINGS } from "../../../app/config/strings";
import { OPERATION_STATUS, type OperationStatus } from "../../../hooks/operationStatus";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
const OPERATION_STATUS_VALUES = Object.values(OPERATION_STATUS) as OperationStatus[];

export type SubdepartmentBatchListAdvancedFilters = {
  priority: string;
  motorIds: string[];
  lotIds: string[];
};

export const emptySubdepartmentBatchAdvancedFilters = (): SubdepartmentBatchListAdvancedFilters => ({
  priority: "",
  motorIds: [],
  lotIds: [],
});

export const SUBDEPARTMENT_BATCH_SEARCH_FIELDS = [
  "batchId",
  "motorId",
  "motorType",
  "batchType",
  "priority",
  "projectName",
  "material",
  "assignedTo.fullName",
] as const;

const getNestedValue = (obj: Record<string, unknown>, key: string) =>
  key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);

export const subdepartmentBatchMatchesSearch = (batch: Record<string, unknown>, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return SUBDEPARTMENT_BATCH_SEARCH_FIELDS.some((field) =>
    String(getNestedValue(batch, field) ?? "")
      .toLowerCase()
      .includes(q),
  );
};

/** POST /user/subdepartment/batch-list request body */
export type SubdepartmentBatchListRequest = {
  subDepartmentId: number;
  userId: string;
  page: number;
  limit: number;
  status?: string[];
  priority?: string[];
  search?: string;
  motorIds?: string[];
  lotIds?: string[];
};

/** Per route slug → row status field used by list components */
export const SUBDEPT_STATUS_FIELD: Record<string, string> = {
  "raw-material-prep": "rmStatus",
  "case-preparation": "cpStatus",
  mixing: "mxStatus",
  "casting-and-curing": "ccStatus",
  "post-cure-operations": "pcStatus",
  dispatch: "dispatchStatus",
  "raw-material-revalidation": "qcRmStatus",
  "qc-division": "qcDivStatus",
  ndt: "ndtStatus",
  "static-test-facility": "stfStatus",
};

const compactStatusKey = (value: string) => value.replace(/[\s_-]/g, "").toLowerCase();

const STATUS_KEY_ALIASES: Record<string, OperationStatus> = {
  initiated: OPERATION_STATUS.INITIATED,
  inprogress: OPERATION_STATUS.IN_PROGRESS,
  waitingforapproval: OPERATION_STATUS.WAITING_FOR_APPROVAL,
  approved: OPERATION_STATUS.APPROVED,
  rejected: OPERATION_STATUS.REJECTED,
  active: OPERATION_STATUS.INITIATED,
};

export function normalizeSubdepartmentBatchStatus(status: unknown): OperationStatus {
  const trimmed = String(status ?? "").trim();
  if (!trimmed) return OPERATION_STATUS.INITIATED;

  if (OPERATION_STATUS_VALUES.includes(trimmed as OperationStatus)) {
    return trimmed as OperationStatus;
  }

  const fromAlias = STATUS_KEY_ALIASES[compactStatusKey(trimmed)];
  if (fromAlias) return fromAlias;

  const u = trimmed.toUpperCase();
  const map: Record<string, OperationStatus> = {
    INITIATED: OPERATION_STATUS.INITIATED,
    IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
    INPROGRESS: OPERATION_STATUS.IN_PROGRESS,
    WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    WAITINGFORAPPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    APPROVED: OPERATION_STATUS.APPROVED,
    REJECTED: OPERATION_STATUS.REJECTED,
    ACTIVE: OPERATION_STATUS.INITIATED,
  };

  return map[u] ?? OPERATION_STATUS.INITIATED;
}

const resolveMotorType = (batch: Record<string, unknown>) => {
  const motorStage = batch.motorStage ?? batch.motorType;
  if (motorStage && typeof motorStage === "object") {
    const typed = motorStage as { motorTypeName?: string };
    return String(typed.motorTypeName ?? "").trim();
  }
  return String(motorStage ?? "").trim();
};

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

  if (batch.systemManager && typeof batch.systemManager === "object") {
    const manager = batch.systemManager as { id?: string; name?: string; fullName?: string };
    return {
      id: String(manager.id ?? "").trim(),
      fullName: String(manager.fullName ?? manager.name ?? "").trim(),
    };
  }

  return null;
};

export function mapSubdepartmentBatchListRow(
  batch: Record<string, unknown>,
  targetSlug?: string,
) {
  const statusField = (targetSlug && SUBDEPT_STATUS_FIELD[targetSlug]) || "rmStatus";
  const workflowStatus = normalizeSubdepartmentBatchStatus(
    batch[statusField] ??
      batch.rmStatus ??
      batch.workflowStatus ??
      batch.subDepartmentStatus ??
      batch.formStatus ??
      batch.currentStatus ??
      batch.status,
  );

  const mapped = {
    ...batch,
    id: batch.id,
    batchId: batch.batchId,
    motorIds: Array.isArray(batch.motorIds) ? batch.motorIds : [],
    motorId: resolveMotorId(batch),
    motorType: resolveMotorType(batch),
    batchType: batch.batchType,
    priority: batch.priority,
    assignedTo: resolveAssignedTo(batch),
    createdOn: batch.createdOn,
    formId:
      batch.formId ??
      batch.casePreparationFormId ??
      batch.cpFormId ??
      batch.subDepartmentFormId ??
      null,
    rejectionReason: batch.rejectionReason ?? null,
    material: batch.material ?? batch.materialType ?? null,
    projectName: batch.projectName,
    lotIds: Array.isArray(batch.lotIds) ? batch.lotIds : [],
    rmStatus: workflowStatus,
    [statusField]: workflowStatus,
  };

  return mapped;
}

const emptyStatusCountLabels = (): Record<string, number> => ({
  [OPERATION_STATUS.INITIATED]: 0,
  [OPERATION_STATUS.IN_PROGRESS]: 0,
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: 0,
  [OPERATION_STATUS.APPROVED]: 0,
  [OPERATION_STATUS.REJECTED]: 0,
});

/** Derive tab counts from mapped batch rows when the API omits statusCounts */
export function buildSubdepartmentBatchStatusCountsFromRows(
  batches: Record<string, unknown>[],
  totalRecords: number,
): Record<string, number> {
  const byLabel = emptyStatusCountLabels();

  batches.forEach((batch) => {
    const status = normalizeSubdepartmentBatchStatus(
      batch.rmStatus ?? batch.status ?? batch.workflowStatus,
    );
    if (status in byLabel) {
      byLabel[status] += 1;
    }
  });

  const countedTotal = Object.values(byLabel).reduce((sum, value) => sum + value, 0);

  return {
    ...byLabel,
    [FILTER_ALL]: totalRecords > 0 ? totalRecords : countedTotal,
  };
};

const isIgnorableStatusCountKey = (key: string) => {
  const normalized = key.trim().toLowerCase();
  return normalized === "all" || normalized === "total" || key === FILTER_ALL;
};

export function mapSubdepartmentBatchStatusCounts(
  server: Record<string, number> | undefined,
  totalRecords: number,
  batches: Record<string, unknown>[] = [],
): Record<string, number> {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = server?.[key];
      if (typeof value === "number") return value;
    }
    return 0;
  };

  const byLabel = emptyStatusCountLabels();

  Object.entries(server ?? {}).forEach(([key, value]) => {
    if (typeof value !== "number" || isIgnorableStatusCountKey(key)) return;

    const label = normalizeSubdepartmentBatchStatus(key);
    if (label in byLabel) {
      byLabel[label] = value;
    }
  });

  // Fallback to legacy camelCase / label keys when present
  if (Object.values(byLabel).every((count) => count === 0)) {
    byLabel[OPERATION_STATUS.INITIATED] = pick("initiated", "Initiated", "INITIATED");
    byLabel[OPERATION_STATUS.IN_PROGRESS] = pick("inProgress", "In Progress", "IN_PROGRESS");
    byLabel[OPERATION_STATUS.WAITING_FOR_APPROVAL] = pick(
      "waitingForApproval",
      "waitingforApproval",
      "Waiting for Approval",
      "WAITING_FOR_APPROVAL",
    );
    byLabel[OPERATION_STATUS.APPROVED] = pick("approved", "Approved", "APPROVED");
    byLabel[OPERATION_STATUS.REJECTED] = pick("rejected", "Rejected", "REJECTED");
  }

  const serverTotal = pick(FILTER_ALL, "all", "total");
  const countedTotal = Object.values(byLabel).reduce((sum, value) => sum + value, 0);
  const hasServerCounts = countedTotal > 0 || serverTotal > 0;

  if (!hasServerCounts && batches.length > 0) {
    return buildSubdepartmentBatchStatusCountsFromRows(batches, totalRecords);
  }

  return {
    ...byLabel,
    [FILTER_ALL]: serverTotal || totalRecords || countedTotal,
  };
}

type BuildPayloadArgs = {
  subDepartmentId: number;
  userId: string;
  page: number;
  limit: number;
  statusFilter?: string;
  search?: string;
  advancedFilters?: SubdepartmentBatchListAdvancedFilters;
};

export function buildSubdepartmentBatchListPayload({
  subDepartmentId,
  userId,
  page,
  limit,
  statusFilter,
  search,
  advancedFilters,
}: BuildPayloadArgs): SubdepartmentBatchListRequest {
  const advanced = advancedFilters ?? emptySubdepartmentBatchAdvancedFilters();

  const payload: SubdepartmentBatchListRequest = {
    subDepartmentId,
    userId,
    page,
    limit,
  };

  if (statusFilter && statusFilter !== FILTER_ALL) {
    payload.status = [statusFilter];
  }

  if (advanced.priority?.trim()) {
    payload.priority = [advanced.priority.trim()];
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    payload.search = trimmedSearch;
  }

  if (advanced.motorIds.length > 0) {
    payload.motorIds = advanced.motorIds;
  }

  if (advanced.lotIds.length > 0) {
    payload.lotIds = advanced.lotIds;
  }

  return payload;
}
