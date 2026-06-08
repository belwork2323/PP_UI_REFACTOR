import { STRINGS } from "../../../app/config/strings";
import { OPERATION_STATUS, type OperationStatus } from "../../../hooks/operationStatus";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
const OPERATION_STATUS_VALUES = Object.values(OPERATION_STATUS) as OperationStatus[];

export type SubdepartmentBatchListFilters = {
  search?: string;
  status?: string;
  priority?: string;
  department?: string;
  subDepartment?: string;
  motorIds?: string[];
  lotIds?: string[];
};

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

export type SubdepartmentBatchListSort = {
  field?: string;
  order?: "asc" | "desc";
};

export type SubdepartmentBatchListRequest = {
  pagination: { page: number; limit: number };
  filters: SubdepartmentBatchListFilters;
  sort: { field: string; order: "asc" | "desc" };
};

/** UI operation-status labels → API filter enum */
export const UI_OPERATION_STATUS_TO_API: Record<string, string> = {
  [OPERATION_STATUS.INITIATED]: "INITIATED",
  [OPERATION_STATUS.IN_PROGRESS]: "IN_PROGRESS",
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: "WAITING_FOR_APPROVAL",
  [OPERATION_STATUS.APPROVED]: "APPROVED",
  [OPERATION_STATUS.REJECTED]: "REJECTED",
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

export function normalizeSubdepartmentBatchStatus(status: unknown): OperationStatus {
  const u = String(status ?? "").toUpperCase();
  const map: Record<string, OperationStatus> = {
    INITIATED: OPERATION_STATUS.INITIATED,
    IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
    WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    APPROVED: OPERATION_STATUS.APPROVED,
    REJECTED: OPERATION_STATUS.REJECTED,
    ACTIVE: OPERATION_STATUS.INITIATED,
  };

  const fromApiKey = map[u];
  if (fromApiKey) return fromApiKey;

  const trimmed = String(status ?? "").trim();
  if (OPERATION_STATUS_VALUES.includes(trimmed as OperationStatus)) {
    return trimmed as OperationStatus;
  }

  return OPERATION_STATUS.INITIATED;
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
    formId: batch.formId ?? null,
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
  page: number;
  limit: number;
  statusFilter?: string;
  advancedFilters?: SubdepartmentBatchListAdvancedFilters;
  sort?: SubdepartmentBatchListSort;
};

/** Compact API filter value, e.g. "Casting and Curing" → "CastingAndCuring" */
export const toApiFilterName = (name: string) =>
  String(name ?? "")
    .trim()
    .replace(/&/g, "And")
    .replace(/[^a-zA-Z0-9]/g, "");

export function buildSubdepartmentBatchListPayload({
  page,
  limit,
  statusFilter,
  advancedFilters,
  sort,
}: BuildPayloadArgs): SubdepartmentBatchListRequest {
  const filters: SubdepartmentBatchListFilters = {};
  const advanced = advancedFilters ?? emptySubdepartmentBatchAdvancedFilters();

  if (statusFilter && statusFilter !== FILTER_ALL) {
    filters.status =
      UI_OPERATION_STATUS_TO_API[statusFilter] ??
      statusFilter.trim().toUpperCase().replace(/\s+/g, "_");
  }

  if (advanced.priority?.trim()) {
    filters.priority = advanced.priority.trim();
  }

  if (advanced.motorIds.length > 0) {
    filters.motorIds = advanced.motorIds;
  }

  if (advanced.lotIds.length > 0) {
    filters.lotIds = advanced.lotIds;
  }

  return {
    pagination: { page, limit },
    filters,
    sort: {
      field: sort?.field ?? "createdOn",
      order: sort?.order ?? "desc",
    },
  };
}
