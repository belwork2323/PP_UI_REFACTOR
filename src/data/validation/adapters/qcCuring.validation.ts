import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcCuringValidationConfig,
  toQcCuringValidationTarget,
  type QcCuringValidationTarget,
} from "../configs/qcCuring.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusQcField } from "./qcRawMaterial.validation";

export type { ValidationErrors, ValidationTier, QcCuringValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

/** Preferred section order for scroll/focus after failed Curing SUBMIT. */
const QC_CURING_FOCUS_PREFIX_ORDER = [
  "MOTOR_POSITIONING_DATE_TIME",
  "CURING_CYCLE_DETAILS.",
  "VISUAL_OBSERVATIONS",
  "SHORE_A_HARDNESS",
  "DISPATCH_DATE_TIME",
  "CURING_PARAMETER_TABLE.",
  "CURING_START_DATE",
  "CYCLE_START_TIME",
  "CURING_COMPLETE_DATE",
  "CYCLE_END_TIME",
  "BEM_AVERAGE_SHORE_A_HARDNESS",
  "CARTON_AVERAGE_SHORE_A_HARDNESS",
  "SUBSCALE_VISUAL_OBSERVATIONS",
] as const;

/** First error field path for Curing focus/scroll (stable section order). */
export function resolveFirstQcCuringValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of QC_CURING_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** Scroll + focus the control tagged with `data-qc-field`. */
export function focusQcCuringField(fieldPath: string, root: ParentNode = document): boolean {
  return focusQcField(fieldPath, root);
}

export function validateQcCuring(
  target: QcCuringValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcCuringValidationConfig);
}

export function validateQcCuringValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcCuring(toQcCuringValidationTarget(values, entryId), tier);
}

export { qcCuringValidationConfig };
