import type { TrimmingMotorSession } from "@/data/models/user/TrimmingFormModel";
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

export type TrimmingValidationTarget = TrimmingMotorSession;

const DEFAULT_READING_KEYS = ["R2T", "R2B", "R1R", "R1L"] as const;

export const trimmingValidationFields: Record<string, FieldRuleConfig> = {
  motorReceivedAt: date(["UNIT", "SUBMIT"]),
  machineDetails: text(["SUBMIT"], S.PATTERNS.ALPHANUMERIC),
  startDate: date(["SUBMIT"]),
  completionDate: date(["SUBMIT"]),
  arborSize: number(["FORMAT", "SUBMIT"]),
  cutterSize: number(["FORMAT", "SUBMIT"]),
  reading: number(["FORMAT", "SUBMIT"]),
  remarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),
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
        {
          path: `trimmingDetails.${index}.remarks`,
          value: row.remarks,
          ruleKey: "remarks",
        },
      );
    });

    const readingKeys = resolveReadingKeys(motor);
    (motor.commonFormatParameters ?? []).forEach((param, pIndex) => {
      (param.stages ?? []).forEach((stage, sIndex) => {
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
  customRules: [],
  isUnitComplete: (motor) => Boolean(str(motor.motorReceivedAt)),
};

export function toTrimmingValidationTarget(
  motor: TrimmingMotorSession,
): TrimmingValidationTarget {
  return motor;
}
