import { runValidation } from "../runValidation";
import castingCuringValidationConfig from "../configs/castingCuring.validation.config";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";

export function validateCastingCuring(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(data as any, tier, castingCuringValidationConfig);
}

export default validateCastingCuring;
