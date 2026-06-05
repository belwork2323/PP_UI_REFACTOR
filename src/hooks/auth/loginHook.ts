import { useState, useEffect, useCallback } from "react";
import { loginController } from "../../controllers/auth/authController";
import { useAuthStore } from "../../app/store/authStore";
import { getRouteByRole } from "../../utils/roleMapper";
import { STRINGS } from "../../app/config/strings";
import { useAlertStore } from "../../app/store/alertStore";
import { fetchDepartments, fetchRoles, fetchSubDepartments } from "../../data/api/common/generalAPI";

const DEPT_REQUIRED_ROLES = /User|Approver/i;

const roleNeedsDept = (roleId, roles) =>
  Boolean(
    roles
      .find((r) => Number(r.roleId) === Number(roleId))
      ?.roleName?.match(DEPT_REQUIRED_ROLES),
  );

const INITIAL_CREDS = {
  username: "",
  password: "",
  roleId: "" as string | number,
  roleName: "",
  subDepartmentId: "" as string | number,
};

const INITIAL_ERRORS = {
  roleId: "",
  subDepartmentId: "",
  username: "",
  password: "",
  captcha: "",
};

const rejectedMessage = (reason) =>
  reason && typeof reason === "object" && "message" in reason && reason.message
    ? String(reason.message)
    : STRINGS.SYSTEM.UNEXPECTED_ERROR;

const isPasswordValid = (pw) => {
  if (!pw) return false;
  if (pw.length < 8) return false;
  if (!/^[A-Z]/.test(pw)) return false; // first char uppercase
  if (!/[0-9]/.test(pw)) return false; // at least one digit
  if (!/[^A-Za-z0-9]/.test(pw)) return false; // at least one special char
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  if (!hasUpper || !hasLower) return false; // not all caps, not all small
  return true;
};

/**
 * Login form state, lookups (roles / sub-departments), validation, and submit.
 * System lookups call the API layer directly so errors can be surfaced once (no duplicate controller toasts).
 */
