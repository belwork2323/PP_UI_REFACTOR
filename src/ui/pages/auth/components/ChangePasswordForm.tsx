import { Box, Stack, Typography } from "@mui/material";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import PasswordRulesList from "../../../components/common/PasswordRulesList";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import type { LoginTheme } from "@app/theme/custom_themes/auth/login_theme";
import type { PasswordRuleCheck } from "../../../../utils/passwordPolicy";

type ChangePasswordFormProps = {
  theme: LoginTheme;
  values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  errors: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  rules: PasswordRuleCheck[];
  canSubmit: boolean;
  submitting: boolean;
  onFieldChange: (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string,
  ) => void;
  onSubmit: () => void;
  onLogout: () => void;
};

const ChangePasswordForm = ({
  theme: t,
  values,
  errors,
  rules,
  canSubmit,
  submitting,
  onFieldChange,
  onSubmit,
  onLogout,
}: ChangePasswordFormProps) => {
  const strings = STRINGS.AUTH;

  return (
    <>
      <Box sx={t.changePassword.heading}>
        <Typography sx={t.cardHeading.title}>{strings.CHANGE_PASSWORD_TITLE}</Typography>
        <Typography sx={t.cardHeading.subtitle}>{strings.CHANGE_PASSWORD_FORCED_SUBTITLE}</Typography>
      </Box>

      <Box sx={t.form.wrapper}>
        <Input
          label={strings.CURRENT_PASSWORD_LABEL}
          type="password"
          icon={<icons.lock />}
          sx={t.inputField.sx}
          value={values.currentPassword}
          error={Boolean(errors.currentPassword)}
          helperText={errors.currentPassword}
          onChange={(e) => onFieldChange("currentPassword", e.target.value)}
          disabled={submitting}
          inputProps={{
            maxLength: 20,
            minLength: 8,
          }}
        />
        <Input
          label={strings.NEW_PASSWORD_LABEL}
          type="password"
          icon={<icons.lock />}
          sx={t.inputField.sx}
          value={values.newPassword}
          error={Boolean(errors.newPassword)}
          helperText={errors.newPassword}
          onChange={(e) => onFieldChange("newPassword", e.target.value)}
          disabled={submitting}
          inputProps={{
            maxLength: 20,
            minLength: 8,
          }}
        />
        <Input
          label={strings.CONFIRM_PASSWORD_LABEL}
          type="password"
          icon={<icons.lock />}
          sx={t.inputField.sx}
          value={values.confirmPassword}
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword}
          onChange={(e) => onFieldChange("confirmPassword", e.target.value)}
          disabled={submitting}
          inputProps={{
            maxLength: 20,
            minLength: 8,
          }}
        />

        <PasswordRulesList rules={rules} />

        <Stack sx={t.changePassword.actions}>
          <Button fullWidth onClick={onSubmit} disabled={!canSubmit} sx={t.resetForm.requestButton.sx}>
            {strings.CHANGE_PASSWORD_BUTTON}
          </Button>
          <Button fullWidth variant="text" onClick={onLogout} disabled={submitting}>
            {STRINGS.APP_HEADER.LOGOUT_LABEL}
          </Button>
        </Stack>
      </Box>
    </>
  );
};

export default ChangePasswordForm;
