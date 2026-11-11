import { Box, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import LoginFooter from "../../components/custom/LoginFooter";
import FullPageLoader from "../../components/common/FullPageLoader";
import GlobalAlert from "../../components/common/GlobalAlertSnackBar";
import PasswordRulesList from "../../components/common/PasswordRulesList";
import { icons } from "../../../app/theme/icons";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useThemeStore } from "../../../app/store/themeStore";
import { useAuthStore } from "../../../app/store/authStore";
import getLoginTheme from "../../../app/theme/custom_themes/auth/login_theme";
import { useChangePasswordForm } from "../../../hooks/auth/changePasswordHook";
import { images } from "@app/assets/images";
import { useEffect } from "react";
import { logoutController } from "../../../controllers/auth/authController";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const mode = useThemeStore((s) => s.mode);
  const t = getLoginTheme(mode);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated || !!s.user);
  const { open, message, severity, loading, hideAlert } = useAlertStore();

  const form = useChangePasswordForm({ forced: true, navigate });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logoutController();
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={t.page}>
      <FullPageLoader open={loading || form.submitting} message="Updating password..." />

      <Box sx={t.toggleButton.wrapper}>
        <IconButton onClick={() => useThemeStore.getState().toggleMode()} sx={t.toggleButton.root}>
          {mode === "dark" ? (
            <icons.lightModeToggleIcon sx={t.toggleButton.icon} />
          ) : (
            <icons.darkModeToggleIcon sx={t.toggleButton.icon} />
          )}
        </IconButton>
      </Box>

      <Box sx={t.belLogo.wrapper}>
        <img
          src={images.belLogoDark}
          alt="BEL Logo"
          style={t.belLogo.img as React.CSSProperties}
        />
      </Box>

      <Box sx={t.leftPanel.wrapper}>
        <Box sx={t.leftPanel.inner}>
          <Box sx={t.drdoLogo.wrapper}>
            <Box sx={t.drdoLogo.badge}>
              <img
                src={images.drdoLogo}
                alt="DRDO Logo"
                style={t.drdoLogo.img as React.CSSProperties}
              />
            </Box>
          </Box>
          <Typography sx={t.intro_details}>
            {STRINGS.LOGIN_DETAILS.CLIENT_DETAILS.DEPARTMENT_NAME}
          </Typography>
          <Typography sx={t.intro_details}>
            {STRINGS.LOGIN_DETAILS.CLIENT_DETAILS.RESEARCH_DETAILS}
          </Typography>
          <Typography sx={t.intro_details}>
            {STRINGS.LOGIN_DETAILS.CLIENT_DETAILS.ORG_NAME}
          </Typography>
          <Typography sx={t.title}>{STRINGS.LOGIN_DETAILS.TITLE}</Typography>
          <Typography sx={t.subtitle}>{STRINGS.LOGIN_DETAILS.SUBTITLE}</Typography>
        </Box>
      </Box>

      <Box sx={t.rightPanel.wrapper}>
        <Box sx={{ position: "relative" }}>
          <GlobalAlert
            open={open}
            message={message}
            severity={severity}
            onClose={hideAlert}
            customPosition={true}
          />
          <Card elevation={20} sx={t.loginCard.card}>
            <CardContent sx={t.loginCard.cardContent}>
              <Box sx={{ ...t.cardHeading.wrapper, textAlign: "left", mb: 2 }}>
                <Typography sx={t.cardHeading.title}>
                  {STRINGS.AUTH.CHANGE_PASSWORD_TITLE}
                </Typography>
                <Typography sx={t.cardHeading.subtitle}>
                  {STRINGS.AUTH.CHANGE_PASSWORD_FORCED_SUBTITLE}
                </Typography>
              </Box>

              <Box sx={t.form.wrapper}>
                <Input
                  label={STRINGS.AUTH.CURRENT_PASSWORD_LABEL}
                  type="password"
                  icon={<icons.lock />}
                  sx={t.inputField.sx}
                  value={form.values.currentPassword}
                  error={Boolean(form.errors.currentPassword)}
                  helperText={form.errors.currentPassword}
                  onChange={(e) => form.setField("currentPassword", e.target.value)}
                  disabled={form.submitting}
                />
                <Input
                  label={STRINGS.AUTH.NEW_PASSWORD_LABEL}
                  type="password"
                  icon={<icons.lock />}
                  sx={t.inputField.sx}
                  value={form.values.newPassword}
                  error={Boolean(form.errors.newPassword)}
                  helperText={form.errors.newPassword}
                  onChange={(e) => form.setField("newPassword", e.target.value)}
                  disabled={form.submitting}
                />
                <Input
                  label={STRINGS.AUTH.CONFIRM_PASSWORD_LABEL}
                  type="password"
                  icon={<icons.lock />}
                  sx={t.inputField.sx}
                  value={form.values.confirmPassword}
                  error={Boolean(form.errors.confirmPassword)}
                  helperText={form.errors.confirmPassword}
                  onChange={(e) => form.setField("confirmPassword", e.target.value)}
                  disabled={form.submitting}
                />

                <PasswordRulesList rules={form.rules} />

                <Stack gap={1.5} sx={{ mt: 1 }}>
                  <Button
                    fullWidth
                    onClick={form.handleSubmit}
                    disabled={!form.canSubmit}
                    sx={t.resetForm?.requestButton?.sx}
                  >
                    {STRINGS.AUTH.CHANGE_PASSWORD_BUTTON}
                  </Button>
                  <Button fullWidth variant="text" onClick={handleLogout} disabled={form.submitting}>
                    {STRINGS.APP_HEADER.LOGOUT_LABEL}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <LoginFooter />
      </Box>
    </Box>
  );
};

export default ChangePasswordPage;
