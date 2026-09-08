import { runValidation } from "../runValidation";
import castingCuringValidationConfig from "../configs/castingCuring.validation.config";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";
import { postCureValidationConfig } from "../configs/postCure.validation.config";

export function validatePostCure(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(data as any, tier, postCureValidationConfig);
}

export default validatePostCure;
