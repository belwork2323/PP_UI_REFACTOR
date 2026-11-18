import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  CircularProgress,
  alpha,
  keyframes,
  useTheme,
} from "@mui/material";

import { useAlertStore } from "../../../app/store/alertStore";
import { icons } from "../../../app/theme/icons";
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

/** Light-mode alert chrome */
const ALERT_CONFIG_LIGHT = {
  success: {
    Icon: icons.success,
    color: "#2e7d32",
    bg: alpha("#2e7d32", 0.12),
  },
  error: {
    Icon: icons.error,
    color: "#d32f2f",
    bg: alpha("#d32f2f", 0.12),
  },
  warning: {
    Icon: icons.warning,
    color: "#ed6c02",
    bg: alpha("#ed6c02", 0.12),
  },
  info: {
    Icon: icons.info,
    color: "#0288d1",
    bg: alpha("#0288d1", 0.12),
  },
};

/** Dark-mode: brighter icons + stronger wash so they don’t look dull on dark paper */
const ALERT_CONFIG_DARK = {
  success: {
    Icon: icons.success,
    color: "#81c784",
    bg: alpha("#81c784", 0.22),
  },
  error: {
    Icon: icons.error,
    color: "#ef9a9a",
    bg: alpha("#ef9a9a", 0.22),
  },
  warning: {
    Icon: icons.warning,
    color: "#ffb74d",
    bg: alpha("#ffb74d", 0.22),
  },
  info: {
    Icon: icons.info,
    color: "#64b5f6",
    bg: alpha("#64b5f6", 0.22),
  },
};

const GlobalAlertDialog = () => {
  const { open, message, severity, loading, display } = useAlertStore();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (display === "snackbar") {
    return null;
  }

  // Prevent this global dialog from rendering on the login route
  // because LoginPage has a custom positioned Snackbar that uses the exact same store.
  if (window.location.pathname === "/" || window.location.pathname.includes("login")) {
    return null;
  }

  const alertConfig = isDark ? ALERT_CONFIG_DARK : ALERT_CONFIG_LIGHT;
  const config = alertConfig[severity] || alertConfig.info;
  const { Icon, color, bg } = config;
  const messageColor = isDark ? "#f0f2f8" : theme.palette.text.primary;

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      onClose={() => {}} // ignore backdrop click
      disableEscapeKeyDown // block ESC
      // Sit above ApproverActionDialog / other modals so errors are never covered.
      sx={{ zIndex: (t) => t.zIndex.modal + 10 }}
      PaperProps={{
        sx: {
          borderRadius: "24px",
          px: 1,
          py: 3,
          boxShadow: isDark
            ? "0 16px 48px rgba(0,0,0,0.55)"
            : `0 12px 40px ${alpha(theme.palette.secondary.dark || "#000", 0.1)}`,
          backgroundImage: "none",
          bgcolor: isDark ? "#1a1d27" : theme.palette.background.paper,
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "none",
        },
      }}
    >
      <DialogContent sx={{ overflow: "hidden" }}>
        <Box
          key={`${severity}-${loading ? "loading" : "idle"}-${message}`}
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
          gap={3}
        >
          {/* Animated Icon Container */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: loading ? "transparent" : bg,
              border: loading ? "none" : `1px solid ${alpha(color, isDark ? 0.45 : 0.28)}`,
              animation: !loading
                ? `${popIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`
                : "none",
            }}
          >
            {loading ? (
              <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                <CircularProgress
                  size={64}
                  thickness={3}
                  sx={{ color: alpha(color, 0.25), position: "absolute" }}
                  variant="determinate"
                  value={100}
                />
                <CircularProgress
                  size={64}
                  thickness={3}
                  sx={{ color, animationDuration: "1.2s" }}
                />
              </Box>
            ) : (
              <Icon sx={{ fontSize: 44, color, filter: isDark ? "saturate(1.15)" : "none" }} />
            )}
          </Box>

          {/* Animated Message */}
          <Typography
            sx={{
              fontFamily: fonts.family.primary,
              fontSize: "1.1rem",
              fontWeight: 600,
              color: messageColor,
              lineHeight: 1.45,
              px: 2,
              animation: `${slideUp} 0.4s ease-out forwards`,
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
