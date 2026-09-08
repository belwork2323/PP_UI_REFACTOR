/**
 * Static Test Facility validation adapter.
 */

import type { StfMotorSession } from "@/data/models/user/StaticTestFacilityFormModel";
import {
  stfValidationConfig,
  toStfValidationTarget,
  type StfValidationTarget,
} from "../configs/stf.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { legacyIntentToTier, tierToLegacyIntent } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type StfValidationIntent = "DRAFT" | "SUBMIT";

export type { ValidationErrors, ValidationTier, StfValidationTarget };
export {
  fieldError,
  firstValidationError,
  hasValidationErrors,
  tierToLegacyIntent,
  legacyIntentToTier,
};

export function validateStf(
  motor: StfValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(motor, tier, stfValidationConfig);
}

export function validateStfMotorSession(
  motor: StfMotorSession | null | undefined,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  if (!motor) {
    return tier === "SUBMIT" || tier === "UNIT"
      ? { motor: "Motor data is required." }
      : {};
  }
  return validateStf(toStfValidationTarget(motor), tier);
}

export function validateStfBlocks(
  motor: StfMotorSession | null | undefined,
  intent: StfValidationIntent,
): ValidationErrors {
  return validateStfMotorSession(motor, intent === "SUBMIT" ? "SUBMIT" : "FORMAT");
}

export function isStfUnitComplete(motor: StfMotorSession): boolean {
  const target = toStfValidationTarget(motor);
  if (stfValidationConfig.isUnitComplete) {
    return stfValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateStf(target, "UNIT")).length === 0;
}

export { stfValidationConfig };
