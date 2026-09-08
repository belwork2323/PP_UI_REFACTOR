import { runValidation } from "../runValidation";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";
import subscaleHardwareValidationConfig from "../configs/subscale.validation.config";
export function validateSubscale(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(data as any, tier, subscaleHardwareValidationConfig);
}

export default validateSubscale;
