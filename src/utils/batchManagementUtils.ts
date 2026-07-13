import { motorStageLabel } from "@data/models/admin/BatchManagement/BatchManagementModel";
import { normalizeSubdepartmentBatchStatus } from "@data/models/user/SubdepartmentBatchModel";

export { motorStageLabel };

export const getBatchId = (b: any): string => b.batchId || b.id || "—";
export const getProjectId = (b: any): string => b?.projectId || b?.projectName || "—";
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

export const getStage = (b: any): string => b.department?.departmentName || "—";

export const getStatus = (b: any): string => normalizeSubdepartmentBatchStatus(b.status);

export const getPriority = (b: any): string => b.priority || "Medium";

export const getDept = (b: any): string => b.department?.departmentName || "—";

export const getSubDept = (b: any): string => {
  if (Array.isArray(b.subDepartments) && b.subDepartments.length > 0) {
    return b.subDepartments[0]?.subDepartmentName || "—";
  }
  return b.subDepartment || b.subDept || "—";
};

export const getSystemManagerLabel = (b: any): string =>
  b.systemManager?.name?.trim() || b.systemManager?.id || b.systemManagerId || "—";

/** @deprecated Use getSystemManagerLabel */
export const getSystemManagerId = (b: any) => getSystemManagerLabel(b);

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
  if (status === "COMPLETED") return true;
  if (status === "DRAFT") return false;
  return Boolean(b.identificationSheet && Object.keys(b.identificationSheet).length > 0);
};

/** @deprecated Use isIdentificationSheetDraft */
export const needsImplementationCompletion = isIdentificationSheetDraft;
