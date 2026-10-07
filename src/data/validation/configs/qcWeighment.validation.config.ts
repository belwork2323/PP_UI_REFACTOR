
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
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

/** `MOTOR_WEIGHT_DETAILS::MOTOR_WEIGHT_DETAILS` → `MOTOR_WEIGHT_DETAILS` (matches panel error paths). */
const sectionPathId = (formKey: string): string => {
  if (formKey.includes("::")) return formKey.split("::")[0] || formKey;
  return formKey;
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

    for (const [key, val] of Object.entries(values)) {
      const arr = asArray(val);
      if (!arr.length) continue;
      const sample = asRecord(arr[0]);
      if (!sample || !("WEIGHT_KG" in sample || "WEIGHT_PARAMETER" in sample)) continue;
      const sectionId = sectionPathId(key);
      arr.forEach((item, i) => {
        const row = asRecord(item) ?? {};
        // Computed propellant row (locked) — skip until a value is present.
        if (row.locked && !str(row.WEIGHT_KG)) return;
        fields.push({
          path: `${sectionId}.${i}.WEIGHT_KG`,
          value: row.WEIGHT_KG,
          ruleKey: "weightKg",
        });
      });
    }

    return fields;
  },
};

export function toQcWeighmentValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcWeighmentValidationTarget {
  return { entryId, values: values ?? {} };
}
