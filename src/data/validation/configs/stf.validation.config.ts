/**
 * Static Test Facility — Excel sheet rules (FORMAT / UNIT / SUBMIT).
 * Target = one StfMotorSession (stfData + stfTestNo / BEM number).
 */

import type { StfMotorSession } from "@/data/models/user/StaticTestFacilityFormModel";
import type {
  StfBemMotorData,
  StfMainMotorData,
  StfMotorData,
} from "@/data/models/user/StfMotorDataModel";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str, ALPHA_NUM } from "../fieldValidators";

const required = (label: string) => `${label} is required.`;
const invalidNumber = (label: string) => `${label} must be numeric.`;
const invalidText = (label: string) => `${label} must be alphanumeric.`;
const invalidDate = (label: string) => `${label} must be a valid date/time.`;

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

const dateRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: required(label), invalid: invalidDate(label) },
});

const fileRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "file",
  requiredIn,
  messages: { required: required(label), invalid: required(label) },
});

export type StfValidationTarget = StfMotorSession;

/** Shared + BEM + Main field rules (paths resolved per variant). */
export const stfValidationFields: Record<string, FieldRuleConfig> = {
  // Setup
  bemMotorNo: textRule("BEM Number", ["UNIT", "SUBMIT"], {
    pattern: ALPHA_NUM,
    invalidMessage: "BEM Number must be alphanumeric.",
  }),
  stfTestNo: textRule("BEM / STF Test No", ["UNIT", "SUBMIT"], {
    pattern: ALPHA_NUM,
    invalidMessage: "BEM / STF Test No must be alphanumeric.",
  }),

  // BEM Conditioning
  fromDateTime: dateRule("From (Date & Time)", ["SUBMIT"]),
  toDateTime: dateRule("To (Date & Time)", ["SUBMIT"]),
  conditioningTemp: numberRule("Temperature (°C)", ["SUBMIT"]),
  conditioningRh: numberRule("RH (%)", ["SUBMIT"]),
  conditioningObservation: textRule("Observation", []),

  // Grain dimension (per row)
  grainOd: numberRule("OD", ["SUBMIT"]),
  grainA: numberRule("A", ["SUBMIT"]),
  grainB: numberRule("B", ["SUBMIT"]),
  grainC: numberRule("C", ["SUBMIT"]),
  grainLength: numberRule("Length", ["SUBMIT"]),
  grainWeight: numberRule("Weight (Kg)", ["SUBMIT"]),

  // BEM hardware
  headEndNo: textRule("Head End No", ["SUBMIT"], { pattern: ALPHA_NUM }),
  nozzleEndNo: textRule("Nozzle End No", ["SUBMIT"], { pattern: ALPHA_NUM }),
  retainerRingNo: textRule("Retainer Ring No", ["SUBMIT"], { pattern: ALPHA_NUM }),
  casingNo: textRule("Casing No", ["SUBMIT"], { pattern: ALPHA_NUM }),
  casingOd: numberRule("Casing OD", ["SUBMIT"]),
  casingId: numberRule("Casing ID", ["SUBMIT"]),
  casingLength: numberRule("Casing Length", ["SUBMIT"]),
  firingNo: textRule("Firing No", ["SUBMIT"], { pattern: ALPHA_NUM }),

  // Igniter (shared)
  containerType: textRule("Container Type", ["SUBMIT"], { pattern: ALPHA_NUM }),
  composition: textRule("Composition", ["SUBMIT"], { pattern: ALPHA_NUM }),
  weightOfComposition: numberRule("Weight of Composition (g)", ["SUBMIT"]),
  squibResistance: numberRule("Squib Resistance (Ω)", ["SUBMIT"]),
  igniterRemarks: textRule("Remarks", []),

  // Nozzle — BEM
  nozzleClosureMaterial: textRule("Nozzle Closure Material", ["SUBMIT"]),
  throatMaterial: numberRule("Throat Material", ["SUBMIT"]),
  motherGraphite: textRule("Mother Graphite", ["SUBMIT"]),
  nozzleInsert: textRule("Nozzle Insert", ["SUBMIT"]),
  beforeD1: numberRule("Before Firing D1 (mm)", ["SUBMIT"]),
  beforeD2: numberRule("Before Firing D2 (mm)", ["SUBMIT"]),
  afterD1: numberRule("After Firing D1 (mm)", ["SUBMIT"]),
  afterD2: numberRule("After Firing D2 (mm)", ["SUBMIT"]),
  nozzleRemarks: textRule("Remarks", []),

  // Nozzle — Main
  dtBefore: numberRule("DT Before", ["SUBMIT"]),
  deBefore: numberRule("DE Before", ["SUBMIT"]),
  dtAfter: numberRule("DT After", ["SUBMIT"]),
  deAfter: numberRule("DE After", ["SUBMIT"]),

  // Testing
  throatDiameter: numberRule("Throat Diameter", ["SUBMIT"]),
  propellantWeight: numberRule("Wt of Propellant", ["SUBMIT"]),
  webThickness: numberRule("Web Thickness", ["SUBMIT"]),
  nValue: numberRule("n Value", ["SUBMIT"]),
  testingCondTemp: numberRule("Conditioning Temp", ["SUBMIT"]),
  ambientTemp: numberRule("Ambient Temp", ["SUBMIT"]),
  testingRh: numberRule("RH", ["SUBMIT"]),

  // Sensor row
  sensor: textRule("Sensor", ["SUBMIT"], { pattern: ALPHA_NUM }),
  sensitivity: textRule("Sensitivity", ["SUBMIT"]),
  maxRange: textRule("Range Max", ["SUBMIT"]),
  sensorRange: textRule("Range Sensor", ["SUBMIT"]),
  filterHz: textRule("Filter (Hz)", ["SUBMIT"]),
  iaNo: textRule("IA No", ["SUBMIT"], { pattern: ALPHA_NUM }),
  iaGain: numberRule("IA Gain", ["SUBMIT"]),
  extV: numberRule("Ext (V)", ["SUBMIT"]),
  offsetValue: numberRule("Offset Value", ["SUBMIT"]),
  preloading: numberRule("Preloading", ["SUBMIT"]),

  // Results
  avgPressure: numberRule("Avg Pressure (ksc)", ["SUBMIT"]),
  peakPressure: numberRule("Peak Pressure (ksc)", ["SUBMIT"]),
  tb: numberRule("Tb (s)", ["SUBMIT"]),
  burnRate: numberRule("Burn Rate (mm/s)", ["SUBMIT"]),
  cStar: numberRule("C star (m/s)", ["SUBMIT"]),
  isp: numberRule("Isp (s)", ["SUBMIT"]),

  // PT curve
  ptCurve: fileRule("Upload P-T Curve", ["SUBMIT"]),
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
  push(fields, "IGNITER_DETAILS.WEIGHT_OF_COMPOSITION", ig.WEIGHT_OF_COMPOSITION, "weightOfComposition");
  push(fields, "IGNITER_DETAILS.SQUIB_RESISTANCE", ig.SQUIB_RESISTANCE, "squibResistance");
  push(fields, "IGNITER_DETAILS.REMARKS", ig.REMARKS, "igniterRemarks");

  const n = data.NOZZLE_DETAILS;
  push(fields, "NOZZLE_DETAILS.NOZZLE_CLOSURE_MATERIAL", n.NOZZLE_CLOSURE_MATERIAL, "nozzleClosureMaterial");
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
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSOR`, row.SENSOR, "sensor");
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSITIVITY`, row.SENSITIVITY, "sensitivity");
    push(fields, `SENSOR_CONFIGURATION.${i}.MAX_RANGE`, row.MAX_RANGE, "maxRange");
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSOR_RANGE`, row.SENSOR_RANGE, "sensorRange");
    push(fields, `SENSOR_CONFIGURATION.${i}.FILTER_HZ`, row.FILTER_HZ, "filterHz");
    push(fields, `SENSOR_CONFIGURATION.${i}.IA_NO`, row.IA_NO, "iaNo");
    push(fields, `SENSOR_CONFIGURATION.${i}.IA_GAIN`, row.IA_GAIN, "iaGain");
    push(fields, `SENSOR_CONFIGURATION.${i}.EXT_V`, row.EXT_V, "extV");
    push(fields, `SENSOR_CONFIGURATION.${i}.OFFSET_VALUE`, row.OFFSET_VALUE, "offsetValue");
    push(fields, `SENSOR_CONFIGURATION.${i}.PRELOADING`, row.PRELOADING, "preloading");
  });

  const r = data.RESULT_DETAILS;
  push(fields, "RESULT_DETAILS.AVG_PRESSURE", r.AVG_PRESSURE, "avgPressure");
  push(fields, "RESULT_DETAILS.PEAK_PRESSURE", r.PEAK_PRESSURE, "peakPressure");
  push(fields, "RESULT_DETAILS.TB", r.TB, "tb");
  push(fields, "RESULT_DETAILS.BURN_RATE", r.BURN_RATE, "burnRate");
  push(fields, "RESULT_DETAILS.C_STAR", r.C_STAR, "cStar");
  push(fields, "RESULT_DETAILS.ISP", r.ISP, "isp");

  push(fields, "UPLOAD_PT_CURVE.PT_CURVE_UPLOAD", data.UPLOAD_PT_CURVE.PT_CURVE_UPLOAD, "ptCurve");
};

const resolveMainFields = (
  data: StfMainMotorData,
  fields: Array<{ path: string; value: unknown; ruleKey: string }>,
) => {
  const ig = data.IGNITER_DETAILS;
  push(fields, "IGNITER_DETAILS.CONTAINER_TYPE", ig.CONTAINER_TYPE, "containerType");
  push(fields, "IGNITER_DETAILS.COMPOSITION", ig.COMPOSITION, "composition");
  push(fields, "IGNITER_DETAILS.WEIGHT_OF_COMPOSITION", ig.WEIGHT_OF_COMPOSITION, "weightOfComposition");
  push(fields, "IGNITER_DETAILS.SQUIB_RESISTANCE", ig.SQUIB_RESISTANCE, "squibResistance");
  push(fields, "IGNITER_DETAILS.REMARKS", ig.REMARKS, "igniterRemarks");

  const n = data.NOZZLE_DETAILS;
  push(fields, "NOZZLE_DETAILS.NOZZLE_CLOSURE_MATERIAL", n.NOZZLE_CLOSURE_MATERIAL, "nozzleClosureMaterial");
  push(fields, "NOZZLE_DETAILS.MOTHER_GRAPHITE", n.MOTHER_GRAPHITE, "motherGraphite");
  push(fields, "NOZZLE_DETAILS.NOZZLE_INSERT", n.NOZZLE_INSERT, "nozzleInsert");
  push(fields, "NOZZLE_DETAILS.DT_BEFORE", n.DT_BEFORE, "dtBefore");
  push(fields, "NOZZLE_DETAILS.DE_BEFORE", n.DE_BEFORE, "deBefore");
  push(fields, "NOZZLE_DETAILS.DT_AFTER", n.DT_AFTER, "dtAfter");
  push(fields, "NOZZLE_DETAILS.DE_AFTER", n.DE_AFTER, "deAfter");
  push(fields, "NOZZLE_DETAILS.REMARKS", n.REMARKS, "nozzleRemarks");

  const t = data.TESTING_DETAILS;
  push(fields, "TESTING_DETAILS.THROAT_DIAMETER", t.THROAT_DIAMETER, "throatDiameter");
  push(fields, "TESTING_DETAILS.PROPELLANT_WEIGHT", t.PROPELLANT_WEIGHT, "propellantWeight");
  push(fields, "TESTING_DETAILS.WEB_THICKNESS", t.WEB_THICKNESS, "webThickness");
  push(fields, "TESTING_DETAILS.N_VALUE", t.N_VALUE, "nValue");
  push(fields, "TESTING_DETAILS.CONDITIONING_TEMPERATURE", t.CONDITIONING_TEMPERATURE, "testingCondTemp");
  push(fields, "TESTING_DETAILS.AMBIENT_TEMPERATURE", t.AMBIENT_TEMPERATURE, "ambientTemp");
  push(fields, "TESTING_DETAILS.RH_PERCENT", t.RH_PERCENT, "testingRh");

  (data.SENSOR_CONFIGURATION ?? []).forEach((row, i) => {
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSOR`, row.SENSOR, "sensor");
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSITIVITY`, row.SENSITIVITY, "sensitivity");
    push(fields, `SENSOR_CONFIGURATION.${i}.MAX_EXPECTED`, row.MAX_EXPECTED, "maxRange");
    push(fields, `SENSOR_CONFIGURATION.${i}.SENSOR_RANGE`, row.SENSOR_RANGE, "sensorRange");
    push(fields, `SENSOR_CONFIGURATION.${i}.FILTER_HZ`, row.FILTER_HZ, "filterHz");
    push(fields, `SENSOR_CONFIGURATION.${i}.IA_NO`, row.IA_NO, "iaNo");
    push(fields, `SENSOR_CONFIGURATION.${i}.IA_GAIN`, row.IA_GAIN, "iaGain");
    push(fields, `SENSOR_CONFIGURATION.${i}.EXT_VOLTAGE`, row.EXT_VOLTAGE, "extV");
    push(fields, `SENSOR_CONFIGURATION.${i}.OFFSET_VALUE`, row.OFFSET_VALUE, "offsetValue");
    push(fields, `SENSOR_CONFIGURATION.${i}.PRELOADING`, row.PRELOADING, "preloading");
  });

  const r = data.STATIC_TEST_RESULT;
  push(fields, "STATIC_TEST_RESULT.AVERAGE_PRESSURE", r.AVERAGE_PRESSURE, "avgPressure");
  push(fields, "STATIC_TEST_RESULT.PEAK_PRESSURE", r.PEAK_PRESSURE, "peakPressure");
  push(fields, "STATIC_TEST_RESULT.TB", r.TB, "tb");
  push(fields, "STATIC_TEST_RESULT.BURN_RATE", r.BURN_RATE, "burnRate");
  push(fields, "STATIC_TEST_RESULT.C_STAR", r.C_STAR, "cStar");
  push(fields, "STATIC_TEST_RESULT.ISP", r.ISP, "isp");

  push(fields, "UPLOAD_PT_CURVE.PT_CURVE_FILE", data.UPLOAD_PT_CURVE.PT_CURVE_FILE, "ptCurve");
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
      resolveMainFields(data, fields);
    }

    return fields;
  },
  customRules: [
    (motor, tier, errors) => {
      if (tier !== "SUBMIT") return;
      const data = motor.stfData;
      if (!data || data.variant !== "BEM") return;
      const from = str(data.CONDITIONING_DETAILS.FROM_DATE_TIME);
      const to = str(data.CONDITIONING_DETAILS.TO_DATE_TIME);
      if (!from || !to) return;
      const t0 = Date.parse(from);
      const t1 = Date.parse(to);
      if (Number.isFinite(t0) && Number.isFinite(t1) && t1 < t0) {
        errors["CONDITIONING_DETAILS.TO_DATE_TIME"] =
          "To (Date & Time) cannot be before From (Date & Time).";
      }
    },
  ],
  isUnitComplete: (motor) => Boolean(str(motor.motorId) && str(motor.stfTestNo)),
};

export function toStfValidationTarget(motor: StfMotorSession): StfValidationTarget {
  return motor;
}
