import type { DispatchMotorData } from "@/data/models/user/DispatchMotorDataModel";
import { createEmptyDispatchMotorData } from "@/data/models/user/DispatchMotorDataModel";
import type {
  DispatchMotorSession,
  DispatchMotorSetup,
} from "@/data/models/user/DispatchFormModel";
import { createDefaultDispatchMotorSetup } from "@/data/models/user/DispatchFormModel";
import {
  dispatchValidationConfig,
  toDispatchValidationTarget,
  type DispatchValidationTarget,
} from "../configs/dispatch.validation.config";
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

export type DispatchValidationIntent = "DRAFT" | "SUBMIT";

export type { ValidationErrors, ValidationTier, DispatchValidationTarget };
export {
  fieldError,
  firstValidationError,
  firstValidationErrorWithPath,
  hasValidationErrors,
  tierToLegacyIntent,
  legacyIntentToTier,
};

/** Preferred section order for scroll/focus after failed Dispatch SUBMIT. */
const DISPATCH_FOCUS_PREFIX_ORDER = [
  "setup.dispatchDate",
  "setup.dispatchLocation",
  "setup.ndtClearance",
  "setup.ndtMomNo",
  "setup.finalAcceptanceClearance",
  "setup.finalAcceptanceMomNo",
  "PROPELLANT_PROPERTIES.",
  "WAIVER_DETAILS.",
  "ROCKET_MOTOR_INSPECTION.",
  "VEHICLE_DETAILS.",
  "ROCKET_MOTOR_PACKING.",
  "SAFETY_CLEARANCE.",
  "DISPATCH_TEAM.",
] as const;

export type DispatchValidationFocusTarget = {
  fieldPath: string;
};

/** First error field path for Dispatch focus/scroll (stable section order). */
export function resolveFirstDispatchValidationFocus(
  errors: ValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors).filter((key) => String(errors[key] ?? "").trim());
  if (!keys.length) return null;

  for (const prefix of DISPATCH_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** Scroll + focus the control tagged with `data-dispatch-field`. */
export function focusDispatchField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("dispatch-field", fieldPath, root);
}

export function formatDispatchValidationPath(path: string): string {
  const trimmed = String(path ?? "").trim();
  if (!trimmed) return "";

  const labels: Record<string, string> = {
    "setup.dispatchDate": "Dispatch Date",
    "setup.dispatchLocation": "Dispatch Location",
    "setup.ndtClearance": "NDT Clearance",
    "setup.ndtMomNo": "NDT MOM No.",
    "setup.finalAcceptanceClearance": "Final Acceptance Clearance",
    "setup.finalAcceptanceMomNo": "Final Acceptance MOM No.",
    "WAIVER_DETAILS.WAIVER_AVAILABLE": "Waiver Details",
    "ROCKET_MOTOR_PACKING.NITROGEN_GAS_PURGING": "Nitrogen Gas Purging",
    "ROCKET_MOTOR_PACKING.NITROGEN_PURGING_PRESSURE": "Nitrogen Pressure",
    "ROCKET_MOTOR_PACKING.LABELLING_OF_MOTOR": "Labelling of Motor",
    "ROCKET_MOTOR_PACKING.DISPATCH_PHOTOS": "Dispatch Photos",
    "SAFETY_CLEARANCE.SAFETY_CLEARANCE_STATUS": "Safety Clearance",
    "SAFETY_CLEARANCE.CLEARANCE_CERTIFICATE": "Clearance Certificate",
    "DISPATCH_TEAM.QA_REPRESENTATIVE": "QA Rep.",
    "DISPATCH_TEAM.SAFETY_REPRESENTATIVE": "Safety Rep.",
    "DISPATCH_TEAM.PROJECT_REPRESENTATIVE": "Project Rep.",
    motor: "Motor",
  };
  if (labels[trimmed]) return labels[trimmed];

  if (trimmed.includes("PROPELLANT_PROPERTIES")) {
    if (trimmed.includes("SPECIFICATION")) return "Propellant Specs";
    if (trimmed.includes("fmValues")) return "Propellant FM Value";
  }
  if (trimmed.includes("OBSERVATION")) return "Observation";

  const leaf = trimmed.includes(".") ? trimmed.slice(trimmed.lastIndexOf(".") + 1) : trimmed;
  return leaf.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function firstDispatchValidationError(errors: ValidationErrors): string | undefined {
  const focusPath = resolveFirstDispatchValidationFocus(errors);
  if (focusPath && errors[focusPath]) {
    const label = formatDispatchValidationPath(focusPath);
    const message = String(errors[focusPath] ?? "").trim();
    return label ? `${label}: ${message}` : message;
  }
  return firstValidationErrorWithPath(errors, formatDispatchValidationPath);
}

/** Primary entry — FORMAT | UNIT | SUBMIT */
export function validateDispatch(
  target: DispatchValidationTarget,
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(target, tier, dispatchValidationConfig);
}

export function validateDispatchMotorSession(
  motor: DispatchMotorSession | null | undefined,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  if (!motor) {
    return tier === "SUBMIT" || tier === "UNIT" ? { motor: "Motor data is required." } : {};
  }
  return validateDispatch(toDispatchValidationTarget(motor), tier);
}

/**
 * Legacy DRAFT | SUBMIT (DRAFT → FORMAT). Prefer tier-based API.
 */
export function validateDispatchBlocks(
  motor: DispatchMotorSession | null | undefined,
  intent: DispatchValidationIntent,
): ValidationErrors {
  return validateDispatchMotorSession(motor, intent === "SUBMIT" ? "SUBMIT" : "FORMAT");
}

export function validateDispatchMotorData(
  data: DispatchMotorData | null | undefined,
  setup?: DispatchMotorSetup | null,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  return validateDispatch(
    {
      setup: setup ?? createDefaultDispatchMotorSetup(),
      data: data ?? createEmptyDispatchMotorData(),
    },
    tier,
  );
}

/** UNIT gate — setup date + location (config.isUnitComplete). */
export function isDispatchUnitComplete(motor: DispatchMotorSession): boolean {
  const target = toDispatchValidationTarget(motor);
  if (dispatchValidationConfig.isUnitComplete) {
    return dispatchValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateDispatch(target, "UNIT")).length === 0;
}

export { dispatchValidationConfig };
