import { useCallback, useState } from "react";
import { resetPasswordController } from "../../controllers/auth/authController";
import { STRINGS } from "../../app/config/strings";
import { useAlertStore } from "../../app/store/alertStore";
import {
  REASON_MAX_LENGTH,
  REASON_MIN_LENGTH,
  REASON_PATTERN,
  USER_ID_PATTERN,
} from "../../utils/passwordPolicy";

const INITIAL = { userId: "", reason: "" };
const INITIAL_ERRORS = { userId: "", reason: "" };

/**
 * State, validation, and submit handler for the login-page inline reset request form.
 */
export function useResetPasswordForm({ onBack }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlertStore();

  const canSubmit =
    values.userId.trim().length > 2 && values.reason.trim().length >= REASON_MIN_LENGTH;

  const setField = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }, []);

  const validate = useCallback(() => {
    const next = { ...INITIAL_ERRORS };
    let ok = true;
    const V = STRINGS.AUTH.VALIDATION;
    const userId = values.userId.trim();
    const reason = values.reason.trim();

    if (!userId) {
      next.userId = V.USER_ID_REQUIRED;
      ok = false;
    } else if (!USER_ID_PATTERN.test(userId)) {
      next.userId = V.USER_ID_INVALID;
      ok = false;
    }

    if (!reason) {
      next.reason = V.REASON_REQUIRED;
      ok = false;
    } else if (reason.length < REASON_MIN_LENGTH) {
      next.reason = V.REASON_TOO_SHORT;
      ok = false;
    } else if (reason.length > REASON_MAX_LENGTH) {
      next.reason = V.REASON_TOO_LONG;
      ok = false;
    } else if (!REASON_PATTERN.test(reason)) {
      next.reason = V.REASON_INVALID;
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
      const errorDetails = response.errorCode;
      if (errorDetails && typeof errorDetails === "object") {
        const fieldErrors = errorDetails as Record<string, string>;
        if (Object.keys(fieldErrors).length > 0) {
          const newErrors = { userId: "", reason: "" };
          if (fieldErrors.userId) newErrors.userId = fieldErrors.userId;
          if (fieldErrors.reason) newErrors.reason = fieldErrors.reason;
          setErrors(newErrors);
        }
      }
      showAlert(response.message || STRINGS.AUTH.RESET_FAILED, "error");
    }

    setSubmitting(false);
  }, [validate, values.userId, values.reason, showAlert, resetLocal, onBack]);

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
