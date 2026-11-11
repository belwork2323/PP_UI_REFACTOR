/**
 * Trimming validation adapter (same layout as rawMaterialSourcing.validation.ts).
 */

import type { TrimmingMotorSession } from "@/data/models/user/TrimmingFormModel";
import {
  trimmingValidationConfig,
  toTrimmingValidationTarget,
  type TrimmingValidationTarget,
} from "../configs/trimming.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { legacyIntentToTier, tierToLegacyIntent } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";

export type TrimmingValidationIntent = "DRAFT" | "SUBMIT";

export type { ValidationErrors, ValidationTier, TrimmingValidationTarget };
export {
  fieldError,
  firstValidationError,
  hasValidationErrors,
  tierToLegacyIntent,
  legacyIntentToTier,
};

/** Preferred section order for scroll/focus after failed Trimming SUBMIT. */
const TRIMMING_FOCUS_PREFIX_ORDER = [
  "motorReceivedAt",
  "trimmingDetails.",
  "commonFormatParameters.",
  "measurementQaRemarks",
  "dimensionsQaRemarks",
  "motorRemarks",
] as const;

/** First error field path for manufacturing Trimming focus/scroll. */
export function resolveFirstTrimmingValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of TRIMMING_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** Scroll + focus the control tagged with `data-qc-field` (shared Trimming table). */
export function focusTrimField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("qc-field", fieldPath, root);
}

export function validateTrimming(
  motor: TrimmingValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(motor, tier, trimmingValidationConfig);
}

export function validateTrimmingMotorSession(
  motor: TrimmingMotorSession | null | undefined,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  if (!motor) {
    return tier === "SUBMIT" || tier === "UNIT"
      ? { motor: "Motor data is required." }
      : {};
  }
  return validateTrimming(toTrimmingValidationTarget(motor), tier);
}

export function validateTrimmingBlocks(
  motor: TrimmingMotorSession | null | undefined,
  intent: TrimmingValidationIntent,
): ValidationErrors {
  return validateTrimmingMotorSession(motor, intent === "SUBMIT" ? "SUBMIT" : "FORMAT");
}

export function isTrimmingUnitComplete(motor: TrimmingMotorSession): boolean {
  const target = toTrimmingValidationTarget(motor);
  if (trimmingValidationConfig.isUnitComplete) {
    return trimmingValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateTrimming(target, "UNIT")).length === 0;
}

export { trimmingValidationConfig };
