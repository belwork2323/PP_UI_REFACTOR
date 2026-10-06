import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import {
  qcPostCureValidationConfig,
  toQcPostCureValidationTarget,
  type QcPostCureValidationTarget,
} from "../configs/qcPostCure.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { fieldError, firstValidationError, hasValidationErrors } from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";
import { focusQcField } from "./qcRawMaterial.validation";
import { validatePostCureMotorSession } from "./postCure.validation";
import {
  getPostCureSessionFromValues,
  isPostCureSessionValues,
} from "@/hooks/user/qualityControl/qcPostCureTables";

export type { ValidationErrors, ValidationTier, QcPostCureValidationTarget };
export { fieldError, firstValidationError, hasValidationErrors };

/**
 * Preferred section order for scroll/focus after failed Post Cure SUBMIT.
 * Loose flap first (default tab), then inhibitor type, then inhibition sections.
 */
const QC_POST_CURE_FOCUS_PREFIX_ORDER = [
  "bellowRemovalDetails.",
  "looseFlapEpoxyPreparation.",
  "qualificationDetails.",
  "lfEpoxyFillingDetails.",
  "inhibitorType",
  "ir1Premix.",
  "ir1FinalMix.",
  "ir1Qualification.",
  "hemcoat3kPreparation.",
  "hemcoat3kFinalMix.",
  "hemcoat3kQualification.",
  "inhibitionBatchDetails.",
  "inhibitionApplicationDetails.",
  "dispatchDetails.",
  "inhibitionNotApplicable.",
] as const;

/** First error field path for Post Cure focus/scroll (stable section order). */
export function resolveFirstQcPostCureValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of QC_POST_CURE_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** True when error map looks like Post Cure session paths. */
export function looksLikeQcPostCureValidationErrors(
  errors: ValidationErrors | null | undefined,
): boolean {
  if (!errors) return false;
  return Object.keys(errors).some((k) => {
    const path = String(k ?? "");
    return (
      path === "inhibitorType" ||
      path.startsWith("bellowRemovalDetails.") ||
      path.startsWith("looseFlapEpoxyPreparation.") ||
      path.startsWith("lfEpoxyFillingDetails.") ||
      path.startsWith("inhibitionBatchDetails.") ||
      path.startsWith("inhibitionApplicationDetails.") ||
      path.startsWith("dispatchDetails.") ||
      path.startsWith("inhibitionNotApplicable.") ||
      path.startsWith("ir1Premix.") ||
      path.startsWith("ir1FinalMix.") ||
      path.startsWith("ir1Qualification.") ||
      path.startsWith("hemcoat3kPreparation.") ||
      path.startsWith("hemcoat3kFinalMix.") ||
      path.startsWith("hemcoat3kQualification.") ||
      path.startsWith("qualificationDetails.") ||
      path.includes("qualification")
    );
  });
}

/** Scroll + focus the control tagged with `data-qc-field`. */
export function focusQcPostCureField(fieldPath: string, root: ParentNode = document): boolean {
  return focusQcField(fieldPath, root) || focusFieldByDataAttr("qc-field", fieldPath, root);
}

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
