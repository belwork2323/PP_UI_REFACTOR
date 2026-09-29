import type { FormSubmissionType, RocketMotorCasingFormData } from "@/data/models/user/RocketMotorCasingFormModel";
import {
  isCasingSubmitComplete,
  isCasingUnitComplete,
  rocketMotorCasingFieldRules,
  rocketMotorCasingValidationConfig,
} from "../configs/rocketMotorCasing.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { isRequiredForTier } from "../submissionIntent";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";

export type CasingFieldRuleKey = keyof typeof rocketMotorCasingFieldRules;

/** Whether a casing field shows the required (*) marker — UNIT or SUBMIT mandatory. */
export function isCasingFieldRequired(ruleKey: CasingFieldRuleKey): boolean {
  const rule = rocketMotorCasingFieldRules[ruleKey];
  return (
    isRequiredForTier(rule.requiredIn, "SUBMIT") || isRequiredForTier(rule.requiredIn, "UNIT")
  );
}

export type CasingValidationErrors = ValidationErrors;

export function validateRocketMotorCasing(
  form: RocketMotorCasingFormData,
  tier: ValidationTier,
): CasingValidationErrors {
  return runValidation(form, tier, rocketMotorCasingValidationConfig);
}

/** Maps legacy DRAFT/SUBMIT intent to validation tiers (DRAFT save → UNIT). */
export function validateCasingFormErrors(
  form: RocketMotorCasingFormData,
  intent: FormSubmissionType,
): CasingValidationErrors {
  const tier: ValidationTier = intent === "SUBMIT" ? "SUBMIT" : "UNIT";
  return validateRocketMotorCasing(form, tier);
}

export function validateCasingFormForSubmit(
  form: RocketMotorCasingFormData,
  intent: FormSubmissionType,
): string | null {
  return Object.values(validateCasingFormErrors(form, intent))[0] ?? null;
}

export const canSaveCasingDraft = isCasingUnitComplete;

export const isCasingFormComplete = isCasingSubmitComplete;

export { isCasingUnitComplete, isCasingSubmitComplete, isCasingIdentificationComplete } from "../configs/rocketMotorCasing.validation.config";

export type RmcValidationFocusTarget = {
  fieldPath: string;
  step: number;
};

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

/** First non-empty validation message (stable key sort with RMC priority). */
export const firstRmcValidationErrorMessage = (
  errors: ValidationErrors,
): string | undefined => {
  for (const key of Object.keys(errors).sort((a, b) => {
    const pa = RMC_FOCUS_PATH_PRIORITY(a);
    const pb = RMC_FOCUS_PATH_PRIORITY(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b, undefined, { numeric: true });
  })) {
    const text = str(errors[key]);
    if (text) return text;
  }
  return undefined;
};

/**
 * Wizard steps (0–5):
 * 0 Identification & receipt, 1 Visual, 2 Weighment, 3 Dimensional, 4 Mock trial, 5 Reports
 */
export function resolveRmcStepForFieldPath(fieldPath: string): number {
  const path = String(fieldPath ?? "");
  if (
    path === "visualInspectionReport" ||
    path === "dimensionalInspectionReport" ||
    path === "mockTrialReport"
  ) {
    return 5;
  }
  if (path.startsWith("mockTrial.") || path === "mockTrial") return 4;
  if (path.startsWith("dimensionalData") || path === "dimensionalData") return 3;
  if (
    path.startsWith("weight") ||
    path.startsWith("weighscale") ||
    path.startsWith("calibration")
  ) {
    return 2;
  }
  if (path.startsWith("visualInspection")) return 1;
  // Identification & receipt (incl. radiography, insulation, NDT, mech/thermal)
  return 0;
}

/** Prefer ID → radiography/receipt → visual → weighment → dimensional → mock → reports. */
const RMC_FOCUS_PATH_PRIORITY = (path: string): number => {
  if (/^(projectName|motorStageApi|motorId)$/.test(path)) return 10;
  if (/^(radiographyPlan|casingType|receivingDate)/.test(path)) return 20;
  if (/^(items|greenCard|clearance)/.test(path)) return 30;
  if (/^(insulation|postPpt|ndt|acemNdt|projectRubber|otherDetails)/.test(path)) return 40;
  if (/^(mechanicalProperties|thermalProperties)/.test(path)) return 50;
  if (/^visualInspection\./.test(path)) return 60;
  if (/^(weight|weighscale|calibration)/.test(path)) return 70;
  if (/^dimensionalData/.test(path)) return 80;
  if (/^mockTrial\./.test(path)) return 90;
  if (/Report$/.test(path)) return 100;
  return 200;
};

export function resolveFirstRmcValidationFocus(
  errors: ValidationErrors,
): RmcValidationFocusTarget | null {
  const paths = Object.keys(errors)
    .filter((key) => str(errors[key]))
    .sort((a, b) => {
      const pa = RMC_FOCUS_PATH_PRIORITY(a);
      const pb = RMC_FOCUS_PATH_PRIORITY(b);
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  if (!paths.length) return null;
  const fieldPath = paths[0];
  return {
    fieldPath,
    step: resolveRmcStepForFieldPath(fieldPath),
  };
}

/** Scroll + focus the control tagged with `data-rmc-field`. */
export function focusRmcField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("rmc-field", fieldPath, root);
}
