import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcCastingValidationConfig,
  toQcCastingValidationTarget,
  type QcCastingValidationTarget,
} from "../configs/qcCasting.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcCastingValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

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
