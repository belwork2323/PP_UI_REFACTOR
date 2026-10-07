import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcPropellantValidationConfig,
  toQcPropellantValidationTarget,
  type QcPropellantValidationTarget,
} from "../configs/qcPropellant.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";
import { focusQcField } from "./qcRawMaterial.validation";

export type { ValidationErrors, ValidationTier, QcPropellantValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

/** Preferred section order for scroll/focus after failed Propellant (QC) SUBMIT. */
const QC_PROPELLANT_FOCUS_PREFIX_ORDER = [
  "MECHANICAL_PROPERTIES.",
  "INTERFACE_PROPERTIES.",
  "SSBR_UBR_BURN_RATE.",
  "BALLISTIC_EVALUATION.",
] as const;

/** First error field path for Propellant focus/scroll (stable section order). */
export function resolveFirstQcPropellantValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of QC_PROPELLANT_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** True when error map looks like QC Propellant / QC division session paths. */
export function looksLikeQcPropellantValidationErrors(
  errors: ValidationErrors | null | undefined,
): boolean {
  if (!errors) return false;
  return Object.keys(errors).some((k) => {
    const path = String(k ?? "");
    return (
      path.startsWith("MECHANICAL_PROPERTIES.") ||
      path.startsWith("INTERFACE_PROPERTIES.") ||
      path.startsWith("SSBR_UBR_BURN_RATE.") ||
      path.startsWith("BALLISTIC_EVALUATION.")
    );
  });
}

/** Scroll + focus the control tagged with `data-qc-field`. */
export function focusQcPropellantField(fieldPath: string, root: ParentNode = document): boolean {
  return focusQcField(fieldPath, root) || focusFieldByDataAttr("qc-field", fieldPath, root);
}

export function validateQcPropellant(
  target: QcPropellantValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcPropellantValidationConfig);
}

export function validateQcPropellantValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcPropellant(toQcPropellantValidationTarget(values, entryId), tier);
}

export { qcPropellantValidationConfig };
