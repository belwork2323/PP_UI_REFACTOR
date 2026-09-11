
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

const file = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "file",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcPostCureValidationTarget = {
  entryId?: string;
  subType?: string | null;
  inhibitorType?: string | null;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcPostCureValidationFields: Record<string, FieldRuleConfig> = {
  location: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  fromDate: date(["SUBMIT"]),
  toDate: date(["SUBMIT"]),
  batchNo: text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  preparationDate: date(["SUBMIT"]),
  specification: number(["SUBMIT"]),
  result: number(["SUBMIT"]),
  qtyFilled: number(["SUBMIT"]),
  qtyApplied: number(["SUBMIT"]),
  observations: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  qcReport: file(["SUBMIT"]),
  dispatchDate: date(["SUBMIT"]),
  dispatchStation: text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  remarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const walk = (
  node: unknown,
  path: string,
  fields: Array<{ path: string; value: unknown; ruleKey: string }>,
) => {
  const rec = asRecord(node);
  if (!rec) return;

  // Scalar known keys
  const scalarMap: Record<string, string> = {
    LF_EPOXY_BATCH_NO: "batchNo",
    IR1_BATCH_NO: "batchNo",
    HEMCOAT_3K_BATCH_NO: "batchNo",
    LF_EPOXY_PREPARATION_DATE: "preparationDate",
    IR1_PREPARATION_DATE: "preparationDate",
    HEMCOAT_3K_PREPARATION_DATE: "preparationDate",
    LF_EPOXY_QC_REPORT: "qcReport",
    IR1_QC_REPORT: "qcReport",
    HEMCOAT_3K_QC_REPORT: "qcReport",
    DISPATCH_DATE: "dispatchDate",
    DISPATCH_STATION: "dispatchStation",
    REMARKS: "remarks",
  };
  Object.entries(scalarMap).forEach(([key, ruleKey]) => {
    if (key in rec) {
      fields.push({ path: path ? `${path}.${key}` : key, value: rec[key], ruleKey });
    }
  });

  Object.entries(rec).forEach(([key, val]) => {
    const arr = asArray(val);
    if (!arr.length) {
      if (asRecord(val)) walk(val, path ? `${path}.${key}` : key, fields);
      return;
    }
    const sample = asRecord(arr[0]);
    if (!sample) return;

    if ("FROM_DATE" in sample || "TO_DATE" in sample || "QTY_FILLED" in sample || "QTY_APPLIED" in sample) {
      arr.forEach((item, i) => {
        const row = asRecord(item) ?? {};
        const base = `${path ? path + "." : ""}${key}.${i}`;
        fields.push({ path: `${base}.FROM_DATE`, value: row.FROM_DATE, ruleKey: "fromDate" });
        fields.push({ path: `${base}.TO_DATE`, value: row.TO_DATE, ruleKey: "toDate" });
        if ("QTY_FILLED" in row) {
          fields.push({ path: `${base}.QTY_FILLED`, value: row.QTY_FILLED, ruleKey: "qtyFilled" });
        }
        if ("QTY_APPLIED" in row) {
          fields.push({ path: `${base}.QTY_APPLIED`, value: row.QTY_APPLIED, ruleKey: "qtyApplied" });
        }
        fields.push({
          path: `${base}.OBSERVATIONS`,
          value: row.OBSERVATIONS,
          ruleKey: "observations",
        });
      });
    }

    if ("RESULT" in sample || "SPECIFICATION" in sample) {
      arr.forEach((item, i) => {
        const row = asRecord(item) ?? {};
        const base = `${path ? path + "." : ""}${key}.${i}`;
        fields.push({
          path: `${base}.SPECIFICATION`,
          value: row.SPECIFICATION,
          ruleKey: "specification",
        });
        fields.push({ path: `${base}.RESULT`, value: row.RESULT, ruleKey: "result" });
        if ("QC_REPORT" in row) {
          fields.push({ path: `${base}.QC_REPORT`, value: row.QC_REPORT, ruleKey: "qcReport" });
        }
      });
    }
  });
};

export const qcPostCureValidationConfig: SubDeptValidationConfig<QcPostCureValidationTarget> = {
  id: "qc-post-cure",
  fields: qcPostCureValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];
    walk(values, "", fields);
    return fields;
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    // Any batch no or from date filled
    const raw = JSON.stringify(values);
    return /BATCH_NO|FROM_DATE|DISPATCH_DATE/.test(raw) && /"[^"]{1,}"/.test(raw);
  },
};

export function toQcPostCureValidationTarget(
  values: SchemaFormValues | null | undefined,
  options?: { entryId?: string; subType?: string | null; inhibitorType?: string | null },
): QcPostCureValidationTarget {
  return {
    entryId: options?.entryId,
    subType: options?.subType,
    inhibitorType: options?.inhibitorType,
    values: values ?? {},
  };
}
