import { STRINGS } from "../../../app/config/strings";
import {
  OPERATION_STATUS,
  formatApiStatusForDisplay,
  mapApiStatusCountKeyToUiTab,
  mapDisplayStatusToUiTab,
  toOperationStatusApiValue,
  type OperationStatus,
} from "../../../hooks/operationStatus";
import {
  motorStageForApi,
  normalizeMotorStage,
} from "../admin/BatchManagement/BatchManagementModel";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

/** Shown when the working subdepartment is absent from currentStage and stageProgress. */
export const BATCH_STATUS_UNAVAILABLE = "Status Unavailable";

export type SubdepartmentBatchListAdvancedFilters = {
  batchId: string;
  batchTypes: string[];
  motorStages: string[];
  motorIds: string[];
  projectIds: string[];
};

export const MANUFACTURING_BATCH_TYPE_OPTIONS = ["MAIN", "SUBSCALE"] as const;

export const normalizeBatchTypeCode = (raw: string | undefined | null): string => {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
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
    filters.projectIds.length > 0,
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
    const rowMotorId = String(batch.motorId ?? "")
      .trim()
      .toLowerCase();
    const matches = filters.motorIds.some((id) => {
      const query = id.trim().toLowerCase();
      if (!query) return false;
      return rowMotorIds.some((value) => value.includes(query)) || rowMotorId.includes(query);
    });
    if (!matches) return false;
  }

  if (filters.projectIds.length > 0) {
    const nested =
      batch.project && typeof batch.project === "object"
        ? (batch.project as { projectId?: string })
        : null;
    const rowProjectId = String(nested?.projectId ?? batch.projectId ?? "")
      .trim()
      .toLowerCase();
    const matches = filters.projectIds.some((id) => id.trim().toLowerCase() === rowProjectId);
    if (!matches) return false;
  }

  return true;
};

export const emptySubdepartmentBatchAdvancedFilters =
  (): SubdepartmentBatchListAdvancedFilters => ({
    batchId: "",
    batchTypes: [],
    motorStages: [],
    motorIds: [],
    projectIds: [],
  });

export const SUBDEPARTMENT_BATCH_SEARCH_FIELDS = [
  "batchId",
  "motorId",
  "motorStage",
  "motorType",
  "batchType",
  "priority",
  "projectName",
  "projectId",
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
  projectId?: string;
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

/** Format API status for list display — shows server value, no remapping. */
export function normalizeSubdepartmentBatchStatus(status: unknown): string {
  const trimmed = String(status ?? "").trim();
  if (!trimmed) return BATCH_STATUS_UNAVAILABLE;
  if (trimmed === BATCH_STATUS_UNAVAILABLE) return BATCH_STATUS_UNAVAILABLE;
  return formatApiStatusForDisplay(trimmed);
}

type BatchStageStatusResolution = {
  status: unknown;
  rejectionReason: string | null;
  stageEntry: Record<string, unknown> | null;
};

export const findStageEntryForSubDepartment = (
  stages: unknown,
  subDepartmentId: number,
): Record<string, unknown> | null => {
  if (!Array.isArray(stages) || !subDepartmentId) return null;

  const match = stages.find((entry) => {
    if (!entry || typeof entry !== "object") return false;
    return Number((entry as Record<string, unknown>).subDepartmentId) === subDepartmentId;
  });

  return match && typeof match === "object" ? (match as Record<string, unknown>) : null;
};

const hasBatchStageArrays = (batch: Record<string, unknown>) =>
  Array.isArray(batch.currentStage) || Array.isArray(batch.stageProgress);

/**
 * Resolve workflow status for a subdepartment batch-list row:
 * 1) currentStage entry for this subdepartment
 * 2) else stageProgress entry for this subdepartment
 * 3) else Status Unavailable (when stage arrays are present)
 * Legacy single `status` fields are used only when stage arrays are absent.
 */
export function resolveWorkflowStatusFromBatchStages(
  batch: Record<string, unknown>,
  subDepartmentId?: number | null,
): BatchStageStatusResolution {
  const targetId = Number(subDepartmentId ?? batch.subDepartmentId ?? 0) || 0;
  const hasStages = hasBatchStageArrays(batch);

  if (hasStages && targetId > 0) {
    const fromCurrent = findStageEntryForSubDepartment(batch.currentStage, targetId);
    const currentStatus = String(fromCurrent?.status ?? "").trim();
    if (fromCurrent && currentStatus) {
      return {
        status: fromCurrent.status,
        rejectionReason:
          fromCurrent.rejectionReason != null
            ? String(fromCurrent.rejectionReason)
            : null,
        stageEntry: fromCurrent,
      };
    }

    const fromProgress = findStageEntryForSubDepartment(batch.stageProgress, targetId);
    const progressStatus = String(fromProgress?.status ?? "").trim();
    if (fromProgress && progressStatus) {
      return {
        status: fromProgress.status,
        rejectionReason:
          fromProgress.rejectionReason != null
            ? String(fromProgress.rejectionReason)
            : null,
        stageEntry: fromProgress,
      };
    }

    return {
      status: BATCH_STATUS_UNAVAILABLE,
      rejectionReason: null,
      stageEntry: null,
    };
  }

  if (hasStages) {
    return {
      status: BATCH_STATUS_UNAVAILABLE,
      rejectionReason: null,
      stageEntry: null,
    };
  }

  return {
    status:
      batch.status ??
      batch.rmStatus ??
      batch.workflowStatus ??
      batch.subDepartmentStatus ??
      batch.formStatus ??
      batch.currentStatus,
    rejectionReason:
      batch.rejectionReason != null ? String(batch.rejectionReason) : null,
    stageEntry: null,
  };
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

const resolveSystemManager = (batch: Record<string, unknown>) => resolvePerson(batch.systemManager);

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
  subDepartmentId?: number | null,
) {
  const statusField = (targetSlug && SUBDEPT_STATUS_FIELD[targetSlug]) || "rmStatus";
  const stageResolution = resolveWorkflowStatusFromBatchStages(batch, subDepartmentId);
  const statusFieldFallback =
    batch[statusField] ??
    batch.status ??
    batch.rmStatus ??
    batch.workflowStatus ??
    batch.subDepartmentStatus ??
    batch.formStatus ??
    batch.currentStatus;
  const workflowStatus = normalizeSubdepartmentBatchStatus(
    stageResolution.status ?? statusFieldFallback,
  );

  const systemManager = resolveSystemManager(batch);
  const createdBy = resolveCreatedBy(batch);
  const formSubmittedBy = resolveFormSubmittedBy(batch);
  const motorStage = normalizeMotorStage(batch.motorStage ?? batch.motorType);
  const submittedBy = String(batch.submittedBy ?? formSubmittedBy?.fullName ?? "").trim();

  const nestedProject =
    batch.project && typeof batch.project === "object"
      ? (batch.project as { projectId?: string | null; projectName?: string | null })
      : null;
  const projectId = String(nestedProject?.projectId ?? batch.projectId ?? "").trim();
  const projectName = String(nestedProject?.projectName ?? batch.projectName ?? "").trim();

  const stageLabel =
    stageResolution.stageEntry != null
      ? String(
          stageResolution.stageEntry.subDepartmentName ??
            stageResolution.stageEntry.departmentName ??
            "",
        ).trim()
      : resolveBatchListStage(batch);

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
    subBatchType: batch.subBatchType ?? null,
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
    rejectionReason:
      stageResolution.rejectionReason ??
      (batch.rejectionReason != null ? String(batch.rejectionReason) : null),
    material: batch.material ?? batch.materialType ?? null,
    projectId,
    projectName,
    stage: stageLabel,
    lotIds: Array.isArray(batch.lotIds) ? batch.lotIds.map((id) => String(id)) : [],
    rmStatus: workflowStatus,
    status: workflowStatus,
    [statusField]: workflowStatus,
  };

  return mapped;
}

