import React from "react";
import { Box } from "@mui/material";
import DashboardPage from "./components/DashboardPage";
import { useThemeStore } from "../../../app/store/themeStore";
import getDashboardTheme from "../../../app/theme/custom_themes/admin/dashboard_theme";

const AdminDashboard = () => {
  const mode = useThemeStore((s) => s.mode);
  const th = getDashboardTheme(mode);

  return (
    <Box sx={th.dashboard.adminWrapper}>
      <DashboardPage mode={mode} />
    </Box>
  );
};

export default AdminDashboard;