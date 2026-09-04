import { toLegacyRawMaterialSourcingRules } from "./configs/rawMaterialSourcing.validation.config";

/** Reusable field-rule primitives for subdepartment-owned workflow forms. */
export type ValidationValueType = "text" | "date" | "number" | "file";

export type FieldValidationRule = {
  required: boolean;
  valueType: ValidationValueType;
  /** Applied only when a non-empty text value is supplied. */
  pattern?: RegExp;
};

export type RawMaterialSourcingRuleKey =
  | "supplyOrderNo"
  | "receiptDate"
  | "manufacturerName"
  | "lotNo"
  | "analysedResult"
  | "acemQcResult"
  | "certificates"
  | "certificateType";

export const ROCKET_MOTOR_CASING_VALIDATION_RULES = {
  projectName: { required: true, valueType: "text" as const },
  motorStage: { required: true, valueType: "text" as const },
  motorId: { required: true, valueType: "text" as const, pattern: /^[A-Za-z0-9][A-Za-z0-9 /-]*$/ },
  casingType: { required: true, valueType: "text" as const },
  receivingDate: { required: true, valueType: "date" as const },
  insulationCuringDate: { required: true, valueType: "date" as const },
  insulationType: { required: true, valueType: "text" as const },
  insulationReportNo: { required: true, valueType: "text" as const, pattern: /^[A-Za-z0-9][A-Za-z0-9 /-]*$/ },
  visualObservation: { required: true, valueType: "text" as const },
  weightWithoutHarness: { required: true, valueType: "number" as const },
  weighscaleEquipment: { required: true, valueType: "text" as const },
  calibrationDueDate: { required: true, valueType: "date" as const },
  dimension: { required: true, valueType: "number" as const },
  mockTrialText: { required: true, valueType: "text" as const, pattern: /^[A-Za-z0-9][A-Za-z0-9 /-]*$/ },
  mockTrialNumber: { required: true, valueType: "number" as const },
} as const;

/** Rules supplied by Raw Material Sourcing – Lot Creation. */
/** @deprecated Use rawMaterialSourcingFieldRules from configs/rawMaterialSourcing.validation.config.ts */
export const RAW_MATERIAL_SOURCING_VALIDATION_RULES: Record<
  RawMaterialSourcingRuleKey,
  FieldValidationRule
> = toLegacyRawMaterialSourcingRules();

export type CasePrepRuleKey =
  | "abradingWheelType"
  | "numberOfSpacers"
  | "solventUsedQtyKg"
  | "batchNo"
  | "qualifyingSubscaleBatchNo"
  | "prrcClearanceDate"
  | "heBellowDimension"
  | "neBellowDimension"
  | "tceObservation"
  | "linerType";

/** Top-level scalar rules for Case Preparation (nested tables in casePrepValidation.ts). */
export const CASE_PREPARATION_VALIDATION_RULES: Record<CasePrepRuleKey, FieldValidationRule> = {
  abradingWheelType: {
    required: true,
    valueType: "text",
    pattern: /^[A-Za-z0-9][A-Za-z0-9 /-]*$/,
  },
  numberOfSpacers: { required: true, valueType: "number" },
  solventUsedQtyKg: { required: true, valueType: "number" },
  batchNo: { required: true, valueType: "text", pattern: /^[A-Za-z0-9][A-Za-z0-9 /-]*$/ },
  qualifyingSubscaleBatchNo: {
    required: true,
    valueType: "text",
    pattern: /^[A-Za-z0-9][A-Za-z0-9 /-]*$/,
  },
  prrcClearanceDate: { required: true, valueType: "date" },
  heBellowDimension: { required: true, valueType: "text" },
  neBellowDimension: { required: true, valueType: "text" },
  tceObservation: {
    required: true,
    valueType: "text",
    pattern: /^[A-Za-z0-9][A-Za-z0-9 /-]*$/,
  },
  linerType: { required: true, valueType: "text" },
};

export type FieldValidationState = "valid" | "required" | "invalid";

const hasFileValue = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  if (!value || typeof value !== "object") return false;
  const file = value as { fileId?: unknown; fileUrl?: unknown; file?: unknown; status?: unknown };
  return (
    Boolean(file.file || String(file.fileId ?? "").trim() || String(file.fileUrl ?? "").trim()) &&
    file.status !== "failed"
  );
};

export function validateFieldValue(value: unknown, rule: FieldValidationRule): FieldValidationState {
  if (rule.valueType === "file") {
    return hasFileValue(value) ? "valid" : rule.required ? "required" : "valid";
  }

  const text = String(value ?? "").trim();
  if (!text) return rule.required ? "required" : "valid";

  if (rule.valueType === "number") return Number.isFinite(Number(text)) ? "valid" : "invalid";
  if (rule.valueType === "date") {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(text)) return "invalid";
    const [day, month, year] = text.split("-").map(Number);
    const candidate = new Date(year, month - 1, day);
    return candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day
      ? "valid"
      : "invalid";
  }
  if (rule.pattern && !rule.pattern.test(text)) return "invalid";
  return "valid";
}

export function validateFieldType(value: unknown, rule: FieldValidationRule): FieldValidationState {
  return validateFieldValue(value, { ...rule, required: false });
}
