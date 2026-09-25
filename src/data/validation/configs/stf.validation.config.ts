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

const date = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const dateTime = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "datetime",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});
const file = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "file",
  requiredIn,
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
  bemMotorNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  stfTestNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),

  fromDateTime: dateTime(["SUBMIT"]),
  toDateTime: dateTime(["SUBMIT"]),
  conditioningTemp: number(["SUBMIT"]),
  conditioningRh: number(["SUBMIT"]),
  conditioningObservation: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  grainOd: number(["SUBMIT"]),
  grainA: number(["SUBMIT"]),
  grainB: number(["SUBMIT"]),
  grainC: number(["SUBMIT"]),
  grainLength: number(["SUBMIT"]),
  grainWeight: number(["SUBMIT"]),

  headEndNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  nozzleEndNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  retainerRingNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  casingNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  casingOd: number(["SUBMIT"]),
  casingId: number(["SUBMIT"]),
  casingLength: number(["SUBMIT"]),
  firingNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),

  containerType: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  composition: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  weightOfComposition: number(["SUBMIT"]),
  squibResistance: number(["SUBMIT"]),
  igniterRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  nozzleClosureMaterial: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  throatMaterial: number(["SUBMIT"]),
  motherGraphite: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  nozzleInsert: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  beforeD1: number(["SUBMIT"]),
  beforeD2: number(["SUBMIT"]),
  afterD1: number(["SUBMIT"]),
  afterD2: number(["SUBMIT"]),
  nozzleRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  dtBefore: number(["SUBMIT"]),
  deBefore: number(["SUBMIT"]),
  dtAfter: number(["SUBMIT"]),
  deAfter: number(["SUBMIT"]),

  throatDiameter: number(["SUBMIT"]),
  propellantWeight: number(["SUBMIT"]),
  webThickness: number(["SUBMIT"]),
  nValue: number(["SUBMIT"]),
  testingCondTemp: number(["SUBMIT"]),
  ambientTemp: number(["SUBMIT"]),
  testingRh: number(["SUBMIT"]),

  sensor: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  sensitivity: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  maxRange: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  sensorRange: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  filterHz: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  iaNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  iaGain: number(["SUBMIT"]),
  extV: number(["SUBMIT"]),
  offsetValue: number(["SUBMIT"]),
  preloading: number(["SUBMIT"]),

  avgPressure: number(["SUBMIT"]),
  peakPressure: number(["SUBMIT"]),
  tb: number(["SUBMIT"]),
  burnRate: number(["SUBMIT"]),
  cStar: number(["SUBMIT"]),
  isp: number(["SUBMIT"]),

  ptCurve: file(["SUBMIT"]),
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
  const c = data.CONDITIONING_DETAILS;
  push(fields, "CONDITIONING_DETAILS.FROM_DATE_TIME", c.FROM_DATE_TIME, "fromDateTime");
  push(fields, "CONDITIONING_DETAILS.TO_DATE_TIME", c.TO_DATE_TIME, "toDateTime");
  push(fields, "CONDITIONING_DETAILS.TEMPERATURE", c.TEMPERATURE, "conditioningTemp");
  push(fields, "CONDITIONING_DETAILS.RH", c.RH, "conditioningRh");
  push(fields, "CONDITIONING_DETAILS.OBSERVATION", c.OBSERVATION, "conditioningObservation");

  (data.GRAIN_DIMENSION ?? []).forEach((row, i) => {
    const hasData = [row.OD, row.A, row.B, row.C, row.LENGTH, row.WEIGHT].some((v) => str(v));
    if (!hasData) return;
    push(fields, `GRAIN_DIMENSION.${i}.OD`, row.OD, "grainOd");
    push(fields, `GRAIN_DIMENSION.${i}.A`, row.A, "grainA");
    push(fields, `GRAIN_DIMENSION.${i}.B`, row.B, "grainB");
    push(fields, `GRAIN_DIMENSION.${i}.C`, row.C, "grainC");
    push(fields, `GRAIN_DIMENSION.${i}.LENGTH`, row.LENGTH, "grainLength");
    push(fields, `GRAIN_DIMENSION.${i}.WEIGHT`, row.WEIGHT, "grainWeight");
  });

  const h = data.BEM_HARDWARE_DETAILS;
  push(fields, "BEM_HARDWARE_DETAILS.HEAD_END_NO", h.HEAD_END_NO, "headEndNo");
  push(fields, "BEM_HARDWARE_DETAILS.NOZZLE_END_NO", h.NOZZLE_END_NO, "nozzleEndNo");
  push(fields, "BEM_HARDWARE_DETAILS.RETAINER_RING_NO", h.RETAINER_RING_NO, "retainerRingNo");
  push(fields, "BEM_HARDWARE_DETAILS.CASING_NO", h.CASING_NO, "casingNo");
  push(fields, "BEM_HARDWARE_DETAILS.CASING_OD", h.CASING_OD, "casingOd");
  push(fields, "BEM_HARDWARE_DETAILS.CASING_ID", h.CASING_ID, "casingId");
  push(fields, "BEM_HARDWARE_DETAILS.CASING_LENGTH", h.CASING_LENGTH, "casingLength");
  push(fields, "BEM_HARDWARE_DETAILS.FIRING_NO", h.FIRING_NO, "firingNo");

  const ig = data.IGNITER_DETAILS;
  push(fields, "IGNITER_DETAILS.CONTAINER_TYPE", ig.CONTAINER_TYPE, "containerType");
  push(fields, "IGNITER_DETAILS.COMPOSITION", ig.COMPOSITION, "composition");
  push(
    fields,
    "IGNITER_DETAILS.WEIGHT_OF_COMPOSITION",
    ig.WEIGHT_OF_COMPOSITION,
    "weightOfComposition",
  );
  push(fields, "IGNITER_DETAILS.SQUIB_RESISTANCE", ig.SQUIB_RESISTANCE, "squibResistance");
  push(fields, "IGNITER_DETAILS.REMARKS", ig.REMARKS, "igniterRemarks");

  const n = data.NOZZLE_DETAILS;
  push(
    fields,
    "NOZZLE_DETAILS.NOZZLE_CLOSURE_MATERIAL",
    n.NOZZLE_CLOSURE_MATERIAL,
    "nozzleClosureMaterial",
  );
  push(fields, "NOZZLE_DETAILS.THROAT_MATERIAL", n.THROAT_MATERIAL, "throatMaterial");
  push(fields, "NOZZLE_DETAILS.MOTHER_GRAPHITE", n.MOTHER_GRAPHITE, "motherGraphite");
  push(fields, "NOZZLE_DETAILS.NOZZLE_INSERT", n.NOZZLE_INSERT, "nozzleInsert");
  push(fields, "NOZZLE_DETAILS.BEFORE_D1", n.BEFORE_D1, "beforeD1");
  push(fields, "NOZZLE_DETAILS.BEFORE_D2", n.BEFORE_D2, "beforeD2");
  push(fields, "NOZZLE_DETAILS.AFTER_D1", n.AFTER_D1, "afterD1");
  push(fields, "NOZZLE_DETAILS.AFTER_D2", n.AFTER_D2, "afterD2");
  push(fields, "NOZZLE_DETAILS.REMARKS", n.REMARKS, "nozzleRemarks");

  const t = data.TESTING_DETAILS;
  push(fields, "TESTING_DETAILS.THROAT_DIAMETER", t.THROAT_DIAMETER, "throatDiameter");
  push(fields, "TESTING_DETAILS.WT_OF_PROPELLANT", t.WT_OF_PROPELLANT, "propellantWeight");
  push(fields, "TESTING_DETAILS.WEB_THICKNESS", t.WEB_THICKNESS, "webThickness");
  push(fields, "TESTING_DETAILS.N_VALUE", t.N_VALUE, "nValue");
  push(fields, "TESTING_DETAILS.CONDITIONING_TEMP", t.CONDITIONING_TEMP, "testingCondTemp");
  push(fields, "TESTING_DETAILS.AMBIENT_TEMP", t.AMBIENT_TEMP, "ambientTemp");
  push(fields, "TESTING_DETAILS.RH", t.RH, "testingRh");

  (data.SENSOR_CONFIGURATION ?? []).forEach((row, i) => {
    const hasData = [
      row.SENSOR,
      row.SENSITIVITY,
      row.MAX_RANGE,
      row.SENSOR_RANGE,
      row.FILTER_HZ,
      row.IA_NO,
      row.IA_GAIN,
      (row as any).EXT_V ?? (row as any).EXT_VOLTAGE,
      row.OFFSET_VALUE,
      row.PRELOADING,
    ].some((v) => str(v));
    if (!hasData) return;

    push(fields, `SENSOR_CONFIGURATION.${i}.SENSOR`, row.SENSOR, "sensor");
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSITIVITY`, row.SENSITIVITY, "sensitivity");
    push(fields, `SENSOR_CONFIGURATION.${i}.MAX_RANGE`, row.MAX_RANGE, "maxRange");
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSOR_RANGE`, row.SENSOR_RANGE, "sensorRange");
    push(fields, `SENSOR_CONFIGURATION.${i}.FILTER_HZ`, row.FILTER_HZ, "filterHz");
    push(fields, `SENSOR_CONFIGURATION.${i}.IA_NO`, row.IA_NO, "iaNo");
    push(fields, `SENSOR_CONFIGURATION.${i}.IA_GAIN`, row.IA_GAIN, "iaGain");
    push(
      fields,
      `SENSOR_CONFIGURATION.${i}.EXT_V`,
      (row as any).EXT_V ?? (row as any).EXT_VOLTAGE,
      "extV",
    );
    push(fields, `SENSOR_CONFIGURATION.${i}.OFFSET_VALUE`, row.OFFSET_VALUE, "offsetValue");
    push(fields, `SENSOR_CONFIGURATION.${i}.PRELOADING`, row.PRELOADING, "preloading");
  });

  const r = (data as any).RESULT_DETAILS ?? (data as any).STATIC_TEST_RESULT ?? {};
  push(fields, "RESULT_DETAILS.AVG_PRESSURE", r.AVG_PRESSURE ?? r.AVERAGE_PRESSURE, "avgPressure");
  push(fields, "RESULT_DETAILS.PEAK_PRESSURE", r.PEAK_PRESSURE, "peakPressure");
  push(fields, "RESULT_DETAILS.TB", r.TB, "tb");
  push(fields, "RESULT_DETAILS.BURN_RATE", r.BURN_RATE, "burnRate");
  push(fields, "RESULT_DETAILS.C_STAR", r.C_STAR, "cStar");
  push(fields, "RESULT_DETAILS.ISP", r.ISP, "isp");

  const pt = data.UPLOAD_PT_CURVE as any;
  push(
    fields,
    "UPLOAD_PT_CURVE.PT_CURVE_UPLOAD",
    pt?.PT_CURVE_UPLOAD ?? pt?.PT_CURVE_FILE,
    "ptCurve",
  );
};

