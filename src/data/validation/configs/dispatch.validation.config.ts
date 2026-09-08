import type { DispatchMotorData } from "@/data/models/user/DispatchMotorDataModel";
import type {
  DispatchMotorSession,
  DispatchMotorSetup,
} from "@/data/models/user/DispatchFormModel";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";

const required = (label: string) => `${label} is required.`;
const invalidNumber = (label: string) => `${label} must be numeric.`;
const invalidDate = (label: string) => `${label} must be a valid date.`;
const invalidText = (label: string) => `${label} has an invalid format.`;
const fileRequired = (label: string) => `${label} is required.`;

const textRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  messages: { required: required(label), invalid: invalidText(label) },
});

const selectRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  messages: { required: required(label), invalid: invalidText(label) },
});

const numberRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "number",
  requiredIn,
  messages: { required: required(label), invalid: invalidNumber(label) },
});

const dateRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: required(label), invalid: invalidDate(label) },
});

const fileRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "file",
  requiredIn,
  messages: { required: fileRequired(label), invalid: fileRequired(label) },
});

export type DispatchValidationTarget = {
  setup: DispatchMotorSetup;
  data: DispatchMotorData;
};

export const dispatchValidationFields: Record<string, FieldRuleConfig> = {
  "setup.dispatchDate": dateRule("Dispatch Date", ["UNIT", "SUBMIT"]),
  "setup.dispatchLocation": textRule("Dispatch Location", ["UNIT", "SUBMIT"]),
  "setup.ndtClearance": selectRule("NDT Clearance Accorded", ["SUBMIT"]),
  "setup.ndtMomNo": textRule("NDT MOM No.", ["SUBMIT"]),
  "setup.finalAcceptanceClearance": selectRule(
    "Final Acceptance Committee Clearance",
    ["SUBMIT"],
  ),
  "setup.finalAcceptanceMomNo": textRule("Final Acceptance MOM No.", ["SUBMIT"]),

  propellantSpec: numberRule("Specs", ["SUBMIT"]),
  propellantFm: numberRule("FM value", ["SUBMIT"]),
  waiverDetails: textRule("Waiver Details", ["SUBMIT"]),
  inspectionObservation: textRule("Observation", ["SUBMIT"]),
  vehicleObservation: textRule("Observation", ["SUBMIT"]),
  packingObservation: textRule("Observation", ["SUBMIT"]),
  nitrogenPurging: selectRule("Nitrogen gas purging", []),
  nitrogenPressure: textRule("Nitrogen purging pressure", ["SUBMIT"]),
  labellingOfMotor: selectRule("Labelling of motor", ["SUBMIT"]),
  dispatchPhotos: fileRule("Dispatch photos", ["SUBMIT"]),
  safetyClearance: selectRule("Safety Clearance for Dispatch", ["SUBMIT"]),
  clearanceCertificate: fileRule("Clearance certificate", ["SUBMIT"]),
  qaRep: textRule("QA Rep.", ["SUBMIT"]),
  safetyRep: textRule("Safety Rep.", ["SUBMIT"]),
  projectRep: textRule("Project Rep.", ["SUBMIT"]),
};

const resolveSetupFields = (setup: DispatchMotorSetup) => {
  const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [
    { path: "setup.dispatchDate", value: setup.dispatchDate, ruleKey: "setup.dispatchDate" },
    {
      path: "setup.dispatchLocation",
      value: setup.dispatchLocation,
      ruleKey: "setup.dispatchLocation",
    },
    { path: "setup.ndtClearance", value: setup.ndtClearance, ruleKey: "setup.ndtClearance" },
    {
      path: "setup.finalAcceptanceClearance",
      value: setup.finalAcceptanceClearance,
      ruleKey: "setup.finalAcceptanceClearance",
    },
  ];

  if (str(setup.ndtClearance) === "YES") {
    fields.push({ path: "setup.ndtMomNo", value: setup.ndtMomNo, ruleKey: "setup.ndtMomNo" });
  }
  if (str(setup.finalAcceptanceClearance) === "YES") {
    fields.push({
      path: "setup.finalAcceptanceMomNo",
      value: setup.finalAcceptanceMomNo,
      ruleKey: "setup.finalAcceptanceMomNo",
    });
  }
  return fields;
};

