import { Box, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { icons } from "../../../../app/theme";
import { STRINGS } from "../../../../app/config/strings";

/**
 * Presentational only — logic lives in `useResetPasswordForm`.
 */
const ResetPasswordForm = ({
  t,
  values,
  errors,
  canSubmit,
  submitting,
  onFieldChange,
  onSubmit,
  onBack,
}) => (
  <>
    <Box sx={t.resetForm.topBar}>
      <IconButton
        type="button"
        onClick={onBack}
        aria-label={STRINGS.AUTH.BACK_TO_LOGIN}
        sx={t.resetForm.backButton}
        size="small"
      >
        <ArrowBackRoundedIcon />
      </IconButton>
      <Box sx={{ flex: 1, ...t.cardHeading.wrapper, mb: 0, textAlign: "left" }}>
        <Typography sx={t.cardHeading.title}>{STRINGS.AUTH.RESET_TITLE}</Typography>
        <Typography sx={t.cardHeading.subtitle}>{STRINGS.AUTH.RESET_SUBTITLE}</Typography>
      </Box>
    </Box>

    <Box sx={t.form.wrapper}>
      <Input
        label={STRINGS.AUTH.USER_ID_LABEL}
        icon={<icons.person />}
        sx={t.inputField.sx}
        value={values.userId}
        error={Boolean(errors.userId)}
        helperText={errors.userId}
        onChange={(e) => onFieldChange("userId", e.target.value)}
        disabled={submitting}
      />

      <Input
        label={STRINGS.AUTH.REASON_LABEL}
        icon={<DescriptionOutlinedIcon />}
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

      <Stack gap={1.5}>
        <Button
          fullWidth
          startIcon={<icons.reset />}
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          sx={t.resetForm.requestButton.sx}
        >
          {STRINGS.AUTH.REQUEST_RESET_BUTTON}
        </Button>
      </Stack>
    </Box>
  </>
);

export default ResetPasswordForm;
