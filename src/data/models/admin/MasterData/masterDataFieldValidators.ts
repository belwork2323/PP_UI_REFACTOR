import {
  MASTER_DATA_CODE_FORMAT_MESSAGE,
  MASTER_DATA_CODE_PATTERN,
  MASTER_DATA_NAME_PATTERN,
} from "@data/models/admin/MasterData/MasterDataModel";
import type { MasterDataReferenceRange } from "@data/models/admin/MasterData/nestedMasterDataTypes";

export const masterDataNameFormatMessage = (label: string) =>
  `${label} must start with a letter or digit and contain only letters, digits, spaces, hyphen, underscore, / and \\`;

export const validateMasterDataCodeField = (
  raw: string,
  label = "Code",
  required = true,
  maxLength = 64,
): string | null => {
  const value = raw.trim();
  if (!value) return required ? `${label} is required` : null;
  if (value.length > maxLength) return `${label} must not exceed ${maxLength} characters`;
  if (!MASTER_DATA_CODE_PATTERN.test(value)) return MASTER_DATA_CODE_FORMAT_MESSAGE;
  return null;
};

export const validateMasterDataNameField = (
  raw: string,
  label = "Name",
  required = true,
  maxLength = 255,
): string | null => {
  const value = raw.trim();
  if (!value) return required ? `${label} is required` : null;
  if (value.length > maxLength) return `${label} must not exceed ${maxLength} characters`;
  if (!MASTER_DATA_NAME_PATTERN.test(value)) return masterDataNameFormatMessage(label);
  return null;
};

export type ReferenceRangeFieldErrors = {
  minValue?: string;
  maxValue?: string;
  unit?: string;
};

export const validateReferenceRangeFields = (
  range: MasterDataReferenceRange,
  label: string,
  requireAll = false,
): ReferenceRangeFieldErrors => {
  const errors: ReferenceRangeFieldErrors = {};
  const { minValue, maxValue } = range;

  if (requireAll) {
    if (minValue == null) errors.minValue = `Min value is required for "${label}"`;
    if (maxValue == null) errors.maxValue = `Max value is required for "${label}"`;
  }

  if (minValue != null && maxValue != null && minValue > maxValue) {
    errors.minValue = `Min value cannot exceed max value for "${label}"`;
  }

  return errors;
};

export const hasReferenceRangeErrors = (errors: ReferenceRangeFieldErrors): boolean =>
  Boolean(errors.minValue || errors.maxValue || errors.unit);

export const firstFieldErrorMessage = (obj: unknown): string | null => {
  if (!obj || typeof obj !== "object") return null;
  for (const value of Object.values(obj as Record<string, unknown>)) {
    if (typeof value === "string" && value) return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        const msg = firstFieldErrorMessage(item);
        if (msg) return msg;
      }
    } else if (value && typeof value === "object") {
      const msg = firstFieldErrorMessage(value);
      if (msg) return msg;
    }
  }
  return null;
};
