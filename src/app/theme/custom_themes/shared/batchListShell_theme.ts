import { alpha } from "@mui/material";
import fonts from "@app/theme/fonts";
import general from "@app/theme/custom_themes/common/common_css_theme";

export type BatchListShellPalette = {
  primary?: string;
  primaryLight?: string;
  border?: string;
  text?: string;
  textSub?: string;
  surface?: string;
};

export type BatchListShellBatchListTokens = {
  filterInputBg?: string;
};

const fadeUpKeyframes = "batchListShellFadeUp";

/** Shared BatchListShell theme — used by UserBatchList and AdminListShell */
export const getBatchListShellTheme = (
  palette: BatchListShellPalette,
  batchList: BatchListShellBatchListTokens = {},
  options?: { fadeAnimation?: string }
) => {
  const p = palette;
  const t = batchList;
  const animation = options?.fadeAnimation ?? `${fadeUpKeyframes} 0.3s ease`;

  return {
    sections: {
      root: { animation },
      statusStack: {
        direction: "row" as const,
        gap: 1.5,
        flexWrap: "wrap" as const,
        mb: 2,
        p: { xs: 0.5, md: 1 },
      },
      filterContainer: {
        mb: 2,
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        background: t.filterInputBg || "#ffffff",
        border: `1px solid ${p.border}`,
        boxShadow: `0 1px 6px ${alpha(p.primary || "#000", 0.05)}`,
      },
      filterStack: {
        direction: { xs: "column", sm: "row" } as const,
        gap: 1.5,
        alignItems: { sm: "center" } as const,
        flexWrap: "wrap" as const,
      },
      resultsWrap: {
        ml: "auto",
        display: "flex",
        alignItems: "center",
        gap: 0.75,
      },
      loadingWrap: {
        display: "flex",
        justifyContent: "center",
        py: 4,
      },
      listWrap: {},
      emptyWrap: {
        textAlign: "center",
        py: 8,
        borderRadius: 3,
        border: `1.5px dashed ${alpha(p.primaryLight || "#000", 0.3)}`,
        background: alpha(p.surface || "#fff", 0.5),
      },
    },
    statusTab: {
      button: (isActive: boolean, meta?: { color?: string }) => ({
        borderRadius: 2,
        fontSize: fonts.typography.label.fontSize,
        fontWeight: fonts.typography.label.fontWeight,
        px: 2,
        py: "7px",
        textTransform: "none",
        whiteSpace: "nowrap",
        ...(isActive
          ? {
              background: meta?.color ?? p.primary,
              border: "none",
              boxShadow: `0 2px 8px ${alpha(meta?.color ?? p.primary ?? "#000", 0.3)}`,
              color: "#ffffff",
            }
          : {
              borderColor: meta?.color ? alpha(meta.color, 0.35) : p.border,
              color: meta?.color ?? p.textSub,
              "&:hover": {
                background: meta?.color ? alpha(meta.color, 0.06) : alpha(p.primary || "#000", 0.05),
                borderColor: meta?.color ?? p.primary,
              },
            }),
      }),
      countChip: (isActive: boolean, meta?: { color?: string }) => ({
        height: 17,
        minWidth: 22,
        fontSize: "0.6rem",
        fontWeight: fonts.weight.extrabold,
        background: isActive ? alpha("#ffffff", 0.25) : alpha(meta?.color ?? p.primary ?? "#000", 0.1),
        color: isActive ? "#ffffff" : meta?.color ?? p.primary,
        border: "none",
      }),
    },
    inputs: {
      search: {
        flex: 1,
        minWidth: 260,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          background: t.filterInputBg || "#fff",
          color: p.text,
          fontSize: fonts.typography.input.fontSize,
          boxShadow: `0 1px 6px ${alpha(p.primary || "#000", 0.05)}`,
          "& .MuiOutlinedInput-input": {
            padding: "10px 14px",
          },
          "& fieldset": { borderColor: p.border },
          "&:hover fieldset": { borderColor: p.primaryLight },
          "&.Mui-focused fieldset": { borderColor: p.primaryLight },
        },
        "& .MuiInputBase-input": {
          color: p.text,
        },
      },
      filter: {
        minWidth: 150,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          background: t.filterInputBg || "#fff",
          color: p.text,
          fontSize: fonts.typography.input.fontSize,
          "& fieldset": { borderColor: p.border },
          "&:hover fieldset": { borderColor: p.primaryLight },
          "&.Mui-focused fieldset": { borderColor: p.primaryLight },
        },
        "& .MuiInputLabel-root": {
          fontSize: fonts.typography.label.fontSize,
          color: p.textSub,
        },
        "& .MuiSelect-icon": {
          color: p.textSub,
        },
      },
      startIcon: {
        search: { fontSize: 17, color: p.textSub },
        filter: { fontSize: 15, color: p.textSub },
      },
      menuItem: {
        fontSize: fonts.typography.input.fontSize,
        color: p.text,
      },
    },
    results: {
      icon: { fontSize: 14, color: alpha(p.primary || "#000", 0.55) },
      text: {
        fontSize: fonts.typography.meta.fontSize,
        color: p.textSub,
        fontWeight: fonts.typography.meta.fontWeight,
      },
    },
    loading: {
      spinner: { color: p.primary },
    },
    empty: {
      icon: { fontSize: 40, color: alpha(p.primaryLight || "#000", 0.25), mb: 1.5 },
      title: { fontWeight: fonts.weight.bold, color: p.textSub },
      subtitle: { fontSize: fonts.size.sm, color: alpha(p.textSub || "#000", 0.7), mt: 0.5 },
    },
  };
};

