/**
 * Static Test Facility validation adapter.
 */

import type { StfMotorSession } from "@/data/models/user/StaticTestFacilityFormModel";
import {
  stfValidationConfig,
  toStfValidationTarget,
  type StfValidationTarget,
} from "../configs/stf.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { legacyIntentToTier, tierToLegacyIntent } from "../submissionIntent";
import {
  fieldError,
  firstValidationError,
  firstValidationErrorWithPath,
  hasValidationErrors,
} from "../validationErrors";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";

export type StfValidationIntent = "DRAFT" | "SUBMIT";

export type { ValidationErrors, ValidationTier, StfValidationTarget };
export {
  fieldError,
  firstValidationError,
  firstValidationErrorWithPath,
  hasValidationErrors,
  tierToLegacyIntent,
  legacyIntentToTier,
};

/** Preferred section order for scroll/focus after failed STF SUBMIT. */
const STF_FOCUS_PREFIX_ORDER = [
  "motorId",
  "stfTestNo",
  "CONDITIONING_DETAILS.",
  "GRAIN_DIMENSION.",
  "BEM_HARDWARE_DETAILS.",
  "IGNITER_DETAILS.",
  "NOZZLE_DETAILS.",
  "TESTING_DETAILS.",
  "SENSOR_CONFIGURATION.",
  "RESULT_DETAILS.",
  "STATIC_TEST_RESULT.",
  "UPLOAD_PT_CURVE.",
] as const;

export type StfValidationFocusTarget = {
  fieldPath: string;
};

/** First error field path for STF focus/scroll (stable section order). */
export function resolveFirstStfValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of STF_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** Scroll + focus the control tagged with `data-stf-field`. */
export function focusStfField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("stf-field", fieldPath, root);
}

export function formatStfValidationPath(path: string): string {
  const trimmed = String(path ?? "").trim();
  if (!trimmed) return "";
  if (trimmed === "motorId") return "Motor No.";
  if (trimmed === "stfTestNo") return "STF Test No.";
  const leaf = trimmed.includes(".") ? trimmed.slice(trimmed.lastIndexOf(".") + 1) : trimmed;
  return leaf.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function firstStfValidationError(errors: ValidationErrors): string | undefined {
  const focusPath = resolveFirstStfValidationFocus(errors);
  if (focusPath && errors[focusPath]) {
    const label = formatStfValidationPath(focusPath);
    const message = String(errors[focusPath] ?? "").trim();
    return label ? `${label}: ${message}` : message;
  }
  return firstValidationErrorWithPath(errors, formatStfValidationPath);
}

export function validateStf(
  motor: StfValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(motor, tier, stfValidationConfig);
}

export function validateStfMotorSession(
  motor: StfMotorSession | null | undefined,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  if (!motor) {
    return tier === "SUBMIT" || tier === "UNIT"
      ? { motor: "Motor data is required." }
      : {};
  }
  return validateStf(toStfValidationTarget(motor), tier);
}

export function validateStfBlocks(
  motor: StfMotorSession | null | undefined,
  intent: StfValidationIntent,
): ValidationErrors {
  return validateStfMotorSession(motor, intent === "SUBMIT" ? "SUBMIT" : "FORMAT");
}

export function isStfUnitComplete(motor: StfMotorSession): boolean {
  const target = toStfValidationTarget(motor);
  if (stfValidationConfig.isUnitComplete) {
    return stfValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateStf(target, "UNIT")).length === 0;
}

export { stfValidationConfig };
