import type { MaterialItem } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import { getBatchStageProgressArrays } from "../previousStageApproval";
import {
  extractBatchMotorIds,
  type QcPartialItemStatus,
} from "./qcDivisionApprovalUnits";
import {
  extractQcDivisionStatusesFromBatch,
  mapFormDetailsDivisionStatusesToFlowKeyMap,
  resolveQcDivisionStatusSource,
} from "./qcDivisionDataSource";
import type { QcDivisionCatalogItem } from "./qcFlowConfig";
import {
  resolveQcWorkingBatchType,
  resolveQcWorkingSubBatchType,
} from "./qcBatchType";

export type QcBatchUnits = {
  motorIds: string[];
  premixCount: number;
  materials: MaterialItem[];
};

export type QcBatchContext = {
  batchId: string;
  batchType: "MAIN" | "SUBSCALE" | "";
  subBatchType: "QUALIFICATION" | "EXPERIMENTAL" | "";
  batchWorkflowStatus: string;
  divisionStatuses: Record<string, QcPartialItemStatus>;
  units: QcBatchUnits;
  stageProgress: unknown[] | null;
  currentStage: unknown[] | null;
};

export type QcDivisionUnitKind = "MOTOR" | "PREMIX" | "MATERIAL" | "NONE";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickNumber = (...values: unknown[]): number => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
};

/** Unwrap batch details from bootstrap payload, list row, or nested `__batchDetails`. */
export const resolveBatchDetailsRoot = (batchPayload: unknown): Record<string, unknown> | null => {
  const root = asRecord(batchPayload);
  if (!root) return null;
  return asRecord(root.__batchDetails) ?? root;
};

export const extractBatchPremixCount = (batchPayload: unknown): number => {
  const batch = resolveBatchDetailsRoot(batchPayload);
  if (!batch) return 0;
  const sheet = asRecord(batch.identificationSheet);
  const count =
    pickNumber(
      sheet?.numberOfPremix,
      sheet?.number_of_premix,
      batch.numberOfPremix,
      batch.premixCount,
    ) ?? 0;
  if (count > 0) return count;
  if (asArray(sheet?.materials).length > 0) return 1;
  return 0;
};

export const extractQcBatchUnits = (batchPayload: unknown): QcBatchUnits => {
  const motorIds = extractBatchMotorIds(batchPayload).map((row) => row.motorId);
  const batch = resolveBatchDetailsRoot(batchPayload);
  const sheet = asRecord(batch?.identificationSheet);
  const materials = asArray(sheet?.materials).filter(
    (row): row is MaterialItem => row != null && typeof row === "object",
  );

  return {
    motorIds,
    premixCount: extractBatchPremixCount(batchPayload),
    materials,
  };
};

const normalizeBatchWorkflowStatus = (batchPayload: unknown): string =>
  String(asRecord(batchPayload)?.status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const getQcDivisionUnitRequirements = (
  flowKey: string,
  rawMaterialType?: string | null,
): QcDivisionUnitKind[] => {
  const key = String(flowKey ?? "").trim().toUpperCase();
  const typeKey = String(rawMaterialType ?? "").trim().toUpperCase();

  if (key === "RAW_MATERIAL_REVALIDATION") return ["NONE"];

  if (key === "RAW_MATERIAL") {
    if (typeKey === "RAW_MATERIAL_REVALIDATION") return ["NONE"];
    if (typeKey === "RAW_MATERIAL_PROCESSING") return ["PREMIX", "MATERIAL"];
    return ["MATERIAL"];
  }
  if (key === "MIXING") return ["PREMIX"];
  if (
    key === "HARDWARE" ||
    key === "CASTING" ||
    key === "CURING" ||
    key === "DE_CORING" ||
    key === "TRIMMING" ||
    key === "POST_CURE" ||
    key === "NDT" ||
    key === "QC" ||
    key === "WEIGHTMENT"
  ) {
    return ["MOTOR"];
  }
  return ["NONE"];
};

export const canShowQcDivisionUi = (
  flowKey: string,
  units: QcBatchUnits,
  rawMaterialType?: string | null,
): boolean => {
  const requirements = getQcDivisionUnitRequirements(flowKey, rawMaterialType);
  if (requirements.includes("NONE") || requirements.length === 0) return true;

  return requirements.every((kind) => {
    if (kind === "MOTOR") return units.motorIds.length > 0;
    if (kind === "PREMIX") return units.premixCount > 0;
    if (kind === "MATERIAL") return units.materials.length > 0;
    return true;
  });
};

export const getQcDivisionBlockedReason = (
  flowKey: string,
  units: QcBatchUnits,
  rawMaterialType?: string | null,
): string | null => {
  if (canShowQcDivisionUi(flowKey, units, rawMaterialType)) return null;

  const requirements = getQcDivisionUnitRequirements(flowKey, rawMaterialType);
  const missing: string[] = [];
  if (requirements.includes("MOTOR") && units.motorIds.length === 0) missing.push("motor");
  if (requirements.includes("PREMIX") && units.premixCount === 0) missing.push("premix");
  if (requirements.includes("MATERIAL") && units.materials.length === 0) missing.push("material");

  if (!missing.length) {
    return "Cannot show QC UI — no motor, premix, or material data available for this batch.";
  }
  return `Cannot show QC UI — no ${missing.join(" / ")} data available for this batch.`;
};

export const resolveQcBatchContext = (params: {
  listRow?: Record<string, unknown> | null;
  batchDetails: unknown;
  catalog?: QcDivisionCatalogItem[];
  formId?: string | null;
  qcFormDetails?: unknown;
}): QcBatchContext => {
  const batch = asRecord(params.batchDetails) ?? {};
  const list = asRecord(params.listRow) ?? {};

  const batchType = resolveQcWorkingBatchType(
    list.batchType as string | null,
    batch.batchType as string | null,
  );
  const subBatchType = resolveQcWorkingSubBatchType(
    list.subBatchType as string | null,
    batch.subBatchType as string | null,
  );

  const stageArrays = getBatchStageProgressArrays(batch);
  const divisionStatuses = resolveQcDivisionStatusSource({
    formId: params.formId,
    batchDetails: params.batchDetails,
    qcFormDetails: params.qcFormDetails,
    catalog: params.catalog,
  });

  return {
    batchId: String(batch.batchId ?? list.batchId ?? "").trim(),
    batchType,
    subBatchType,
    batchWorkflowStatus: normalizeBatchWorkflowStatus(params.batchDetails),
    divisionStatuses,
    units: extractQcBatchUnits(params.batchDetails),
    stageProgress: (stageArrays.stageProgress as unknown[] | null) ?? null,
    currentStage: (stageArrays.currentStage as unknown[] | null) ?? null,
  };
};

export { extractQcDivisionStatusesFromBatch, mapFormDetailsDivisionStatusesToFlowKeyMap, resolveQcDivisionStatusSource };
