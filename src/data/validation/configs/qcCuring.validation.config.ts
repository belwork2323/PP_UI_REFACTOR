import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";
import { normalizeVisualObservations } from "@/hooks/user/qualityControl/qcCuringTables";
import { toUiDateTime, toUiTime } from "@/data/models/user/castingCuringFieldCodec";

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
  // HH:mm or HH:mm:ss (API hydrate often includes seconds)
  pattern: /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

/** UI `DD-MM-YYYY HH:mm` or ISO local — uses isValidUiDateTime. */
const dateTime = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "datetime",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcCuringValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcCuringValidationFields: Record<string, FieldRuleConfig> = {
  // Motor setup (sheet: type, oven no, positioning datetime)
  // Mandatory on SUBMIT only — draft/save uses FORMAT (no required checks)
  curingType: text(["SUBMIT"]),
  ovenNumber: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  motorPositioningDateTime: dateTime(["SUBMIT"]),

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
  pressurePlateRemovalDateTime: dateTime([]),
  shoreAHardness: number(["SUBMIT"]),
  dispatchDateTime: dateTime(["SUBMIT"]),

  // Subscale parameters
  bemNo: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  wheelPeelNo: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  cartonNo: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  controlGrainNo: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  curingStartDate: date(["SUBMIT"]),
  cycleStartTime: time(["SUBMIT"]),
  curingCompleteDate: date(["SUBMIT"]),
  cycleEndTime: time(["SUBMIT"]),
  bemAvgShoreA: number(["SUBMIT"]),
  cartonAvgShoreA: number(["SUBMIT"]),
  // Labelled “(if any)” in UI
  subscaleVisualObservations: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Resolve bare or section-scoped keys (`CURING_MOTOR_SETUP::MOTOR_POSITIONING_DATE_TIME`). */
const pickValue = (values: Record<string, unknown>, ...fieldIds: string[]): unknown => {
  for (const id of fieldIds) {
    if (values[id] !== undefined && values[id] !== null) return values[id];
  }
  for (const [key, value] of Object.entries(values)) {
    for (const id of fieldIds) {
      if (key === id || key.endsWith(`::${id}`)) return value;
    }
  }
  return undefined;
};

const tableBlockId = (formKey: string, fallback: string): string => {
  const parts = formKey.split("::");
  return parts.length > 1 ? parts[parts.length - 1]! : fallback;
};

const rowHasUserData = (row: Record<string, unknown>) =>
  Object.entries(row).some(([key, value]) => key !== "SR_NO" && Boolean(str(value)));

const subscaleSectionHasData = (values: Record<string, unknown>) =>
  Boolean(
    str(pickValue(values, "CURING_START_DATE")) ||
      str(pickValue(values, "CYCLE_START_TIME")) ||
      str(pickValue(values, "CURING_COMPLETE_DATE")) ||
      str(pickValue(values, "CYCLE_END_TIME")) ||
      str(pickValue(values, "BEM_AVERAGE_SHORE_A_HARDNESS")) ||
      str(pickValue(values, "CARTON_AVERAGE_SHORE_A_HARDNESS")) ||
      str(pickValue(values, "SUBSCALE_VISUAL_OBSERVATIONS")) ||
      Object.entries(values).some(([key, val]) => {
        if (!key.toUpperCase().includes("CURING_PARAMETER_TABLE")) return false;
        return asArray(val).some((item) => rowHasUserData(asRecord(item) ?? {}));
      }),
  );

export const qcCuringValidationConfig: SubDeptValidationConfig<QcCuringValidationTarget> = {
  id: "qc-curing",
  fields: qcCuringValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];
    const includeSubscale = subscaleSectionHasData(values);

    // Bare error paths so QCCuringMotorPanel err("MOTOR_POSITIONING_DATE_TIME") keeps working.
    fields.push({
      path: "CURING_TYPE",
      value: pickValue(values, "CURING_TYPE", "TYPE_OF_CURING"),
      ruleKey: "curingType",
    });
    fields.push({
      path: "OVEN_NUMBER",
      value: pickValue(values, "OVEN_NUMBER"),
      ruleKey: "ovenNumber",
    });
    fields.push({
      path: "MOTOR_POSITIONING_DATE_TIME",
      value: toUiDateTime(pickValue(values, "MOTOR_POSITIONING_DATE_TIME")),
      ruleKey: "motorPositioningDateTime",
    });

    fields.push({
      path: "VISUAL_OBSERVATIONS",
      value: normalizeVisualObservations(pickValue(values, "VISUAL_OBSERVATIONS")),
      ruleKey: "visualObservations",
    });
    fields.push({
      path: "PRESSURE_PLATE_REMOVAL_DATE_TIME",
      value: toUiDateTime(pickValue(values, "PRESSURE_PLATE_REMOVAL_DATE_TIME")),
      ruleKey: "pressurePlateRemovalDateTime",
    });
    fields.push({
      path: "SHORE_A_HARDNESS",
      value: pickValue(values, "SHORE_A_HARDNESS"),
      ruleKey: "shoreAHardness",
    });
    fields.push({
      path: "DISPATCH_DATE_TIME",
      value: toUiDateTime(pickValue(values, "DISPATCH_DATE_TIME")),
      ruleKey: "dispatchDateTime",
    });

    if (includeSubscale) {
      fields.push({
        path: "CURING_START_DATE",
        value: pickValue(values, "CURING_START_DATE"),
        ruleKey: "curingStartDate",
      });
      fields.push({
        path: "CYCLE_START_TIME",
        value: toUiTime(pickValue(values, "CYCLE_START_TIME")),
        ruleKey: "cycleStartTime",
      });
      fields.push({
        path: "CURING_COMPLETE_DATE",
        value: pickValue(values, "CURING_COMPLETE_DATE"),
        ruleKey: "curingCompleteDate",
      });
      fields.push({
        path: "CYCLE_END_TIME",
        value: toUiTime(pickValue(values, "CYCLE_END_TIME")),
        ruleKey: "cycleEndTime",
      });
      fields.push({
        path: "BEM_AVERAGE_SHORE_A_HARDNESS",
        value: pickValue(values, "BEM_AVERAGE_SHORE_A_HARDNESS"),
        ruleKey: "bemAvgShoreA",
      });
      fields.push({
        path: "CARTON_AVERAGE_SHORE_A_HARDNESS",
        value: pickValue(values, "CARTON_AVERAGE_SHORE_A_HARDNESS"),
        ruleKey: "cartonAvgShoreA",
      });
      fields.push({
        path: "SUBSCALE_VISUAL_OBSERVATIONS",
        value: normalizeVisualObservations(pickValue(values, "SUBSCALE_VISUAL_OBSERVATIONS")),
        ruleKey: "subscaleVisualObservations",
      });
    }

    for (const [key, val] of Object.entries(values)) {
      const arr = asArray(val);
      if (!arr.length) continue;
      const sample = asRecord(arr[0]);
      if (!sample) continue;

      // Empty placeholder rows for pressure curing (PEAK_PRESSURE/TEMPERATURE/TIME) must not
      // be validated as curing-cycle rows — they share TEMPERATURE and were falsely required.
      const keyUpper = key.toUpperCase();
      if (keyUpper.includes("PRESSURE_CURING_DETAILS")) {
        continue;
      }
      const isPressureOnlyRow =
        "PEAK_PRESSURE" in sample &&
        !("DURATION" in sample) &&
        !("ACTUAL_DURATION" in sample) &&
        !("START_DATE" in sample);
      if (isPressureOnlyRow) {
        continue;
      }

      if ("TEMPERATURE" in sample || "DURATION" in sample || "ACTUAL_DURATION" in sample) {
        const prefix = tableBlockId(key, "CURING_CYCLE_DETAILS");
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          // Skip empty placeholder cycle rows (API sanitize drops them too).
          if (!rowHasUserData(row) && arr.length > 1) return;
          fields.push({
            path: `${prefix}.${i}.TEMPERATURE`,
            value: row.TEMPERATURE,
            ruleKey: "temperature",
          });
          fields.push({
            path: `${prefix}.${i}.DURATION`,
            value: row.DURATION,
            ruleKey: "duration",
          });
          fields.push({
            path: `${prefix}.${i}.START_DATE`,
            value: row.START_DATE,
            ruleKey: "startDate",
          });
          fields.push({
            path: `${prefix}.${i}.START_TIME`,
            value: toUiTime(row.START_TIME),
            ruleKey: "startTime",
          });
          fields.push({
            path: `${prefix}.${i}.END_DATE`,
            value: row.END_DATE,
            ruleKey: "endDate",
          });
          fields.push({
            path: `${prefix}.${i}.END_TIME`,
            value: toUiTime(row.END_TIME),
            ruleKey: "endTime",
          });
          fields.push({
            path: `${prefix}.${i}.ACTUAL_DURATION`,
            value: row.ACTUAL_DURATION,
            ruleKey: "actualDuration",
          });
          fields.push({
            path: `${prefix}.${i}.PEAK_PRESSURE_ACHIEVED`,
            value: row.PEAK_PRESSURE_ACHIEVED,
            ruleKey: "peakPressure",
          });
          fields.push({
            path: `${prefix}.${i}.REMARKS`,
            value: row.REMARKS,
            ruleKey: "cycleRemarks",
          });
        });
        continue;
      }

      if (
        includeSubscale &&
        ("BEM_NO" in sample || "WHEEL_PEEL_NO" in sample || "CONTROL_GRAIN_NO" in sample)
      ) {
        const prefix = tableBlockId(key, "CURING_PARAMETER_TABLE");
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          if (!rowHasUserData(row) && arr.length > 1) return;
          fields.push({
            path: `${prefix}.${i}.BEM_NO`,
            value: row.BEM_NO,
            ruleKey: "bemNo",
          });
          fields.push({
            path: `${prefix}.${i}.WHEEL_PEEL_NO`,
            value: row.WHEEL_PEEL_NO,
            ruleKey: "wheelPeelNo",
          });
          fields.push({
            path: `${prefix}.${i}.CARTON_NO`,
            value: row.CARTON_NO,
            ruleKey: "cartonNo",
          });
          fields.push({
            path: `${prefix}.${i}.CONTROL_GRAIN_NO`,
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
      str(pickValue(values, "OVEN_NUMBER")) ||
        str(pickValue(values, "MOTOR_POSITIONING_DATE_TIME")) ||
        str(pickValue(values, "CURING_TYPE")),
    );
  },
};

export function toQcCuringValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcCuringValidationTarget {
  return { entryId, values: values ?? {} };
}
