import { motorStageLabel } from "@data/models/admin/BatchManagement/BatchManagementModel";

export { motorStageLabel };

export const getBatchId = (b: any): string => b.batchId || b.id || "—";
export const getProjectId = (b: any): string => b?.projectId || b?.projectName || "—";

export const getBatchTypeLabel = (b: any): string => {
  const type = String(b?.batchType ?? "")
    .trim()
    .toUpperCase();
  if (type === "MAIN") return "Main";
  if (type === "SUBSCALE") return "Subscale";
  return type || "—";
};

export const getSubBatchTypeLabel = (b: any): string => {
  const subType = String(b?.subBatchType ?? "").trim();
  return subType || "";
};

/** Chip label — prefers sub-type when present (same pattern as processing stage). */
export const getBatchTypeChipLabel = (b: any): string => {
  const subType = getSubBatchTypeLabel(b);
  if (subType) {
    return subType
      .toLowerCase()
      .split(/[\s_]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return getBatchTypeLabel(b);
};
export const getMotorId = (b: any): string => {
  if (Array.isArray(b.motorIds) && b.motorIds.length > 0) {
    return b.motorIds.join(", ");
  }
  return b.motorId || "—";
};

export const getMotorStage = (b: any): string => {
  const stage = b.motorStage ?? b.motorType;
  if (stage == null || stage === "") return "—";
  if (typeof stage === "object") {
    return motorStageLabel(stage.motorStage ?? stage.motorTypeName);
  }
  return motorStageLabel(stage);
};

/** @deprecated Use getMotorStage */
export const getMotorType = getMotorStage;

export const getStage = (b: any): string => {
  const name = String(b.department?.departmentName ?? "").trim();
  return name || "—";
};

/** Show API status as-is (no remapping). */
export const getStatus = (b: any): string => {
  const status = String(b.status ?? "").trim();
  return status || "—";
};

export const getPriority = (b: any): string => b.priority || "Medium";

export const getDept = (b: any): string => b.department?.departmentName || "—";

export const getSubDept = (b: any): string => {
  if (Array.isArray(b.subDepartments) && b.subDepartments.length > 0) {
    const name = b.subDepartments[0]?.subDepartmentName;
    if (name && String(name).trim()) return String(name).trim();
  }

  const stage = b.stage && typeof b.stage === "object" ? b.stage : null;
  const dept =
    stage?.department && typeof stage.department === "object"
      ? stage.department
      : stage?.departmentId != null || stage?.departmentName
        ? stage
        : null;
  const stageSubDept = stage?.subDepartment ?? dept?.subDepartment;

  if (typeof stageSubDept === "string" && stageSubDept.trim()) {
    return stageSubDept.trim();
  }
  if (stageSubDept?.subDepartmentName) {
    return String(stageSubDept.subDepartmentName).trim();
  }

  const rootSubDept = b.subDepartmentName ?? b.firstSubDept ?? b.subDepartment ?? b.subDept;
  if (rootSubDept && String(rootSubDept).trim()) {
    return String(rootSubDept).trim();
  }

  // When identification sheet is DRAFT, API sends stage.departmentName = "Yet to Assign"
  // with empty subDepartments — fall back to department name.
  return b.department?.departmentName || "—";
};

export const getSystemManagerLabel = (b: any): string =>
  b.systemManager?.name?.trim() || b.systemManager?.id || b.systemManagerId || "—";

export const getSystemManagerName = (b: any): string => b.systemManager?.name?.trim() || "—";

export const getSystemManagerId = (b: any): string => {
  const id = b.systemManager?.id?.trim() || String(b.systemManagerId ?? "").trim();
  return id || "—";
};

export const getCreatedOn = (b: any) => b.createdOn || b.createdAt || null;
export const getCreatedBy = (b: any) => b.createdBy ?? null;
export const getNotes = (b: any): string => b.notes || b.description || "";

export const getIdentificationSheetStatus = (b: any): string =>
  String(b.identificationSheetStatus ?? b.identification_sheet_status ?? "")
    .trim()
    .toUpperCase();

export const isIdentificationSheetDraft = (b: any): boolean => {
  const status = getIdentificationSheetStatus(b);
  if (status === "DRAFT") return true;
  if (status === "COMPLETED") return false;
  return !b.identificationSheet || Object.keys(b.identificationSheet).length === 0;
};

export const isIdentificationSheetCompleted = (b: any): boolean => {
  const status = getIdentificationSheetStatus(b);
  if (status === "COMPLETED" || status === "COMPLETE") return true;
  if (status === "DRAFT") return false;
  return Boolean(b.identificationSheet && Object.keys(b.identificationSheet).length > 0);
};

/** @deprecated Use isIdentificationSheetDraft */
export const needsImplementationCompletion = isIdentificationSheetDraft;

const normalizeWorkflowStatus = (status: string): string =>
  String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

/** Current processing sub-department is Raw Material Preparation. */
export const isRawMaterialPreparationStage = (b: any): boolean =>
  getSubDept(b).trim().toLowerCase() === "raw material preparation";

/** Current processing sub-department is Subscale. */
export const isSubscaleStage = (b: any): boolean =>
  getSubDept(b).trim().toLowerCase() === "subscale";

export const isSubscaleBatchType = (b: any): boolean =>
  String(b?.batchType ?? "")
    .trim()
    .toUpperCase() === "SUBSCALE";

/** Batch workflow status is To Be Initiated (not yet started in current stage). */
export const isToBeInitiatedBatchStatus = (b: any): boolean => {
  const status = normalizeWorkflowStatus(getStatus(b));
  return status === "TO_BE_INITIATED" || status === "TO_BE_INTIATED" || status === "INITIATED";
};

/** Batch workflow status is In Progress in the current stage. */
export const isInProgressBatchStatus = (b: any): boolean =>
  normalizeWorkflowStatus(getStatus(b)) === "IN_PROGRESS";

/** Batch has not yet been assigned to a processing sub-department. */
export const isYetToAssignStage = (b: any): boolean => {
  const subDept = getSubDept(b).trim().toLowerCase();
  const dept = String(b.department?.departmentName ?? getDept(b) ?? "")
    .trim()
    .toLowerCase();
  return subDept === "yet to assign" || dept === "yet to assign";
};

/** First workflow sub-department for this batch type (RMP for MAIN, Subscale for SUBSCALE). */
export const isFirstSubDepartmentStage = (b: any): boolean =>
  isSubscaleBatchType(b) ? isSubscaleStage(b) : isRawMaterialPreparationStage(b);

export type AdminBatchEditMode = "none" | "full" | "append_only";

/** Resolve admin batch edit permissions from list/detail row. */
export const getAdminBatchEditMode = (b: any): AdminBatchEditMode => {
  if (!isIdentificationSheetCompleted(b)) return "none";
  if (isYetToAssignStage(b)) return "full";
  if (isFirstSubDepartmentStage(b) && isToBeInitiatedBatchStatus(b)) return "full";
  return "append_only";
};

export const canEditAdminBatch = (b: any): boolean => getAdminBatchEditMode(b) !== "none";

/**
 * Admin batch list delete is allowed only when:
 * - identification sheet is DRAFT, or
 * - MAIN batch: stage is Raw Material Preparation and status is TO_BE_INITIATED, or
 * - SUBSCALE batch: stage is Subscale and status is TO_BE_INITIATED (hidden once IN_PROGRESS).
 */
export const canDeleteAdminBatch = (b: any): boolean => {
  if (isIdentificationSheetDraft(b)) return true;

  if (isSubscaleBatchType(b)) {
    return isSubscaleStage(b) && isToBeInitiatedBatchStatus(b);
  }

  return isRawMaterialPreparationStage(b) && isToBeInitiatedBatchStatus(b);
};
