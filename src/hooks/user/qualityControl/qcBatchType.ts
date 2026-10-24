import { normalizeBatchTypeCode } from "../../../data/models/user/SubdepartmentBatchModel";

export const isQcMainBatch = (batchType?: string | null) =>
  normalizeBatchTypeCode(batchType) === "MAIN";

export const isQcSubscaleBatch = (batchType?: string | null) =>
  normalizeBatchTypeCode(batchType) === "SUBSCALE";

export const normalizeQcSubBatchType = (raw?: string | null): string => {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!s) return "";
  if (s.includes("QUALIFICATION")) return "QUALIFICATION";
  if (s.includes("EXPERIMENTAL")) return "EXPERIMENTAL";
  return s;
};

export const isQcQualificationSubBatch = (subBatchType?: string | null) =>
  normalizeQcSubBatchType(subBatchType) === "QUALIFICATION";

export const isQcExperimentalSubBatch = (subBatchType?: string | null) =>
  normalizeQcSubBatchType(subBatchType) === "EXPERIMENTAL";

/** Subscale Qualification or Experimental — manufacturing skips RMP / Mixing / NDT unit approvals. */
export const isQcSubscaleQualOrExperimentalBatch = (
  batchType?: string | null,
  subBatchType?: string | null,
): boolean =>
  isQcSubscaleBatch(batchType) &&
  (isQcQualificationSubBatch(subBatchType) || isQcExperimentalSubBatch(subBatchType));

/** QC premix / final mix / motor tabs should not wait on prior subdepartment approvals. */
export const shouldSkipQcManufacturingUnitPrerequisiteGate = (
  batchType?: string | null,
  subBatchType?: string | null,
): boolean => isQcSubscaleQualOrExperimentalBatch(batchType, subBatchType);

/**
 * Experimental QC applicable divisions: RMR / RMP / Mixing, plus STF (BEM-gated separately).
 * Hardware+ / QC / Weighment stay N/A (no motors on experimental subscale).
 */
export const isQcExperimentalAllowedDivision = (
  flowKey: string,
  rawMaterialType?: string | null,
): boolean => {
  const key = String(flowKey ?? "")
    .trim()
    .toUpperCase();
  const typeKey = String(rawMaterialType ?? "")
    .trim()
    .toUpperCase();
  if (
    key === "RAW_MATERIAL_REVALIDATION" ||
    key === "RAW_MATERIAL_PROCESSING" ||
    key === "MIXING" ||
    key === "STATIC_TEST_FACILITY"
  ) {
    return true;
  }
  if (key === "RAW_MATERIAL") {
    if (!typeKey) return true;
    return (
      typeKey === "RAW_MATERIAL_REVALIDATION" || typeKey === "RAW_MATERIAL_PROCESSING"
    );
  }
  return false;
};

/** True when Experimental division is always-on (not BEM-gated STF). */
export const isQcExperimentalAlwaysEnabledDivision = (
  flowKey: string,
  rawMaterialType?: string | null,
): boolean => {
  const key = String(flowKey ?? "")
    .trim()
    .toUpperCase();
  if (key === "STATIC_TEST_FACILITY") return false;
  return isQcExperimentalAllowedDivision(flowKey, rawMaterialType);
};

export const QC_EXPERIMENTAL_DIVISION_BLOCKED_REASON =
  "No motor linked to this subscale batch — this division is not applicable.";
/** Prefer explicit Subscale from list or details — details may default empty batchType to MAIN. */
export const resolveQcWorkingBatchType = (
  listBatchType?: string | null,
  detailsBatchType?: string | null,
): "MAIN" | "SUBSCALE" | "" => {
  const listCode = normalizeBatchTypeCode(listBatchType);
  const detailsCode = normalizeBatchTypeCode(detailsBatchType);
  if (listCode === "SUBSCALE" || detailsCode === "SUBSCALE") return "SUBSCALE";
  if (listCode === "MAIN" || detailsCode === "MAIN") return "MAIN";
  const resolved = listCode || detailsCode;
  if (resolved === "MAIN" || resolved === "SUBSCALE") return resolved;
  return "";
};

export const resolveQcWorkingSubBatchType = (
  listSubBatchType?: string | null,
  detailsSubBatchType?: string | null,
): "QUALIFICATION" | "EXPERIMENTAL" | "" => {
  const listCode = normalizeQcSubBatchType(listSubBatchType);
  const detailsCode = normalizeQcSubBatchType(detailsSubBatchType);
  if (listCode === "EXPERIMENTAL" || detailsCode === "EXPERIMENTAL") return "EXPERIMENTAL";
  if (listCode === "QUALIFICATION" || detailsCode === "QUALIFICATION") return "QUALIFICATION";
  const resolved = listCode || detailsCode;
  if (resolved === "QUALIFICATION" || resolved === "EXPERIMENTAL") return resolved;
  return "";
};
