import { useState, useEffect, useCallback } from "react";
import type { NavigateFunction } from "react-router-dom";
import { authLoginController } from "@controllers/auth/login/loginController";
import { useAuthStore } from "@app/store/authStore";
import { getRouteByRole } from "@utils/roleMapper";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import { useCaptchaHook } from "@hooks/auth/login/useCaptchaHook";
import type {
  LoginFormCredentials,
  LoginFormErrors,
} from "@data/models/auth/login/LoginCredentialsModel";
import type { LoginRoleOption } from "@data/models/auth/login/LoginLookupsModel";
import type { SubDepartmentModel } from "@data/models/user/SubDepartmentModel";

const DEPT_REQUIRED_ROLES = /User|Approver/i;

export type UseLoginHookOptions = {
  navigate: NavigateFunction;
};

const roleNeedsDept = (roleId: string | number, roles: LoginRoleOption[]) =>
  Boolean(
    roles
      .find((r) => Number(r.roleId) === Number(roleId))
      ?.roleName?.match(DEPT_REQUIRED_ROLES),
  );

const INITIAL_CREDS: LoginFormCredentials = {
  username: "",
  password: "",
  roleId: "",
  roleName: "",
  subDepartmentId: "",
};

const INITIAL_ERRORS: LoginFormErrors = {
  roleId: "",
  subDepartmentId: "",
  username: "",
  password: "",
  captcha: "",
};

