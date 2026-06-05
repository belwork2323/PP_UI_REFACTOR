// src/ui/pages/auth/LoginPage.jsx
import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Stack } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import Input from "../../components/common/Input";
import Dropdown from "../../components/common/Dropdown";
import Button from "../../components/common/Button";
import LoginFooter from "../../components/custom/LoginFooter";
import { icons } from "../../../app/theme/icons";
import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import IconButton from "@mui/material/IconButton";
import getLoginTheme from "../../../app/theme/custom_themes/auth/login_theme";
import { useThemeStore } from "../../../app/store/themeStore";
import CaptchaField from "./components/CaptchaField";
import FullPageLoader from "../../components/common/FullPageLoader";
import GlobalAlert from "../../components/common/GlobalAlertSnackBar";
import ResetPasswordForm from "./components/ResetPasswordForm";
import { useResetPasswordForm } from "../../../hooks/auth/resetPasswordHook";
import { useLoginForm } from "../../../hooks/auth/loginHook";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [authView, setAuthView] = useState("login");

  const handleBackFromReset = useCallback(() => {
    setAuthView("login");
    setSearchParams({});
  }, [setSearchParams]);

  const resetPassword = useResetPasswordForm({ onBack: handleBackFromReset });
  const loginForm = useLoginForm({ navigate });

  const { open, message, severity, loading, hideAlert } = useAlertStore();

  const mode = useThemeStore((s) => s.mode);
  const t = getLoginTheme(mode);

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "reset") setAuthView("reset");
  }, [searchParams]);

  return (
    <Box sx={t.page}>
      <FullPageLoader open={loading} message="Authenticating..." />

      <Box sx={t.toggleButton.wrapper}>
        <IconButton onClick={() => useThemeStore.getState().toggleMode()} sx={t.toggleButton.root}>
          {mode === "dark"
            ? <icons.lightModeToggleIcon sx={t.toggleButton.icon} />
            : <icons.darkModeToggleIcon sx={t.toggleButton.icon} />}
        </IconButton>
      </Box>

      <Box sx={t.belLogo.wrapper}>
        <img
          src="/src/assets/images/bel_logo_dark.png"
          alt="BEL Logo"
          style={t.belLogo.img as React.CSSProperties}
        />
      </Box>

      <Box sx={t.leftPanel.wrapper}>
        <Box sx={t.leftPanel.inner}>
          <Box sx={t.drdoLogo.wrapper}>
            <Box sx={t.drdoLogo.badge}>
              <img src="src/assets/images/DRDO-logo.png" alt="DRDO Logo" style={t.drdoLogo.img as React.CSSProperties} />
            </Box>
          </Box>
          <Typography sx={t.intro_details}>{STRINGS.LOGIN_DETAILS.CLIENT_DETAILS.DEPARTMENT_NAME}</Typography>
          <Typography sx={t.intro_details}>{STRINGS.LOGIN_DETAILS.CLIENT_DETAILS.RESEARCH_DETAILS}</Typography>
          <Typography sx={t.intro_details}>{STRINGS.LOGIN_DETAILS.CLIENT_DETAILS.ORG_NAME}</Typography>
          <Typography sx={t.title}>{STRINGS.LOGIN_DETAILS.TITLE}</Typography>
          <Typography sx={t.subtitle}>{STRINGS.LOGIN_DETAILS.SUBTITLE}</Typography>
          <Box>
            {STRINGS.AUTH.FEATURES.map((feature, index) => (
              <Box key={index} sx={t.featureCard.card}>
                <Typography sx={t.featureCard.title}>{feature.title}</Typography>
                <Typography sx={t.featureCard.description}>{feature.description}</Typography>
              </Box>
            ))}
          </Box>
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
              {authView === "login" ? (
                <>
                  <Box sx={t.cardHeading.wrapper}>
                    <Typography sx={t.cardHeading.title}>{STRINGS.AUTH.LOGIN_TITLE}</Typography>
                    <Typography sx={t.cardHeading.subtitle}>{STRINGS.AUTH.LOGIN_SUBTITLE}</Typography>
                  </Box>

                  <Box sx={t.form.wrapper}>
                    {loginForm.systemLookupsLoading && (
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
                        <CircularProgress size={22} thickness={5} />
                        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {loginForm.loadingMessage}
                        </Typography>
                      </Stack>
                    )}

                    <Dropdown
                      label="Select Role"
                      value={loginForm.credentials.roleId}
                      options={loginForm.roleOptions}
                      sx={t.roleDropdown.select}
                      disabled={loginForm.roleDropdownDisabled}
                      error={Boolean(loginForm.errors.roleId) || loginForm.rolesEmpty}
                      helperText={loginForm.roleHelperText}
                      onChange={(e) => loginForm.handleRoleChange(e.target.value)}
                    />

                    {loginForm.showDeptDropdown && (
                      <Dropdown
                        label="Select Sub Department"
                        value={loginForm.credentials.subDepartmentId}
                        options={loginForm.subDeptOptions}
                        sx={t.deptDropdown.select}
                        disabled={loginForm.subDeptDropdownDisabled}
                        error={
                          Boolean(loginForm.errors.subDepartmentId) ||
                          (loginForm.showDeptDropdown &&
                            !loginForm.systemLookupsLoading &&
                            loginForm.subDeptOptions.length === 0)
                        }
                        helperText={loginForm.subDeptHelperText}
                        onChange={(e) =>
                          loginForm.handleChange("subDepartmentId", e.target.value === "" ? "" : Number(e.target.value))
                        }
                      />
                    )}

                    <Input
                      label={STRINGS.AUTH.USERNAME_LABEL}
                      icon={<icons.person />}
                      sx={t.inputField.sx}
                      value={loginForm.credentials.username}
                      error={Boolean(loginForm.errors.username)}
                      helperText={loginForm.errors.username}
                      onChange={(e) => loginForm.handleChange("username", e.target.value)}
                    />

                    <Input
                      label={STRINGS.AUTH.PASSWORD_LABEL}
                      type="password"
                      icon={<icons.lock />}
                      sx={t.inputField.sx}
                      value={loginForm.credentials.password}
                      error={Boolean(loginForm.errors.password)}
                      helperText={loginForm.errors.password}
                      onChange={(e) => loginForm.handleChange("password", e.target.value)}
                    />

                    <CaptchaField
                      label="Enter Captcha"
                      required
                      error={Boolean(loginForm.errors.captcha)}
                      helperText={loginForm.errors.captcha}
                      onChange={loginForm.handleCaptchaChange}
                      onCaptchaId={loginForm.setCaptchaId}
                      reloadKey={loginForm.captchaReloadTrigger}
                    />

                    <Button
                      fullWidth
                      startIcon={<icons.login />}
                      onClick={loginForm.handleLogin}
                      disabled={loginForm.loginBlocked || loginForm.submitting}
                      sx={t.loginButton.sx}
                    >
                      {STRINGS.AUTH.LOGIN_BUTTON}
                    </Button>

                    <Typography sx={t.forgotPassword} onClick={() => setAuthView("reset")}>
                      {STRINGS.AUTH.FORGOT_PASSWORD}
                    </Typography>
                  </Box>
                </>
              ) : (
                <ResetPasswordForm
                  t={t}
                  values={resetPassword.values}
                  errors={resetPassword.errors}
                  canSubmit={resetPassword.canSubmit}
                  submitting={resetPassword.submitting}
                  onFieldChange={resetPassword.setField}
                  onSubmit={resetPassword.handleSubmit}
                  onBack={resetPassword.handleBack}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <LoginFooter />
    </Box>
  );
};

export default LoginPage;
