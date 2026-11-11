import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Zoom,
} from "@mui/material";
import Input from "./Input";
import PasswordRulesList from "./PasswordRulesList";
import AdminManagementFormHeader from "../custom/admin/AdminManagementFormHeader";
import { getAdminCommonTheme } from "../../../app/theme/custom_themes/admin/admin_common_theme";
import { useThemeStore } from "../../../app/store/themeStore";
import { icons } from "../../../app/theme/icons";
import { STRINGS } from "../../../app/config/strings";
import { useChangePasswordForm } from "../../../hooks/auth/changePasswordHook";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ChangePasswordDialog = ({ open, onClose }: Props) => {
  const mode = useThemeStore((s) => s.mode);
  const t = getAdminCommonTheme(mode);
  const { modal } = t;

  const form = useChangePasswordForm({
    forced: false,
    onSuccess: onClose,
  });

  const handleClose = () => {
    if (!form.submitting) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Zoom}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          ...modal.paper,
          ...modal.paperMd,
          height: "auto",
          maxHeight: "85vh",
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <AdminManagementFormHeader
          icon={<icons.lock sx={modal.header.icon} />}
          title={STRINGS.AUTH.CHANGE_PASSWORD_TITLE}
          subtitle={STRINGS.AUTH.CHANGE_PASSWORD_SUBTITLE}
          onClose={handleClose}
          closeDisabled={form.submitting}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>
          <Input
            fullWidth
            label={STRINGS.AUTH.CURRENT_PASSWORD_LABEL}
            type="password"
            value={form.values.currentPassword}
            error={Boolean(form.errors.currentPassword)}
            helperText={form.errors.currentPassword}
            onChange={(e) => form.setField("currentPassword", e.target.value)}
            disabled={form.submitting}
            size="small"
          />
          <Input
            fullWidth
            label={STRINGS.AUTH.NEW_PASSWORD_LABEL}
            type="password"
            value={form.values.newPassword}
            error={Boolean(form.errors.newPassword)}
            helperText={form.errors.newPassword}
            onChange={(e) => form.setField("newPassword", e.target.value)}
            disabled={form.submitting}
            size="small"
          />
          <Input
            fullWidth
            label={STRINGS.AUTH.CONFIRM_PASSWORD_LABEL}
            type="password"
            value={form.values.confirmPassword}
            error={Boolean(form.errors.confirmPassword)}
            helperText={form.errors.confirmPassword}
            onChange={(e) => form.setField("confirmPassword", e.target.value)}
            disabled={form.submitting}
            size="small"
          />
          <PasswordRulesList rules={form.rules} />
        </Stack>
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button onClick={handleClose} disabled={form.submitting} sx={modal.cancelButton}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={form.handleSubmit}
          disabled={!form.canSubmit}
          sx={modal.saveButton}
        >
          {STRINGS.AUTH.CHANGE_PASSWORD_BUTTON}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
