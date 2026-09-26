import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcTrimmingValidationConfig,
  toQcTrimmingValidationTarget,
  type QcTrimmingValidationTarget,
} from "../configs/qcTrimming.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcTrimmingValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcTrimming(
  target: QcTrimmingValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcTrimmingValidationConfig);
}

export function validateQcTrimmingValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcTrimming(toQcTrimmingValidationTarget(values, entryId), tier);
}

export { qcTrimmingValidationConfig };
