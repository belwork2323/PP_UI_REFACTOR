import { alpha } from "@mui/material";

export type ListFilterPanelPalette = {
  primary: string;
  primaryLight: string;
  border: string;
  text: string;
  textSub: string;
  danger: string;
};

export const getListFilterPanelTheme = (palette: ListFilterPanelPalette) => ({
  toggle: {
    button: (active: boolean) => ({
      display: "flex",
      alignItems: "center",
      gap: 0.6,
      cursor: "pointer",
      flexShrink: 0,
      px: 1.2,
      py: 0.55,
      borderRadius: 2,
      border: `1px solid ${active ? palette.primaryLight : alpha(palette.primaryLight, 0.35)}`,
      bgcolor: active ? alpha(palette.primaryLight, 0.1) : "transparent",
      color: active ? palette.primaryLight : palette.textSub,
      transition: "all 0.15s",
      userSelect: "none",
      "&:hover": {
        bgcolor: alpha(palette.primaryLight, 0.08),
        borderColor: palette.primaryLight,
        color: palette.primaryLight,
      },
    }),
    text: { fontSize: "0.72rem", fontWeight: 700, lineHeight: 1 },
    icon: { fontSize: 14 },
    chevron: { fontSize: 14, ml: 0.2 },
    badge: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: alpha(palette.primaryLight, 0.2),
      color: palette.primaryLight,
      borderRadius: "50%",
      width: 16,
      height: 16,
      fontSize: "0.58rem",
      fontWeight: 800,
    },
  },
  panel: {
    root: {
      mt: 1.5,
      pt: 2,
      borderTop: `1px solid ${alpha(palette.border, 0.55)}`,
    },
    header: {
      container: { alignItems: "center", pb: 0.5 },
      icon: { fontSize: 18, color: palette.primaryLight },
      label: { fontSize: "0.82rem", fontWeight: 700, color: palette.text },
      badge: {
        minWidth: 20,
        height: 20,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.65rem",
        fontWeight: 800,
        bgcolor: alpha(palette.primaryLight, 0.15),
        color: palette.primaryLight,
      },
      clearChip: {
        fontWeight: 700,
        fontSize: "0.75rem",
        height: "28px",
        px: 0.5,
        borderColor: alpha(palette.danger, 0.35),
        color: palette.danger,
        "& .MuiChip-label": { px: 1.5 },
      },
    },
    closeButton: {
      textTransform: "none",
      fontWeight: 700,
      color: palette.text,
      borderColor: alpha(palette.border, 0.8),
      "&:hover": {
        borderColor: palette.primaryLight,
        bgcolor: alpha(palette.primaryLight, 0.08),
      },
    },
    applyButton: {
      textTransform: "none",
      fontWeight: 700,
      bgcolor: palette.primary,
      color: "#fff",
      "&:hover": { bgcolor: palette.primaryLight },
    },
    fieldSpinner: { mt: 0.75, color: palette.primaryLight },
  },
});

export type ListFilterPanelTheme = ReturnType<typeof getListFilterPanelTheme>;
