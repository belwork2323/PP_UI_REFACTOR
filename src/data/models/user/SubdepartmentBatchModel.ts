import { STRINGS } from "../../../app/config/strings";
import {
  OPERATION_STATUS,
  toOperationStatusApiValue,
  type OperationStatus,
} from "../../../hooks/operationStatus";
import { motorStageForApi, normalizeMotorStage } from "../admin/BatchManagement/BatchManagementModel";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
const OPERATION_STATUS_VALUES = Object.values(OPERATION_STATUS) as OperationStatus[];

export type SubdepartmentBatchListAdvancedFilters = {
  batchId: string;
  batchTypes: string[];
  motorStages: string[];
  motorIds: string[];
  priorities: string[];
};

export const MANUFACTURING_BATCH_TYPE_OPTIONS = ["MAIN", "SUBSCALE"] as const;
export const MANUFACTURING_PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"] as const;

export const normalizeBatchTypeCode = (raw: string | undefined | null): string => {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s) return "";
  if (s === "MAIN" || s.includes("MAIN")) return "MAIN";
  if (s === "SUBSCALE" || s.includes("SUBSCALE") || s.includes("SUB")) return "SUBSCALE";
  return s;
};

/** Human-readable batch type label for list tables */
export const formatSubdepartmentBatchTypeLabel = (batchType?: string | null): string => {
  const raw = String(batchType ?? "").trim();
  if (!raw) return "—";
  const normalized = normalizeBatchTypeCode(raw);
  if (normalized === "MAIN") return "Main Scale";
  if (normalized === "SUBSCALE") return "Sub Scale";
  return raw;
};

/** Map UI filter codes to batch-list API request values */
export const batchTypeFilterToApiValue = (code: string): string => normalizeBatchTypeCode(code);

/** @deprecated Response labels — use batchTypeFilterToApiValue for request filters */
export const batchTypeFilterToApiLabel = (code: string): string => {
  const normalized = normalizeBatchTypeCode(code);
  if (normalized === "MAIN") return "Main Batch";
  if (normalized === "SUBSCALE") return "Subscale Batch";
  return code.trim();
};

export const hasSubdepartmentBatchAdvancedFilters = (
  filters: SubdepartmentBatchListAdvancedFilters,
): boolean =>
  Boolean(
    filters.batchId?.trim() ||
      filters.batchTypes.length > 0 ||
      filters.motorStages.length > 0 ||
      filters.motorIds.length > 0 ||
      filters.priorities.length > 0,
  );

export const subdepartmentBatchMatchesAdvancedFilters = (
  batch: Record<string, unknown>,
  filters: SubdepartmentBatchListAdvancedFilters,
): boolean => {
  if (filters.batchId?.trim()) {
    const query = filters.batchId.trim().toLowerCase();
    const batchId = String(batch.batchId ?? "").toLowerCase();
    if (!batchId.includes(query)) return false;
  }

  if (filters.batchTypes.length > 0) {
    const rowCode = normalizeBatchTypeCode(String(batch.batchType ?? ""));
    const matches = filters.batchTypes.some((type) => normalizeBatchTypeCode(type) === rowCode);
    if (!matches) return false;
  }

  if (filters.motorStages.length > 0) {
    const rowStage = normalizeMotorStage(batch.motorStage ?? batch.motorType);
    const matches = filters.motorStages.some(
      (stage) => String(normalizeMotorStage(stage)) === String(rowStage),
    );
    if (!matches) return false;
  }

  if (filters.motorIds.length > 0) {
    const rowMotorIds = Array.isArray(batch.motorIds)
      ? batch.motorIds.map((id) => String(id).trim().toLowerCase())
      : [];
    const rowMotorId = String(batch.motorId ?? "").trim().toLowerCase();
    const matches = filters.motorIds.some((id) => {
      const query = id.trim().toLowerCase();
      if (!query) return false;
      return rowMotorIds.some((value) => value.includes(query)) || rowMotorId.includes(query);
    });
    if (!matches) return false;
  }

  if (filters.priorities.length > 0) {
    const rowPriority = String(batch.priority ?? "").trim();
    const matches = filters.priorities.some(
      (priority) => priority.trim().toLowerCase() === rowPriority.toLowerCase(),
    );
    if (!matches) return false;
  }

  return true;
};

