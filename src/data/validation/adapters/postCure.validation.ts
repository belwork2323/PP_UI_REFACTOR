import { runValidation } from "../runValidation";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";
import { postCureValidationConfig } from "../configs/postCure.validation.config";
import type {
  LooseFlapMotorData,
  PostCureMotorData,
} from "@/data/models/user/PostCureMotorDataModel";
import { isPostCureInhibitionDetailsRequired } from "@/data/models/user/PostCureMotorDataModel";

export function validatePostCure(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(data as any, tier, postCureValidationConfig);
}

export function validatePostCureLooseFlap(
  data: LooseFlapMotorData,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(data, tier, postCureValidationConfig);
}

export function validatePostCureInhibition(
  data: PostCureMotorData | null | undefined,
  tier: ValidationTier,
): ValidationErrors {
  if (!data) return {};
  return runValidation(data, tier, postCureValidationConfig);
}

export function validatePostCureMotorSession(
  session: {
    inhibitorType: string;
    looseFlapData: LooseFlapMotorData;
    inhibitionData: PostCureMotorData | null;
  },
  tier: ValidationTier,
): ValidationErrors {
  const errors: ValidationErrors = {
    ...validatePostCureLooseFlap(session.looseFlapData, tier),
  };

  if (!String(session.inhibitorType ?? "").trim() && tier === "SUBMIT") {
    errors.inhibitorType = "Inhibitor type is required";
  }

  if (isPostCureInhibitionDetailsRequired(session.inhibitorType)) {
    Object.assign(errors, validatePostCureInhibition(session.inhibitionData, tier));
  }

  return errors;
}

export default validatePostCure;
