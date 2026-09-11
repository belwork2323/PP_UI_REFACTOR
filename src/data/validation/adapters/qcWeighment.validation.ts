import type { SchemaFormValues } from "@/schema-engine";
import {
  qcWeighmentValidationConfig,
  toQcWeighmentValidationTarget,
  type QcWeighmentValidationTarget,
} from "../configs/qcWeighment.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcWeighmentValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcWeighment(
  target: QcWeighmentValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcWeighmentValidationConfig);
}

export function validateQcWeighmentValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcWeighment(toQcWeighmentValidationTarget(values, entryId), tier);
}

export { qcWeighmentValidationConfig };
