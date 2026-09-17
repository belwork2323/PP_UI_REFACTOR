import type { SchemaFormValues } from "@/schema-engine";
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

const time = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  pattern: /^([01]?\d|2[0-3]):[0-5]\d$/,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcCuringValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcCuringValidationFields: Record<string, FieldRuleConfig> = {
  // Motor setup (sheet: type, oven no, positioning datetime)
  curingType: text(["UNIT", "SUBMIT"]),
  ovenNumber: text(["UNIT", "SUBMIT"], S.PATTERNS.MASTER_CODE),
  motorPositioningDateTime: text(["SUBMIT"]),

  // Cycle details
  temperature: number(["SUBMIT"]),
  duration: number(["SUBMIT"]),
  startDate: date(["SUBMIT"]),
  startTime: time(["SUBMIT"]),
  endDate: date(["SUBMIT"]),
  endTime: time(["SUBMIT"]),
  actualDuration: number(["SUBMIT"]),
  peakPressure: number([]),
  cycleRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Post curing
  visualObservations: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  pressurePlateRemovalDateTime: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  shoreAHardness: number(["SUBMIT"]),
  dispatchDateTime: text(["SUBMIT"]),

  // Subscale parameters
  bemNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  wheelPeelNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  cartonNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  controlGrainNo: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  curingStartDate: date(["SUBMIT"]),
  cycleStartTime: time(["SUBMIT"]),
  curingCompleteDate: date(["SUBMIT"]),
  cycleEndTime: time(["SUBMIT"]),
  bemAvgShoreA: number(["SUBMIT"]),
  cartonAvgShoreA: number(["SUBMIT"]),
  subscaleVisualObservations: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const pick = (values: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) {
    if (values[k] !== undefined && values[k] !== null) return values[k];
  }
  return undefined;
};

export const qcCuringValidationConfig: SubDeptValidationConfig<QcCuringValidationTarget> = {
  id: "qc-curing",
  fields: qcCuringValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    fields.push({
      path: "CURING_TYPE",
      value: pick(values, "CURING_TYPE", "TYPE_OF_CURING"),
      ruleKey: "curingType",
    });
    fields.push({
      path: "OVEN_NUMBER",
      value: pick(values, "OVEN_NUMBER"),
      ruleKey: "ovenNumber",
    });
    fields.push({
      path: "MOTOR_POSITIONING_DATE_TIME",
      value: pick(values, "MOTOR_POSITIONING_DATE_TIME"),
      ruleKey: "motorPositioningDateTime",
    });

    // Post fields
    fields.push({
      path: "VISUAL_OBSERVATIONS",
      value: pick(values, "VISUAL_OBSERVATIONS"),
      ruleKey: "visualObservations",
    });
    fields.push({
      path: "PRESSURE_PLATE_REMOVAL_DATE_TIME",
      value: pick(values, "PRESSURE_PLATE_REMOVAL_DATE_TIME"),
      ruleKey: "pressurePlateRemovalDateTime",
    });
    fields.push({
      path: "SHORE_A_HARDNESS",
      value: pick(values, "SHORE_A_HARDNESS"),
      ruleKey: "shoreAHardness",
    });
    fields.push({
      path: "DISPATCH_DATE_TIME",
      value: pick(values, "DISPATCH_DATE_TIME"),
      ruleKey: "dispatchDateTime",
    });

    // Subscale scalars
    fields.push({
      path: "CURING_START_DATE",
      value: pick(values, "CURING_START_DATE"),
      ruleKey: "curingStartDate",
    });
    fields.push({
      path: "CYCLE_START_TIME",
      value: pick(values, "CYCLE_START_TIME"),
      ruleKey: "cycleStartTime",
    });
    fields.push({
      path: "CURING_COMPLETE_DATE",
      value: pick(values, "CURING_COMPLETE_DATE"),
      ruleKey: "curingCompleteDate",
    });
    fields.push({
      path: "CYCLE_END_TIME",
      value: pick(values, "CYCLE_END_TIME"),
      ruleKey: "cycleEndTime",
    });
    fields.push({
      path: "BEM_AVERAGE_SHORE_A_HARDNESS",
      value: pick(values, "BEM_AVERAGE_SHORE_A_HARDNESS"),
      ruleKey: "bemAvgShoreA",
    });
    fields.push({
      path: "CARTON_AVERAGE_SHORE_A_HARDNESS",
      value: pick(values, "CARTON_AVERAGE_SHORE_A_HARDNESS"),
      ruleKey: "cartonAvgShoreA",
    });
    fields.push({
      path: "SUBSCALE_VISUAL_OBSERVATIONS",
      value: pick(values, "SUBSCALE_VISUAL_OBSERVATIONS"),
      ruleKey: "subscaleVisualObservations",
    });

    for (const [key, val] of Object.entries(values)) {
      const arr = asArray(val);
      if (!arr.length) continue;
      const sample = asRecord(arr[0]);
      if (!sample) continue;

      // Cycle rows
      if ("TEMPERATURE" in sample || "DURATION" in sample || "ACTUAL_DURATION" in sample) {
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({ path: `${key}.${i}.TEMPERATURE`, value: row.TEMPERATURE, ruleKey: "temperature" });
          fields.push({ path: `${key}.${i}.DURATION`, value: row.DURATION, ruleKey: "duration" });
          fields.push({ path: `${key}.${i}.START_DATE`, value: row.START_DATE, ruleKey: "startDate" });
          fields.push({ path: `${key}.${i}.START_TIME`, value: row.START_TIME, ruleKey: "startTime" });
          fields.push({ path: `${key}.${i}.END_DATE`, value: row.END_DATE, ruleKey: "endDate" });
          fields.push({ path: `${key}.${i}.END_TIME`, value: row.END_TIME, ruleKey: "endTime" });
          fields.push({
            path: `${key}.${i}.ACTUAL_DURATION`,
            value: row.ACTUAL_DURATION,
            ruleKey: "actualDuration",
          });
          fields.push({
            path: `${key}.${i}.PEAK_PRESSURE_ACHIEVED`,
            value: row.PEAK_PRESSURE_ACHIEVED,
            ruleKey: "peakPressure",
          });
          fields.push({ path: `${key}.${i}.REMARKS`, value: row.REMARKS, ruleKey: "cycleRemarks" });
        });
      }

      // Subscale parameter rows
      if ("BEM_NO" in sample || "WHEEL_PEEL_NO" in sample || "CONTROL_GRAIN_NO" in sample) {
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({ path: `${key}.${i}.BEM_NO`, value: row.BEM_NO, ruleKey: "bemNo" });
          fields.push({
            path: `${key}.${i}.WHEEL_PEEL_NO`,
            value: row.WHEEL_PEEL_NO,
            ruleKey: "wheelPeelNo",
          });
          fields.push({ path: `${key}.${i}.CARTON_NO`, value: row.CARTON_NO, ruleKey: "cartonNo" });
          fields.push({
            path: `${key}.${i}.CONTROL_GRAIN_NO`,
            value: row.CONTROL_GRAIN_NO,
            ruleKey: "controlGrainNo",
          });
        });
      }
    }

    return fields;
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    return Boolean(
      str(pick(values, "OVEN_NUMBER")) ||
        str(pick(values, "MOTOR_POSITIONING_DATE_TIME")) ||
        str(pick(values, "CURING_TYPE")),
    );
  },
};

export function toQcCuringValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcCuringValidationTarget {
  return { entryId, values: values ?? {} };
}
