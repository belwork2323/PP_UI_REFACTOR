import { useCallback, useMemo } from "react";
import {
  fieldError,
  getVisibleFieldError,
  hasValidationErrors,
  type ValidationDisplayFlags,
} from "../../../data/validation/validationErrors";
import type { ValidationErrors } from "../../../data/validation/submissionIntent";

export type ValidationAttemptFlags = {
  format: boolean;
  unit: boolean;
  submit: boolean;
};

export const useValidationDisplay = (
  errors: ValidationErrors,
  attempt: ValidationAttemptFlags,
) => {
  const flags: ValidationDisplayFlags = useMemo(
    () => ({
      showFormat: attempt.format,
      showUnit: attempt.unit,
      showSubmit: attempt.submit,
    }),
    [attempt.format, attempt.unit, attempt.submit],
  );

  const visibleError = useCallback(
    (path: string) => getVisibleFieldError(errors, path, flags),
    [errors, flags],
  );

  const rawError = useCallback((path: string) => fieldError(errors, path), [errors]);

  return {
    visibleError,
    rawError,
    hasErrors: hasValidationErrors(errors),
  };
};

export default useValidationDisplay;
