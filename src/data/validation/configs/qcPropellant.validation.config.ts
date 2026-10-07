
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
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
  // Specs allow ranges/tolerances (e.g. "99 - 100") — Mixing / manufacturing Post Cure parity.
  specification: text(["SUBMIT"], S.PATTERNS.SPECIFICATION_WITH_TOLERANCE),
  /** Every FM sample column is required on SUBMIT. */
  fmValue: number(["SUBMIT"]),
  avg: number(["SUBMIT"]),
  stdDev: number(["SUBMIT"]),
  /** Std Dev is blank with a single FM sample (auto-stat); format-only until ≥2 samples. */
  stdDevOptional: number([]),
  remarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  ballisticSpec: text(["SUBMIT"], S.PATTERNS.SPECIFICATION_WITH_TOLERANCE),
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
          // Skip aggregate rows only — `locked` marks SSBR property labels, not skipped validation.
          if (row.kind === "mean" || row.kind === "std") return;
          const base = `${sectionId}.${i}`;

          fields.push({
            path: `${base}.SPECIFICATION`,
            value: row.SPECIFICATION,
            ruleKey: "specification",
          });

          const fmCols = sortFmCols(Object.keys(row).filter(isFmColumn));
          const filledFmCount = fmCols.filter((col) => str(row[col])).length;
          fmCols.forEach((col) => {
            // All FM columns are required on SUBMIT (headers show asterisk on every FM).
            fields.push({
              path: `${base}.${col}`,
              value: row[col],
              ruleKey: "fmValue",
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
              // Auto-stat leaves STD blank with a single sample.
              ruleKey: filledFmCount >= 2 ? "stdDev" : "stdDevOptional",
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
