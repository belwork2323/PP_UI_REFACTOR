import { ThemeProvider, CssBaseline } from "@mui/material";
import AppRoutes from "./app/routes/AppRoutes";
import theme from "./app/theme";
import { useAlertStore } from "./app/store/alertStore";
import FullPageLoader from "./ui/components/common/FullPageLoader";

import GlobalAlertDialog from "./ui/components/common/GlobalAlert";

const App = () => {
  const { loading } = useAlertStore();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FullPageLoader open={loading} />
      <GlobalAlertDialog />
      <AppRoutes />
    </ThemeProvider>
  );
};

export default App;
