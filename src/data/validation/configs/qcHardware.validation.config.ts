
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

/** Stable UI / FieldErrorText prefixes — must match QCHardwareProcessPanel errorPrefix. */
export const QC_HARDWARE_ERROR_PREFIX = {
  FIRST_CUT: "FIRST_CUT",
  SECOND_CUT: "SECOND_CUT",
  PREHEATING: "PREHEATING_DETAILS",
  LINEAR_COATING: "LINEAR_COATING_DETAILS",
  VISUAL_OBSERVATIONS: "VISUAL_OBSERVATIONS",
} as const;

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
  // Abrading cut row (Case Prep abrading details — Date, Start, End, Qty of Dust)
  cutDate: date(["SUBMIT"]),
  cutStartTime: time(["SUBMIT"]),
  cutEndTime: time(["SUBMIT"]),
  dustQty: number(["SUBMIT"]),
  cutObservations: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Preheating (Case Prep pre-heating monitoring table subset)
  ovenNumber: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  buildingNo: text(["SUBMIT"], S.PATTERNS.BUILDING_CODE),
  temperature: number(["SUBMIT"]),
  vacuumLevel: number(["SUBMIT"]),

  // Linear coating (Case Prep liner application log subset)
  linerQty: number(["SUBMIT"]),
  insulationTemp: number(["SUBMIT"]),
  rh: number(["SUBMIT"]),

  // Dispatch (Case Prep dispatch punctures + datetime + visual observations)
  hePunctures: number(["SUBMIT"]),
  nePunctures: number(["SUBMIT"]),
  lfPunctures: number(["SUBMIT"]),
  dispatchDateTime: text(["SUBMIT"]),
  // Case Prep: dispatch visual observation notes are mandatory
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

