
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

export type QcWeighmentValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcWeighmentValidationFields: Record<string, FieldRuleConfig> = {
  // Mandatory on SUBMIT only — draft/save uses FORMAT (no required checks)
  weighscaleNo: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  calibrationDueDate: date(["SUBMIT"]),
  weightKg: number(["SUBMIT"]),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Resolve bare or section-scoped keys (`WEIGHTMENT_WEIGHSCALE_DETAILS::WEIGHSCALE_NO`). */
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

export const qcWeighmentValidationConfig: SubDeptValidationConfig<QcWeighmentValidationTarget> = {
  id: "qc-weighment",
  fields: qcWeighmentValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    fields.push({
      path: "WEIGHSCALE_NO",
      value: pickValue(values, "WEIGHSCALE_NO", "weighscaleNo"),
      ruleKey: "weighscaleNo",
    });
    fields.push({
      path: "CALIBRATION_DUE_DATE",
      value: pickValue(values, "CALIBRATION_DUE_DATE", "calibrationDueDate"),
      ruleKey: "calibrationDueDate",
    });

    const walkWeights = (node: unknown, prefix: string, depth = 0) => {
      if (depth > 6 || node == null) return;
      const arr = asArray(node);
      if (arr.length) {
        const sample = asRecord(arr[0]);
        if (sample && ("WEIGHT_KG" in sample || "WEIGHT_PARAMETER" in sample)) {
          arr.forEach((item, i) => {
            const row = asRecord(item) ?? {};
            if (row.locked && !str(row.WEIGHT_KG)) return;
            fields.push({
              path: `${prefix}.${i}.WEIGHT_KG`,
              value: row.WEIGHT_KG,
              ruleKey: "weightKg",
            });
          });
          return;
        }
      }
      const rec = asRecord(node);
      if (!rec) return;
      Object.entries(rec).forEach(([key, val]) => {
        walkWeights(val, prefix ? `${prefix}.${key}` : key, depth + 1);
      });
    };
    walkWeights(values, "");

    return fields;
  },
};

export function toQcWeighmentValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcWeighmentValidationTarget {
  return { entryId, values: values ?? {} };
}
