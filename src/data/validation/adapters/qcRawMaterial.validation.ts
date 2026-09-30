
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcRawMaterialValidationConfig,
  toQcRawMaterialValidationTarget,
  type QcRawMaterialValidationTarget,
} from "../configs/qcRawMaterial.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";

export type { ValidationErrors, ValidationTier, QcRawMaterialValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcRawMaterial(
  target: QcRawMaterialValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcRawMaterialValidationConfig);
}

/** Validate one division entry's schemaValues (REVALIDATION / Raw Material). */
export function validateQcRawMaterialValues(
  values: SchemaFormValues | Record<string, unknown> | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcRawMaterial(toQcRawMaterialValidationTarget(values, entryId), tier);
}

export function isQcRawMaterialUnitComplete(
  values: SchemaFormValues | Record<string, unknown> | null | undefined,
): boolean {
  const target = toQcRawMaterialValidationTarget(values);
  if (qcRawMaterialValidationConfig.isUnitComplete) {
    return qcRawMaterialValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateQcRawMaterial(target, "UNIT")).length === 0;
}

export type QcRawMaterialValidationFocusTarget = {
  fieldPath: string;
};

const trimStr = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Prefer editable cells, then read-only lot/master fields. */
const QC_RAW_MATERIAL_FOCUS_PATH_PRIORITY = (path: string): number => {
  if (/\.RESULT$/.test(path)) return 10;
  if (/\.ACEM_QC_RESULT$/.test(path)) return 20;
  if (/\.VALIDITY$/.test(path)) return 30;
  if (/\.REMARKS$/.test(path)) return 40;
  if (/\.QC_CERTIFICATE$/.test(path)) return 50;
  if (/\.LOT_BATCH_NUMBER$/.test(path)) return 60;
  if (/\.PARAMETER$/.test(path)) return 70;
  if (/\.SPECIFICATION$/.test(path)) return 80;
  if (path === "materials") return 90;
  return 100;
};

export function resolveFirstQcRawMaterialValidationFocus(
  errors: ValidationErrors,
): QcRawMaterialValidationFocusTarget | null {
  const paths = Object.keys(errors).filter((key) => trimStr(errors[key]));
  if (!paths.length) return null;
  paths.sort((a, b) => {
    const pa = QC_RAW_MATERIAL_FOCUS_PATH_PRIORITY(a);
    const pb = QC_RAW_MATERIAL_FOCUS_PATH_PRIORITY(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b, undefined, { numeric: true });
  });
  return { fieldPath: paths[0] };
}

/** Scroll + focus the control tagged with `data-qc-field`. */
export function focusQcField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("qc-field", fieldPath, root);
}

export { qcRawMaterialValidationConfig };
