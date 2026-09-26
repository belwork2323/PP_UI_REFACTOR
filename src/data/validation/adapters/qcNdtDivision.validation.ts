import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcNdtDivisionValidationConfig,
  toQcNdtDivisionValidationTarget,
  type QcNdtDivisionValidationTarget,
} from "../configs/qcNdtDivision.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcNdtDivisionValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcNdtDivision(
  target: QcNdtDivisionValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcNdtDivisionValidationConfig);
}

export function validateQcNdtDivisionValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcNdtDivision(toQcNdtDivisionValidationTarget(values, entryId), tier);
}

export { qcNdtDivisionValidationConfig };
