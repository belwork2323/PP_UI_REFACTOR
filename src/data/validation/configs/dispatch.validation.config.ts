import type { DispatchMotorData } from "@/data/models/user/DispatchMotorDataModel";
import type {
  DispatchMotorSession,
  DispatchMotorSetup,
} from "@/data/models/user/DispatchFormModel";
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

export type DispatchValidationTarget = {
  setup: DispatchMotorSetup;
  data: DispatchMotorData;
};

export const dispatchValidationFields: Record<string, FieldRuleConfig> = {
  // Setup
  "setup.dispatchDate": date(["UNIT", "SUBMIT"]),
  "setup.dispatchLocation": text(["UNIT", "SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  "setup.ndtClearance": text(["SUBMIT"]),
  "setup.ndtMomNo": text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  "setup.finalAcceptanceClearance": text(["SUBMIT"]),
  "setup.finalAcceptanceMomNo": text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),

  // Propellant
  propellantSpec: number(["SUBMIT"]),
  propellantFmValue: number(["SUBMIT"]),

  // Observations (inspection / vehicle / packing)
  observation: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Packing / clearance / team
  nitrogenPurging: text(["SUBMIT"]),
  nitrogenPressure: number(["SUBMIT"]),
  labellingOfMotor: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  safetyClearance: text(["SUBMIT"]),
  clearanceCertificate: file(["SUBMIT"]),
  qaRep: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  safetyRep: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  projectRep: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Optional
  waiverDetails: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const resolveSetupFields = (setup: DispatchMotorSetup) => [
  { path: "setup.dispatchDate", value: setup.dispatchDate, ruleKey: "setup.dispatchDate" },
  {
    path: "setup.dispatchLocation",
    value: setup.dispatchLocation,
    ruleKey: "setup.dispatchLocation",
  },
  { path: "setup.ndtClearance", value: setup.ndtClearance, ruleKey: "setup.ndtClearance" },
  { path: "setup.ndtMomNo", value: setup.ndtMomNo, ruleKey: "setup.ndtMomNo" },
  {
    path: "setup.finalAcceptanceClearance",
    value: setup.finalAcceptanceClearance,
    ruleKey: "setup.finalAcceptanceClearance",
  },
  {
    path: "setup.finalAcceptanceMomNo",
    value: setup.finalAcceptanceMomNo,
    ruleKey: "setup.finalAcceptanceMomNo",
  },
];

const resolveMotorDataFields = (data: DispatchMotorData) => {
  const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

  (data.PROPELLANT_PROPERTIES?.rows ?? []).forEach((row, index) => {
    if ((row as { rowType?: string }).rowType === "header") return;
    fields.push({
      path: `PROPELLANT_PROPERTIES.rows.${index}.SPECIFICATION`,
      value: (row as { SPECIFICATION?: unknown }).SPECIFICATION,
      ruleKey: "propellantSpec",
    });
    const fmValues = (row as { fmValues?: Record<string, unknown> }).fmValues ?? {};
    Object.entries(fmValues).forEach(([col, val]) => {
      fields.push({
        path: `PROPELLANT_PROPERTIES.rows.${index}.fmValues.${col}`,
        value: val,
        ruleKey: "propellantFmValue",
      });
    });
  });

  const pushObs = (
    rows: Array<Record<string, unknown>> | undefined,
    prefix: string,
    labelKey: string,
  ) => {
    (rows ?? []).forEach((row, index) => {
      if (row.rowType === "header") return;
      fields.push({
        path: `${prefix}.${index}.OBSERVATION`,
        value: row.OBSERVATION ?? row.OBSERVATIONS,
        ruleKey: "observation",
      });
    });
  };

  pushObs(
    data.ROCKET_MOTOR_INSPECTION?.rows as Array<Record<string, unknown>> | undefined,
    "ROCKET_MOTOR_INSPECTION.rows",
    "PARAMETER",
  );
  pushObs(
    data.VEHICLE_DETAILS?.rows as Array<Record<string, unknown>> | undefined,
    "VEHICLE_DETAILS.rows",
    "CHECK_POINT",
  );
  pushObs(
    data.ROCKET_MOTOR_PACKING?.tableRows as Array<Record<string, unknown>> | undefined,
    "ROCKET_MOTOR_PACKING.tableRows",
    "NOMENCLATURE",
  );

  const packing = data.ROCKET_MOTOR_PACKING as Record<string, unknown> | undefined;
  if (packing) {
    fields.push({
      path: "ROCKET_MOTOR_PACKING.NITROGEN_GAS_PURGING",
      value: packing.NITROGEN_GAS_PURGING,
      ruleKey: "nitrogenPurging",
    });
    fields.push({
      path: "ROCKET_MOTOR_PACKING.NITROGEN_PRESSURE",
      value: packing.NITROGEN_PRESSURE,
      ruleKey: "nitrogenPressure",
    });
    fields.push({
      path: "ROCKET_MOTOR_PACKING.LABELLING_OF_MOTOR",
      value: packing.LABELLING_OF_MOTOR,
      ruleKey: "labellingOfMotor",
    });
  }

  fields.push({
    path: "WAIVER_DETAILS.WAIVER_AVAILABLE",
    value: data.WAIVER_DETAILS?.WAIVER_AVAILABLE,
    ruleKey: "waiverDetails",
  });

  const safety = data.SAFETY_CLEARANCE as Record<string, unknown> | undefined;
  if (safety) {
    fields.push({
      path: "SAFETY_CLEARANCE.SAFETY_CLEARANCE_STATUS",
      value: safety.SAFETY_CLEARANCE_STATUS,
      ruleKey: "safetyClearance",
    });
    fields.push({
      path: "SAFETY_CLEARANCE.CLEARANCE_CERTIFICATE",
      value: safety.CLEARANCE_CERTIFICATE,
      ruleKey: "clearanceCertificate",
    });
  }

  const team = data.DISPATCH_TEAM as Record<string, unknown> | undefined;
  if (team) {
    fields.push({
      path: "DISPATCH_TEAM.QA_REPRESENTATIVE",
      value: team.QA_REPRESENTATIVE,
      ruleKey: "qaRep",
    });
    fields.push({
      path: "DISPATCH_TEAM.SAFETY_REPRESENTATIVE",
      value: team.SAFETY_REPRESENTATIVE,
      ruleKey: "safetyRep",
    });
    fields.push({
      path: "DISPATCH_TEAM.PROJECT_REPRESENTATIVE",
      value: team.PROJECT_REPRESENTATIVE,
      ruleKey: "projectRep",
    });
  }

  return fields;
};

export const dispatchValidationConfig: SubDeptValidationConfig<DispatchValidationTarget> = {
  id: "dispatch",
  fields: dispatchValidationFields,
  resolveFieldPaths: (target) => [
    ...resolveSetupFields(target.setup),
    ...resolveMotorDataFields(target.data),
  ],
  customRules: [],
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
