import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcWeighmentValidationConfig,
  toQcWeighmentValidationTarget,
  type QcWeighmentValidationTarget,
} from "../configs/qcWeighment.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";
import { focusQcField } from "./qcRawMaterial.validation";

export type { ValidationErrors, ValidationTier, QcWeighmentValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

/** Preferred section order for scroll/focus after failed Weighment SUBMIT. */
const QC_WEIGHMENT_FOCUS_PREFIX_ORDER = [
  "WEIGHSCALE_NO",
  "CALIBRATION_DUE_DATE",
  "MOTOR_WEIGHT_DETAILS.",
] as const;

/** First error field path for Weighment focus/scroll (stable section order). */
export function resolveFirstQcWeighmentValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of QC_WEIGHMENT_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** True when error map looks like QC Weighment session paths. */
export function looksLikeQcWeighmentValidationErrors(
  errors: ValidationErrors | null | undefined,
): boolean {
  if (!errors) return false;
  return Object.keys(errors).some((k) => {
    const path = String(k ?? "");
    return (
      path === "WEIGHSCALE_NO" ||
      path === "CALIBRATION_DUE_DATE" ||
      path.startsWith("MOTOR_WEIGHT_DETAILS.")
    );
  });
}

/** Scroll + focus the control tagged with `data-qc-field`. */
export function focusQcWeighmentField(fieldPath: string, root: ParentNode = document): boolean {
  return focusQcField(fieldPath, root) || focusFieldByDataAttr("qc-field", fieldPath, root);
}

export function validateQcWeighment(
  target: QcWeighmentValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcWeighmentValidationConfig);
}

export function validateQcWeighmentValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcWeighment(toQcWeighmentValidationTarget(values, entryId), tier);
}

export { qcWeighmentValidationConfig };