export function useLoginHook({ navigate }: UseLoginHookOptions) {
  const login = useAuthStore((s) => s.login);
  const { showAlert, setLoading } = useAlertStore();

  const [credentials, setCredentials] = useState(INITIAL_CREDS);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [roles, setRoles] = useState<LoginRoleOption[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartmentModel[]>([]);
  const [systemLookupsLoading, setSystemLookupsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    captcha,
    loading: captchaLoading,
    fetchErr: captchaFetchErr,
    value: captchaValue,
    touched: captchaTouched,
    captchaId,
    ready: captchaReady,
    reload: reloadCaptcha,
    handleInputChange: onCaptchaInputChange,
    handleBlur: onCaptchaBlur,
    resetOnFailure: resetCaptchaOnFailure,
    validate: validateCaptcha,
  } = useCaptchaHook();

  const showDeptDropdown = roleNeedsDept(credentials.roleId, roles);
  const rolesEmpty = !systemLookupsLoading && roles.length === 0;
  const subDeptsEmpty = !systemLookupsLoading && subDepartments.length === 0;

  const roleOptions = roles.map((r) => ({
    value: r.roleId,
    label: r.roleName,
  }));

  const subDeptOptions = subDepartments.map((s) => ({
    value: s.subDepartmentId,
    label: s.subDepartmentName,
  }));

  const roleDropdownDisabled = systemLookupsLoading || rolesEmpty;
  const subDeptDropdownDisabled = systemLookupsLoading || !showDeptDropdown || subDeptsEmpty;

  const roleHelperText =
    errors.roleId || (rolesEmpty ? STRINGS.AUTH.NO_ROLES_AVAILABLE : "");

  const subDeptHelperText =
    errors.subDepartmentId ||
    (showDeptDropdown && subDeptsEmpty && !systemLookupsLoading
      ? STRINGS.AUTH.NO_SUBDEPARTMENTS_FOR_LOGIN
      : "");

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      setSystemLookupsLoading(true);

      try {
        const { roles: rolesData, subDepartments: subData, alerts } =
          await authLoginController.loadLookups();

        if (cancelled) return;

        alerts.forEach(({ message, severity }) => {
          showAlert(message, severity, { autoCloseMs: 2000 });
        });

        setRoles(rolesData);
        setSubDepartments(subData);
      } catch {
        if (!cancelled) {
          showAlert(STRINGS.SYSTEM.UNEXPECTED_ERROR, "error", { autoCloseMs: 2000 });
        }
      } finally {
        if (!cancelled) setSystemLookupsLoading(false);
      }
    };

    loadLookups();
    return () => {
      cancelled = true;
    };
  }, [showAlert]);

  useEffect(() => {
    if (!showDeptDropdown) {
      setErrors((prev) => ({ ...prev, subDepartmentId: "" }));
      setCredentials((prev) => ({ ...prev, subDepartmentId: "" }));
    }
  }, [showDeptDropdown]);

  const handleChange = useCallback(
    (field: keyof Omit<LoginFormCredentials, "roleName">, value: string | number) => {
      setCredentials((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field as keyof LoginFormErrors] ? { ...prev, [field]: "" } : prev));
    },
    [],
  );

  const handleRoleChange = useCallback(
    (selectedRaw: string | number) => {
      const selectedId = selectedRaw === "" ? "" : Number(selectedRaw);
      const selected = roles.find((r) => Number(r.roleId) === selectedId);
      setCredentials((prev) => ({
        ...prev,
        roleId: selectedId === "" ? "" : selectedId,
        roleName: selected?.roleName ?? "",
        subDepartmentId: "",
      }));
      setErrors((prev) => ({ ...prev, roleId: "", subDepartmentId: "" }));
    },
    [roles],
  );

  const handleCaptchaInputChange = useCallback(
    (value: string) => {
      onCaptchaInputChange(value);
      setErrors((prev) => (prev.captcha ? { ...prev, captcha: "" } : prev));
    },
    [onCaptchaInputChange],
  );

  const validate = useCallback(() => {
    const V = STRINGS.AUTH.VALIDATION;
    const next = { ...INITIAL_ERRORS };
    let valid = true;

    if (rolesEmpty) {
      next.roleId = STRINGS.AUTH.NO_ROLES_AVAILABLE;
      valid = false;
    } else if (credentials.roleId === "" || credentials.roleId == null) {
      next.roleId = V.ROLE_REQUIRED;
      valid = false;
    }
    if (
      showDeptDropdown &&
      (credentials.subDepartmentId === "" || credentials.subDepartmentId == null)
    ) {
      next.subDepartmentId = subDeptsEmpty
        ? STRINGS.AUTH.NO_SUBDEPARTMENTS_FOR_LOGIN
        : V.DEPARTMENT_REQUIRED;
      valid = false;
    }
    if (!credentials.username.trim()) {
      next.username = V.USERNAME_REQUIRED;
      valid = false;
    }
    if (!credentials.password) {
      next.password = V.PASSWORD_REQUIRED;
      valid = false;
    }

    const captchaResult = validateCaptcha();
    if (!captchaResult.valid) {
      next.captcha = captchaResult.error;
      valid = false;
    }

    setErrors(next);
    return valid;
  }, [
    credentials.roleId,
    credentials.subDepartmentId,
    credentials.username,
    credentials.password,
    validateCaptcha,
    showDeptDropdown,
    rolesEmpty,
    subDeptsEmpty,
  ]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    if (submitting) return;

    setSubmitting(true);
    setLoading(true);

    const requestPayload = {
      userId: credentials.username.trim(),
      password: credentials.password,
      role: {
        roleId: credentials.roleId,
        roleName: credentials.roleName,
      },
      captcha: {
        captchaId: captchaId!,
        captchaValue: captchaValue.trim(),
      },
    };

    const response = await authLoginController.login(requestPayload);

    if (!response.success || !response.data) {
      showAlert(response.message || STRINGS.SYSTEM.UNEXPECTED_ERROR, "error", { autoCloseMs: 2000 });
      resetCaptchaOnFailure();
    } else {
      const user = response.data;
      if (showDeptDropdown && !user.hasSubDeptAccess(credentials.subDepartmentId)) {
        showAlert(STRINGS.AUTH.ACCESS_DENIED_DEPT, "error", { autoCloseMs: 2000 });
        resetCaptchaOnFailure();
      } else {
        login(user);
        const selectedSubDept = user.getSubDepartment(credentials.subDepartmentId);
        const route = getRouteByRole(user.role, credentials.subDepartmentId, selectedSubDept);
        navigate(route, { replace: true });
      }
    }

    setLoading(false);
    setSubmitting(false);
  }, [
    credentials,
    validate,
    captchaId,
    captchaValue,
    resetCaptchaOnFailure,
    login,
    navigate,
    showDeptDropdown,
    showAlert,
    setLoading,
    submitting,
  ]);

  const passwordFilled = Boolean(credentials.password);
  const usernameFilled = credentials.username.trim().length > 0;
  const roleSelected = credentials.roleId !== "" && credentials.roleId != null;
  const subDeptSelected =
    !showDeptDropdown ||
    (credentials.subDepartmentId !== "" && credentials.subDepartmentId != null);

  const loginBlocked =
    systemLookupsLoading ||
    rolesEmpty ||
    (showDeptDropdown && subDeptsEmpty) ||
    !usernameFilled ||
    !passwordFilled ||
    !roleSelected ||
    !subDeptSelected ||
    !captchaReady ||
    submitting;

  return {
    credentials,
    errors,
    roleOptions,
    subDeptOptions,
    showDeptDropdown,
    systemLookupsLoading,
    rolesEmpty,
    roleDropdownDisabled,
    subDeptDropdownDisabled,
    roleHelperText,
    subDeptHelperText,
    loginBlocked,
    submitting,
    handleChange,
    handleRoleChange,
    handleLogin,
    loadingMessage: STRINGS.AUTH.LOADING_LOOKUPS,
    captcha: {
      captcha,
      loading: captchaLoading,
      fetchErr: captchaFetchErr,
      value: captchaValue,
      error: errors.captcha,
      touched: captchaTouched,
      onReload: reloadCaptcha,
      onInputChange: handleCaptchaInputChange,
      onBlur: onCaptchaBlur,
    },
  };
}