export function useLoginForm({ navigate }) {
  const login = useAuthStore((s) => s.login);
  const { showAlert } = useAlertStore();

  const [credentials, setCredentials] = useState(INITIAL_CREDS);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [roles, setRoles] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [systemLookupsLoading, setSystemLookupsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaId, setCaptchaId] = useState(null);
  const [captchaReloadTrigger, setCaptchaReloadTrigger] = useState(0);

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
  const subDeptDropdownDisabled =
    systemLookupsLoading ||
    !showDeptDropdown ||
    subDeptsEmpty;

  const roleHelperText =
    errors.roleId ||
    (rolesEmpty ? STRINGS.AUTH.NO_ROLES_AVAILABLE : "");

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
        console.log(STRINGS.AUTH.LOGS.LOAD_START);
        console.log(STRINGS.AUTH.LOGS.API_ROLES);
        console.log(STRINGS.AUTH.LOGS.API_DEPTS);

        const [rolesSettled, depsSettled] = await Promise.allSettled([
          fetchRoles(),
          fetchDepartments(),
        ]);

        if (cancelled) return;

        let rolesData = [];
        if (rolesSettled.status === "fulfilled") {
          rolesData = Array.isArray(rolesSettled.value) ? rolesSettled.value : [];
          console.log(STRINGS.AUTH.LOGS.ROLES_LOADED, rolesData);
          if (rolesData.length === 0) showAlert(STRINGS.AUTH.NO_ROLES_AVAILABLE, "warning", { autoCloseMs: 2000 });
        } else {
          console.error(STRINGS.AUTH.ERRORS.FETCH_ROLES_FAILED, rolesSettled.reason);
          showAlert(rejectedMessage(rolesSettled.reason), "error", { autoCloseMs: 2000 });
        }

        let subData = [];

        const depsData =
          depsSettled.status === "fulfilled" && Array.isArray(depsSettled.value)
            ? depsSettled.value
            : [];

        if (depsSettled.status === "rejected") {
          console.error(STRINGS.AUTH.ERRORS.FETCH_DEPTS_FAILED, depsSettled.reason);
          showAlert(rejectedMessage(depsSettled.reason), "error", { autoCloseMs: 2000 });
        }

        // Preferred path: fetch sub-departments per departmentId, then flatten.
        if (depsData.length > 0) {
          console.log(`${STRINGS.AUTH.LOGS.DEPTS_LOADED_PREFIX}${depsData.length}`);
          console.log(STRINGS.AUTH.LOGS.API_SUB_DEPTS);

          const settledSubs = await Promise.allSettled(
            depsData.map((d) => {
              const departmentId = d.departmentId;
              console.log(STRINGS.AUTH.LOGS.FETCH_SUB_FOR, departmentId);
              return fetchSubDepartments(departmentId);
            }),
          );

          settledSubs.forEach((res, idx) => {
            if (res.status === "fulfilled") {
              const list = Array.isArray(res.value) ? res.value : [];
              console.log(
                `${STRINGS.AUTH.LOGS.SUB_DEPTS_IDX}${idx}:`,
                list.length,
              );
              subData = subData.concat(list);
            } else {
              console.warn(
                `${STRINGS.AUTH.LOGS.SUB_DEPTS_FAIL_IDX}${idx}:`,
                res.reason,
              );
            }
          });
        }

        if (subData.length === 0) {
          console.log(STRINGS.AUTH.LOGS.FB_FETCH_ALL);
          const subAllSettled = await Promise.allSettled([fetchSubDepartments()]);
          const subAll = subAllSettled[0];

          if (subAll.status === "fulfilled") {
            subData = Array.isArray(subAll.value) ? subAll.value : [];
            console.log(STRINGS.AUTH.LOGS.SUB_ALL_LOADED, subData.length);
          } else {
            console.error(STRINGS.AUTH.ERRORS.FETCH_SUB_DEPTS_FAILED, subAll.reason);
          }
        }

        if (subData.length === 0 && rolesData.length > 0) {
          showAlert(STRINGS.AUTH.NO_SUBDEPARTMENTS_FOR_LOGIN, "warning", { autoCloseMs: 2000 });
        }

        setRoles(rolesData);
        setSubDepartments(subData);
      } catch (err) {
        console.error(STRINGS.AUTH.ERRORS.LOOKUP_UNEXPECTED, err);
        showAlert(rejectedMessage(err), "error", { autoCloseMs: 2000 });
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

  const handleChange = useCallback((field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (field === "password") {
        if (!value || String(value).trim().length === 0) {
          return { ...prev, password: "" };
        }
        return {
          ...prev,
          password: isPasswordValid(String(value))
            ? ""
            : STRINGS.AUTH.VALIDATION.PASSWORD_INVALID,
        };
      }

      return prev[field] ? { ...prev, [field]: "" } : prev;
    });
  }, []);

  const handleRoleChange = useCallback((selectedRaw) => {
    const selectedId =
      selectedRaw === "" ? "" : Number(selectedRaw);
    const selected = roles.find((r) => Number(r.roleId) === selectedId);
    setCredentials((prev) => ({
      ...prev,
      roleId: selectedId === "" ? "" : selectedId,
      roleName: selected?.roleName ?? "",
      subDepartmentId: "",
    }));
    setErrors((prev) => ({ ...prev, roleId: "", subDepartmentId: "" }));
  }, [roles]);

  const handleCaptchaChange = useCallback((value, isValid) => {
    setCaptchaValue(value);
    setCaptchaValid(isValid ?? false);
    setErrors((prev) => (prev.captcha ? { ...prev, captcha: "" } : prev));
  }, []);

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
      (credentials.subDepartmentId === "" ||
        credentials.subDepartmentId == null)
    ) {
      if (subDeptsEmpty) {
        next.subDepartmentId = STRINGS.AUTH.NO_SUBDEPARTMENTS_FOR_LOGIN;
      } else {
        next.subDepartmentId = V.DEPARTMENT_REQUIRED;
      }
      valid = false;
    }
    if (!credentials.username.trim()) {
      next.username = V.USERNAME_REQUIRED;
      valid = false;
    }
    if (!credentials.password) {
      next.password = V.PASSWORD_REQUIRED;
      valid = false;
    } else if (!isPasswordValid(credentials.password)) {
      next.password = V.PASSWORD_INVALID;
      valid = false;
    }
    if (!captchaValue.trim()) {
      next.captcha = V.CAPTCHA_REQUIRED;
      valid = false;
    } else if (!captchaId || String(captchaId).trim().length === 0) {
      next.captcha = V.CAPTCHA_INVALID;
      valid = false;
    } else if (!captchaValid) {
      next.captcha = V.CAPTCHA_INVALID;
      valid = false;
    }

    setErrors(next);
    return valid;
  }, [
    credentials.roleId,
    credentials.subDepartmentId,
    credentials.username,
    credentials.password,
    captchaValue,
    captchaValid,
    captchaId,
    showDeptDropdown,
    rolesEmpty,
    subDeptsEmpty,
  ]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    if (submitting) return;

    setSubmitting(true);
    useAlertStore.setState({ loading: true });

    const currentUsername = credentials.username.trim();
    const currentPassword = credentials.password;
    const currentRoleId = credentials.roleId;
    const currentRoleName = credentials.roleName;
    const currentCaptchaId = captchaId;
    const currentCaptchaValue = captchaValue.trim();

    const requestPayload = {
      userId: currentUsername,
      password: currentPassword,
      role: {
        roleId: currentRoleId,
        roleName: currentRoleName,
      },
      captcha: {
        captchaId: currentCaptchaId,
        captchaValue: currentCaptchaValue,
      },
    };

    const response = await loginController(requestPayload);

    if (!response.success || !response.data) {
      showAlert(response.message || STRINGS.SYSTEM.UNEXPECTED_ERROR, "error", { autoCloseMs: 2000 });
      setCaptchaValue("");
      setCaptchaValid(false);
      setCaptchaId(null);
      setCaptchaReloadTrigger((prev) => prev + 1);
    } else {
      const user = response.data;
      if (
        showDeptDropdown &&
        !user.hasSubDeptAccess(credentials.subDepartmentId)
      ) {
        showAlert(STRINGS.AUTH.ACCESS_DENIED_DEPT, "error", { autoCloseMs: 2000 });
        setCaptchaValue("");
        setCaptchaValid(false);
        setCaptchaId(null);
        setCaptchaReloadTrigger((prev) => prev + 1);
      } else {
        login(user);
        const selectedSubDept = user.getSubDepartment(credentials.subDepartmentId);
        const route = getRouteByRole(user.role, credentials.subDepartmentId, selectedSubDept);
        navigate(route, { replace: true });
      }
    }

    useAlertStore.setState({ loading: false });
    setSubmitting(false);
  }, [
    credentials,
    validate,
    captchaId,
    captchaValue,
    login,
    navigate,
    showDeptDropdown,
    showAlert,
    submitting,
  ]);

  const passwordValid = isPasswordValid(credentials.password);
  const usernameFilled = credentials.username.trim().length > 0;
  const roleSelected = credentials.roleId !== "" && credentials.roleId != null;
  const subDeptSelected =
    !showDeptDropdown ||
    (credentials.subDepartmentId !== "" &&
      credentials.subDepartmentId != null);
  const captchaIdValid = captchaId != null && String(captchaId).trim().length > 0;
  const captchaFilled = captchaValue.trim().length > 0;

  const loginBlocked =
    systemLookupsLoading ||
    rolesEmpty ||
    (showDeptDropdown && subDeptsEmpty) ||
    !usernameFilled ||
    !passwordValid ||
    !roleSelected ||
    !subDeptSelected ||
    !captchaIdValid ||
    !captchaFilled ||
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
    captchaValue,
    captchaValid,
    captchaId,
    setCaptchaId,
    captchaReloadTrigger,
    handleChange,
    handleRoleChange,
    handleCaptchaChange,
    handleLogin,
    loadingMessage: STRINGS.AUTH.LOADING_LOOKUPS,
  };
}
