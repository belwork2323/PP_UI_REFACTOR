
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
  // Sheet: alphanumeric (letters, digits, - _ only)
  weighscaleNo: text(["UNIT", "SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  calibrationDueDate: date(["UNIT", "SUBMIT"]),
  weightKg: number(["SUBMIT"]),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const deepFindScalar = (node: unknown, keys: string[], depth = 0): unknown => {
  if (depth > 6 || node == null) return undefined;
  const rec = asRecord(node);
  if (!rec) return undefined;
  for (const k of keys) {
    if (k in rec && rec[k] != null) return rec[k];
  }
  for (const val of Object.values(rec)) {
    if (asRecord(val)) {
      const found = deepFindScalar(val, keys, depth + 1);
      if (found !== undefined) return found;
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
      value: deepFindScalar(values, ["WEIGHSCALE_NO", "weighscaleNo"]),
      ruleKey: "weighscaleNo",
    });
    fields.push({
      path: "CALIBRATION_DUE_DATE",
      value: deepFindScalar(values, ["CALIBRATION_DUE_DATE", "calibrationDueDate"]),
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