const resolveMotorDataFields = (data: DispatchMotorData) => {
  const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

  data.PROPELLANT_PROPERTIES.rows.forEach((row, index) => {
    if (row.rowType === "header") return;
    fields.push({
      path: `PROPELLANT_PROPERTIES.rows.${index}.SPECIFICATION`,
      value: row.SPECIFICATION,
      ruleKey: "propellantSpec",
    });
    data.PROPELLANT_PROPERTIES.fmColumns.forEach((col) => {
      fields.push({
        path: `PROPELLANT_PROPERTIES.rows.${index}.fmValues.${col}`,
        value: row.fmValues?.[col],
        ruleKey: "propellantFm",
      });
    });
  });

  fields.push({
    path: "WAIVER_DETAILS.WAIVER_AVAILABLE",
    value: data.WAIVER_DETAILS.WAIVER_AVAILABLE,
    ruleKey: "waiverDetails",
  });

  data.ROCKET_MOTOR_INSPECTION.rows.forEach((row, index) => {
    if (row.rowType === "header") return;
    fields.push({
      path: `ROCKET_MOTOR_INSPECTION.rows.${index}.OBSERVATION`,
      value: row.OBSERVATION,
      ruleKey: "inspectionObservation",
    });
  });

  data.VEHICLE_DETAILS.rows.forEach((row, index) => {
    fields.push({
      path: `VEHICLE_DETAILS.rows.${index}.OBSERVATION`,
      value: row.OBSERVATION,
      ruleKey: "vehicleObservation",
    });
  });

  data.ROCKET_MOTOR_PACKING.tableRows.forEach((row, index) => {
    fields.push({
      path: `ROCKET_MOTOR_PACKING.tableRows.${index}.OBSERVATION`,
      value: row.OBSERVATION,
      ruleKey: "packingObservation",
    });
  });

  fields.push({
    path: "ROCKET_MOTOR_PACKING.NITROGEN_GAS_PURGING",
    value: data.ROCKET_MOTOR_PACKING.NITROGEN_GAS_PURGING,
    ruleKey: "nitrogenPurging",
  });

  if (str(data.ROCKET_MOTOR_PACKING.NITROGEN_GAS_PURGING) === "YES") {
    fields.push({
      path: "ROCKET_MOTOR_PACKING.NITROGEN_PURGING_PRESSURE",
      value: data.ROCKET_MOTOR_PACKING.NITROGEN_PURGING_PRESSURE,
      ruleKey: "nitrogenPressure",
    });
  }

  fields.push({
    path: "ROCKET_MOTOR_PACKING.LABELLING_OF_MOTOR",
    value: data.ROCKET_MOTOR_PACKING.LABELLING_OF_MOTOR,
    ruleKey: "labellingOfMotor",
  });
  fields.push({
    path: "ROCKET_MOTOR_PACKING.DISPATCH_PHOTOS",
    value: data.ROCKET_MOTOR_PACKING.DISPATCH_PHOTOS,
    ruleKey: "dispatchPhotos",
  });
  fields.push({
    path: "SAFETY_CLEARANCE.SAFETY_CLEARANCE_STATUS",
    value: data.SAFETY_CLEARANCE.SAFETY_CLEARANCE_STATUS,
    ruleKey: "safetyClearance",
  });
  fields.push({
    path: "SAFETY_CLEARANCE.CLEARANCE_CERTIFICATE",
    value: data.SAFETY_CLEARANCE.CLEARANCE_CERTIFICATE,
    ruleKey: "clearanceCertificate",
  });
  fields.push({
    path: "DISPATCH_TEAM.QA_REPRESENTATIVE",
    value: data.DISPATCH_TEAM.QA_REPRESENTATIVE,
    ruleKey: "qaRep",
  });
  fields.push({
    path: "DISPATCH_TEAM.SAFETY_REPRESENTATIVE",
    value: data.DISPATCH_TEAM.SAFETY_REPRESENTATIVE,
    ruleKey: "safetyRep",
  });
  fields.push({
    path: "DISPATCH_TEAM.PROJECT_REPRESENTATIVE",
    value: data.DISPATCH_TEAM.PROJECT_REPRESENTATIVE,
    ruleKey: "projectRep",
  });

  return fields;
};

const enrichPropellantMessages = (
  data: DispatchValidationTarget,
  _tier: ValidationTier,
  errors: ValidationErrors,
) => {
  data.data.PROPELLANT_PROPERTIES.rows.forEach((row, index) => {
    if (row.rowType === "header") return;
    const prop = str(row.PROPERTY) || `Property ${index + 1}`;
    const specPath = `PROPELLANT_PROPERTIES.rows.${index}.SPECIFICATION`;
    if (errors[specPath]) {
      if (errors[specPath].includes("numeric")) {
        errors[specPath] = `${prop} — Specs must be numeric.`;
      } else if (errors[specPath].includes("required")) {
        errors[specPath] = `${prop} — Specs is required.`;
      }
    }
    data.data.PROPELLANT_PROPERTIES.fmColumns.forEach((col) => {
      const p = `PROPELLANT_PROPERTIES.rows.${index}.fmValues.${col}`;
      if (!errors[p]) return;
      const colLabel = col.replace("_", " ");
      if (errors[p].includes("numeric")) {
        errors[p] = `${prop} — ${colLabel} must be numeric.`;
      } else if (errors[p].includes("required")) {
        errors[p] = `${prop} — ${colLabel} is required.`;
      }
    });
  });
};

export const dispatchValidationConfig: SubDeptValidationConfig<DispatchValidationTarget> = {
  id: "dispatch",
  fields: dispatchValidationFields,
  resolveFieldPaths: (target) => [
    ...resolveSetupFields(target.setup),
    ...resolveMotorDataFields(target.data),
  ],
  customRules: [enrichPropellantMessages],
  isUnitComplete: (target) =>
    Boolean(str(target.setup.dispatchDate) && str(target.setup.dispatchLocation)),
};

export function toDispatchValidationTarget(
  motor: DispatchMotorSession,
): DispatchValidationTarget {
  return {
    setup: motor.setup,
    data: motor.dispatchData,
  };
}
