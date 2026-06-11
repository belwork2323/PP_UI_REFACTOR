import { Box } from "@mui/material";
import AppHeader from "./components/custom/AppHeader";
import AppFooter from "./components/custom/AppFooter";
import ConfirmAlertDialog from "./components/common/ConfirmAlertDialog";
import { Outlet } from "react-router-dom";
import { useMainLayoutHook } from "@hooks/custom/useMainLayoutHook";
import { STRINGS } from "@app/config/strings";

const ML = STRINGS.MAIN_LAYOUT;

const MainLayout = () => {
  const {
    logoutConfirmOpen,
    handleLogout,
    handleConfirmLogout,
    cancelLogout,
  } = useMainLayoutHook();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppHeader title={ML.HEADER_TITLE} onLogout={handleLogout} />

      <ConfirmAlertDialog
        open={logoutConfirmOpen}
        title={ML.LOGOUT_CONFIRM_TITLE}
        message={ML.LOGOUT_CONFIRM_MESSAGE}
        confirmLabel={ML.LOGOUT_CONFIRM_LABEL}
        cancelLabel={ML.LOGOUT_CANCEL_LABEL}
        severity="warning"
        onConfirm={handleConfirmLogout}
        onCancel={cancelLogout}
      />

      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <AppFooter />
    </Box>
  );
};

export default MainLayout;