const resolveMainFields = (
  data: StfMainMotorData,
  fields: Array<{ path: string; value: unknown; ruleKey: string }>,
) => {
  const ig = data.IGNITER_DETAILS;
  push(fields, "IGNITER_DETAILS.CONTAINER_TYPE", ig.CONTAINER_TYPE, "containerType");
  push(fields, "IGNITER_DETAILS.COMPOSITION", ig.COMPOSITION, "composition");
  push(
    fields,
    "IGNITER_DETAILS.WEIGHT_OF_COMPOSITION",
    ig.WEIGHT_OF_COMPOSITION,
    "weightOfComposition",
  );
  push(fields, "IGNITER_DETAILS.SQUIB_RESISTANCE", ig.SQUIB_RESISTANCE, "squibResistance");
  push(fields, "IGNITER_DETAILS.REMARKS", ig.REMARKS, "igniterRemarks");

  const n = data.NOZZLE_DETAILS as any;
  push(
    fields,
    "NOZZLE_DETAILS.NOZZLE_CLOSURE_MATERIAL",
    n.NOZZLE_CLOSURE_MATERIAL,
    "nozzleClosureMaterial",
  );
  push(fields, "NOZZLE_DETAILS.MOTHER_GRAPHITE", n.MOTHER_GRAPHITE, "motherGraphite");
  push(fields, "NOZZLE_DETAILS.NOZZLE_INSERT", n.NOZZLE_INSERT, "nozzleInsert");
  push(fields, "NOZZLE_DETAILS.DT_BEFORE", n.DT_BEFORE, "dtBefore");
  push(fields, "NOZZLE_DETAILS.DE_BEFORE", n.DE_BEFORE, "deBefore");
  push(fields, "NOZZLE_DETAILS.DT_AFTER", n.DT_AFTER, "dtAfter");
  push(fields, "NOZZLE_DETAILS.DE_AFTER", n.DE_AFTER, "deAfter");
  push(fields, "NOZZLE_DETAILS.REMARKS", n.REMARKS, "nozzleRemarks");

  const t = data.TESTING_DETAILS as any;
  push(fields, "TESTING_DETAILS.THROAT_DIAMETER", t.THROAT_DIAMETER, "throatDiameter");
  push(
    fields,
    "TESTING_DETAILS.PROPELLANT_WEIGHT",
    t.PROPELLANT_WEIGHT ?? t.WT_OF_PROPELLANT,
    "propellantWeight",
  );
  push(fields, "TESTING_DETAILS.WEB_THICKNESS", t.WEB_THICKNESS, "webThickness");
  push(fields, "TESTING_DETAILS.N_VALUE", t.N_VALUE, "nValue");
  // MAIN UI keys (with BEM-style fallbacks for legacy/hydrated payloads)
  push(
    fields,
    "TESTING_DETAILS.CONDITIONING_TEMPERATURE",
    t.CONDITIONING_TEMPERATURE ?? t.CONDITIONING_TEMP,
    "testingCondTemp",
  );
  push(
    fields,
    "TESTING_DETAILS.AMBIENT_TEMPERATURE",
    t.AMBIENT_TEMPERATURE ?? t.AMBIENT_TEMP,
    "ambientTemp",
  );
  push(fields, "TESTING_DETAILS.RH_PERCENT", t.RH_PERCENT ?? t.RH, "testingRh");

  (data.SENSOR_CONFIGURATION ?? []).forEach((row: any, i) => {
    const hasData = [
      row.SENSOR,
      row.SENSITIVITY,
      row.MAX_EXPECTED,
      row.MAX_RANGE,
      row.SENSOR_RANGE,
      row.FILTER_HZ,
      row.IA_NO,
      row.IA_GAIN,
      row.EXT_VOLTAGE,
      row.EXT_V,
      row.OFFSET_VALUE,
      row.PRELOADING,
    ].some((v) => str(v));
    // Skip empty placeholder channels so they do not block SUBMIT
    if (!hasData) return;

    push(fields, `SENSOR_CONFIGURATION.${i}.SENSOR`, row.SENSOR, "sensor");
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSITIVITY`, row.SENSITIVITY, "sensitivity");
    push(
      fields,
      `SENSOR_CONFIGURATION.${i}.MAX_EXPECTED`,
      row.MAX_EXPECTED ?? row.MAX_RANGE,
      "maxRange",
    );
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSOR_RANGE`, row.SENSOR_RANGE, "sensorRange");
    push(fields, `SENSOR_CONFIGURATION.${i}.FILTER_HZ`, row.FILTER_HZ, "filterHz");
    push(fields, `SENSOR_CONFIGURATION.${i}.IA_NO`, row.IA_NO, "iaNo");
    push(fields, `SENSOR_CONFIGURATION.${i}.IA_GAIN`, row.IA_GAIN, "iaGain");
    push(
      fields,
      `SENSOR_CONFIGURATION.${i}.EXT_VOLTAGE`,
      row.EXT_VOLTAGE ?? row.EXT_V,
      "extV",
    );
    push(fields, `SENSOR_CONFIGURATION.${i}.OFFSET_VALUE`, row.OFFSET_VALUE, "offsetValue");
    push(fields, `SENSOR_CONFIGURATION.${i}.PRELOADING`, row.PRELOADING, "preloading");
  });

  const r = (data as any).STATIC_TEST_RESULT ?? (data as any).RESULT_DETAILS ?? {};
  push(
    fields,
    "STATIC_TEST_RESULT.AVERAGE_PRESSURE",
    r.AVERAGE_PRESSURE ?? r.AVG_PRESSURE,
    "avgPressure",
  );
  push(fields, "STATIC_TEST_RESULT.PEAK_PRESSURE", r.PEAK_PRESSURE, "peakPressure");
  push(fields, "STATIC_TEST_RESULT.TB", r.TB, "tb");
  push(fields, "STATIC_TEST_RESULT.BURN_RATE", r.BURN_RATE, "burnRate");
  push(fields, "STATIC_TEST_RESULT.C_STAR", r.C_STAR, "cStar");
  push(fields, "STATIC_TEST_RESULT.ISP", r.ISP, "isp");

  const pt = data.UPLOAD_PT_CURVE as any;
  push(
    fields,
    "UPLOAD_PT_CURVE.PT_CURVE_FILE",
    pt?.PT_CURVE_FILE ?? pt?.PT_CURVE_UPLOAD,
    "ptCurve",
  );
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
  // customRules: [
  //   (motor, tier, errors) => {
  //     if (tier !== "SUBMIT") return;
  //     const data = motor.stfData;
  //     if (!data || data.variant !== "BEM") return;
  //     const from = str((data as StfBemMotorData).CONDITIONING_DETAILS.FROM_DATE_TIME);
  //     const to = str((data as StfBemMotorData).CONDITIONING_DETAILS.TO_DATE_TIME);
  //     if (!from || !to) return;
  //     const t0 = Date.parse(from);
  //     const t1 = Date.parse(to);
  //     if (Number.isFinite(t0) && Number.isFinite(t1) && t1 < t0) {
  //       errors["CONDITIONING_DETAILS.TO_DATE_TIME"] = S.INVALID;
  //     }
  //   },
  // ],
  isUnitComplete: (motor) => Boolean(str(motor.motorId) && str(motor.stfTestNo)),
};

export function toStfValidationTarget(motor: StfMotorSession): StfValidationTarget {
  return motor;
}
