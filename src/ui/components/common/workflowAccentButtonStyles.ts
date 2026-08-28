import { alpha, type SxProps, type Theme } from "@mui/material";

/** Shared accent used by View Status and Submit for Approval actions. */
export const WORKFLOW_ACCENT_COLOR = "#0F766E";

export const getWorkflowAccentOutlinedButtonSx = (options?: {
  fontWeight?: number;
}): SxProps<Theme> => {
  const accent = WORKFLOW_ACCENT_COLOR;
  return {
    textTransform: "none",
    fontWeight: options?.fontWeight ?? 700,
    whiteSpace: "nowrap",
    letterSpacing: "0.01em",
    px: 1.5,
    color: accent,
    borderColor: alpha(accent, 0.55),
    borderWidth: 1.5,
    background: alpha(accent, 0.1),
    boxShadow: `inset 0 0 0 1px ${alpha(accent, 0.06)}`,
    "& .MuiButton-startIcon": { mr: 0.6 },
    "& .MuiSvgIcon-root": { fontSize: 18 },
    "&:hover": {
      borderWidth: 1.5,
      borderColor: accent,
      background: alpha(accent, 0.18),
      color: accent,
    },
    "&.Mui-disabled": {
      color: alpha(accent, 0.45),
      borderColor: alpha(accent, 0.22),
      background: alpha(accent, 0.05),
    },
  };
};
