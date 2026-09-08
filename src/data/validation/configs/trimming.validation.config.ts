/**
 * Trimming — Excel sheet rules (FORMAT / UNIT / SUBMIT).
 */

import type { TrimmingMotorSession } from "@/data/models/user/TrimmingFormModel";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import {
  str,
  ALPHA_NUM,
  isFiniteNumber,
  parseNumber,
  meetsSpecification,
} from "../fieldValidators";

const required = (label: string) => `${label} is required.`;
const invalidNumber = (label: string) => `${label} must be numeric.`;
const invalidDate = (label: string) => `${label} must be a valid date.`;
const invalidText = (label: string) => `${label} must be alphanumeric.`;
const invalidVsSpec = (label: string) => `${label} does not meet specification.`;

const textRule = (
  label: string,
  requiredIn: ValidationTier[],
  options?: { pattern?: RegExp; invalidMessage?: string },
): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  pattern: options?.pattern,
  messages: {
    required: required(label),
    invalid: options?.invalidMessage ?? invalidText(label),
  },
});

const numberRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "number",
  requiredIn,
  messages: { required: required(label), invalid: invalidNumber(label) },
});

const dateRule = (label: string, requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: required(label), invalid: invalidDate(label) },
});

export type TrimmingValidationTarget = TrimmingMotorSession;

const DEFAULT_READING_KEYS = ["R2T", "R2B", "R1R", "R1L"] as const;

export const trimmingValidationFields: Record<string, FieldRuleConfig> = {
  motorReceivedAt: dateRule("Motor Received Date", ["UNIT", "SUBMIT"]),
  machineDetails: textRule("Machine Details", ["SUBMIT"], {
    pattern: ALPHA_NUM,
    invalidMessage: "Machine Details must be alphanumeric.",
  }),
  startDate: dateRule("Start Date", ["SUBMIT"]),
  completionDate: dateRule("Completion Date", ["SUBMIT"]),
  arborSize: numberRule("Arbor Size", ["SUBMIT"]),
  cutterSize: numberRule("Cutter Size", ["SUBMIT"]),
  reading: numberRule("Reading", ["SUBMIT"]),
};

const resolveReadingKeys = (motor: TrimmingMotorSession): string[] => {
  const keys = new Set<string>(DEFAULT_READING_KEYS);
  const locs = (motor as { commonFormatLocations?: string[] }).commonFormatLocations;
  if (Array.isArray(locs)) locs.forEach((k) => keys.add(String(k)));
  (motor.commonFormatParameters ?? []).forEach((param) => {
    param.stages?.forEach((stage) => {
      Object.keys(stage.readings ?? {}).forEach((k) => keys.add(k));
    });
  });
  return [...keys];
};

export const trimmingValidationConfig: SubDeptValidationConfig<TrimmingValidationTarget> = {
  id: "trimming",
  fields: trimmingValidationFields,
  resolveFieldPaths: (motor) => {
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [
      { path: "motorReceivedAt", value: motor.motorReceivedAt, ruleKey: "motorReceivedAt" },
    ];

    (motor.trimmingDetails ?? []).forEach((row, index) => {
      fields.push(
        {
          path: `trimmingDetails.${index}.machineDetails`,
          value: row.machineDetails,
          ruleKey: "machineDetails",
        },
        {
          path: `trimmingDetails.${index}.startDate`,
          value: row.startDate,
          ruleKey: "startDate",
        },
        {
          path: `trimmingDetails.${index}.completionDate`,
          value: row.completionDate,
          ruleKey: "completionDate",
        },
        {
          path: `trimmingDetails.${index}.arborSize`,
          value: row.arborSize,
          ruleKey: "arborSize",
        },
        {
          path: `trimmingDetails.${index}.cutterSize`,
          value: row.cutterSize,
          ruleKey: "cutterSize",
        },
      );
    });

    const readingKeys = resolveReadingKeys(motor);
    (motor.commonFormatParameters ?? []).forEach((param, pIndex) => {
      param.stages?.forEach((stage, sIndex) => {
        readingKeys.forEach((key) => {
          fields.push({
            path: `commonFormatParameters.${pIndex}.stages.${sIndex}.readings.${key}`,
            value: stage.readings?.[key],
            ruleKey: "reading",
          });
        });
      });
    });

    return fields;
  },
  customRules: [
    (motor, _tier, errors) => {
      (motor.trimmingDetails ?? []).forEach((row, index) => {
        const start = str(row.startDate);
        const end = str(row.completionDate);
        if (!start || !end) return;
        const toTime = (v: string) => {
          if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(v)) {
            const [d, m, y] = v.split("-").map(Number);
            return new Date(y, m - 1, d).getTime();
          }
          return Date.parse(v);
        };
        const t0 = toTime(start);
        const t1 = toTime(end);
        if (Number.isFinite(t0) && Number.isFinite(t1) && t1 < t0) {
          errors[`trimmingDetails.${index}.completionDate`] =
            "Completion Date cannot be before Start Date.";
        }
      });
    },
    (motor, tier, errors) => {
      if (tier !== "SUBMIT" && tier !== "FORMAT") return;
      (motor.commonFormatParameters ?? []).forEach((param, pIndex) => {
        param.stages?.forEach((stage, sIndex) => {
          const stageAny = stage as {
            specification?: string;
            readings?: Record<string, string>;
          };
          const specText = str(stageAny.specification);
          Object.entries(stageAny.readings ?? {}).forEach(([key, value]) => {
            const path = `commonFormatParameters.${pIndex}.stages.${sIndex}.readings.${key}`;
            const text = str(value);
            if (!text || !isFiniteNumber(text)) return;
            if (tier === "SUBMIT" && specText) {
              const n = parseNumber(text);
              if (n != null && !meetsSpecification(n, specText)) {
                errors[path] = invalidVsSpec(key);
              }
            }
          });
        });
      });
    },
  ],
  isUnitComplete: (motor) => Boolean(str(motor.motorReceivedAt)),
};

export function toTrimmingValidationTarget(
  motor: TrimmingMotorSession,
): TrimmingValidationTarget {
  return motor;
}
