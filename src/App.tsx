import AppRoutes from "./app/routes/AppRoutes";
import { useAlertStore } from "./app/store/alertStore";
import FullPageLoader from "./ui/components/common/FullPageLoader";

import GlobalAlertDialog from "./ui/components/common/GlobalAlert";

const App = () => {
  const { loading } = useAlertStore();
  return (
    <>
      <FullPageLoader open={loading} />
      <GlobalAlertDialog />
      <AppRoutes />
    </>
  );
};

export default App;
