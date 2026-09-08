import type { NDTMotorSession } from "@/data/models/user/NDTFormModel";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { str, ALPHA_NUM } from "../fieldValidators";

const required = (label: string) => `${label} is required.`;
const invalidNumber = (label: string) => `${label} must be numeric.`;
const invalidText = (label: string) => `${label} must be alphanumeric.`;

const textRule = (
  label: string,
  requiredIn: ValidationTier[],
  options?: { pattern?: RegExp; invalidMessage?: string },
): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  pattern: options?.pattern,
  messages: {
    required: required(label),
    invalid: options?.invalidMessage ?? invalidText(label),
  },
});

const numberRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "number",
  requiredIn,
  messages: { required: required(label), invalid: invalidNumber(label) },
});

const fileRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "file",
  requiredIn,
  messages: { required: required(label), invalid: required(label) },
});

export type NDTValidationTarget = NDTMotorSession;

export const ndtValidationFields: Record<string, FieldRuleConfig> = {
  equipment: textRule("Equipment utilized for radiography work", ["UNIT", "SUBMIT"]),
  beamEnergies: textRule("X ray beam energy used for radiography", ["UNIT", "SUBMIT"]),
  radiographyPlan: textRule("Radiography plan", ["SUBMIT"]),

  planSections: numberRule("Sections", ["SUBMIT"]),
  planOrientations: numberRule("Orientations", ["SUBMIT"]),
  planSfd: numberRule("SFD", ["SUBMIT"]),
  planNormalExposures: numberRule("No. of Normal Exposure", ["SUBMIT"]),
  planTangentialExposures: numberRule("No. of Tangential Exposure", ["SUBMIT"]),
  planDetectorType: textRule("Type of Detector", ["SUBMIT"], {
    pattern: ALPHA_NUM,
    invalidMessage: "Type of Detector must be alphanumeric.",
  }),

  // Sheet: additional exposure NOT mandatory
  additionalSection: numberRule("Section", []),
  additionalOrientation: textRule("Orientation", []),
  additionalExposures: numberRule("Exposures", []),

  radioObservation: textRule("Observation", ["SUBMIT"], {
    pattern: ALPHA_NUM,
    invalidMessage: "Observation must be alphanumeric.",
  }),
  radioObsSection: numberRule("Section", []),
  radioObsOrientation: textRule("Orientation", []),

  visualObservationNotes: textRule("Observation", [], {
    pattern: ALPHA_NUM,
    invalidMessage: "Observation must be alphanumeric.",
  }),
  visualObservationFree: textRule("Observation", [], {
    pattern: ALPHA_NUM,
    invalidMessage: "Observation must be alphanumeric.",
  }),

  signedReport: fileRule("Signed NDT report (PDF)", ["SUBMIT"]),
};

const equipmentValue = (motor: NDTMotorSession) =>
  Array.isArray(motor.equipment) ? motor.equipment.join(", ") : String(motor.equipment ?? "");

const beamValue = (motor: NDTMotorSession) =>
  Array.isArray(motor.beamEnergies) ? motor.beamEnergies.join(", ") : "";

export const ndtValidationConfig: SubDeptValidationConfig<NDTValidationTarget> = {
  id: "ndt",
  fields: ndtValidationFields,
  resolveFieldPaths: (motor) => {
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [
      { path: "equipment", value: equipmentValue(motor), ruleKey: "equipment" },
      { path: "beamEnergies", value: beamValue(motor), ruleKey: "beamEnergies" },
      {
        path: "radiographyPlan",
        value: motor.radiographyPlan || motor.radiographyPlanName,
        ruleKey: "radiographyPlan",
      },
      { path: "signedReport", value: motor.signedReport, ruleKey: "signedReport" },
    ];

    (motor.radiographyPlanRows ?? []).forEach((row, index) => {
      fields.push(
        { path: `radiographyPlanRows.${index}.sections`, value: row.sections, ruleKey: "planSections" },
        { path: `radiographyPlanRows.${index}.orientations`, value: row.orientations, ruleKey: "planOrientations" },
        { path: `radiographyPlanRows.${index}.sfd`, value: row.sfd, ruleKey: "planSfd" },
        { path: `radiographyPlanRows.${index}.normalExposures`, value: row.normalExposures, ruleKey: "planNormalExposures" },
        { path: `radiographyPlanRows.${index}.tangentialExposures`, value: row.tangentialExposures, ruleKey: "planTangentialExposures" },
        { path: `radiographyPlanRows.${index}.detectorType`, value: row.detectorType, ruleKey: "planDetectorType" },
      );
    });

    (motor.additionalExposureRows ?? []).forEach((row, index) => {
      fields.push(
        { path: `additionalExposureRows.${index}.sectionNumber`, value: row.sectionNumber, ruleKey: "additionalSection" },
        { path: `additionalExposureRows.${index}.orientation`, value: row.orientation, ruleKey: "additionalOrientation" },
        { path: `additionalExposureRows.${index}.exposureCount`, value: row.exposureCount, ruleKey: "additionalExposures" },
      );
    });

    (motor.radiographyObservationRows ?? []).forEach((row, index) => {
      fields.push(
        { path: `radiographyObservationRows.${index}.observations`, value: row.observations, ruleKey: "radioObservation" },
        { path: `radiographyObservationRows.${index}.section`, value: row.section, ruleKey: "radioObsSection" },
        { path: `radiographyObservationRows.${index}.orientation`, value: row.orientation, ruleKey: "radioObsOrientation" },
      );
    });

    (motor.visualInspectionRows ?? []).forEach((row, index) => {
      if (row.isPreset) {
        fields.push({
          path: `visualInspectionRows.${index}.observationNotes`,
          value: row.observationNotes,
          ruleKey: "visualObservationNotes",
        });
      } else {
        fields.push({
          path: `visualInspectionRows.${index}.observation`,
          value: row.observation,
          ruleKey: "visualObservationFree",
        });
      }
    });

    return fields;
  },
  customRules: [
    (motor, tier, errors) => {
      if (tier !== "SUBMIT") return;
      const anyObs = (motor.radiographyObservationRows ?? []).some((r) => str(r.observations));
      if (!anyObs) {
        errors["radiographyObservationRows.0.observations"] =
          "Observation in radiography is required.";
      }
    },
  ],
  isUnitComplete: (motor) => {
    const hasEquipment = Array.isArray(motor.equipment)
      ? motor.equipment.length > 0
      : Boolean(str(motor.equipment as unknown as string));
    const hasBeam = Array.isArray(motor.beamEnergies) && motor.beamEnergies.length > 0;
    return hasEquipment && hasBeam;
  },
};

export function toNDTValidationTarget(motor: NDTMotorSession): NDTValidationTarget {
  return motor;
}
