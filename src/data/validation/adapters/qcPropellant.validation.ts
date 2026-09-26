import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcPropellantValidationConfig,
  toQcPropellantValidationTarget,
  type QcPropellantValidationTarget,
} from "../configs/qcPropellant.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcPropellantValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

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
