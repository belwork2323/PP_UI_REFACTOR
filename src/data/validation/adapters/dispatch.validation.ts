import type { DispatchMotorData } from "@/data/models/user/DispatchMotorDataModel";
import { createEmptyDispatchMotorData } from "@/data/models/user/DispatchMotorDataModel";
import type {
  DispatchMotorSession,
  DispatchMotorSetup,
} from "@/data/models/user/DispatchFormModel";
import { createDefaultDispatchMotorSetup } from "@/data/models/user/DispatchFormModel";
import {
  dispatchValidationConfig,
  toDispatchValidationTarget,
  type DispatchValidationTarget} from "../configs/dispatch.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { legacyIntentToTier, tierToLegacyIntent } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type DispatchValidationIntent = "DRAFT" | "SUBMIT";

export type { ValidationErrors, ValidationTier, DispatchValidationTarget };
export {
  fieldError,
  firstValidationError,
  hasValidationErrors,
  tierToLegacyIntent,
  legacyIntentToTier,
};

/** Primary entry — FORMAT | UNIT | SUBMIT */
export function validateDispatch(
  target: DispatchValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, dispatchValidationConfig);
}

export function validateDispatchMotorSession(
  motor: DispatchMotorSession | null | undefined,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  if (!motor) {
    return tier === "SUBMIT" || tier === "UNIT" ? { motor: "Motor data is required." } : {};
  }
  return validateDispatch(toDispatchValidationTarget(motor), tier);
}

/**
 * Legacy DRAFT | SUBMIT (DRAFT → FORMAT). Prefer tier-based API.
 */
export function validateDispatchBlocks(
  motor: DispatchMotorSession | null | undefined,
  intent: DispatchValidationIntent,
): ValidationErrors {
  return validateDispatchMotorSession(motor, intent === "SUBMIT" ? "SUBMIT" : "FORMAT");
}

export function validateDispatchMotorData(
  data: DispatchMotorData | null | undefined,
  setup?: DispatchMotorSetup | null,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  return validateDispatch(
    {
      setup: setup ?? createDefaultDispatchMotorSetup(),
      data: data ?? createEmptyDispatchMotorData(),
    },
    tier,
  );
}

/** UNIT gate — setup date + location (config.isUnitComplete). */
export function isDispatchUnitComplete(motor: DispatchMotorSession): boolean {
  const target = toDispatchValidationTarget(motor);
  if (dispatchValidationConfig.isUnitComplete) {
    return dispatchValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateDispatch(target, "UNIT")).length === 0;
}

export { dispatchValidationConfig };
