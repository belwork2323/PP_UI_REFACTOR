/**
 * NDT — field rules (FORMAT / UNIT / SUBMIT).
 * Messages + patterns from VALIDATIONSTRING (subscale style).
 */

import type { NDTMotorSession } from "@/data/models/user/NDTFormModel";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

const text = (
  requiredIn: ValidationTier[],
  pattern?: RegExp,
): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  pattern,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const number = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "number",
  requiredIn,
  pattern: S.PATTERNS.FLOAT,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const date = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const file = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "file",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type NdtValidationTarget = NDTMotorSession;
export type NDTValidationTarget = NdtValidationTarget;

export const ndtValidationFields: Record<string, FieldRuleConfig> = {
  // Radiography plan row
  sections: number(["SUBMIT"]),
  orientations: number(["SUBMIT"]),
  sfd: number(["SUBMIT"]),
  normalExposure: number(["SUBMIT"]),
  tangentialExposure: number(["SUBMIT"]),
  detectorType: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Additional exposure
  sectionNumber: text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  orientation: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  exposureCount: number(["SUBMIT"]),

  // Observation in radiography
  observationSection: text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  observationOrientation: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  observations: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Visual / signed report
  visualObservation: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  signedReport: file(["SUBMIT"]),
};

export const ndtValidationConfig: SubDeptValidationConfig<NdtValidationTarget> = {
  id: "ndt",
  fields: ndtValidationFields,
  resolveFieldPaths: (motor) => {
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    (motor.radiographyPlanRows ?? []).forEach((row, index) => {
      fields.push(
        {
          path: `radiographyPlanRows.${index}.sections`,
          value: row.sections,
          ruleKey: "sections",
        },
        {
          path: `radiographyPlanRows.${index}.orientations`,
          value: row.orientations,
          ruleKey: "orientations",
        },
        { path: `radiographyPlanRows.${index}.sfd`, value: row.sfd, ruleKey: "sfd" },
        {
          path: `radiographyPlanRows.${index}.normalExposure`,
          value: (row as { normalExposure?: unknown }).normalExposure ??
            (row as { noOfNormalExposure?: unknown }).noOfNormalExposure,
          ruleKey: "normalExposure",
        },
        {
          path: `radiographyPlanRows.${index}.tangentialExposure`,
          value:
            (row as { tangentialExposure?: unknown }).tangentialExposure ??
            (row as { noOfTangentialExposure?: unknown }).noOfTangentialExposure,
          ruleKey: "tangentialExposure",
        },
        {
          path: `radiographyPlanRows.${index}.detectorType`,
          value:
            (row as { detectorType?: unknown }).detectorType ??
            (row as { typeOfDetector?: unknown }).typeOfDetector,
          ruleKey: "detectorType",
        },
      );
    });

    (motor.additionalExposureRows ?? []).forEach((row, index) => {
      fields.push(
        {
          path: `additionalExposureRows.${index}.sectionNumber`,
          value: row.sectionNumber,
          ruleKey: "sectionNumber",
        },
        {
          path: `additionalExposureRows.${index}.orientation`,
          value: row.orientation,
          ruleKey: "orientation",
        },
        {
          path: `additionalExposureRows.${index}.exposureCount`,
          value: row.exposureCount,
          ruleKey: "exposureCount",
        },
      );
    });

    (motor.radiographyObservationRows ?? []).forEach((row, index) => {
      fields.push(
        {
          path: `radiographyObservationRows.${index}.section`,
          value: row.section,
          ruleKey: "observationSection",
        },
        {
          path: `radiographyObservationRows.${index}.orientation`,
          value: row.orientation,
          ruleKey: "observationOrientation",
        },
        {
          path: `radiographyObservationRows.${index}.observations`,
          value: row.observations,
          ruleKey: "observations",
        },
      );
    });

    (motor.visualInspectionRows ?? []).forEach((row, index) => {
      fields.push({
        path: `visualInspectionRows.${index}.observation`,
        value: (row as { observation?: unknown }).observation,
        ruleKey: "visualObservation",
      });
    });

    fields.push({
      path: "signedReport",
      value: (motor as { signedReport?: unknown }).signedReport,
      ruleKey: "signedReport",
    });

    return fields;
  },
  customRules: [],
  isUnitComplete: (motor) => {
    const plan = motor.radiographyPlanRows ?? [];
    return plan.some((row) => Boolean(str(row.sections) || str(row.orientations)));
  },
};

export function toNdtValidationTarget(motor: NDTMotorSession): NdtValidationTarget {
  return motor;
}

/** Alias used by ndt.validation adapter. */
export const toNDTValidationTarget = toNdtValidationTarget;

