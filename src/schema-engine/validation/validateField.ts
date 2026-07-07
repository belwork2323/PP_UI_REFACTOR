import type { SchemaValidation } from "../types";

export const validateFieldValue = (
  value: unknown,
  validation?: SchemaValidation,
): string | null => {
  if (!validation) return null;

  const str = String(value ?? "").trim();

  if (validation.required && !str) {
    return validation.message ?? "This field is required.";
  }

  if (validation.min !== undefined || validation.max !== undefined) {
    const num = Number(value);
    if (!Number.isFinite(num)) return validation.message ?? "Enter a valid number.";
    if (validation.min !== undefined && num < validation.min) {
      return validation.message ?? `Minimum value is ${validation.min}.`;
    }
    if (validation.max !== undefined && num > validation.max) {
      return validation.message ?? `Maximum value is ${validation.max}.`;
    }
  }

  if (validation.pattern && str) {
    try {
      if (!new RegExp(validation.pattern).test(str)) {
        return validation.message ?? "Invalid format.";
      }
    } catch {
      return null;
    }
  }

  return null;
};
