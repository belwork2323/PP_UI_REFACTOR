import type { StfMotorSession } from "@/data/models/user/StaticTestFacilityFormModel";
import type {
  StfBemMotorData,
  StfMainMotorData,
  StfMotorData,
} from "@/data/models/user/StfMotorDataModel";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

const text = (requiredIn: ValidationTier[], pattern?: RegExp): FieldRuleConfig => ({
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

const dateTime = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "datetime",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type StfValidationTarget = StfMotorSession;

export const stfValidationFields: Record<string, FieldRuleConfig> = {
  // Mandatory on SUBMIT only — draft/save uses FORMAT (no required checks)
  // bemMotorNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  stfTestNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),

  // Shared header / remarks
  firingDate: dateTime(["SUBMIT"]),
  ambientTemp: number(["SUBMIT"]),
  qaRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // BEM test header
  loadingNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  firingNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  headerTemperature: number(["SUBMIT"]),
  headerRh: number(["SUBMIT"]),
  wtOfGrain: text(["SUBMIT"]),
  grainConfiguration: text(["SUBMIT"]),

  // BEM igniter
  igniterType: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  srNoAndLotNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  chargeMassGm: number(["SUBMIT"]),
  composition: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Shared / BEM / MAIN nozzle Dt-De
  beforeDt: number(["SUBMIT"]),
  beforeDe: number(["SUBMIT"]),
  afterDt: number(["SUBMIT"]),
  afterDe: number(["SUBMIT"]),
  nozzleClosureThicknessMm: number(["SUBMIT"]),
  nozzleErosionRateMmS: number(["SUBMIT"]),

  // MAIN motor data
  propellantWeightKg: number(["SUBMIT"]),
  avgBemBurnRateMmS: number(["SUBMIT"]),
  nValue: number(["SUBMIT"]),
  propellantDensity: number(["SUBMIT"]),
  gamma: number(["SUBMIT"]),

  // BEM data
  bemConditioningTemp: number(["SUBMIT"]),
  webThicknessAverageMin: number(["SUBMIT"]),
  webThicknessStdDev: number(["SUBMIT"]),

  // Ballistic channels
  ballisticChannel1: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  ballisticChannel2: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Burn rate
  burnRateMmS: number(["SUBMIT"]),
  pressureAbsKsc: number(["SUBMIT"]),
  burnRateNValue: number(["SUBMIT"]),
};

const push = (
  fields: Array<{ path: string; value: unknown; ruleKey: string }>,
  path: string,
  value: unknown,
  ruleKey: string,
) => {
  fields.push({ path, value, ruleKey });
};

const resolveBemFields = (
  data: StfBemMotorData,
  fields: Array<{ path: string; value: unknown; ruleKey: string }>,
) => {
  const h = data.TEST_HEADER;
  push(fields, "TEST_HEADER.LOADING_NO", h.LOADING_NO, "loadingNo");
  push(fields, "TEST_HEADER.FIRING_NO", h.FIRING_NO, "firingNo");
  push(fields, "TEST_HEADER.FIRING_DATE", h.FIRING_DATE, "firingDate");
  push(fields, "TEST_HEADER.TEMPERATURE", h.TEMPERATURE, "headerTemperature");
  push(fields, "TEST_HEADER.RH", h.RH, "headerRh");
  push(fields, "TEST_HEADER.WT_OF_GRAIN", h.WT_OF_GRAIN, "wtOfGrain");
  push(fields, "TEST_HEADER.GRAIN_CONFIGURATION", h.GRAIN_CONFIGURATION, "grainConfiguration");
  push(fields, "TEST_HEADER.QA_REMARKS", h.QA_REMARKS, "qaRemarks");

  const ig = data.IGNITER_DETAILS;
  push(fields, "IGNITER_DETAILS.TYPE", ig.TYPE, "igniterType");
  push(fields, "IGNITER_DETAILS.SR_NO_AND_LOT_NO", ig.SR_NO_AND_LOT_NO, "srNoAndLotNo");
  push(fields, "IGNITER_DETAILS.CHARGE_MASS_GM", ig.CHARGE_MASS_GM, "chargeMassGm");
  push(fields, "IGNITER_DETAILS.COMPOSITION", ig.COMPOSITION, "composition");
  push(fields, "IGNITER_DETAILS.QA_REMARKS", ig.QA_REMARKS, "qaRemarks");

  const n = data.NOZZLE_DETAILS;
  push(fields, "NOZZLE_DETAILS.BEFORE_DT", n.BEFORE_DT, "beforeDt");
  push(fields, "NOZZLE_DETAILS.BEFORE_DE", n.BEFORE_DE, "beforeDe");
  push(fields, "NOZZLE_DETAILS.AFTER_DT", n.AFTER_DT, "afterDt");
  push(fields, "NOZZLE_DETAILS.AFTER_DE", n.AFTER_DE, "afterDe");
  push(
    fields,
    "NOZZLE_DETAILS.NOZZLE_CLOSURE_THICKNESS_MM",
    n.NOZZLE_CLOSURE_THICKNESS_MM,
    "nozzleClosureThicknessMm",
  );
  push(fields, "NOZZLE_DETAILS.QA_REMARKS", n.QA_REMARKS, "qaRemarks");

  const b = data.BEM_DATA;
  push(fields, "BEM_DATA.PROPELLANT_WEIGHT_KG", b.PROPELLANT_WEIGHT_KG, "propellantWeightKg");
  push(
    fields,
    "BEM_DATA.CONDITIONING_TEMPERATURE",
    b.CONDITIONING_TEMPERATURE,
    "bemConditioningTemp",
  );
  push(fields, "BEM_DATA.N_VALUE", b.N_VALUE, "nValue");
  push(
    fields,
    "BEM_DATA.WEB_THICKNESS_AVERAGE_MIN",
    b.WEB_THICKNESS_AVERAGE_MIN,
    "webThicknessAverageMin",
  );
  push(fields, "BEM_DATA.WEB_THICKNESS_STD_DEV", b.WEB_THICKNESS_STD_DEV, "webThicknessStdDev");
  push(fields, "BEM_DATA.QA_REMARKS", b.QA_REMARKS, "qaRemarks");

  (data.BALLISTIC_PARAMETERS ?? []).forEach((row, i) => {
    const hasData = [row.CHANNEL_1, row.CHANNEL_2, row.QA_REMARKS].some((v) => str(v));
    if (!hasData) return;
    push(fields, `BALLISTIC_PARAMETERS.${i}.CHANNEL_1`, row.CHANNEL_1, "ballisticChannel1");
    push(fields, `BALLISTIC_PARAMETERS.${i}.CHANNEL_2`, row.CHANNEL_2, "ballisticChannel2");
    push(fields, `BALLISTIC_PARAMETERS.${i}.QA_REMARKS`, row.QA_REMARKS, "qaRemarks");
  });

  const br = data.BURN_RATE;
  push(fields, "BURN_RATE.BURN_RATE_MM_S", br.BURN_RATE_MM_S, "burnRateMmS");
  push(fields, "BURN_RATE.PRESSURE_ABS_KSC", br.PRESSURE_ABS_KSC, "pressureAbsKsc");
  push(fields, "BURN_RATE.QA_REMARKS", br.QA_REMARKS, "qaRemarks");
};

const resolveMainFields = (
  data: StfMainMotorData,
  fields: Array<{ path: string; value: unknown; ruleKey: string }>,
) => {
  const h = data.TEST_HEADER;
  push(fields, "TEST_HEADER.FIRING_DATE", h.FIRING_DATE, "firingDate");
  push(fields, "TEST_HEADER.AMBIENT_TEMPERATURE", h.AMBIENT_TEMPERATURE, "ambientTemp");
  push(fields, "TEST_HEADER.QA_REMARKS", h.QA_REMARKS, "qaRemarks");

  const n = data.NOZZLE_DETAILS;
  push(fields, "NOZZLE_DETAILS.BEFORE_DT", n.BEFORE_DT, "beforeDt");
  push(fields, "NOZZLE_DETAILS.BEFORE_DE", n.BEFORE_DE, "beforeDe");
  push(fields, "NOZZLE_DETAILS.AFTER_DT", n.AFTER_DT, "afterDt");
  push(fields, "NOZZLE_DETAILS.AFTER_DE", n.AFTER_DE, "afterDe");
  push(
    fields,
    "NOZZLE_DETAILS.NOZZLE_EROSION_RATE_MM_S",
    n.NOZZLE_EROSION_RATE_MM_S,
    "nozzleErosionRateMmS",
  );
  push(fields, "NOZZLE_DETAILS.QA_REMARKS", n.QA_REMARKS, "qaRemarks");

  const m = data.MAIN_MOTOR_DATA;
  push(
    fields,
    "MAIN_MOTOR_DATA.PROPELLANT_WEIGHT_KG",
    m.PROPELLANT_WEIGHT_KG,
    "propellantWeightKg",
  );
  push(
    fields,
    "MAIN_MOTOR_DATA.AVG_BEM_BURN_RATE_MM_S",
    m.AVG_BEM_BURN_RATE_MM_S,
    "avgBemBurnRateMmS",
  );
  push(fields, "MAIN_MOTOR_DATA.N_VALUE", m.N_VALUE, "nValue");
  push(fields, "MAIN_MOTOR_DATA.PROPELLANT_DENSITY", m.PROPELLANT_DENSITY, "propellantDensity");
  push(fields, "MAIN_MOTOR_DATA.GAMMA", m.GAMMA, "gamma");
  push(fields, "MAIN_MOTOR_DATA.QA_REMARKS", m.QA_REMARKS, "qaRemarks");

  (data.BALLISTIC_PARAMETERS ?? []).forEach((row, i) => {
    const hasData = [row.CHANNEL_1, row.QA_REMARKS].some((v) => str(v));
    if (!hasData) return;
    push(fields, `BALLISTIC_PARAMETERS.${i}.CHANNEL_1`, row.CHANNEL_1, "ballisticChannel1");
    push(fields, `BALLISTIC_PARAMETERS.${i}.QA_REMARKS`, row.QA_REMARKS, "qaRemarks");
  });

  const br = data.BURN_RATE;
  push(fields, "BURN_RATE.BURN_RATE_MM_S", br.BURN_RATE_MM_S, "burnRateMmS");
  push(fields, "BURN_RATE.PRESSURE_ABS_KSC", br.PRESSURE_ABS_KSC, "pressureAbsKsc");
  push(fields, "BURN_RATE.N_VALUE", br.N_VALUE, "burnRateNValue");
  push(fields, "BURN_RATE.QA_REMARKS", br.QA_REMARKS, "qaRemarks");
};

export const stfValidationConfig: SubDeptValidationConfig<StfValidationTarget> = {
  id: "static-test-facility",
  fields: stfValidationFields,
  resolveFieldPaths: (motor) => {
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [
      { path: "motorId", value: motor.motorId, ruleKey: "bemMotorNo" },
      { path: "stfTestNo", value: motor.stfTestNo, ruleKey: "stfTestNo" },
    ];

    const data = motor.stfData as StfMotorData | undefined;
    if (!data) return fields;

    if (data.variant === "BEM") {
      resolveBemFields(data, fields);
    } else {
      resolveMainFields(data as StfMainMotorData, fields);
    }

    return fields;
  },
  isUnitComplete: (motor) => Boolean(str(motor.motorId) && str(motor.stfTestNo)),
};

export function toStfValidationTarget(motor: StfMotorSession): StfValidationTarget {
  return motor;
}
