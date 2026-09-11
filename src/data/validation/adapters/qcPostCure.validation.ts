import type { SchemaFormValues } from "@/schema-engine";
import {
  qcPostCureValidationConfig,
  toQcPostCureValidationTarget,
  type QcPostCureValidationTarget,
} from "../configs/qcPostCure.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcPostCureValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcPostCure(
  target: QcPostCureValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcPostCureValidationConfig);
}

export function validateQcPostCureValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  options?: { entryId?: string; subType?: string | null; inhibitorType?: string | null },
): ValidationErrors {
  return validateQcPostCure(toQcPostCureValidationTarget(values, options), tier);
}

export { qcPostCureValidationConfig };
