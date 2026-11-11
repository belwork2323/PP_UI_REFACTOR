import { useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

type TemporaryPasswordRevealProps = {
  password: string;
  /** Optional prefix label, e.g. "Temp" */
  label?: string;
  fontSize?: string | number;
};

/**
 * Masked temporary password with eye icon to toggle visibility.
 */
const TemporaryPasswordReveal = ({
  password,
  label,
  fontSize = "0.75rem",
}: TemporaryPasswordRevealProps) => {
  const [visible, setVisible] = useState(false);

  if (!password) return null;

  const display = visible ? password : "•".repeat(Math.min(Math.max(password.length, 8), 16));

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.25,
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize,
          fontFamily: "monospace",
          fontWeight: 700,
          color: "primary.main",
          wordBreak: "break-all",
          lineHeight: 1.3,
        }}
      >
        {label ? `${label}: ` : ""}
        {display}
      </Typography>
      <IconButton
        size="small"
        aria-label={visible ? "Hide temporary password" : "Show temporary password"}
        onClick={(e) => {
          e.stopPropagation();
          setVisible((v) => !v);
        }}
        sx={{ p: 0.35, color: "primary.main", flexShrink: 0 }}
      >
        {visible ? (
          <VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} />
        ) : (
          <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
        )}
      </IconButton>
    </Box>
  );
};

export default TemporaryPasswordReveal;
