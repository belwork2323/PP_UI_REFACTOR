import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcPostCureValidationConfig,
  toQcPostCureValidationTarget,
  type QcPostCureValidationTarget,
} from "../configs/qcPostCure.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { validatePostCureMotorSession } from "./postCure.validation";
import {
  getPostCureSessionFromValues,
  isPostCureSessionValues,
} from "@/hooks/user/qualityControl/qcPostCureTables";

export type { ValidationErrors, ValidationTier, QcPostCureValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

export function validateQcPostCure(
  target: QcPostCureValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  if (isPostCureSessionValues(target.values as SchemaFormValues)) {
    return validatePostCureMotorSession(
      getPostCureSessionFromValues(target.values as SchemaFormValues, target.inhibitorType),
      tier,
    );
  }
  return runValidation(target, tier, qcPostCureValidationConfig);
}

export function validateQcPostCureValues(
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier = "SUBMIT",
  options?: { entryId?: string; subType?: string | null; inhibitorType?: string | null },
): ValidationErrors {
  if (isPostCureSessionValues(values)) {
    return validatePostCureMotorSession(
      getPostCureSessionFromValues(values, options?.inhibitorType),
      tier,
    );
  }
  return validateQcPostCure(toQcPostCureValidationTarget(values, options), tier);
}

export { qcPostCureValidationConfig };
