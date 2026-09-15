
import type { SchemaFormValues } from "@/schema-engine";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

const text = (
  requiredIn: ValidationTier[],
  pattern?: RegExp,
): FieldRuleConfig => ({
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

export type QcRawMaterialValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcRawMaterialValidationFields: Record<string, FieldRuleConfig> = {
  lotBatchNumber: text(["UNIT", "SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  parameter: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  specification: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  result: number(["FORMAT", "SUBMIT"]),
  acemQcResult: number(["FORMAT", "SUBMIT"]),
  validity: date(["SUBMIT"]),
  remarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  qcCertificate: file([]),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const extractRows = (
  values: Record<string, unknown>,
): Array<{ index: number; row: Record<string, unknown> }> => {
  let source: unknown[] = [];
  if (Array.isArray(values.materials) && values.materials.length) source = values.materials;
  else if (Array.isArray(values.rows) && values.rows.length) source = values.rows;
  else if (Array.isArray(values.revalidationRows) && values.revalidationRows.length)
    source = values.revalidationRows;
  else {
    for (const v of Object.values(values)) {
      if (
        Array.isArray(v) &&
        v.some(
          (item) =>
            asRecord(item)?.PARAMETER != null ||
            asRecord(item)?.LOT_BATCH_NUMBER != null ||
            asRecord(item)?._rowRole != null,
        )
      ) {
        source = v;
        break;
      }
    }
  }

  const out: Array<{ index: number; row: Record<string, unknown> }> = [];
  source.forEach((item, index) => {
    const row = asRecord(item);
    if (!row) return;
    if (String(row._rowRole ?? "") === "picker") return;
    out.push({ index, row });
  });
  return out;
};

export const qcRawMaterialValidationConfig: SubDeptValidationConfig<QcRawMaterialValidationTarget> =
  {
    id: "qc-raw-material",
    fields: qcRawMaterialValidationFields,
    resolveFieldPaths: (target) => {
      const values = asRecord(target.values) ?? {};
      const rows = extractRows(values);
      const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

      if (rows.length === 0) {
        fields.push({ path: "materials", value: "", ruleKey: "lotBatchNumber" });
        return fields;
      }

      const seenGroups = new Set<string>();
      rows.forEach(({ index, row }) => {
        const groupId = String(row._groupId ?? `row-${index}`);
        if (!seenGroups.has(groupId)) {
          seenGroups.add(groupId);
          fields.push({
            path: `rows.${index}.LOT_BATCH_NUMBER`,
            value: row.LOT_BATCH_NUMBER,
            ruleKey: "lotBatchNumber",
          });
        }

        const role = String(row._rowRole ?? "");
        if (role && role !== "expanded") return;

        fields.push({
          path: `rows.${index}.PARAMETER`,
          value: row.PARAMETER,
          ruleKey: "parameter",
        });
        fields.push({
          path: `rows.${index}.SPECIFICATION`,
          value: row.SPECIFICATION,
          ruleKey: "specification",
        });
        fields.push({
          path: `rows.${index}.RESULT`,
          value: row.RESULT,
          ruleKey: "result",
        });
        fields.push({
          path: `rows.${index}.ACEM_QC_RESULT`,
          value: row.ACEM_QC_RESULT,
          ruleKey: "acemQcResult",
        });
        fields.push({
          path: `rows.${index}.VALIDITY`,
          value: row.VALIDITY,
          ruleKey: "validity",
        });
        fields.push({
          path: `rows.${index}.REMARKS`,
          value: row.REMARKS,
          ruleKey: "remarks",
        });
      });

      seenGroups.clear();
      rows.forEach(({ index, row }) => {
        const groupId = String(row._groupId ?? `row-${index}`);
        if (seenGroups.has(groupId)) return;
        seenGroups.add(groupId);
        fields.push({
          path: `rows.${index}.QC_CERTIFICATE`,
          value: row.QC_CERTIFICATE,
          ruleKey: "qcCertificate",
        });
      });

      return fields;
    },
    isUnitComplete: (target) => {
      const values = asRecord(target.values) ?? {};
      const rows = extractRows(values);
      if (rows.length === 0) return false;
      return rows.some(({ row }) => Boolean(str(row.LOT_BATCH_NUMBER)));
    },
  };

export function toQcRawMaterialValidationTarget(
  values: SchemaFormValues | Record<string, unknown> | null | undefined,
  entryId?: string,
): QcRawMaterialValidationTarget {
  return {
    entryId,
    values: (values as SchemaFormValues) ?? {},
  };
}
