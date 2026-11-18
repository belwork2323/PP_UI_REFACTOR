import { useEffect, useMemo } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import AppRoutes from "./app/routes/AppRoutes";
import { createAppMuiTheme } from "./app/theme/createAppMuiTheme";
import { useThemeStore } from "./app/store/themeStore";
import { useAlertStore } from "./app/store/alertStore";
import FullPageLoader from "./ui/components/common/FullPageLoader";

import GlobalAlertDialog from "./ui/components/common/GlobalAlert";
import GlobalValidationSnackbar from "./ui/components/common/GlobalValidationSnackbar";

const App = () => {
  const { loading } = useAlertStore();
  const mode = useThemeStore((s) => s.mode);
  const theme = useMemo(() => createAppMuiTheme(mode), [mode]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FullPageLoader open={loading} message="Loading…" />
      <GlobalAlertDialog />
      <GlobalValidationSnackbar />
      <AppRoutes />
    </ThemeProvider>
  );
};

export default App;
