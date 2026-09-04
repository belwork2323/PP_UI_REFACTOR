import { runValidation } from "../runValidation";
import mixingValidationConfig from "../configs/mixing.validation.config";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";

export function validateMixing(data: unknown, tier: ValidationTier): ValidationErrors {
  // data expected shape: { premixes?: [], finalMixes?: [] }
  return runValidation(data as any, tier, mixingValidationConfig);
}

export default validateMixing;
