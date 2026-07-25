import { Backdrop, Box, CircularProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type WorkflowFormOpeningLoaderProps = {
  open: boolean;
  title?: string;
  message?: string;
  /** Brand primary used for the spinner ring */
  color?: string;
  /** Brand light accent for the soft outer ring */
  accentColor?: string;
};

/**
 * Full-viewport branded loader shown while Fill Details / Continue Filling
 * resolves batch, schema, and form APIs before the form UI mounts.
 */
const WorkflowFormOpeningLoader = ({
  open,
  title = "Loading form",
  message = "Fetching details and preparing the form…",
  color = "#1565C0",
  accentColor = "#1976D2",
}: WorkflowFormOpeningLoaderProps) => (
  <Backdrop
    open={open}
    sx={{
      zIndex: (theme) => theme.zIndex.modal + 2,
      flexDirection: "column",
      gap: 2.5,
      backdropFilter: "blur(8px)",
      background: `linear-gradient(
        160deg,
        ${alpha("#0B1F33", 0.72)} 0%,
        ${alpha(color, 0.55)} 55%,
        ${alpha(accentColor, 0.45)} 100%
      )`,
    }}
  >
    <Box
      sx={{
        position: "relative",
        width: 88,
        height: 88,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        size={88}
        thickness={2.2}
        sx={{
          position: "absolute",
          color: alpha("#fff", 0.18),
        }}
      />
      <CircularProgress
        size={88}
        thickness={3.4}
        sx={{
          position: "absolute",
          color: alpha("#fff", 0.92),
          animationDuration: "1.15s",
          [`& .MuiCircularProgress-circle`]: {
            strokeLinecap: "round",
          },
        }}
      />
      <CircularProgress
        size={58}
        thickness={4.5}
        sx={{
          color: accentColor,
          animationDuration: "0.85s",
          animationDirection: "reverse",
          [`& .MuiCircularProgress-circle`]: {
            strokeLinecap: "round",
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: `radial-gradient(circle, #fff 0%, ${alpha(accentColor, 0.95)} 70%)`,
          boxShadow: `0 0 18px ${alpha("#fff", 0.55)}`,
        }}
      />
    </Box>

    <Box sx={{ textAlign: "center", px: 3, maxWidth: 420 }}>
      <Typography
        sx={{
          color: "#fff",
          fontWeight: 800,
          fontSize: "1.05rem",
          letterSpacing: "0.02em",
          textShadow: "0 1px 8px rgba(0,0,0,0.25)",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          color: alpha("#fff", 0.88),
          fontSize: "0.84rem",
          fontWeight: 500,
          lineHeight: 1.45,
        }}
      >
        {message}
      </Typography>
    </Box>
  </Backdrop>
);

export default WorkflowFormOpeningLoader;
