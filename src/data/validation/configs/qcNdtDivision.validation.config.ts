
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

const file = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "file",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcNdtDivisionValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcNdtDivisionValidationFields: Record<string, FieldRuleConfig> = {
  machineNo: text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  noOfSections: number(["SUBMIT"]),
  noOfOrientations: number(["SUBMIT"]),
  normalExposures: number(["SUBMIT"]),
  tangentialExposures: number(["SUBMIT"]),
  typeOfDefect: text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  observations: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  location: text([], S.PATTERNS.ALPHANUMERIC),
  visualObservation: text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  uploadImage: file([]),
  signedReport: file(["SUBMIT"]),
  additionalRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export const qcNdtDivisionValidationConfig: SubDeptValidationConfig<QcNdtDivisionValidationTarget> =
  {
    id: "qc-ndt-division",
    fields: qcNdtDivisionValidationFields,
    resolveFieldPaths: (target) => {
      const values = asRecord(target.values) ?? {};
      const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

      fields.push({
        path: "SIGNED_REPORT",
        value: values.SIGNED_REPORT ?? values.signedReport,
        ruleKey: "signedReport",
      });
      fields.push({
        path: "ADDITIONAL_REMARKS",
        value: values.ADDITIONAL_REMARKS ?? values.additionalRemarks,
        ruleKey: "additionalRemarks",
      });

      for (const [key, val] of Object.entries(values)) {
        const arr = asArray(val);
        if (!arr.length) continue;
        const sample = asRecord(arr[0]);
        if (!sample) continue;

        if ("MACHINE_NO" in sample || "NO_OF_SECTIONS" in sample) {
          arr.forEach((item, i) => {
            const row = asRecord(item) ?? {};
            fields.push({
              path: `${key}.${i}.MACHINE_NO`,
              value: row.MACHINE_NO,
              ruleKey: "machineNo",
            });
            fields.push({
              path: `${key}.${i}.NO_OF_SECTIONS`,
              value: row.NO_OF_SECTIONS,
              ruleKey: "noOfSections",
            });
            fields.push({
              path: `${key}.${i}.NO_OF_ORIENTATIONS`,
              value: row.NO_OF_ORIENTATIONS,
              ruleKey: "noOfOrientations",
            });
            fields.push({
              path: `${key}.${i}.NORMAL_EXPOSURES`,
              value: row.NORMAL_EXPOSURES,
              ruleKey: "normalExposures",
            });
            fields.push({
              path: `${key}.${i}.TANGENTIAL_EXPOSURES`,
              value: row.TANGENTIAL_EXPOSURES,
              ruleKey: "tangentialExposures",
            });
          });
        }

        if ("TYPE_OF_DEFECT" in sample) {
          arr.forEach((item, i) => {
            const row = asRecord(item) ?? {};
            fields.push({
              path: `${key}.${i}.TYPE_OF_DEFECT`,
              value: row.TYPE_OF_DEFECT,
              ruleKey: "typeOfDefect",
            });
            fields.push({
              path: `${key}.${i}.OBSERVATIONS`,
              value: row.OBSERVATIONS,
              ruleKey: "observations",
            });
            fields.push({
              path: `${key}.${i}.LOCATION`,
              value: row.LOCATION,
              ruleKey: "location",
            });
          });
        }

        if ("OBSERVATION_TYPE" in sample || "OBSERVATION" in sample) {
          arr.forEach((item, i) => {
            const row = asRecord(item) ?? {};
            fields.push({
              path: `${key}.${i}.OBSERVATION`,
              value: row.OBSERVATION,
              ruleKey: "visualObservation",
            });
            fields.push({
              path: `${key}.${i}.LOCATION`,
              value: row.LOCATION,
              ruleKey: "location",
            });
            fields.push({
              path: `${key}.${i}.UPLOAD_IMAGE`,
              value: row.UPLOAD_IMAGE,
              ruleKey: "uploadImage",
            });
          });
        }
      }

      return fields;
    },
    isUnitComplete: (target) => {
      const values = asRecord(target.values) ?? {};
      for (const val of Object.values(values)) {
        const arr = asArray(val);
        if (arr.some((item) => str(asRecord(item)?.MACHINE_NO) || str(asRecord(item)?.NO_OF_SECTIONS))) {
          return true;
        }
      }
      return false;
    },
  };

export function toQcNdtDivisionValidationTarget(
  values: SchemaFormValues | null | undefined,
  entryId?: string,
): QcNdtDivisionValidationTarget {
  return { entryId, values: values ?? {} };
}
