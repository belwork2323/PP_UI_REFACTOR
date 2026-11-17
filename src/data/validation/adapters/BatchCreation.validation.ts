import batchImplementationValidationConfig from "../configs/BatchCreation.config";
import { runValidation } from "../runValidation";
import { ValidationErrors, ValidationTier } from "../submissionIntent";

export function validateBatchCreation(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(data as any, tier, batchImplementationValidationConfig);
}
