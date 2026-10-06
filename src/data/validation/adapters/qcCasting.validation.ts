import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcCastingValidationConfig,
  toQcCastingValidationTarget,
  type QcCastingValidationTarget,
} from "../configs/qcCasting.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";
import { focusQcField } from "./qcRawMaterial.validation";

export type { ValidationErrors, ValidationTier, QcCastingValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

/** Preferred section order for scroll/focus after failed Casting SUBMIT. */
const QC_CASTING_FOCUS_PREFIX_ORDER = [
  "ASSEMBLY_DATE",
  "MANDREL_ASSEMBLY.",
  "DATE_OF_CASTING",
  "RH_PERCENT",
  "VACUUM_MAINTAINED",
  "CASTING_TABLE.",
  "WEIGHTMENT_DETAILS.",
  "SOAKING_DURATION",
  "PRESSURE_PLATE_ASSEMBLY_REQUIRED",
  "PRESSURE_PLATE_DETAILS.",
  "CASTING_TYPE",
] as const;

/** First error field path for Casting focus/scroll (stable section order). */
export function resolveFirstQcCastingValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of QC_CASTING_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** Scroll + focus the control tagged with `data-qc-field`. */
export function focusQcCastingField(fieldPath: string, root: ParentNode = document): boolean {
  return focusQcField(fieldPath, root) || focusFieldByDataAttr("qc-field", fieldPath, root);
}

export function validateQcCasting(
  target: QcCastingValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcCastingValidationConfig);
}

export function validateQcCastingValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcCasting(toQcCastingValidationTarget(values, entryId), tier);
}

export { qcCastingValidationConfig };
