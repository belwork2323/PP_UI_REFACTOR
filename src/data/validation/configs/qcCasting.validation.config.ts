
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

export type QcCastingValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcCastingValidationFields: Record<string, FieldRuleConfig> = {
  castingType: text(["SUBMIT"]),
  assemblyDate: date(["SUBMIT"]),
  readingWithoutCup: number(["SUBMIT"]),
  readingWithBottomCup: number(["SUBMIT"]),

  dateOfCasting: date(["SUBMIT"]),
  rhPercent: number(["SUBMIT"]),
  vacuumMaintained: number(["SUBMIT"]),

  finalMixBowlNo: text(["SUBMIT"], S.PATTERNS.CASTING_BOWL_LABEL),
  propellantQty: number(["SUBMIT"]),
  initialUnloadingViscosity: number(["SUBMIT"]),
  castingStartTime: time(["SUBMIT"]),
  castingCompletionTime: time(["SUBMIT"]),
  slurryCastFromBowl: number(["SUBMIT"]),
  castingRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  loadCellInitial: number(["SUBMIT"]),
  loadCellFinal: number(["SUBMIT"]),
  totalWeight: number(["SUBMIT"]),

  soakingDuration: time(["SUBMIT"]),
  pressurePlateApplicable: text(["SUBMIT"]),
  pressureStartTime: time(["SUBMIT"]),
  pressureEndTime: time(["SUBMIT"]),
  pressureSensorId: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  initialPressureReading: number(["SUBMIT"]),
  pressureObservations: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
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

export const qcCastingValidationConfig: SubDeptValidationConfig<QcCastingValidationTarget> = {
  id: "qc-casting",
  fields: qcCastingValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    fields.push({
      path: "CASTING_TYPE",
      value: pick(values, "CASTING_TYPE", "TYPE_OF_CASTING", "castingType"),
      ruleKey: "castingType",
    });
    fields.push({
      path: "ASSEMBLY_DATE",
      value: pick(values, "ASSEMBLY_DATE", "FINAL_ASSEMBLY_DATE", "DATE"),
      ruleKey: "assemblyDate",
    });
    fields.push({
      path: "DATE_OF_CASTING",
      value: pick(values, "DATE_OF_CASTING"),
      ruleKey: "dateOfCasting",
    });
    fields.push({
      path: "RH_PERCENT",
      value: pick(values, "RH_PERCENT", "RH"),
      ruleKey: "rhPercent",
    });
    fields.push({
      path: "VACUUM_MAINTAINED",
      value: pick(values, "VACUUM_MAINTAINED"),
      ruleKey: "vacuumMaintained",
    });
    fields.push({
      path: "SOAKING_DURATION",
      value: pick(values, "SOAKING_DURATION"),
      ruleKey: "soakingDuration",
    });
    fields.push({
      path: "PRESSURE_PLATE_ASSEMBLY_REQUIRED",
      value: pick(values, "PRESSURE_PLATE_ASSEMBLY_REQUIRED"),
      ruleKey: "pressurePlateApplicable",
    });

    // Mandrel rows
    for (const [key, val] of Object.entries(values)) {
      const arr = asArray(val);
      if (!arr.length) continue;
      const sample = asRecord(arr[0]);
      if (sample && ("READING_WITHOUT_CUP" in sample || "READING_WITH_BOTTOM_CUP" in sample)) {
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({
            path: `${key}.${i}.READING_WITHOUT_CUP`,
            value: row.READING_WITHOUT_CUP,
            ruleKey: "readingWithoutCup",
          });
          fields.push({
            path: `${key}.${i}.READING_WITH_BOTTOM_CUP`,
            value: row.READING_WITH_BOTTOM_CUP,
            ruleKey: "readingWithBottomCup",
          });
        });
      }
      if (sample && ("FINAL_MIX_BOWL_NO" in sample || "PROPELLANT_QTY" in sample)) {
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({
            path: `${key}.${i}.FINAL_MIX_BOWL_NO`,
            value: row.FINAL_MIX_BOWL_NO,
            ruleKey: "finalMixBowlNo",
          });
          fields.push({
            path: `${key}.${i}.PROPELLANT_QTY`,
            value: row.PROPELLANT_QTY,
            ruleKey: "propellantQty",
          });
          fields.push({
            path: `${key}.${i}.INITIAL_UNLOADING_VISCOSITY`,
            value: row.INITIAL_UNLOADING_VISCOSITY,
            ruleKey: "initialUnloadingViscosity",
          });
          fields.push({
            path: `${key}.${i}.CASTING_START_TIME`,
            value: row.CASTING_START_TIME,
            ruleKey: "castingStartTime",
          });
          fields.push({
            path: `${key}.${i}.CASTING_COMPLETION_TIME`,
            value: row.CASTING_COMPLETION_TIME,
            ruleKey: "castingCompletionTime",
          });
          fields.push({
            path: `${key}.${i}.SLURRY_CAST_FROM_EACH_BOWL`,
            value: row.SLURRY_CAST_FROM_EACH_BOWL,
            ruleKey: "slurryCastFromBowl",
          });
          fields.push({
            path: `${key}.${i}.REMARKS`,
            value: row.REMARKS,
            ruleKey: "castingRemarks",
          });
        });
      }
      if (sample && ("LOAD_CELL_INITIAL" in sample || "TOTAL_WEIGHT" in sample)) {
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({
            path: `${key}.${i}.LOAD_CELL_INITIAL`,
            value: row.LOAD_CELL_INITIAL,
            ruleKey: "loadCellInitial",
          });
          fields.push({
            path: `${key}.${i}.LOAD_CELL_FINAL`,
            value: row.LOAD_CELL_FINAL,
            ruleKey: "loadCellFinal",
          });
          fields.push({
            path: `${key}.${i}.TOTAL_WEIGHT`,
            value: row.TOTAL_WEIGHT,
            ruleKey: "totalWeight",
          });
        });
      }
      if (sample && ("PRESSURE_SENSOR_USED" in sample || "INITIAL_PRESSURE_READING" in sample)) {
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({
            path: `${key}.${i}.START_TIME`,
            value: row.START_TIME,
            ruleKey: "pressureStartTime",
          });
          fields.push({
            path: `${key}.${i}.END_TIME`,
            value: row.END_TIME,
            ruleKey: "pressureEndTime",
          });
          fields.push({
            path: `${key}.${i}.PRESSURE_SENSOR_USED`,
            value: row.PRESSURE_SENSOR_USED,
            ruleKey: "pressureSensorId",
          });
          fields.push({
            path: `${key}.${i}.INITIAL_PRESSURE_READING`,
            value: row.INITIAL_PRESSURE_READING,
            ruleKey: "initialPressureReading",
          });
          fields.push({
            path: `${key}.${i}.OBSERVATIONS`,
            value: row.OBSERVATIONS,
            ruleKey: "pressureObservations",
          });
        });
      }
    }

    return fields;
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    return Boolean(
      str(pick(values, "DATE_OF_CASTING")) ||
        str(pick(values, "ASSEMBLY_DATE", "FINAL_ASSEMBLY_DATE")) ||
        str(pick(values, "RH_PERCENT")),
    );
  },
};

export function toQcCastingValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcCastingValidationTarget {
  return { entryId, values: values ?? {} };
}
