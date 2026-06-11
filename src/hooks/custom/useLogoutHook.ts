import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authLoginController } from "@controllers/auth/login/loginController";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";

export function useLogoutHook() {
  const navigate = useNavigate();
  const { showAlert } = useAlertStore();

  const confirmLogout = useCallback(async (): Promise<boolean> => {
    const result = await authLoginController.logout();
    if (result.success) {
      navigate("/login", { replace: true });
      return true;
    }

    showAlert(result.message || STRINGS.AUTH.LOGOUT_FAILED, "error", { autoCloseMs: 3000 });
    return false;
  }, [navigate, showAlert]);

  return { confirmLogout };
}
