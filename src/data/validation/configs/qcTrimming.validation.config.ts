/**
 * QC Division — Trimming (sheet rows 96–104).
 * Reuses manufacturing trimming session shape via getTrimmingSessionFromValues.
 */

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

const date = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const text = (requiredIn: ValidationTier[], pattern?: RegExp): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  pattern,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcTrimmingValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcTrimmingValidationFields: Record<string, FieldRuleConfig> = {
  motorReceivedAt: date(["UNIT", "SUBMIT"]),
  dimension: number(["SUBMIT"]),
  specified: number(["SUBMIT"]),
  measurementStage: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  reading: number(["SUBMIT"]), // R2T, R2B, R1R, R1L — cross-check with spec on SUBMIT via custom optional
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export const qcTrimmingValidationConfig: SubDeptValidationConfig<QcTrimmingValidationTarget> = {
  id: "qc-trimming",
  fields: qcTrimmingValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    fields.push({
      path: "motorReceivedAt",
      value: values.motorReceivedAt ?? values.MOTOR_RECEIVED_AT,
      ruleKey: "motorReceivedAt",
    });

    const details = asArray(values.trimmingDetails ?? values.TRIMMING_DETAILS);
    details.forEach((item, i) => {
      const row = asRecord(item) ?? {};
      fields.push({
        path: `trimmingDetails.${i}.dimension`,
        value: row.dimension ?? row.DIMENSION,
        ruleKey: "dimension",
      });
      fields.push({
        path: `trimmingDetails.${i}.specified`,
        value: row.specified ?? row.SPECIFIED,
        ruleKey: "specified",
      });
      fields.push({
        path: `trimmingDetails.${i}.measurementStage`,
        value: row.measurementStage ?? row.MEASUREMENT_STAGE,
        ruleKey: "measurementStage",
      });
    });

    const params = asArray(values.commonFormatParameters ?? values.COMMON_FORMAT_PARAMETERS);
    params.forEach((param, pIndex) => {
      const p = asRecord(param) ?? {};
      const stages = asArray(p.stages);
      stages.forEach((stage, sIndex) => {
        const st = asRecord(stage) ?? {};
        const readings = asRecord(st.readings) ?? {};
        Object.entries(readings).forEach(([key, val]) => {
          fields.push({
            path: `commonFormatParameters.${pIndex}.stages.${sIndex}.readings.${key}`,
            value: val,
            ruleKey: "reading",
          });
        });
      });
    });

    return fields;
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    return Boolean(str(values.motorReceivedAt ?? values.MOTOR_RECEIVED_AT));
  },
};

export function toQcTrimmingValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcTrimmingValidationTarget {
  return { entryId, values: values ?? {} };
}
