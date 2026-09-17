import type { ValidationErrors, ValidationTier } from "./submissionIntent";
import { flattenValidationErrorTree } from "../../utils/flattenValidationErrorTree";

export const fieldError = (
  errors: ValidationErrors | null | undefined,
  path: string,
): string | undefined => errors?.[path];

export const firstValidationError = (
  errors: ValidationErrors | null | undefined,
): string | undefined => {
  if (!errors) return undefined;
  const keys = Object.keys(errors);
  return keys.length ? errors[keys[0]] : undefined;
};

/** First error with a short field path label, e.g. "Detector type: Invalid value". */
export const firstValidationErrorWithPath = (
  errors: ValidationErrors | null | undefined,
  formatPath?: (path: string) => string,
): string | undefined => {
  if (!errors) return undefined;
  const keys = Object.keys(errors);
  if (!keys.length) return undefined;
  const path = keys[0];
  const message = String(errors[path] ?? "").trim();
  if (!message) return undefined;
  const label = formatPath ? formatPath(path) : path;
  return label ? `${label}: ${message}` : message;
};

/** Human-readable summary from API field-error maps (e.g. `{ insulationType: "must not be blank" }`). */
export const formatValidationDetailsMessage = (details: unknown): string | null => {
  if (details == null) return null;
  if (typeof details === "string" && details.trim()) return details.trim();
  if (typeof details === "object" && !Array.isArray(details)) {
    const record = details as Record<string, unknown>;
    if (typeof record.details === "string" && record.details.trim()) {
      return record.details.trim();
    }
  }
  const flat = flattenValidationErrorTree(details);
  const entries = Object.entries(flat).filter(([, message]) => Boolean(String(message ?? "").trim()));
  if (!entries.length) return null;
  const lines = entries.slice(0, 3).map(([field, message]) => {
    const label = field.includes(".") ? field.slice(field.lastIndexOf(".") + 1) : field;
    return `${label}: ${message}`;
  });
  const more = entries.length > 3 ? ` (+${entries.length - 3} more)` : "";
  return `${lines.join("; ")}${more}`;
};

export const hasValidationErrors = (errors: ValidationErrors | null | undefined): boolean =>
  Boolean(errors && Object.keys(errors).length > 0);

export type ValidationDisplayFlags = {
  showFormat: boolean;
  showUnit: boolean;
  showSubmit: boolean;
};

/** Map stored errors to a single visible message based on which tiers the user has attempted. */
export const getVisibleFieldError = (
  errors: ValidationErrors | null | undefined,
  path: string,
  flags: ValidationDisplayFlags,
): string | undefined => {
  const message = fieldError(errors, path);
  if (!message) return undefined;
  if (flags.showSubmit || flags.showUnit || flags.showFormat) return message;
  return undefined;
};

/** Show a field error only after the user touched it, or when a full form action was attempted. */
export const getTouchedFieldError = (
  errors: ValidationErrors | null | undefined,
  path: string,
  flags: ValidationDisplayFlags,
  options: { touched: boolean; showWhenUntouched?: boolean },
): string | undefined => {
  const message = getVisibleFieldError(errors, path, flags);
  if (!message) return undefined;
  if (options.showWhenUntouched || options.touched) return message;
  return undefined;
};

export const tierForDraftAction = (): ValidationTier => "UNIT";
export const tierForSubmitAction = (): ValidationTier => "SUBMIT";
export const tierForLiveChange = (): ValidationTier => "FORMAT";