export const emptySubdepartmentBatchAdvancedFilters = (): SubdepartmentBatchListAdvancedFilters => ({
  batchId: "",
  batchTypes: [],
  motorStages: [],
  motorIds: [],
  priorities: [],
});

export const SUBDEPARTMENT_BATCH_SEARCH_FIELDS = [
  "batchId",
  "motorId",
  "motorStage",
  "motorType",
  "batchType",
  "priority",
  "projectName",
  "material",
  "stage",
  "assignedTo.fullName",
  "systemManager.fullName",
  "formSubmittedBy.fullName",
  "createdBy.fullName",
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
  search?: string;
  motorIds?: string[];
  batchIds?: string[];
  batchTypes?: string[];
  motorStages?: number[];
  priority?: string[];
};

/** Per route slug → row status field used by list components */
export const SUBDEPT_STATUS_FIELD: Record<string, string> = {
  "raw-material-prep": "rmStatus",
  "case-preparation": "cpStatus",
  mixing: "mxStatus",
  "casting-and-curing": "ccStatus",
  "post-cure-operations": "pcStatus",
  subscale: "ssStatus",
  trimming: "trStatus",
  dispatch: "dispatchStatus",
  "raw-material-revalidation": "qcRmStatus",
  "qc-division": "qcDivStatus",
  ndt: "ndtStatus",
  "static-test-facility": "stfStatus",
};

const compactStatusKey = (value: string) => value.replace(/[\s_-]/g, "").toLowerCase();

const STATUS_KEY_ALIASES: Record<string, OperationStatus> = {
  initiated: OPERATION_STATUS.TO_BE_INITIATED,
  tobeinitiated: OPERATION_STATUS.TO_BE_INITIATED,
  inprogress: OPERATION_STATUS.IN_PROGRESS,
  waitingforapproval: OPERATION_STATUS.WAITING_FOR_APPROVAL,
  approved: OPERATION_STATUS.APPROVED,
  rejected: OPERATION_STATUS.REJECTED,
  active: OPERATION_STATUS.TO_BE_INITIATED,
};

