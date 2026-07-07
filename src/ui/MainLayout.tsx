// app/layout/MainLayout.jsx
import { Box } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "./components/custom/AppHeader";
import AppFooter from "./components/custom/AppFooter";
import ConfirmAlertDialog from "./components/common/ConfirmAlertDialog";
import { logoutController } from "../controllers/auth/authController";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const navigate = useNavigate();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false);
    const success = await logoutController();
    if (success) {
      navigate("/login", { replace: true });
    }
  };

  const cancelLogout = () => {
    setLogoutConfirmOpen(false);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppHeader
        title="Blockchain Based Propellant Processing System"
        onNavSelect={() => {}}
        onLogout={handleLogout}
      />

      <ConfirmAlertDialog
        open={logoutConfirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        severity="warning"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />

      {/* Routed page content */}
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <AppFooter />
    </Box>
  );
};

export default MainLayout;