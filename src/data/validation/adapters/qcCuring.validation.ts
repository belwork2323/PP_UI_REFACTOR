import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcCuringValidationConfig,
  toQcCuringValidationTarget,
  type QcCuringValidationTarget,
} from "../configs/qcCuring.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcCuringValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcCuring(
  target: QcCuringValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcCuringValidationConfig);
}

export function validateQcCuringValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcCuring(toQcCuringValidationTarget(values, entryId), tier);
}

export { qcCuringValidationConfig };
