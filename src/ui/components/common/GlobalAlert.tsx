import { Dialog, DialogContent, Typography, Box, CircularProgress, alpha, keyframes } from "@mui/material";

import { useAlertStore } from "../../../app/store/alertStore";
import { icons } from "../../../app/theme/icons";
import colors from "../../../app/theme/colors";
import fonts from "../../../app/theme/fonts";

/* ===========================
   Animations
=========================== */
const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const slideUp = keyframes`
  0% { transform: translateY(12px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

/* ===========================
   Alert Config (Central)
=========================== */
const ALERT_CONFIG = {
  success: {
    Icon: icons.success,
    color: colors.success.main,
    bg: alpha(colors.success.main, 0.1),
  },
  error: {
    Icon: icons.error,
    color: colors.error.main,
    bg: alpha(colors.error.main, 0.1),
  },
  warning: {
    Icon: icons.warning,
    color: colors.warning.main,
    bg: alpha(colors.warning.main, 0.1),
  },
  info: {
    Icon: icons.info,
    color: colors.info.main,
    bg: alpha(colors.info.main, 0.1),
  },
};

const GlobalAlertDialog = () => {
  const { open, message, severity, loading } = useAlertStore();

  // Prevent this global dialog from rendering on the login route
  // because LoginPage has a custom positioned Snackbar that uses the exact same store.
  if (window.location.pathname === "/" || window.location.pathname.includes("login")) {
    return null;
  }

  const config = ALERT_CONFIG[severity] || ALERT_CONFIG.info;
  const { Icon, color, bg } = config;

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      onClose={() => {}} // ignore backdrop click
      disableEscapeKeyDown // block ESC
      PaperProps={{
        sx: {
          borderRadius: "24px",
          px: 1,
          py: 3,
          boxShadow: (theme) => `0 12px 40px ${alpha(theme.palette.secondary.dark, 0.1)}`,
          backgroundImage: "none",
        }
      }}
    >
      <DialogContent sx={{ overflow: "hidden" }}>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" gap={3}>
          
          {/* Animated Icon Container */}
          <Box
            sx={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 80, height: 80, borderRadius: "50%",
              bgcolor: loading ? "transparent" : bg,
              animation: open && !loading ? `${popIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards` : "none",
            }}
          >
            {loading ? (
              <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                <CircularProgress size={64} thickness={3} sx={{ color: alpha(color, 0.2), position: "absolute" }} variant="determinate" value={100} />
                <CircularProgress size={64} thickness={3} sx={{ color, animationDuration: "1.2s" }} />
              </Box>
            ) : (
              <Icon sx={{ fontSize: 44, color }} />
            )}
          </Box>

          {/* Animated Message */}
          <Typography
            sx={{
              fontFamily: fonts.family.primary,
              fontSize: "1.1rem",
              fontWeight: 600,
              color: colors.grey[800],
              lineHeight: 1.45,
              px: 2,
              animation: open ? `${slideUp} 0.4s ease-out forwards` : "none",
              animationDelay: "0.1s",
              opacity: 0, // initially hide until animation starts
            }}
          >
            {message}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalAlertDialog;