const emptyStatusCountLabels = (): Record<string, number> => ({
  [OPERATION_STATUS.TO_BE_INITIATED]: 0,
  [OPERATION_STATUS.IN_PROGRESS]: 0,
  [OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL]: 0,
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: 0,
  [OPERATION_STATUS.APPROVED]: 0,
  [OPERATION_STATUS.COMPLETELY_APPROVED]: 0,
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
      batch.rmStatus ??
        batch.cpStatus ??
        batch.status ??
        batch.workflowStatus,
    );
    const tab = mapDisplayStatusToUiTab(status);
    if (tab && tab in byLabel) {
      byLabel[tab] += 1;
    }
  });

  const countedTotal = Object.values(byLabel).reduce((sum, value) => sum + value, 0);

  return {
    ...byLabel,
    // Prefer status-bucket sum; pagination totalRecords changes with the active status filter.
    [FILTER_ALL]: countedTotal > 0 ? countedTotal : totalRecords,
  };
}

const isIgnorableStatusCountKey = (key: string) => {
  const normalized = key.trim().toLowerCase();
  return normalized === "all" || normalized === "total" || key === FILTER_ALL;
};

/**
 * Map API `statusCounts` camelCase keys onto UI status filter tabs.
 * Batch row statuses are not remapped — only tab counts are bucketed here.
 */
export function mapSubdepartmentBatchStatusCounts(
  server: Record<string, number> | undefined,
  totalRecords: number,
  batches: Record<string, unknown>[] = [],
): Record<string, number> {
  const byLabel = emptyStatusCountLabels();

  Object.entries(server ?? {}).forEach(([key, value]) => {
    if (typeof value !== "number" || isIgnorableStatusCountKey(key)) return;

    const tab = mapApiStatusCountKeyToUiTab(key);
    if (tab) {
      byLabel[tab] += value;
    }
  });

  let countedTotal = Object.values(byLabel).reduce((sum, value) => sum + value, 0);
  const hasServerCounts = countedTotal > 0 || Object.keys(server ?? {}).length > 0;

  if (!hasServerCounts && batches.length > 0) {
    return buildSubdepartmentBatchStatusCountsFromRows(batches, totalRecords);
  }

  if (batches.length > 0 && server && typeof server === "object") {
    const serverTabs = new Set(
      Object.keys(server)
        .filter((key) => !isIgnorableStatusCountKey(key) && typeof server[key] === "number")
        .map((key) => mapApiStatusCountKeyToUiTab(key))
        .filter(Boolean),
    );
    const fromRows = buildSubdepartmentBatchStatusCountsFromRows(batches, totalRecords);
    (Object.keys(byLabel) as string[]).forEach((status) => {
      if (!serverTabs.has(status as OperationStatus) && (fromRows[status] ?? 0) > 0) {
        byLabel[status] = fromRows[status];
      }
    });
    countedTotal = Object.values(byLabel).reduce((sum, value) => sum + value, 0);
  }

  return {
    ...byLabel,
    [FILTER_ALL]: countedTotal > 0 ? countedTotal : totalRecords,
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
    payload.batchTypes = advanced.batchTypes.map(batchTypeFilterToApiValue).filter(Boolean);
  }

  if (advanced.motorStages.length > 0) {
    payload.motorStages = advanced.motorStages
      .map((stage) => motorStageForApi(stage))
      .filter((stage): stage is number => typeof stage === "number");
  }

  if (advanced.projectIds.length > 0) {
    const projectId = String(advanced.projectIds[0] ?? "").trim();
    if (projectId) payload.projectId = projectId;
  }

  return payload;
}
