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

export type QcDeCoringValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcDeCoringValidationFields: Record<string, FieldRuleConfig> = {
  deCoringLoad: number(["UNIT", "SUBMIT"]),
  deCoringDateTime: text(["UNIT", "SUBMIT"]),
  observations: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const pick = (values: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) {
    if (values[k] !== undefined && values[k] !== null) return values[k];
  }
  return undefined;
};

export const qcDeCoringValidationConfig: SubDeptValidationConfig<QcDeCoringValidationTarget> = {
  id: "qc-de-coring",
  fields: qcDeCoringValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    return [
      {
        path: "DE_CORING_LOAD",
        value: pick(values, "DE_CORING_LOAD"),
        ruleKey: "deCoringLoad",
      },
      {
        path: "DE_CORING_DATE_TIME",
        value: pick(values, "DE_CORING_DATE_TIME"),
        ruleKey: "deCoringDateTime",
      },
      {
        path: "OBSERVATIONS",
        value: pick(values, "OBSERVATIONS"),
        ruleKey: "observations",
      },
    ];
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    return Boolean(str(pick(values, "DE_CORING_LOAD")) || str(pick(values, "DE_CORING_DATE_TIME")));
  },
};

export function toQcDeCoringValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcDeCoringValidationTarget {
  return { entryId, values: values ?? {} };
}
