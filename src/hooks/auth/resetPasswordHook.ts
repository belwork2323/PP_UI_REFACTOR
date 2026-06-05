import { useCallback, useState } from "react";
import { resetPasswordController } from "../../controllers/auth/authController";
import { STRINGS } from "../../app/config/strings";
import { useAlertStore } from "../../app/store/alertStore";

const INITIAL = { userId: "", reason: "" };
const INITIAL_ERRORS = { userId: "", reason: "" };

/**
 * State, validation, and submit handler for the login-page inline reset request form.
 * Keeps MUI-only components free of business logic.
 */
export function useResetPasswordForm({ onBack }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlertStore();

  const canSubmit =
    values.userId.trim().length > 0 && values.reason.trim().length > 0;

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }, []);

  const validate = useCallback(() => {
    const next = { ...INITIAL_ERRORS };
    let ok = true;
    const V = STRINGS.AUTH.VALIDATION;
    if (!values.userId.trim()) {
      next.userId = V.USER_ID_REQUIRED;
      ok = false;
    }
    if (!values.reason.trim()) {
      next.reason = V.REASON_REQUIRED;
      ok = false;
    }
    setErrors(next);
    return ok;
  }, [values.userId, values.reason]);

  const resetLocal = useCallback(() => {
    setValues(INITIAL);
    setErrors(INITIAL_ERRORS);
    setSubmitting(false);
  }, []);

  const handleBack = useCallback(() => {
    resetLocal();
    onBack?.();
  }, [onBack, resetLocal]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);
    const response = await resetPasswordController({
      userId: values.userId.trim(),
      reason: values.reason.trim(),
    });

    if (response.success) {
      showAlert(response.message, "success");
      resetLocal();
      onBack?.();
    } else {
      // Check if error has field-level validation errors
      const errorDetails = response.errorCode;
      if (
        errorDetails &&
        typeof errorDetails === "object"
      ) {
        const fieldErrors = errorDetails as Record<string, string>;
        // If we have field-level errors, set them in the form
        if (Object.keys(fieldErrors).length > 0) {
          const newErrors = { userId: "", reason: "" };
          if (fieldErrors.userId) {
            newErrors.userId = fieldErrors.userId;
          }
          if (fieldErrors.reason) {
            newErrors.reason = fieldErrors.reason;
          }
          setErrors(newErrors);
        }
      }
      const errMessage = response.message || STRINGS.AUTH.RESET_FAILED;
      showAlert(errMessage, "error");
    }
    
    setSubmitting(false);
  }, [validate, values.userId, values.reason, setErrors]);

  return {
    values,
    errors,
    canSubmit,
    submitting,
    setField,
    handleSubmit,
    handleBack,
  };
}
