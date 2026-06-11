import { useCallback, useState } from "react";
import { authLoginController } from "@controllers/auth/login/loginController";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import type {
  ResetPasswordFormErrors,
  ResetPasswordFormValues,
} from "@ui/pages/auth/login/components/ResetPasswordForm";

export type UseResetPasswordHookOptions = {
  onBack?: () => void;
};

const INITIAL: ResetPasswordFormValues = { userId: "", reason: "" };
const INITIAL_ERRORS: ResetPasswordFormErrors = { userId: "", reason: "" };

export function useResetPasswordHook({ onBack }: UseResetPasswordHookOptions = {}) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useAlertStore();

  const canSubmit = values.userId.trim().length > 0 && values.reason.trim().length > 0;

  const setField = useCallback((field: keyof ResetPasswordFormValues, value: string) => {
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
    const response = await authLoginController.resetPassword({
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
  }, [validate, values.userId, values.reason, onBack, showAlert, resetLocal]);

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
