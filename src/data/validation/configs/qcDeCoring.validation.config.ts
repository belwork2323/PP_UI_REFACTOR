import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";
import { toUiDateTime } from "@/data/models/user/castingCuringFieldCodec";

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

const dateTime = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "datetime",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcDeCoringValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcDeCoringValidationFields: Record<string, FieldRuleConfig> = {
  // Mandatory on SUBMIT only — draft/save uses FORMAT (no required checks)
  deCoringLoad: number(["SUBMIT"]),
  deCoringDateTime: dateTime(["SUBMIT"]),
  observations: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/** Resolve bare or section-scoped keys (`DE_CORING_DETAILS::DE_CORING_LOAD`). */
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

export const qcDeCoringValidationConfig: SubDeptValidationConfig<QcDeCoringValidationTarget> = {
  id: "qc-de-coring",
  fields: qcDeCoringValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    return [
      {
        path: "DE_CORING_LOAD",
        value: pickValue(values, "DE_CORING_LOAD"),
        ruleKey: "deCoringLoad",
      },
      {
        path: "DE_CORING_DATE_TIME",
        value: toUiDateTime(pickValue(values, "DE_CORING_DATE_TIME") ?? ""),
        ruleKey: "deCoringDateTime",
      },
      {
        path: "OBSERVATIONS",
        value: pickValue(values, "OBSERVATIONS"),
        ruleKey: "observations",
      },
    ];
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    return Boolean(
      str(pickValue(values, "DE_CORING_LOAD")) || str(pickValue(values, "DE_CORING_DATE_TIME")),
    );
  },
};

export function toQcDeCoringValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcDeCoringValidationTarget {
  return { entryId, values: values ?? {} };
}
