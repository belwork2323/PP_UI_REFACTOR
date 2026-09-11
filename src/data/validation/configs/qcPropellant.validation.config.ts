
import type { SchemaFormValues } from "@/schema-engine";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

const number = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "number",
  requiredIn,
  pattern: S.PATTERNS.FLOAT,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const text = (requiredIn: ValidationTier[], pattern?: RegExp): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  pattern,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcPropellantValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcPropellantValidationFields: Record<string, FieldRuleConfig> = {
  specification: number(["SUBMIT"]),
  fmValue: number(["SUBMIT"]),
  avg: number(["SUBMIT"]),
  stdDev: number(["SUBMIT"]),
  remarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  ballisticSpec: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  ballisticValue: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const isFmColumn = (key: string) =>
  /^FM[_-]?\d+/i.test(key) || /^BEM/i.test(key) || key.startsWith("FM_");

export const qcPropellantValidationConfig: SubDeptValidationConfig<QcPropellantValidationTarget> = {
  id: "qc-propellant",
  fields: qcPropellantValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    const walkSection = (sectionKey: string, sectionVal: unknown) => {
      const section = asRecord(sectionVal);
      if (!section) return;

      // Property-style rows
      for (const [key, val] of Object.entries(section)) {
        const arr = asArray(val);
        if (!arr.length) continue;
        const sample = asRecord(arr[0]);
        if (!sample) continue;

        if ("PROPERTY" in sample || "SPECIFICATION" in sample) {
          arr.forEach((item, i) => {
            const row = asRecord(item) ?? {};
            if (row.kind === "mean" || row.kind === "std") return;
            const base = `${sectionKey}.${key}.${i}`;
            fields.push({
              path: `${base}.SPECIFICATION`,
              value: row.SPECIFICATION,
              ruleKey: "specification",
            });
            Object.keys(row).forEach((col) => {
              if (isFmColumn(col)) {
                fields.push({ path: `${base}.${col}`, value: row[col], ruleKey: "fmValue" });
              }
            });
            if ("AVG" in row || "AVERAGE" in row) {
              fields.push({
                path: `${base}.AVG`,
                value: row.AVG ?? row.AVERAGE,
                ruleKey: "avg",
              });
            }
            if ("STD_DEV" in row || "STD" in row) {
              fields.push({
                path: `${base}.STD_DEV`,
                value: row.STD_DEV ?? row.STD,
                ruleKey: "stdDev",
              });
            }
            if ("REMARKS" in row) {
              fields.push({ path: `${base}.REMARKS`, value: row.REMARKS, ruleKey: "remarks" });
            }
          });
        }

        // Ballistic rows
        if ("DETAILS" in sample) {
          arr.forEach((item, i) => {
            const row = asRecord(item) ?? {};
            const base = `${sectionKey}.${key}.${i}`;
            fields.push({
              path: `${base}.SPECIFICATION`,
              value: row.SPECIFICATION,
              ruleKey: "ballisticSpec",
            });
            Object.keys(row).forEach((col) => {
              if (col === "DETAILS" || col === "SPECIFICATION" || col === "SR_NO") return;
              if (typeof row[col] === "object") return;
              fields.push({ path: `${base}.${col}`, value: row[col], ruleKey: "ballisticValue" });
            });
          });
        }
      }
    };

    // Top-level may already be sections or nested under division keys
    for (const [key, val] of Object.entries(values)) {
      if (asArray(val).length) {
        // treat whole values as one section bag
        walkSection("", values);
        break;
      }
      walkSection(key, val);
    }

    // Also walk root if property rows live at top level
    walkSection("root", values);

    return fields;
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    const raw = JSON.stringify(values);
    return /SPECIFICATION|PROPERTY|FM_/.test(raw);
  },
};

export function toQcPropellantValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcPropellantValidationTarget {
  return { entryId, values: values ?? {} };
}
