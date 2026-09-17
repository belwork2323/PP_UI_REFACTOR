
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

/** Time stored as HH:mm text — validate non-empty + simple pattern on SUBMIT. */
const time = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  pattern: /^([01]?\d|2[0-3]):[0-5]\d$/,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcHardwareValidationTarget = {
  entryId?: string;
  subType: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcHardwareValidationFields: Record<string, FieldRuleConfig> = {
  // Abrading cut row (sheet: Date, Start, End, Qty of Dust)
  cutDate: date(["SUBMIT"]),
  cutStartTime: time(["SUBMIT"]),
  cutEndTime: time(["SUBMIT"]),
  dustQty: number(["SUBMIT"]),
  cutObservations: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Preheating (extra process)
  ovenNumber: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  buildingNo: text(["SUBMIT"], S.PATTERNS.BUILDING_CODE),
  temperature: number(["SUBMIT"]),
  vacuumLevel: number(["SUBMIT"]),

  // Linear coating
  linerQty: number(["SUBMIT"]),
  insulationTemp: number(["SUBMIT"]),
  rh: number(["SUBMIT"]),

  // Dispatch hardware unit
  hePunctures: number(["SUBMIT"]),
  nePunctures: number(["SUBMIT"]),
  lfPunctures: number(["SUBMIT"]),
  dispatchDateTime: text(["SUBMIT"]),
  visualObservations: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Resolve bare or section-scoped keys (`DISPATCH_DETAILS::HE_PUNCTURES`). */
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

const findTableRows = (values: Record<string, unknown>, tableIds: string[]): Record<string, unknown>[] => {
  for (const id of tableIds) {
    const direct = asArray(values[id]);
    if (direct.length) return direct.map((r) => asRecord(r) ?? {});
    for (const [key, value] of Object.entries(values)) {
      if (key === id || key.endsWith(`::${id}`)) {
        const arr = asArray(value);
        if (arr.length) return arr.map((r) => asRecord(r) ?? {});
      }
    }
  }
  return [];
};

export const qcHardwareValidationConfig: SubDeptValidationConfig<QcHardwareValidationTarget> = {
  id: "qc-hardware",
  fields: qcHardwareValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];
    const sub = String(target.subType ?? "").toUpperCase();

    if (sub === "ABRADING") {
      const tables = [
        { id: "FIRST_CUT", keys: ["ABRADING_FIRST_CUT", "FIRST_CUT", "QC_HARDWARE_ABRADING_FIRST_CUT"] },
        { id: "SECOND_CUT", keys: ["ABRADING_SECOND_CUT", "SECOND_CUT", "QC_HARDWARE_ABRADING_SECOND_CUT"] },
      ];
      // Prefer any array that looks like cut rows
      const pushCut = (prefix: string, rows: Record<string, unknown>[]) => {
        rows.forEach((row, i) => {
          fields.push({ path: `${prefix}.${i}.DATE`, value: row.DATE, ruleKey: "cutDate" });
          fields.push({ path: `${prefix}.${i}.START_TIME`, value: row.START_TIME, ruleKey: "cutStartTime" });
          fields.push({ path: `${prefix}.${i}.END_TIME`, value: row.END_TIME, ruleKey: "cutEndTime" });
          fields.push({ path: `${prefix}.${i}.DUST_QTY`, value: row.DUST_QTY, ruleKey: "dustQty" });
          fields.push({
            path: `${prefix}.${i}.OBSERVATIONS`,
            value: row.OBSERVATIONS,
            ruleKey: "cutObservations",
          });
        });
      };

      let found = false;
      for (const [key, val] of Object.entries(values)) {
        const arr = asArray(val);
        if (!arr.length) continue;
        const sample = asRecord(arr[0]);
        if (sample && ("DUST_QTY" in sample || ("DATE" in sample && "START_TIME" in sample))) {
          const prefix = key.toUpperCase().includes("SECOND") ? "SECOND_CUT" : key;
          pushCut(prefix, arr.map((r) => asRecord(r) ?? {}));
          found = true;
        }
      }
      if (!found) {
        fields.push({ path: "FIRST_CUT.0.DATE", value: "", ruleKey: "cutDate" });
      }
      return fields;
    }

    if (sub === "PREHEATING") {
      for (const [key, val] of Object.entries(values)) {
        const arr = asArray(val);
        if (!arr.length) continue;
        const sample = asRecord(arr[0]);
        if (sample && ("OVEN_NUMBER" in sample || "TEMPERATURE" in sample)) {
          arr.forEach((item, i) => {
            const row = asRecord(item) ?? {};
            fields.push({ path: `${key}.${i}.DATE`, value: row.DATE, ruleKey: "cutDate" });
            fields.push({ path: `${key}.${i}.START_TIME`, value: row.START_TIME, ruleKey: "cutStartTime" });
            fields.push({ path: `${key}.${i}.END_TIME`, value: row.END_TIME, ruleKey: "cutEndTime" });
            fields.push({ path: `${key}.${i}.OVEN_NUMBER`, value: row.OVEN_NUMBER, ruleKey: "ovenNumber" });
            fields.push({ path: `${key}.${i}.BUILDING_NO`, value: row.BUILDING_NO, ruleKey: "buildingNo" });
            fields.push({ path: `${key}.${i}.TEMPERATURE`, value: row.TEMPERATURE, ruleKey: "temperature" });
            fields.push({ path: `${key}.${i}.VACUUM_LEVEL`, value: row.VACUUM_LEVEL, ruleKey: "vacuumLevel" });
          });
        }
      }
      return fields;
    }

    if (sub === "LINEAR_COATING" || sub === "LINER_COATING") {
      for (const [key, val] of Object.entries(values)) {
        const arr = asArray(val);
        if (!arr.length) continue;
        const sample = asRecord(arr[0]);
        if (sample && ("LINER_QTY" in sample || "INSULATION_TEMP" in sample)) {
          arr.forEach((item, i) => {
            const row = asRecord(item) ?? {};
            fields.push({ path: `${key}.${i}.DATE`, value: row.DATE, ruleKey: "cutDate" });
            fields.push({ path: `${key}.${i}.START_TIME`, value: row.START_TIME, ruleKey: "cutStartTime" });
            fields.push({ path: `${key}.${i}.END_TIME`, value: row.END_TIME, ruleKey: "cutEndTime" });
            fields.push({ path: `${key}.${i}.LINER_QTY`, value: row.LINER_QTY, ruleKey: "linerQty" });
            fields.push({
              path: `${key}.${i}.INSULATION_TEMP`,
              value: row.INSULATION_TEMP,
              ruleKey: "insulationTemp",
            });
            fields.push({ path: `${key}.${i}.RH`, value: row.RH, ruleKey: "rh" });
          });
        }
      }
      return fields;
    }

    if (sub === "DISPATCH") {
      const hePunctures = pickValue(values, "HE_PUNCTURES");
      const nePunctures = pickValue(values, "NE_PUNCTURES");
      const lfPunctures = pickValue(values, "LF_PUNCTURES");
      const dispatchDateTime = pickValue(values, "DISPATCH_DATE_TIME");
      fields.push({ path: "HE_PUNCTURES", value: hePunctures, ruleKey: "hePunctures" });
      fields.push({ path: "NE_PUNCTURES", value: nePunctures, ruleKey: "nePunctures" });
      fields.push({ path: "LF_PUNCTURES", value: lfPunctures, ruleKey: "lfPunctures" });
      fields.push({
        path: "DISPATCH_DATE_TIME",
        value: dispatchDateTime,
        ruleKey: "dispatchDateTime",
      });
      const vis = findTableRows(values, [
        "VISUAL_OBSERVATIONS",
        "DISPATCH_VISUAL_OBSERVATIONS",
        "QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS",
      ]);
      // Also accept any ::-scoped visual observation table
      const scopedVis =
        vis.length > 0
          ? vis
          : (() => {
              for (const [key, value] of Object.entries(values)) {
                if (!key.toUpperCase().includes("VISUAL")) continue;
                const arr = asArray(value);
                if (!arr.length) continue;
                const sample = asRecord(arr[0]);
                if (sample && ("OBSERVATIONS" in sample || "PARAMETER" in sample)) {
                  return arr.map((r) => asRecord(r) ?? {});
                }
              }
              return [] as Record<string, unknown>[];
            })();
      scopedVis.forEach((item, i) => {
        const row = asRecord(item) ?? {};
        fields.push({
          path: `VISUAL_OBSERVATIONS.${i}.OBSERVATIONS`,
          value: row.OBSERVATIONS,
          ruleKey: "visualObservations",
        });
      });
    }

    return fields;
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    for (const val of Object.values(values)) {
      const arr = asArray(val);
      if (arr.some((item) => str(asRecord(item)?.DATE) || str(asRecord(item)?.DUST_QTY))) {
        return true;
      }
    }
    return Boolean(
      str(pickValue(values, "DISPATCH_DATE_TIME")) || str(pickValue(values, "HE_PUNCTURES")),
    );
  },
};

export function toQcHardwareValidationTarget(
  values: SchemaFormValues | null | undefined,
  subType: string,
  entryId?: string,
): QcHardwareValidationTarget {
  return { entryId, subType, values: values ?? {} };
}
