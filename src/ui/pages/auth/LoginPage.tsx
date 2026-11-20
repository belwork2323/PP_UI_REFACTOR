import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import { useLoginForm } from "@hooks/auth/loginHook";
import { useResetPasswordForm } from "@hooks/auth/resetPasswordHook";
import AuthPageShell from "../../components/custom/auth/AuthPageShell";
import LoginForm from "./components/LoginForm";
import ResetPasswordForm from "./components/ResetPasswordForm";

type AuthView = "login" | "reset";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authView, setAuthView] = useState<AuthView>("login");
  const loading = useAlertStore((state) => state.loading);
  const strings = STRINGS.AUTH;

  const handleBackFromReset = useCallback(() => {
    setAuthView("login");
    setSearchParams({});
  }, [setSearchParams]);

  const resetPassword = useResetPasswordForm({ onBack: handleBackFromReset });
  const loginForm = useLoginForm({ navigate });

  useEffect(() => {
    if (searchParams.get("mode") === "reset") setAuthView("reset");
  }, [searchParams]);

  return (
    <AuthPageShell
      loaderOpen={loading}
      loaderMessage={strings.AUTHENTICATING}
      showFeatures
    >
      {(theme) =>
        authView === "login" ? (
          <LoginForm
            theme={theme}
            credentials={loginForm.credentials}
            errors={loginForm.errors}
            roleOptions={loginForm.roleOptions}
            subDeptOptions={loginForm.subDeptOptions}
            showDeptDropdown={loginForm.showDeptDropdown}
            systemLookupsLoading={loginForm.systemLookupsLoading}
            rolesEmpty={loginForm.rolesEmpty}
            roleDropdownDisabled={loginForm.roleDropdownDisabled}
            subDeptDropdownDisabled={loginForm.subDeptDropdownDisabled}
            roleHelperText={loginForm.roleHelperText}
            subDeptHelperText={loginForm.subDeptHelperText}
            loginBlocked={loginForm.loginBlocked}
            submitting={loginForm.submitting}
            loadingMessage={loginForm.loadingMessage}
            captchaReloadTrigger={loginForm.captchaReloadTrigger}
            onRoleChange={loginForm.handleRoleChange}
            onChange={loginForm.handleChange}
            onCaptchaChange={loginForm.handleCaptchaChange}
            onCaptchaId={loginForm.setCaptchaId}
            onLogin={loginForm.handleLogin}
            onForgotPassword={() => setAuthView("reset")}
          />
        ) : (
          <ResetPasswordForm
            theme={theme}
            values={resetPassword.values}
            errors={resetPassword.errors}
            canSubmit={resetPassword.canSubmit}
            submitting={resetPassword.submitting}
            onFieldChange={resetPassword.setField}
            onSubmit={resetPassword.handleSubmit}
            onBack={resetPassword.handleBack}
          />
        )
      }
    </AuthPageShell>
  );
};

export default LoginPage;
