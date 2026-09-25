
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
  // Mandatory on SUBMIT only — draft/save uses FORMAT (no required checks)
  specification: number(["SUBMIT"]),
  /** At least one FM sample value per row. */
  fmValue: number(["SUBMIT"]),
  /** Extra FM columns beyond the first filled sample — format only. */
  fmValueOptional: number([]),
  avg: number(["SUBMIT"]),
  stdDev: number(["SUBMIT"]),
  remarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  ballisticSpec: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  // Ballistic FM/BEM cells are optional notes-style values (UI has no required asterisks)
  ballisticValue: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const isFmColumn = (key: string) =>
  /^FM[_-]?\d+/i.test(key) || /^BEM/i.test(key) || key.startsWith("FM_");

/** `MECHANICAL_PROPERTIES::MECHANICAL_PROPERTIES` → `MECHANICAL_PROPERTIES` (matches panel error paths). */
const sectionPathId = (formKey: string): string => {
  if (formKey.includes("::")) return formKey.split("::")[0] || formKey;
  return formKey;
};

const sortFmCols = (cols: string[]) =>
  [...cols].sort((a, b) => {
    const na = Number(String(a).match(/\d+/)?.[0] ?? 0);
    const nb = Number(String(b).match(/\d+/)?.[0] ?? 0);
    return na - nb || a.localeCompare(b);
  });

export const qcPropellantValidationConfig: SubDeptValidationConfig<QcPropellantValidationTarget> = {
  id: "qc-propellant",
  fields: qcPropellantValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    for (const [key, val] of Object.entries(values)) {
      const arr = asArray(val);
      if (!arr.length) continue;
      const sample = asRecord(arr[0]);
      if (!sample) continue;

      const sectionId = sectionPathId(key);

      if ("PROPERTY" in sample || "SPECIFICATION" in sample) {
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          if (row.kind === "mean" || row.kind === "std" || row.locked) return;
          const base = `${sectionId}.${i}`;

          fields.push({
            path: `${base}.SPECIFICATION`,
            value: row.SPECIFICATION,
            ruleKey: "specification",
          });

          const fmCols = sortFmCols(Object.keys(row).filter(isFmColumn));
          const hasAnyFm = fmCols.some((col) => str(row[col]));
          fmCols.forEach((col) => {
            const filled = Boolean(str(row[col]));
            // Require values until at least one FM is present; empty extras stay optional.
            fields.push({
              path: `${base}.${col}`,
              value: row[col],
              ruleKey: filled || !hasAnyFm ? "fmValue" : "fmValueOptional",
            });
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
        continue;
      }

      if ("DETAILS" in sample) {
        arr.forEach((item, i) => {
          const row = asRecord(item) ?? {};
          if (row.locked) return;
          const base = `${sectionId}.${i}`;
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
