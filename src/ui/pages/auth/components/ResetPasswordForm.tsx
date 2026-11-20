import { Box, IconButton, Stack, Typography } from "@mui/material";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { FieldLabelWithAsterisk } from "../../../components/common/FieldLabelWithAsterisk";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import type { LoginTheme } from "@app/theme/custom_themes/auth/login_theme";

type ResetPasswordFormProps = {
  theme: LoginTheme;
  values: { userId: string; reason: string };
  errors: { userId: string; reason: string };
  canSubmit: boolean;
  submitting: boolean;
  onFieldChange: (field: "userId" | "reason", value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const ResetPasswordForm = ({
  theme: t,
  values,
  errors,
  canSubmit,
  submitting,
  onFieldChange,
  onSubmit,
  onBack,
}: ResetPasswordFormProps) => {
  const strings = STRINGS.AUTH;
  const BackIcon = icons.auth.back;
  const ReasonIcon = icons.auth.description;

  return (
    <>
      <Box sx={t.resetForm.topBar}>
        <IconButton
          type="button"
          onClick={onBack}
          aria-label={strings.BACK_TO_LOGIN}
          sx={t.resetForm.backButton}
          size="small"
        >
          <BackIcon />
        </IconButton>
        <Box sx={t.resetForm.heading}>
          <Typography sx={t.cardHeading.title}>{strings.RESET_TITLE}</Typography>
          <Typography sx={t.cardHeading.subtitle}>{strings.RESET_SUBTITLE}</Typography>
        </Box>
      </Box>

      <Box sx={t.form.wrapper}>
        <Input
          label={<FieldLabelWithAsterisk label={strings.USER_ID_LABEL} required />}
          icon={<icons.person />}
          sx={t.inputField.sx}
          value={values.userId}
          error={Boolean(errors.userId)}
          helperText={errors.userId}
          onChange={(e) => onFieldChange("userId", e.target.value)}
          disabled={submitting}
          inputProps={{
            maxLength: 20,
            minLength: 3,
          }}
        />

        <Input
          label={<FieldLabelWithAsterisk label={strings.REASON_LABEL} required />}
          icon={<ReasonIcon />}
          sx={{ ...t.inputField.sx, ...t.resetForm.reasonField }}
          value={values.reason}
          error={Boolean(errors.reason)}
          helperText={errors.reason}
          onChange={(e) => onFieldChange("reason", e.target.value)}
          disabled={submitting}
          multiline
          minRows={3}
          maxRows={8}
        />

        <Stack sx={t.resetForm.actions}>
          <Button
            fullWidth
            startIcon={<icons.reset />}
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            sx={t.resetForm.requestButton.sx}
          >
            {strings.REQUEST_RESET_BUTTON}
          </Button>
        </Stack>
      </Box>
    </>
  );
};

export default ResetPasswordForm;
