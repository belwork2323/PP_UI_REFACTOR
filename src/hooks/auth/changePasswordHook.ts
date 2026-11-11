import { useCallback, useMemo, useState } from "react";
import { changePasswordController } from "../../controllers/auth/authController";
import { useAuthStore } from "../../app/store/authStore";
import { useAlertStore } from "../../app/store/alertStore";
import { STRINGS } from "../../app/config/strings";
import { evaluatePasswordRules, isPasswordStrong } from "../../utils/passwordPolicy";
import { getRouteByRole } from "../../utils/roleMapper";

const INITIAL = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const INITIAL_ERRORS = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

type UseChangePasswordOptions = {
  forced?: boolean;
  onSuccess?: () => void;
  navigate?: (path: string, opts?: { replace?: boolean }) => void;
};

export function useChangePasswordForm({
  forced = false,
  onSuccess,
  navigate,
}: UseChangePasswordOptions = {}) {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();

  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitting, setSubmitting] = useState(false);

  const rules = useMemo(
    () => evaluatePasswordRules(values.newPassword),
    [values.newPassword],
  );

  const setField = useCallback((field: keyof typeof INITIAL, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }, []);

  const validate = useCallback(() => {
    const V = STRINGS.AUTH.VALIDATION;
    const next = { ...INITIAL_ERRORS };
    let ok = true;

    if (!values.currentPassword) {
      next.currentPassword = V.CURRENT_PASSWORD_REQUIRED;
      ok = false;
    }
    if (!values.newPassword) {
      next.newPassword = V.NEW_PASSWORD_REQUIRED;
      ok = false;
    } else if (!isPasswordStrong(values.newPassword)) {
      next.newPassword = V.PASSWORD_INVALID;
      ok = false;
    }
    if (!values.confirmPassword) {
      next.confirmPassword = V.CONFIRM_PASSWORD_REQUIRED;
      ok = false;
    } else if (values.newPassword !== values.confirmPassword) {
      next.confirmPassword = V.PASSWORDS_DO_NOT_MATCH;
      ok = false;
    }

    setErrors(next);
    return ok;
  }, [values]);

  const canSubmit =
    Boolean(values.currentPassword) &&
    isPasswordStrong(values.newPassword) &&
    values.newPassword === values.confirmPassword &&
    !submitting;

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    if (!user?.userUUID) {
      showAlert(STRINGS.AUTH.CHANGE_PASSWORD_FAILED, "error");
      return;
    }

    setSubmitting(true);
    const response = await changePasswordController({
      user_uuid: user.userUUID,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });

    if (response.success) {
      const updated = user.copyWith({ mustChangePassword: false });
      login(updated);
      showAlert(STRINGS.AUTH.CHANGE_PASSWORD_SUCCESS, "success");
      setValues(INITIAL);
      setErrors(INITIAL_ERRORS);

      if (onSuccess) {
        onSuccess();
      } else if (forced && navigate) {
        const pendingSubDeptId = sessionStorage.getItem("pendingSubDeptId");
        sessionStorage.removeItem("pendingSubDeptId");
        const selectedSubDept = pendingSubDeptId
          ? updated.getSubDepartment(pendingSubDeptId)
          : null;
        const route = getRouteByRole(
          updated.role,
          pendingSubDeptId,
          selectedSubDept,
        );
        navigate(route, { replace: true });
      }
    } else {
      showAlert(response.message || STRINGS.AUTH.CHANGE_PASSWORD_FAILED, "error");
    }

    setSubmitting(false);
  }, [validate, user, values, login, showAlert, onSuccess, forced, navigate]);

  return {
    values,
    errors,
    rules,
    canSubmit,
    submitting,
    setField,
    handleSubmit,
  };
}
