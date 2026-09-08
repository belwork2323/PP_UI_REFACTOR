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

export type TrimmingValidationIntent = "DRAFT" | "SUBMIT";

export type { ValidationErrors, ValidationTier, TrimmingValidationTarget };
export {
  fieldError,
  firstValidationError,
  hasValidationErrors,
  tierToLegacyIntent,
  legacyIntentToTier,
};

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