const findTableRows = (
  values: Record<string, unknown>,
  tableIds: string[],
): Record<string, unknown>[] => {
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

const resolveAbradingPrefix = (key: string): string => {
  const upper = key.toUpperCase();
  if (upper.includes("SECOND")) return QC_HARDWARE_ERROR_PREFIX.SECOND_CUT;
  if (upper.includes("FIRST")) return QC_HARDWARE_ERROR_PREFIX.FIRST_CUT;
  if (upper.endsWith("::SECOND_CUT") || upper === "SECOND_CUT") {
    return QC_HARDWARE_ERROR_PREFIX.SECOND_CUT;
  }
  return QC_HARDWARE_ERROR_PREFIX.FIRST_CUT;
};

export const qcHardwareValidationConfig: SubDeptValidationConfig<QcHardwareValidationTarget> = {
  id: "qc-hardware",
  fields: qcHardwareValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];
    const sub = String(target.subType ?? "").toUpperCase();

    if (sub === "ABRADING") {
      const pushCut = (prefix: string, rows: Record<string, unknown>[]) => {
        const list = rows.length ? rows : [{}];
        list.forEach((row, i) => {
          fields.push({ path: `${prefix}.${i}.DATE`, value: row.DATE, ruleKey: "cutDate" });
          fields.push({
            path: `${prefix}.${i}.START_TIME`,
            value: row.START_TIME,
            ruleKey: "cutStartTime",
          });
          fields.push({
            path: `${prefix}.${i}.END_TIME`,
            value: row.END_TIME,
            ruleKey: "cutEndTime",
          });
          fields.push({
            path: `${prefix}.${i}.DUST_QTY`,
            value: row.DUST_QTY,
            ruleKey: "dustQty",
          });
          fields.push({
            path: `${prefix}.${i}.OBSERVATIONS`,
            value: row.OBSERVATIONS,
            ruleKey: "cutObservations",
          });
        });
      };

      const firstRows = findTableRows(values, [
        QC_HARDWARE_ERROR_PREFIX.FIRST_CUT,
        "ABRADING_FIRST_CUT",
        "QC_HARDWARE_ABRADING_FIRST_CUT",
      ]);
      const secondRows = findTableRows(values, [
        QC_HARDWARE_ERROR_PREFIX.SECOND_CUT,
        "ABRADING_SECOND_CUT",
        "QC_HARDWARE_ABRADING_SECOND_CUT",
      ]);

      if (firstRows.length || secondRows.length) {
        pushCut(QC_HARDWARE_ERROR_PREFIX.FIRST_CUT, firstRows);
        pushCut(QC_HARDWARE_ERROR_PREFIX.SECOND_CUT, secondRows);
        return fields;
      }

      // Fallback: detect cut-shaped arrays under scoped section keys
      let foundFirst = false;
      let foundSecond = false;
      for (const [key, val] of Object.entries(values)) {
        const arr = asArray(val);
        if (!arr.length) continue;
        const sample = asRecord(arr[0]);
        if (!sample || !("DUST_QTY" in sample || ("DATE" in sample && "START_TIME" in sample))) {
          continue;
        }
        const prefix = resolveAbradingPrefix(key);
        if (prefix === QC_HARDWARE_ERROR_PREFIX.SECOND_CUT) {
          if (foundSecond) continue;
          foundSecond = true;
        } else {
          if (foundFirst) continue;
          foundFirst = true;
        }
        pushCut(prefix, arr.map((r) => asRecord(r) ?? {}));
      }
      if (!foundFirst) pushCut(QC_HARDWARE_ERROR_PREFIX.FIRST_CUT, []);
      if (!foundSecond) pushCut(QC_HARDWARE_ERROR_PREFIX.SECOND_CUT, []);
      return fields;
    }

    if (sub === "PREHEATING") {
      const rows = findTableRows(values, [
        QC_HARDWARE_ERROR_PREFIX.PREHEATING,
        "PREHEATING",
        "QC_HARDWARE_PREHEATING",
      ]);
      const list =
        rows.length > 0
          ? rows
          : (() => {
              for (const [key, val] of Object.entries(values)) {
                const arr = asArray(val);
                if (!arr.length) continue;
                const sample = asRecord(arr[0]);
                if (sample && ("OVEN_NUMBER" in sample || "TEMPERATURE" in sample)) {
                  return arr.map((r) => asRecord(r) ?? {});
                }
              }
              return [{}] as Record<string, unknown>[];
            })();
      const prefix = QC_HARDWARE_ERROR_PREFIX.PREHEATING;
      list.forEach((row, i) => {
        fields.push({ path: `${prefix}.${i}.DATE`, value: row.DATE, ruleKey: "cutDate" });
        fields.push({
          path: `${prefix}.${i}.START_TIME`,
          value: row.START_TIME,
          ruleKey: "cutStartTime",
        });
        fields.push({
          path: `${prefix}.${i}.END_TIME`,
          value: row.END_TIME,
          ruleKey: "cutEndTime",
        });
        fields.push({
          path: `${prefix}.${i}.OVEN_NUMBER`,
          value: row.OVEN_NUMBER,
          ruleKey: "ovenNumber",
        });
        fields.push({
          path: `${prefix}.${i}.BUILDING_NO`,
          value: row.BUILDING_NO,
          ruleKey: "buildingNo",
        });
        fields.push({
          path: `${prefix}.${i}.TEMPERATURE`,
          value: row.TEMPERATURE,
          ruleKey: "temperature",
        });
        fields.push({
          path: `${prefix}.${i}.VACUUM_LEVEL`,
          value: row.VACUUM_LEVEL,
          ruleKey: "vacuumLevel",
        });
      });
      return fields;
    }

    if (sub === "LINEAR_COATING" || sub === "LINER_COATING") {
      const rows = findTableRows(values, [
        QC_HARDWARE_ERROR_PREFIX.LINEAR_COATING,
        "LINEAR_COATING",
        "LINER_COATING",
        "QC_HARDWARE_LINEAR_COATING",
      ]);
      const list =
        rows.length > 0
          ? rows
          : (() => {
              for (const [key, val] of Object.entries(values)) {
                const arr = asArray(val);
                if (!arr.length) continue;
                const sample = asRecord(arr[0]);
                if (sample && ("LINER_QTY" in sample || "INSULATION_TEMP" in sample)) {
                  return arr.map((r) => asRecord(r) ?? {});
                }
              }
              return [{}] as Record<string, unknown>[];
            })();
      const prefix = QC_HARDWARE_ERROR_PREFIX.LINEAR_COATING;
      list.forEach((row, i) => {
        fields.push({ path: `${prefix}.${i}.DATE`, value: row.DATE, ruleKey: "cutDate" });
        fields.push({
          path: `${prefix}.${i}.START_TIME`,
          value: row.START_TIME,
          ruleKey: "cutStartTime",
        });
        fields.push({
          path: `${prefix}.${i}.END_TIME`,
          value: row.END_TIME,
          ruleKey: "cutEndTime",
        });
        fields.push({
          path: `${prefix}.${i}.LINER_QTY`,
          value: row.LINER_QTY,
          ruleKey: "linerQty",
        });
        fields.push({
          path: `${prefix}.${i}.INSULATION_TEMP`,
          value: row.INSULATION_TEMP,
          ruleKey: "insulationTemp",
        });
        fields.push({ path: `${prefix}.${i}.RH`, value: row.RH, ruleKey: "rh" });
      });
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
        QC_HARDWARE_ERROR_PREFIX.VISUAL_OBSERVATIONS,
        "DISPATCH_VISUAL_OBSERVATIONS",
        "QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS",
      ]);
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
              return [{}] as Record<string, unknown>[];
            })();
      scopedVis.forEach((item, i) => {
        const row = asRecord(item) ?? {};
        fields.push({
          path: `${QC_HARDWARE_ERROR_PREFIX.VISUAL_OBSERVATIONS}.${i}.OBSERVATIONS`,
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
