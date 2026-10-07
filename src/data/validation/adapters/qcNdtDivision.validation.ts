import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcNdtDivisionValidationConfig,
  toQcNdtDivisionValidationTarget,
  type QcNdtDivisionValidationTarget,
} from "../configs/qcNdtDivision.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";
import { focusQcField } from "./qcRawMaterial.validation";

export type { ValidationErrors, ValidationTier, QcNdtDivisionValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

/** Preferred section order for scroll/focus after failed QC NDT SUBMIT. */
const QC_NDT_FOCUS_PREFIX_ORDER = [
  "RADIOGRAPHY_DETAILS.",
  "RADIOGRAPHY_OBSERVATIONS.",
  "VISUAL_INSPECTION.",
  "SIGNED_REPORT",
  "ADDITIONAL_REMARKS",
] as const;

/** First error field path for QC NDT focus/scroll (stable section order). */
export function resolveFirstQcNdtValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of QC_NDT_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** True when error map looks like QC Division NDT session paths. */
export function looksLikeQcNdtValidationErrors(
  errors: ValidationErrors | null | undefined,
): boolean {
  if (!errors) return false;
  return Object.keys(errors).some((k) => {
    const path = String(k ?? "");
    return (
      path === "SIGNED_REPORT" ||
      path === "ADDITIONAL_REMARKS" ||
      path.startsWith("RADIOGRAPHY_DETAILS.") ||
      path.startsWith("RADIOGRAPHY_OBSERVATIONS.") ||
      path.startsWith("VISUAL_INSPECTION.")
    );
  });
}

/** Scroll + focus the control tagged with `data-qc-field`. */
export function focusQcNdtField(fieldPath: string, root: ParentNode = document): boolean {
  return focusQcField(fieldPath, root) || focusFieldByDataAttr("qc-field", fieldPath, root);
}

export function validateQcNdtDivision(
  target: QcNdtDivisionValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcNdtDivisionValidationConfig);
}

export function validateQcNdtDivisionValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcNdtDivision(toQcNdtDivisionValidationTarget(values, entryId), tier);
}

export { qcNdtDivisionValidationConfig };
