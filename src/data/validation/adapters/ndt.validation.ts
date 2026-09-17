import type { NDTMotorSession } from "@/data/models/user/NDTFormModel";
import {
  ndtValidationConfig,
  toNDTValidationTarget,
  type NDTValidationTarget,
} from "../configs/ndt.validation.config";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { legacyIntentToTier, tierToLegacyIntent } from "../submissionIntent";
import { fieldError, firstValidationError, firstValidationErrorWithPath, hasValidationErrors } from "../validationErrors";

export type NDTValidationIntent = "DRAFT" | "SUBMIT";

export type { ValidationErrors, ValidationTier, NDTValidationTarget };
export {
  fieldError,
  firstValidationError,
  firstValidationErrorWithPath,
  hasValidationErrors,
  tierToLegacyIntent,
  legacyIntentToTier,
};

const NDT_FIELD_LABELS: Record<string, string> = {
  sections: "Sections",
  orientations: "Orientations",
  sfd: "SFD",
  normalExposures: "Normal exposures",
  tangentialExposures: "Tangential exposures",
  detectorType: "Detector type",
  sectionNumber: "Section number",
  orientation: "Orientation",
  exposureCount: "Exposure count",
  section: "Section",
  observations: "Observations",
  observation: "Observation",
  observationNotes: "Observation",
  signedReport: "Signed report",
  motor: "Motor",
};

export function formatNdtValidationPath(path: string): string {
  const trimmed = String(path ?? "").trim();
  if (!trimmed) return "";
  if (trimmed === "signedReport" || trimmed === "motor") {
    return NDT_FIELD_LABELS[trimmed] ?? trimmed;
  }
  const parts = trimmed.split(".");
  const leaf = parts[parts.length - 1] ?? trimmed;
  const leafLabel = NDT_FIELD_LABELS[leaf] ?? leaf;
  const rowMatch = trimmed.match(/^(radiographyPlanRows|additionalExposureRows|radiographyObservationRows|visualInspectionRows)\.(\d+)\./);
  if (rowMatch) {
    const section =
      rowMatch[1] === "radiographyPlanRows"
        ? "Radiography plan"
        : rowMatch[1] === "additionalExposureRows"
          ? "Additional exposure"
          : rowMatch[1] === "radiographyObservationRows"
            ? "Radiography observation"
            : "Visual inspection";
    return `${section} row ${Number(rowMatch[2]) + 1} · ${leafLabel}`;
  }
  return leafLabel;
}

export function firstNdtValidationError(errors: ValidationErrors): string | undefined {
  return firstValidationErrorWithPath(errors, formatNdtValidationPath);
}

export function validateNDT(motor: NDTValidationTarget, tier: ValidationTier): ValidationErrors {
  return runValidation(motor, tier, ndtValidationConfig);
}

export function validateNDTMotorSession(
  motor: NDTMotorSession | null | undefined,
  tier: ValidationTier = "SUBMIT",
): ValidationErrors {
  if (!motor) {
    return tier === "SUBMIT" || tier === "UNIT" ? { motor: "Motor data is required." } : {};
  }
  return validateNDT(toNDTValidationTarget(motor), tier);
}

export function validateNDTBlocks(
  motor: NDTMotorSession | null | undefined,
  intent: NDTValidationIntent,
): ValidationErrors {
  return validateNDTMotorSession(motor, intent === "SUBMIT" ? "SUBMIT" : "FORMAT");
}

export function isNDTUnitComplete(motor: NDTMotorSession): boolean {
  const target = toNDTValidationTarget(motor);
  if (ndtValidationConfig.isUnitComplete) {
    return ndtValidationConfig.isUnitComplete(target);
  }
  return Object.keys(validateNDT(target, "UNIT")).length === 0;
}

export { ndtValidationConfig };
