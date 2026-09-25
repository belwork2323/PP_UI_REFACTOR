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
  // HH:mm or HH:mm:ss (API hydrate often includes seconds)
  pattern: /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
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
  pressureSensorId: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  initialPressureReading: number(["SUBMIT"]),
  pressureObservations: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Resolve bare or section-scoped keys (`FINAL_ASSEMBLY::ASSEMBLY_DATE`). */
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

export const qcCastingValidationConfig: SubDeptValidationConfig<QcCastingValidationTarget> = {
  id: "qc-casting",
  fields: qcCastingValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    // Keep bare error paths so QCCastingMotorPanel err("ASSEMBLY_DATE") keeps working.
    fields.push({
      path: "CASTING_TYPE",
      value: pickValue(values, "CASTING_TYPE", "TYPE_OF_CASTING", "castingType"),
      ruleKey: "castingType",
    });
    fields.push({
      path: "ASSEMBLY_DATE",
      value: pickValue(values, "ASSEMBLY_DATE", "FINAL_ASSEMBLY_DATE", "DATE"),
      ruleKey: "assemblyDate",
    });
    fields.push({
      path: "DATE_OF_CASTING",
      value: pickValue(values, "DATE_OF_CASTING"),
      ruleKey: "dateOfCasting",
    });
    fields.push({
      path: "RH_PERCENT",
      value: pickValue(values, "RH_PERCENT", "RH"),
      ruleKey: "rhPercent",
    });
    fields.push({
      path: "VACUUM_MAINTAINED",
      value: pickValue(values, "VACUUM_MAINTAINED"),
      ruleKey: "vacuumMaintained",
    });
    fields.push({
      path: "SOAKING_DURATION",
      value: pickValue(values, "SOAKING_DURATION"),
      ruleKey: "soakingDuration",
    });
    fields.push({
      path: "PRESSURE_PLATE_ASSEMBLY_REQUIRED",
      value: pickValue(values, "PRESSURE_PLATE_ASSEMBLY_REQUIRED"),
      ruleKey: "pressurePlateApplicable",
    });

    // Table rows — error paths use block id prefix (matches CastingEditableTable errorPrefix).
    for (const [key, val] of Object.entries(values)) {
      const arr = asArray(val);
      if (!arr.length) continue;
      const sample = asRecord(arr[0]);
      if (!sample) continue;

      if ("READING_WITHOUT_CUP" in sample || "READING_WITH_BOTTOM_CUP" in sample) {
        const prefix = tableBlockId(key, "MANDREL_ASSEMBLY");
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({
            path: `${prefix}.${i}.READING_WITHOUT_CUP`,
            value: row.READING_WITHOUT_CUP,
            ruleKey: "readingWithoutCup",
          });
          fields.push({
            path: `${prefix}.${i}.READING_WITH_BOTTOM_CUP`,
            value: row.READING_WITH_BOTTOM_CUP,
            ruleKey: "readingWithBottomCup",
          });
        });
        continue;
      }

      if ("FINAL_MIX_BOWL_NO" in sample || "PROPELLANT_QTY" in sample) {
        const prefix = tableBlockId(key, "CASTING_TABLE");
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({
            path: `${prefix}.${i}.FINAL_MIX_BOWL_NO`,
            value: row.FINAL_MIX_BOWL_NO,
            ruleKey: "finalMixBowlNo",
          });
          fields.push({
            path: `${prefix}.${i}.PROPELLANT_QTY`,
            value: row.PROPELLANT_QTY,
            ruleKey: "propellantQty",
          });
          fields.push({
            path: `${prefix}.${i}.INITIAL_UNLOADING_VISCOSITY`,
            value: row.INITIAL_UNLOADING_VISCOSITY,
            ruleKey: "initialUnloadingViscosity",
          });
          fields.push({
            path: `${prefix}.${i}.CASTING_START_TIME`,
            value: row.CASTING_START_TIME,
            ruleKey: "castingStartTime",
          });
          fields.push({
            path: `${prefix}.${i}.CASTING_COMPLETION_TIME`,
            value: row.CASTING_COMPLETION_TIME,
            ruleKey: "castingCompletionTime",
          });
          fields.push({
            path: `${prefix}.${i}.SLURRY_CAST_FROM_EACH_BOWL`,
            value: row.SLURRY_CAST_FROM_EACH_BOWL,
            ruleKey: "slurryCastFromBowl",
          });
          fields.push({
            path: `${prefix}.${i}.REMARKS`,
            value: row.REMARKS,
            ruleKey: "castingRemarks",
          });
        });
        continue;
      }

      if ("LOAD_CELL_INITIAL" in sample || "TOTAL_WEIGHT" in sample) {
        const prefix = tableBlockId(key, "WEIGHTMENT_DETAILS");
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({
            path: `${prefix}.${i}.LOAD_CELL_INITIAL`,
            value: row.LOAD_CELL_INITIAL,
            ruleKey: "loadCellInitial",
          });
          fields.push({
            path: `${prefix}.${i}.LOAD_CELL_FINAL`,
            value: row.LOAD_CELL_FINAL,
            ruleKey: "loadCellFinal",
          });
          fields.push({
            path: `${prefix}.${i}.TOTAL_WEIGHT`,
            value: row.TOTAL_WEIGHT,
            ruleKey: "totalWeight",
          });
        });
        continue;
      }

      if ("PRESSURE_SENSOR_USED" in sample || "INITIAL_PRESSURE_READING" in sample) {
        const applicable = String(
          pickValue(values, "PRESSURE_PLATE_ASSEMBLY_REQUIRED") ?? "",
        )
          .trim()
          .toUpperCase();
        // Placeholder pressure rows exist even when assembly is No — skip unless YES.
        if (applicable !== "YES") continue;

        const prefix = tableBlockId(key, "PRESSURE_PLATE_DETAILS");
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          fields.push({
            path: `${prefix}.${i}.START_TIME`,
            value: row.START_TIME,
            ruleKey: "pressureStartTime",
          });
          fields.push({
            path: `${prefix}.${i}.END_TIME`,
            value: row.END_TIME,
            ruleKey: "pressureEndTime",
          });
          fields.push({
            path: `${prefix}.${i}.PRESSURE_SENSOR_USED`,
            value: row.PRESSURE_SENSOR_USED,
            ruleKey: "pressureSensorId",
          });
          fields.push({
            path: `${prefix}.${i}.INITIAL_PRESSURE_READING`,
            value: row.INITIAL_PRESSURE_READING,
            ruleKey: "initialPressureReading",
          });
          fields.push({
            path: `${prefix}.${i}.OBSERVATIONS`,
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
      str(pickValue(values, "DATE_OF_CASTING")) ||
        str(pickValue(values, "ASSEMBLY_DATE", "FINAL_ASSEMBLY_DATE")) ||
        str(pickValue(values, "RH_PERCENT")),
    );
  },
};

export function toQcCastingValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcCastingValidationTarget {
  return { entryId, values: values ?? {} };
}
