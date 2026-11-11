/**
 * QC Division — Trimming.
 * Matches manufacturing TrimmingDetailsRow + commonFormatParameters session shape.
 */

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

const dateTime = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "datetime",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcTrimmingValidationTarget = {
  entryId?: string;
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcTrimmingValidationFields: Record<string, FieldRuleConfig> = {
  // Mandatory on SUBMIT only — draft/save uses FORMAT (no required checks)
  motorReceivedAt: dateTime(["SUBMIT"]),
  machineDetails: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  startDate: dateTime(["SUBMIT"]),
  completionDate: dateTime(["SUBMIT"]),
  arborSize: number(["SUBMIT"]),
  cutterSize: number(["SUBMIT"]),
  ingestSize: number(["SUBMIT"]),
  motorTruing: number(["SUBMIT"]),
  arborTuring: number(["SUBMIT"]),
  reading: number(["SUBMIT"]),
  remarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  qaRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  measurementQaRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  motorRemarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const DEFAULT_READING_KEYS = ["R2T", "R2B", "R1R", "R1L"] as const;

/** Skip empty placeholder detail rows so they do not fail SUBMIT required checks. */
const detailRowHasData = (row: Record<string, unknown>) =>
  Boolean(
    str(row.machineDetails) ||
      str(row.startDate) ||
      str(row.completionDate) ||
      str(row.arborSize) ||
      str(row.cutterSize) ||
      str(row.ingestSize) ||
      str(row.motorTruing) ||
      str(row.arborTuring) ||
      str(row.remarks) ||
      str(row.qaRemarks),
  );

export const qcTrimmingValidationConfig: SubDeptValidationConfig<QcTrimmingValidationTarget> = {
  id: "qc-trimming",
  fields: qcTrimmingValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    fields.push({
      path: "motorReceivedAt",
      value: values.motorReceivedAt ?? values.MOTOR_RECEIVED_AT ?? values.motorReceivedDate,
      ruleKey: "motorReceivedAt",
    });

    const details = asArray(values.trimmingDetails ?? values.TRIMMING_DETAILS);
    details.forEach((item, i) => {
      const row = asRecord(item) ?? {};
      // Validate required cells only when the row has any user data (or is the sole row).
      if (!detailRowHasData(row) && details.length > 1) return;

      fields.push({
        path: `trimmingDetails.${i}.machineDetails`,
        value: row.machineDetails ?? row.MACHINE_DETAILS,
        ruleKey: "machineDetails",
      });
      fields.push({
        path: `trimmingDetails.${i}.startDate`,
        value: row.startDate ?? row.START_DATE,
        ruleKey: "startDate",
      });
      fields.push({
        path: `trimmingDetails.${i}.completionDate`,
        value: row.completionDate ?? row.COMPLETION_DATE,
        ruleKey: "completionDate",
      });
      fields.push({
        path: `trimmingDetails.${i}.arborSize`,
        value: row.arborSize ?? row.ARBOR_SIZE,
        ruleKey: "arborSize",
      });
      fields.push({
        path: `trimmingDetails.${i}.cutterSize`,
        value: row.cutterSize ?? row.CUTTER_SIZE,
        ruleKey: "cutterSize",
      });
      fields.push({
        path: `trimmingDetails.${i}.ingestSize`,
        value: row.ingestSize ?? row.INGEST_SIZE,
        ruleKey: "ingestSize",
      });
      fields.push({
        path: `trimmingDetails.${i}.motorTruing`,
        value: row.motorTruing ?? row.MOTOR_TRUING,
        ruleKey: "motorTruing",
      });
      fields.push({
        path: `trimmingDetails.${i}.arborTuring`,
        value: row.arborTuring ?? row.ARBOR_TURING,
        ruleKey: "arborTuring",
      });
      fields.push({
        path: `trimmingDetails.${i}.remarks`,
        value: row.remarks ?? row.REMARKS,
        ruleKey: "remarks",
      });
      fields.push({
        path: `trimmingDetails.${i}.qaRemarks`,
        value: row.qaRemarks ?? row.QA_REMARKS,
        ruleKey: "qaRemarks",
      });
    });

    fields.push({
      path: "measurementQaRemarks",
      value: values.measurementQaRemarks ?? values.dimensionsQaRemarks,
      ruleKey: "measurementQaRemarks",
    });
    fields.push({
      path: "motorRemarks",
      value: values.motorRemarks,
      ruleKey: "motorRemarks",
    });

    asArray(values.commonFormatParameters ?? values.COMMON_FORMAT_PARAMETERS).forEach(
      (param, pIndex) => {
        const p = asRecord(param) ?? {};
        const stages = asArray(p.stages);
        stages.forEach((stage, sIndex) => {
          const st = asRecord(stage) ?? {};
          const readings = asRecord(st.readings) ?? {};
          const stageKeys = Object.keys(readings);
          // Only validate keys present on this stage (avoid requiring locations from other stages).
          const keysToCheck = stageKeys.length ? stageKeys : [...DEFAULT_READING_KEYS];
          const stageHasData = Object.values(readings).some((v) => str(v));
          if (!stageHasData && stages.length > 1) return;
          keysToCheck.forEach((key) => {
            fields.push({
              path: `commonFormatParameters.${pIndex}.stages.${sIndex}.readings.${key}`,
              value: readings[key],
              ruleKey: "reading",
            });
          });
        });
      },
    );

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
