import { useState, useCallback } from "react";
import { useLogoutHook } from "@hooks/custom/useLogoutHook";

export function useMainLayoutHook() {
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { confirmLogout } = useLogoutHook();

  const handleLogout = useCallback(() => {
    setLogoutConfirmOpen(true);
  }, []);

  const handleConfirmLogout = useCallback(async () => {
    setLogoutConfirmOpen(false);
    await confirmLogout();
  }, [confirmLogout]);

  const cancelLogout = useCallback(() => {
    setLogoutConfirmOpen(false);
  }, []);

  return {
    logoutConfirmOpen,
    handleLogout,
    handleConfirmLogout,
    cancelLogout,
  };
}
