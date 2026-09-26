import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcDeCoringValidationConfig,
  toQcDeCoringValidationTarget,
  type QcDeCoringValidationTarget,
} from "../configs/qcDeCoring.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcDeCoringValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcDeCoring(
  target: QcDeCoringValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcDeCoringValidationConfig);
}

export function validateQcDeCoringValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcDeCoring(toQcDeCoringValidationTarget(values, entryId), tier);
}

export { qcDeCoringValidationConfig };
