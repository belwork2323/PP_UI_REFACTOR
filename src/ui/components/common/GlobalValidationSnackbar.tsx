import { Snackbar, Alert, Slide } from "@mui/material";
import { useAlertStore } from "../../../app/store/alertStore";

const GlobalValidationSnackbar = () => {
  const { open, message, severity, display, hideAlert } = useAlertStore();

  if (display !== "snackbar") {
    return null;
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={hideAlert}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      TransitionComponent={Slide}
      transitionDuration={{ enter: 200, exit: 150 }}
      sx={{ top: { xs: 16, sm: 24 } }}
    >
      <Alert
        onClose={hideAlert}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
          maxWidth: 480,
          py: 0.5,
          px: 1.5,
          fontSize: "0.8125rem",
          alignItems: "center",
          boxShadow: 3,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalValidationSnackbar;
