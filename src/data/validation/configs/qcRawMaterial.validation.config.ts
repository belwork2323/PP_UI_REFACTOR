
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { ALPHA_NUM, str } from "../fieldValidators";
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

/** Specs without a numeric bound (N/A / blank) → alphanumeric ACEM result; otherwise numeric. */
export function specificationImpliesNumeric(spec: unknown): boolean {
  const text = String(spec ?? "").trim();
  if (!text) return false;
  const normalized = text.replace(/\s+/g, " ").toLowerCase();
  if (
    normalized === "n/a" ||
    normalized === "na" ||
    normalized === "n.a." ||
    normalized === "n.a" ||
    normalized === "not applicable" ||
    normalized === "-" ||
    normalized === "—" ||
    normalized === "–"
  ) {
    return false;
  }
  return /\d/.test(text);
}

export function acemQcResultRuleKey(specification: unknown): "acemQcResult" | "acemQcResultAlphanumeric" {
  return specificationImpliesNumeric(specification) ? "acemQcResult" : "acemQcResultAlphanumeric";
}

export const qcRawMaterialValidationFields: Record<string, FieldRuleConfig> = {
  // Read-only lot ids from master (e.g. LOT-17) — allow hyphens
  // Read-only lot from master — required on submit; draft allows empty via FORMAT tier
  lotBatchNumber: text(["SUBMIT"], S.PATTERNS.MASTER_CODE),
  // Parameter / Specs come from material master (may include °C, @, µ, etc.) — no format pattern
  parameter: text(["SUBMIT"]),
  specification: text(["SUBMIT"]),
  // Analysed result may be non-numeric (e.g. Appearance "rough").
  result: text(["SUBMIT"]),
  // ACEM QC Result: numeric when specs have a range/bound; alphanumeric when N/A.
  // FORMAT validates type/pattern of filled values; SUBMIT also requires a value.
  acemQcResult: number(["SUBMIT"]),
  acemQcResultAlphanumeric: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    pattern: ALPHA_NUM,
    messages: {
      required: S.FIELD_REQUIRED,
      invalid: "Use letters, numbers, spaces, hyphens, underscores, or slashes only",
    },
  },
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
          ruleKey: acemQcResultRuleKey(row.SPECIFICATION),
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