export function normalizeSubdepartmentBatchStatus(status: unknown): OperationStatus {
  const trimmed = String(status ?? "").trim();
  if (!trimmed) return OPERATION_STATUS.TO_BE_INITIATED;

  if (OPERATION_STATUS_VALUES.includes(trimmed as OperationStatus)) {
    return trimmed as OperationStatus;
  }

  const fromAlias = STATUS_KEY_ALIASES[compactStatusKey(trimmed)];
  if (fromAlias) return fromAlias;

  const u = trimmed.toUpperCase();
  const map: Record<string, OperationStatus> = {
    TO_BE_INITIATED: OPERATION_STATUS.TO_BE_INITIATED,
    INITIATED: OPERATION_STATUS.TO_BE_INITIATED,
    IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
    INPROGRESS: OPERATION_STATUS.IN_PROGRESS,
    WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    WAITINGFORAPPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    APPROVED: OPERATION_STATUS.APPROVED,
    REJECTED: OPERATION_STATUS.REJECTED,
    ACTIVE: OPERATION_STATUS.TO_BE_INITIATED,
  };

  return map[u] ?? OPERATION_STATUS.TO_BE_INITIATED;
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

const resolveBatchListStage = (batch: Record<string, unknown>) => {
  const stage = batch.stage ?? batch.workflowStage ?? batch.currentStage;
  if (stage == null || stage === "") return "";

  if (typeof stage === "string") return stage.trim();

  if (typeof stage === "object") {
    const obj = stage as Record<string, unknown>;
    const dept =
      obj.department && typeof obj.department === "object"
        ? (obj.department as Record<string, unknown>)
        : obj.departmentId != null || obj.departmentName
          ? obj
          : null;

    if (dept) {
      const subDepts = Array.isArray(dept.subDepartments)
        ? dept.subDepartments
        : Array.isArray(dept.subDepartment)
          ? dept.subDepartment
          : [];
      const firstSubDept = subDepts[0];
      if (firstSubDept && typeof firstSubDept === "object") {
        const subName = String(
          (firstSubDept as Record<string, unknown>).subDepartmentName ?? "",
        ).trim();
        if (subName) return subName;
      }
      return String(dept.departmentName ?? "").trim();
    }

    return String(obj.label ?? obj.name ?? obj.stage ?? "").trim();
  }

  return String(stage).trim();
};

const resolvePerson = (person: unknown) => {
  if (!person || typeof person !== "object") return null;
  const typed = person as { id?: string; fullName?: string; name?: string };
  return {
    id: String(typed.id ?? "").trim(),
    fullName: String(typed.fullName ?? typed.name ?? "").trim(),
  };
};

const resolveSystemManager = (batch: Record<string, unknown>) =>
  resolvePerson(batch.systemManager);

const resolveCreatedBy = (batch: Record<string, unknown>) => resolvePerson(batch.createdBy);

const resolveFormSubmittedBy = (batch: Record<string, unknown>) =>
  resolvePerson(batch.formSubmittedBy);

const resolveAssignedTo = (batch: Record<string, unknown>) => {
  const assigned = resolvePerson(batch.assignedTo);
  if (assigned?.fullName) return assigned;
  return resolveSystemManager(batch);
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

  const systemManager = resolveSystemManager(batch);
  const createdBy = resolveCreatedBy(batch);
  const formSubmittedBy = resolveFormSubmittedBy(batch);
  const motorStage = normalizeMotorStage(batch.motorStage ?? batch.motorType);
  const submittedBy = String(
    batch.submittedBy ?? formSubmittedBy?.fullName ?? "",
  ).trim();

  const mapped = {
    ...batch,
    id: batch.id,
    batchId: batch.batchId,
    motorIds: Array.isArray(batch.motorIds) ? batch.motorIds.map((id) => String(id)) : [],
    motorId: resolveMotorId(batch),
    numberOfMotors: Number(batch.numberOfMotors ?? 0) || undefined,
    motorStage,
    motorType: motorStage != null ? String(motorStage) : resolveMotorType(batch),
    batchType: batch.batchType,
    priority: batch.priority,
    assignedTo: resolveAssignedTo(batch),
    systemManager,
    createdBy,
    formSubmittedBy,
    submittedBy: submittedBy || null,
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
    stage: resolveBatchListStage(batch),
    lotIds: Array.isArray(batch.lotIds) ? batch.lotIds.map((id) => String(id)) : [],
    rmStatus: workflowStatus,
    [statusField]: workflowStatus,
  };

  return mapped;
}

const emptyStatusCountLabels = (): Record<string, number> => ({
  [OPERATION_STATUS.TO_BE_INITIATED]: 0,
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
    byLabel[OPERATION_STATUS.TO_BE_INITIATED] = pick(
      "toBeInitiated",
      "TO_BE_INITIATED",
      "To Be Initiated",
      "initiated",
      "Initiated",
      "INITIATED",
    );
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
    const apiStatus = toOperationStatusApiValue(statusFilter, FILTER_ALL);
    if (apiStatus) {
      payload.status = [apiStatus];
    }
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    payload.search = trimmedSearch;
  }

  if (advanced.motorIds.length > 0) {
    payload.motorIds = advanced.motorIds.map((id) => id.trim()).filter(Boolean);
  }

  const batchId = advanced.batchId?.trim();
  if (batchId) {
    payload.batchIds = [batchId];
  }

  if (advanced.batchTypes.length > 0) {
    payload.batchTypes = advanced.batchTypes
      .map(batchTypeFilterToApiValue)
      .filter(Boolean);
  }

  if (advanced.motorStages.length > 0) {
    payload.motorStages = advanced.motorStages
      .map((stage) => motorStageForApi(stage))
      .filter((stage): stage is number => typeof stage === "number");
  }

  if (advanced.priorities.length > 0) {
    payload.priority = advanced.priorities;
  }

  return payload;
}
