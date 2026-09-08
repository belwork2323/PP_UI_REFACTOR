import type { NDTMotorSession } from "@/data/models/user/NDTFormModel";
import {
  ndtValidationConfig,
  toNDTValidationTarget,
  type NDTValidationTarget,
} from "../configs/ndt.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { legacyIntentToTier, tierToLegacyIntent } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type NDTValidationIntent = "DRAFT" | "SUBMIT";

export type { ValidationErrors, ValidationTier, NDTValidationTarget };
export {
  fieldError,
  firstValidationError,
  hasValidationErrors,
  tierToLegacyIntent,
  legacyIntentToTier,
};

export function validateNDT(motor: NDTValidationTarget, tier: ValidationTier): ValidationErrors {
  return runValidation(motor, tier, ndtValidationConfig);
}

export function validateNDTMotorSession(
  motor: NDTMotorSession | null | undefined,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  if (!motor) {
    return tier === "SUBMIT" || tier === "UNIT" ? { motor: "Motor data is required." } : {};
  }
  return validateNDT(toNDTValidationTarget(motor), tier);
}

export function validateNDTBlocks(
  motor: NDTMotorSession | null | undefined,
  intent: NDTValidationIntent,
): ValidationErrors {
  return validateNDTMotorSession(motor, intent === "SUBMIT" ? "SUBMIT" : "FORMAT");
}

export function isNDTUnitComplete(motor: NDTMotorSession): boolean {
  const target = toNDTValidationTarget(motor);
  if (ndtValidationConfig.isUnitComplete) {
    return ndtValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateNDT(target, "UNIT")).length === 0;
}

export { ndtValidationConfig };
