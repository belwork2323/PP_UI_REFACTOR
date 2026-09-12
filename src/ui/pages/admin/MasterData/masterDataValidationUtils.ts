/** Show format errors while typing; required errors only after save attempt. */
export const visibleValidationError = (
  error: string | undefined,
  hasValue: boolean,
  showErrors: boolean,
): string | undefined => {
  if (!error) return undefined;
  if (showErrors) return error;
  return hasValue && !error.endsWith(" is required") ? error : undefined;
};
