import { Box, CircularProgress, Typography } from "@mui/material";
import Input from "../../../components/common/Input";
import Dropdown from "../../../components/common/Dropdown";
import Button from "../../../components/common/Button";
import { FieldLabelWithAsterisk } from "../../../components/common/FieldLabelWithAsterisk";
import CaptchaField from "../../../components/custom/auth/CaptchaField";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import type { LoginTheme } from "@app/theme/custom_themes/auth/login_theme";

type Option = { value: string | number; label: string };

type LoginFormProps = {
  theme: LoginTheme;
  credentials: {
    roleId: string | number;
    subDepartmentId: string | number;
    username: string;
    password: string;
  };
  errors: {
    roleId: string;
    subDepartmentId: string;
    username: string;
    password: string;
    captcha: string;
  };
  roleOptions: Option[];
  subDeptOptions: Option[];
  showDeptDropdown: boolean;
  systemLookupsLoading: boolean;
  rolesEmpty: boolean;
  roleDropdownDisabled: boolean;
  subDeptDropdownDisabled: boolean;
  roleHelperText: string;
  subDeptHelperText: string;
  loginBlocked: boolean;
  submitting: boolean;
  loadingMessage: string;
  captchaReloadTrigger: number;
  onRoleChange: (value: string | number) => void;
  onChange: (field: string, value: string | number) => void;
  onCaptchaChange: (value: string, isValid?: boolean) => void;
  onCaptchaId: (id: string) => void;
  onLogin: () => void;
  onForgotPassword: () => void;
};

const LoginForm = ({
  theme: t,
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
  loadingMessage,
  captchaReloadTrigger,
  onRoleChange,
  onChange,
  onCaptchaChange,
  onCaptchaId,
  onLogin,
  onForgotPassword,
}: LoginFormProps) => {
  const strings = STRINGS.AUTH;

  return (
    <>
      <Box sx={t.cardHeading.wrapper}>
        <Typography sx={t.cardHeading.title}>{strings.LOGIN_TITLE}</Typography>
        <Typography sx={t.cardHeading.subtitle}>{strings.LOGIN_SUBTITLE}</Typography>
      </Box>

      <Box sx={t.form.wrapper}>
        {systemLookupsLoading && (
          <Box sx={t.lookupRow}>
            <CircularProgress size={22} thickness={5} />
            <Typography sx={t.lookupText}>{loadingMessage}</Typography>
          </Box>
        )}

        <Dropdown
          label={<FieldLabelWithAsterisk label={strings.SELECT_ROLE} required />}
          value={credentials.roleId}
          options={roleOptions}
          sx={t.dropdown.select}
          disabled={roleDropdownDisabled}
          error={Boolean(errors.roleId) || rolesEmpty}
          helperText={roleHelperText}
          onChange={(e) => onRoleChange(e.target.value)}
        />

        {showDeptDropdown && (
          <Dropdown
            label={<FieldLabelWithAsterisk label={strings.SELECT_SUB_DEPARTMENT} required />}
            value={credentials.subDepartmentId}
            options={subDeptOptions}
            sx={t.dropdown.select}
            disabled={subDeptDropdownDisabled}
            error={
              Boolean(errors.subDepartmentId) ||
              (!systemLookupsLoading && subDeptOptions.length === 0)
            }
            helperText={subDeptHelperText}
            onChange={(e) =>
              onChange("subDepartmentId", e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        )}

        <Input
          label={<FieldLabelWithAsterisk label={strings.USERNAME_LABEL} required />}
          icon={<icons.person />}
          sx={t.inputField.sx}
          value={credentials.username}
          error={Boolean(errors.username)}
          helperText={errors.username}
          onChange={(e) => onChange("username", e.target.value)}
          inputProps={{
            maxLength: 20,
            minLength: 3,
          }}
        />

        <Input
          label={<FieldLabelWithAsterisk label={strings.PASSWORD_LABEL} required />}
          type="password"
          icon={<icons.lock />}
          sx={t.inputField.sx}
          value={credentials.password}
          error={Boolean(errors.password)}
          helperText={errors.password}
          onChange={(e) => onChange("password", e.target.value)}
          inputProps={{
            maxLength: 20,
            minLength: 8,
            spellCheck: false,
          }}
        />

        <CaptchaField
          theme={t.captcha}
          label={<FieldLabelWithAsterisk label={STRINGS.CAPTCHA.LABEL} required />}
          error={Boolean(errors.captcha)}
          helperText={errors.captcha}
          onChange={onCaptchaChange}
          onCaptchaId={onCaptchaId}
          reloadKey={captchaReloadTrigger}
        />

        <Button
          fullWidth
          startIcon={<icons.login />}
          onClick={onLogin}
          disabled={loginBlocked || submitting}
          sx={t.loginButton.sx}
        >
          {strings.LOGIN_BUTTON}
        </Button>

        <Typography sx={t.forgotPassword} onClick={onForgotPassword}>
          {strings.FORGOT_PASSWORD}
        </Typography>
      </Box>
    </>
  );
};

export default LoginForm;
