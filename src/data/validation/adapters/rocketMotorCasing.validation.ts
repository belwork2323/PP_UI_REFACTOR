import type { FormSubmissionType, RocketMotorCasingFormData } from "@/data/models/user/RocketMotorCasingFormModel";
import {
  isCasingSubmitComplete,
  isCasingUnitComplete,
  rocketMotorCasingFieldRules,
  rocketMotorCasingValidationConfig,
} from "../configs/rocketMotorCasing.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { isRequiredForTier } from "../submissionIntent";

export type CasingFieldRuleKey = keyof typeof rocketMotorCasingFieldRules;

/** Whether a casing field shows the required (*) marker — UNIT or SUBMIT mandatory. */
export function isCasingFieldRequired(ruleKey: CasingFieldRuleKey): boolean {
  const rule = rocketMotorCasingFieldRules[ruleKey];
  return (
    isRequiredForTier(rule.requiredIn, "SUBMIT") || isRequiredForTier(rule.requiredIn, "UNIT")
  );
}

export type CasingValidationErrors = ValidationErrors;

export function validateRocketMotorCasing(
  form: RocketMotorCasingFormData,
  tier: ValidationTier,
): CasingValidationErrors {
  return runValidation(form, tier, rocketMotorCasingValidationConfig);
}

/** Maps legacy DRAFT/SUBMIT intent to validation tiers (DRAFT save → UNIT). */
export function validateCasingFormErrors(
  form: RocketMotorCasingFormData,
  intent: FormSubmissionType,
): CasingValidationErrors {
  const tier: ValidationTier = intent === "SUBMIT" ? "SUBMIT" : "UNIT";
  return validateRocketMotorCasing(form, tier);
}

export function validateCasingFormForSubmit(
  form: RocketMotorCasingFormData,
  intent: FormSubmissionType,
): string | null {
  return Object.values(validateCasingFormErrors(form, intent))[0] ?? null;
}

export const canSaveCasingDraft = isCasingUnitComplete;

export const isCasingFormComplete = isCasingSubmitComplete;

export { isCasingUnitComplete, isCasingSubmitComplete, isCasingIdentificationComplete } from "../configs/rocketMotorCasing.validation.config";
