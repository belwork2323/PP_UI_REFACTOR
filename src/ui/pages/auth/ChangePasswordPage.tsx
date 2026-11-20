import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import { useAuthStore } from "@app/store/authStore";
import { logoutController } from "@controllers/auth/authController";
import { useChangePasswordForm } from "@hooks/auth/changePasswordHook";
import AuthPageShell from "../../components/custom/auth/AuthPageShell";
import ChangePasswordForm from "./components/ChangePasswordForm";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated || !!state.user);
  const loading = useAlertStore((state) => state.loading);
  const strings = STRINGS.AUTH;
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
    <AuthPageShell
      loaderOpen={loading || form.submitting}
      loaderMessage={strings.UPDATING_PASSWORD}
    >
      {(theme) => (
        <ChangePasswordForm
          theme={theme}
          values={form.values}
          errors={form.errors}
          rules={form.rules}
          canSubmit={form.canSubmit}
          submitting={form.submitting}
          onFieldChange={form.setField}
          onSubmit={form.handleSubmit}
          onLogout={handleLogout}
        />
      )}
    </AuthPageShell>
  );
};

export default ChangePasswordPage;
