import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcTrimmingValidationConfig,
  toQcTrimmingValidationTarget,
  type QcTrimmingValidationTarget,
} from "../configs/qcTrimming.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";
import { focusQcField } from "./qcRawMaterial.validation";

export type { ValidationErrors, ValidationTier, QcTrimmingValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

/** Preferred section order for scroll/focus after failed Trimming SUBMIT. */
const QC_TRIMMING_FOCUS_PREFIX_ORDER = [
  "motorReceivedAt",
  "trimmingDetails.",
  "commonFormatParameters.",
] as const;

/** First error field path for Trimming focus/scroll (stable section order). */
export function resolveFirstQcTrimmingValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of QC_TRIMMING_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** True when error map looks like QC Trimming session paths. */
export function looksLikeQcTrimmingValidationErrors(
  errors: ValidationErrors | null | undefined,
): boolean {
  if (!errors) return false;
  return Object.keys(errors).some((k) => {
    const path = String(k ?? "");
    return (
      path === "motorReceivedAt" ||
      path.startsWith("trimmingDetails.") ||
      path.startsWith("commonFormatParameters.")
    );
  });
}

/** Scroll + focus the control tagged with `data-qc-field`. */
export function focusQcTrimmingField(fieldPath: string, root: ParentNode = document): boolean {
  return focusQcField(fieldPath, root) || focusFieldByDataAttr("qc-field", fieldPath, root);
}

export function validateQcTrimming(
  target: QcTrimmingValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcTrimmingValidationConfig);
}

export function validateQcTrimmingValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcTrimming(toQcTrimmingValidationTarget(values, entryId), tier);
}

export { qcTrimmingValidationConfig };