/** Filter toggle button sx bundle — matches dashboard + sourcing */
export const getFilterToggleSx = (tokens: {
  border: string;
  inputFocus: string;
  filterActiveBg: string;
  filterBadgeBg: string;
  filterBadgeColor: string;
  textSecondary: string;
}) => ({
  filterBtn: (active: boolean) => ({
    ...general.flexRow,
    alignItems: "center",
    gap: 0.6,
    cursor: "pointer",
    px: 1.2,
    py: 0.45,
    borderRadius: "8px",
    border: `1px solid ${active ? tokens.inputFocus : tokens.border}`,
    bgcolor: active ? tokens.filterActiveBg : "transparent",
    color: active ? tokens.inputFocus : tokens.textSecondary,
    transition: "all 0.15s",
    userSelect: "none",
    flexShrink: 0,
    "&:hover": {
      bgcolor: tokens.filterActiveBg,
      borderColor: tokens.inputFocus,
      color: tokens.inputFocus,
    },
  }),
  filterBtnText: { ...fonts.typography.label },
  filterBtnIcon: { fontSize: 14 },
  filterBtnChevron: { fontSize: 14, ml: 0.2 },
  filterBadgePill: {
    ...general.flexCenter,
    bgcolor: tokens.filterBadgeBg,
    color: tokens.filterBadgeColor,
    borderRadius: "50%",
    width: 16,
    height: 16,
    ...fonts.typography.badge,
  },
  filterBadge: {
    ...general.flexCenter,
    bgcolor: tokens.filterBadgeBg,
    color: tokens.filterBadgeColor,
    borderRadius: "50%",
    width: 18,
    height: 18,
    fontSize: fonts.size["2xs"],
    fontWeight: fonts.weight.bold,
  },
  filterPanelHeader: { mb: 1.5 },
  filterLabel: { ...fonts.typography.label },
  filterMetaText: { ...fonts.typography.label, color: tokens.textSecondary, ml: 0.5 },
  clearChip: (clearTokens: { clearBg: string; clearColor: string; clearBorder: string }) => ({
    height: 22,
    fontSize: "0.68rem",
    fontWeight: fonts.weight.semibold,
    bgcolor: clearTokens.clearBg,
    color: clearTokens.clearColor,
    border: `1px solid ${clearTokens.clearBorder}`,
    "&:hover": { bgcolor: clearTokens.clearBg },
  }),
});

export default getBatchListShellTheme;
