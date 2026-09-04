import type { ValidationErrors, ValidationTier } from "./submissionIntent";

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
