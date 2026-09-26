import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcHardwareValidationConfig,
  toQcHardwareValidationTarget,
  type QcHardwareValidationTarget,
} from "../configs/qcHardware.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";

export type { ValidationErrors, ValidationTier, QcHardwareValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcHardware(
  target: QcHardwareValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, qcHardwareValidationConfig);
}

export function validateQcHardwareValues(
  values: SchemaFormValues | null | undefined,
  subType: string,
  tier: ValidationTier = "SUBMIT",
  entryId?: string,
): ValidationErrors {
  return validateQcHardware(toQcHardwareValidationTarget(values, subType, entryId), tier);
}

export { qcHardwareValidationConfig };
