// src/app/theme/custom_themes/shared/shared_theme.ts
//
// Shared compound styles — patterns reused across ALL feature themes.
// Feature themes should call getSharedTheme(mode) and spread or reference
// these objects instead of re-defining them locally.
//
// Usage:
//   import { getSharedTheme } from '../shared/shared_theme';
//   const shared = getSharedTheme(mode);
//   return { ...shared, /* feature-only additions */ };

import { alpha } from "@mui/material";
import colors    from "../../colors";
import fonts     from "../../fonts";
import spacing   from "../../spacing";
import general   from "../common/common_css_theme";
import { getTokens } from "../../tokens/semantics";

// ─── Internal helpers ─────────────────────────────────────────────────────────

const mkInputStyle = (inputBg: string, inputBorder: string, inputBorderHover: string, inputFocus: string, textPrimary: string, textSecondary: string) => ({
  "& .MuiOutlinedInput-root": {
    fontSize:     "0.78rem",
    bgcolor:      inputBg,
    borderRadius: "8px",
    color:        textPrimary,
    "& fieldset":             { borderColor: inputBorder },
    "&:hover fieldset":       { borderColor: inputBorderHover },
    "&.Mui-focused fieldset": { borderColor: inputFocus },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.78rem",
    color:    textSecondary,
    "&.Mui-focused": { color: inputFocus },
  },
  "& .MuiSvgIcon-root": { color: textSecondary },
});

// ─── Status/priority chip colour maps ────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  // Batch / workflow statuses
  "Completed":        { bg: "rgba(34,197,94,0.12)",   color: "#16a34a" },
  "In Progress":      { bg: "rgba(59,130,246,0.12)",   color: "#2563eb" },
  "Pending Approval": { bg: "rgba(245,158,11,0.12)",   color: "#d97706" },
  "Rejected":         { bg: "rgba(239,68,68,0.10)",    color: "#dc2626" },
  "Pending":          { bg: "rgba(245,158,11,0.10)",   color: "#d97706" },
  // User statuses
  "Active":           { bg: "rgba(34,197,94,0.10)",    color: "#16a34a" },
  "Inactive":         { bg: "rgba(239,68,68,0.10)",    color: "#dc2626" },
  "Suspended":        { bg: "rgba(245,158,11,0.12)",   color: "#d97706" },
  // Batch types
  "MainScale":        { bg: "rgba(59,130,246,0.10)",   color: "#2563eb" },
  "SubScale":         { bg: "rgba(167,139,250,0.12)",  color: "#7c3aed" },
};

const STATUS_COLORS_DARK: Record<string, { bg: string; color: string }> = {
  "Completed":        { bg: "rgba(34,197,94,0.15)",   color: "#22c55e" },
  "In Progress":      { bg: "rgba(59,130,246,0.15)",   color: "#3b82f6" },
  "Pending Approval": { bg: "rgba(245,158,11,0.15)",   color: "#f59e0b" },
  "Rejected":         { bg: "rgba(239,68,68,0.12)",    color: "#ef4444" },
  "Pending":          { bg: "rgba(245,158,11,0.12)",   color: "#f59e0b" },
  "Active":           { bg: "rgba(34,197,94,0.12)",    color: "#22c55e" },
  "Inactive":         { bg: "rgba(239,68,68,0.12)",    color: "#ef4444" },
  "Suspended":        { bg: "rgba(245,158,11,0.15)",   color: "#f59e0b" },
  "MainScale":        { bg: "rgba(59,130,246,0.15)",   color: "#3b82f6" },
  "SubScale":         { bg: "rgba(167,139,250,0.15)",  color: "#a78bfa" },
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  "High":   { bg: "rgba(239,68,68,0.10)",   color: "#dc2626" },
  "Medium": { bg: "rgba(245,158,11,0.10)",  color: "#d97706" },
  "Low":    { bg: "rgba(34,197,94,0.10)",   color: "#16a34a" },
};
const PRIORITY_COLORS_DARK: Record<string, { bg: string; color: string }> = {
  "High":   { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  "Medium": { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  "Low":    { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const getSharedTheme = (mode = "light") => {
  const s      = getTokens(mode as "light" | "dark");
  const isDark = mode === "dark";
  const d      = colors.dashboard[mode as "light" | "dark"];
  const p      = colors.primary;

  const accentBlue       = p.main;
  const accentBlueDark   = p.dark;
  const accentBlueMuted  = isDark ? "rgba(25,118,210,0.18)" : "rgba(25,118,210,0.08)";
  const inputBg          = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const inputBorder      = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const inputBorderHover = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.28)";
  const inputFocus       = isDark ? "#90caf9" : p.main;
  const menuBg           = isDark ? "#1e2435" : colors.paper;
  const menuItemHover    = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  const statusColorMap  = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const priorityColorMap = isDark ? PRIORITY_COLORS_DARK : PRIORITY_COLORS;

  const filterInputSx = mkInputStyle(inputBg, inputBorder, inputBorderHover, inputFocus, s.textPrimary, s.textSecondary);
  const managementPageHeader = {
    wrapper: {
      ...general.flexRow,
      alignItems:     "flex-start",
      justifyContent: "space-between",
      mb:             spacing.lg,
      ...general.flexWrap,
      gap:            spacing.md,
    },
    title: {
      fontSize:      { xs: fonts.size.xl, md: fonts.size["2xl"] },
      fontWeight:    fonts.weight.extrabold,
      color:         d.textPrimary,
      letterSpacing: "-0.02em",
      lineHeight:    fonts.lineHeight.tight,
    },
    subtitle: {
      fontSize: fonts.size.sm,
      color:    d.textSecondary,
      mt:       spacing.xs,
    },
  };

  const managementPrimaryButton = {
    textTransform: "none",
    fontWeight:    fonts.weight.bold,
    borderRadius:  general.borderRadius.md,
    px:            spacing.lg,
    bgcolor:       accentBlue,
    boxShadow:     `0 4px 14px ${alpha(accentBlue, 0.35)}`,
    "&:hover":    { bgcolor: accentBlueDark },
    "&.Mui-disabled": {
      bgcolor: alpha(accentBlue, 0.4),
      color:   colors.white.text,
    },
  };

  const managementStatPills = {
    row: {
      mb:  spacing.lg,
      ...general.flexWrap,
      gap: 1.5,
    },
    pill: (color: string, bg: string) => ({
      px:           spacing.md,
      py:           spacing.sm,
      borderRadius: general.borderRadius.md,
      bgcolor:      bg,
      border:       `1px solid ${alpha(color, 0.2)}`,
      ...general.flexRow,
      alignItems:   "center",
      gap:          spacing.sm,
    }),
    pillValue: (color: string) => ({
      fontSize:   fonts.size.xl,
      fontWeight: fonts.weight.extrabold,
      color,
      lineHeight: fonts.lineHeight.tight,
    }),
    pillLabel: {
      fontSize:   fonts.size.xs,
      color:      d.textSecondary,
      fontWeight: fonts.weight.medium,
    },
  };

  const managementToolbar = {
    wrapper: {
      ...general.flexRow,
      gap:          1.5,
      mb:           2.5,
      ...general.flexWrap,
      alignItems:   "center",
      p:            spacing.md,
      bgcolor:      d.cardBg,
      borderRadius: general.borderRadius.lg,
      border:       `1px solid ${isDark ? "rgba(255,255,255,0.12)" : inputBorder}`,
      boxShadow:    d.cardShadow,
    },
    searchField: {
      flex:     1,
      minWidth: 220,
      "& .MuiInputBase-input": { color: d.textPrimary },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? "rgba(255,255,255,0.23)" : inputBorder,
      },
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentBlue },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: accentBlue,
        borderWidth: "2px",
      },
    },
    searchIcon: {
      fontSize: 18,
      color:    d.textSecondary,
    },
    filterButtonActive: {
      borderRadius:  general.borderRadius.md,
      textTransform: "none",
      fontWeight:    fonts.weight.semibold,
      fontSize:      fonts.size.xs,
      px:            1.8,
      py:            0.9,
      bgcolor:       accentBlue,
      color:         colors.white.text,
      "&:hover":    { bgcolor: accentBlueDark },
    },
    filterButtonInactive: {
      borderRadius:  general.borderRadius.md,
      textTransform: "none",
      fontWeight:    fonts.weight.semibold,
      fontSize:      fonts.size.xs,
      px:            1.8,
      py:            0.9,
      borderColor:   isDark ? "rgba(255,255,255,0.23)" : inputBorder,
      color:         isDark ? d.textPrimary : d.textSecondary,
      "&:hover": {
        borderColor: accentBlue,
        color:       accentBlue,
        bgcolor:     isDark ? "rgba(25,118,210,0.08)" : "rgba(25,118,210,0.04)",
      },
    },
    filterRow: {
      ...general.flexWrap,
      gap: 1.5,
    },
    filterSelect: {
      minWidth: 150,
      "& .MuiInputBase-input": { color: d.textPrimary },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? "rgba(255,255,255,0.23)" : inputBorder,
      },
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentBlue },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: accentBlue,
        borderWidth: "2px",
      },
      "& .MuiInputLabel-root": {
        color: d.textSecondary,
        "&.Mui-focused": { color: accentBlue },
      },
      "& .MuiSelect-icon": { color: d.textSecondary },
    },
    clearButton: {
      color:         colors.error.main,
      textTransform: "none",
      fontSize:      fonts.size.xs,
      px:            spacing.sm,
      "&:hover":    { bgcolor: alpha(colors.error.main, isDark ? 0.12 : 0.08) },
    },
  };

  const managementInput = {
    "& .MuiOutlinedInput-root": {
      bgcolor:      inputBg,
      borderRadius: general.borderRadius.md,
      "& fieldset":             { borderColor: inputBorder },
      "&:hover fieldset":       { borderColor: accentBlue },
      "&.Mui-focused fieldset": { borderColor: accentBlue },
    },
    "& .MuiInputLabel-root": {
      color: d.textSecondary,
      "&.Mui-focused": { color: accentBlue },
      "&.MuiInputLabel-shrink": {
        color:      isDark ? d.textPrimary : accentBlue,
        fontWeight: isDark ? fonts.weight.semibold : fonts.weight.medium,
      },
    },
    "& .MuiInputBase-input":              { color: d.textPrimary },
    "& .MuiSelect-icon":                  { color: d.textSecondary },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.23)" : inputBorder },
  };

  const managementMenuPaper = {
    PaperProps: {
      sx: {
        bgcolor:      menuBg,
        border:       `1px solid ${d.cardBorder}`,
        borderRadius: general.borderRadius.md,
        boxShadow:    isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
        "& .MuiMenuItem-root": {
          color:    d.textPrimary,
          fontSize: fonts.size.sm,
          "&:hover":        { bgcolor: menuItemHover },
          "&.Mui-selected": { bgcolor: accentBlueMuted },
        },
        "& .MuiCheckbox-root":             { color: d.textSecondary },
        "& .MuiCheckbox-root.Mui-checked": { color: accentBlue },
      },
    },
  };

  const managementTable = {
    paper: {
      bgcolor:      d.cardBg,
      border:       `1px solid ${d.cardBorder}`,
      borderRadius: general.borderRadius.lg,
      boxShadow:    d.cardShadow,
      overflow:     "hidden" as const,
    },
    headerCell: {
      fontSize:      fonts.size.xs,
      fontWeight:    fonts.weight.bold,
      color:         d.tableHeaderText,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      borderBottom:  `2px solid ${d.tableHeaderBorder}`,
      bgcolor:       isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
      py:            1.5,
      ...general.noWrap,
    },
    headerCellActions: {
      textAlign: "right" as const,
      pr:        spacing.md,
    },
    row: {
      "&:hover":         { bgcolor: d.tableRowHover },
      "&:last-child td": { border: 0 },
      transition:         "background 0.15s",
    },
    cell: {
      borderBottom: `1px solid ${d.dividerColor}`,
      py:           1.5,
    },
    cellActionsWrapper: {
      borderBottom: `1px solid ${d.dividerColor}`,
      py:           1.5,
      textAlign:    "right" as const,
      pr:           spacing.md,
    },
    emptyCell: {
      textAlign: "center" as const,
      py:        6,
    },
    emptyText: {
      fontSize: fonts.size.sm,
      color:    d.textDisabled,
    },
    emptyIcon: {
      fontSize: 40,
      mb:       spacing.sm,
      display:  "block",
      mx:       "auto",
      opacity:  0.3,
      color:    d.textDisabled,
    },
    pagination: {
      color: d.textSecondary,
      "& .MuiTablePagination-select": { color: d.textPrimary },
      "& .MuiSvgIcon-root":           { color: d.textSecondary },
    },
    divider: { borderColor: d.dividerColor },
  };

  const managementStatsGrid = {
    outerWrap: {
      mb:           spacing.xl,
      borderRadius: general.borderRadius.xl,
      border:       `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
      overflow:     "hidden",
      position:     "relative" as const,
      bgcolor:      isDark ? "rgba(255,255,255,0.02)" : "rgba(248,250,252,0.8)",
      boxShadow:    isDark ? "0 2px 24px rgba(0,0,0,0.40)" : "0 2px 16px rgba(0,0,0,0.06)",
    },
    bgDecor: {
      position:      "absolute" as const,
      inset:         0,
      pointerEvents: "none" as const,
      background:    isDark
        ? "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)"
        : "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(29,78,216,0.04) 0%, transparent 70%)",
    },
    innerGrid: {
      position:            "relative" as const,
      zIndex:              1,
      display:             "grid",
      gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(4,1fr)" },
      gap:                 "1px",
      bgcolor:             isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    },
    card: {
      position:   "relative" as const,
      display:    "flex",
      alignItems: "center",
      gap:        2,
      px:         3,
      py:         2.8,
      overflow:   "hidden",
      bgcolor:    isDark ? "#141824" : "#ffffff",
      transition: "background 0.2s ease, transform 0.2s ease",
      "&:hover": {
        bgcolor: isDark ? "#1a2030" : "#f0f6ff",
      },
    },
    accentBar: {
      position:     "absolute" as const,
      left:         0,
      top:          "20%",
      bottom:       "20%",
      width:        3,
      borderRadius: "0 3px 3px 0",
    },
    iconWrap: {
      flexShrink:     0,
      width:          46,
      height:         46,
      borderRadius:   "12px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      transition:     "transform 0.2s ease",
      "&:hover":    { transform: "scale(1.08)" },
    },
    textWrap: {
      flex:     1,
      minWidth: 0,
    },
    value: {
      fontSize:      { xs: "1.6rem", md: "2rem" },
      fontWeight:    800,
      lineHeight:    1,
      letterSpacing: "-0.03em",
      mb:            0.3,
    },
    label: {
      fontSize:   "0.78rem",
      fontWeight: 700,
      color:      d.textPrimary,
      lineHeight: 1.2,
      mb:         0.25,
    },
    subLabel: {
      fontSize:      "0.68rem",
      fontWeight:    500,
      color:         d.textSecondary,
      letterSpacing: "0.01em",
    },
    cornerDot: {
      position:      "absolute" as const,
      right:         -14,
      bottom:        -14,
      width:         52,
      height:        52,
      borderRadius:  "50%",
      opacity:       isDark ? 0.08 : 0.06,
      pointerEvents: "none" as const,
    },
  };

  return {

    // ── Re-expose semantic tokens for direct access ──────────────────────────
    tokens: s,

    // ─── PAGE wrapper ────────────────────────────────────────────────────────
    page: {
      bgcolor:   s.pageBg,
      minHeight: "100vh",
      p:         { xs: spacing.md, md: spacing.lg },
      ...general.boxSizingBorder,
    },

    // ─── CARD ─────────────────────────────────────────────────────────────────
    // Standard bordered card; spread into any feature card token
    card: {
      bgcolor:      s.cardBg,
      border:       `1px solid ${s.cardBorder}`,
      borderRadius: "14px",
      boxShadow:    s.cardShadow,
      overflow:     "hidden" as const,
      "&:hover":    { borderColor: s.borderStrong },
    },

    // ─── SKELETON ─────────────────────────────────────────────────────────────
    skeletonBase: {
      height:       14,
      borderRadius: general.borderRadius.sm,
      bgcolor:      isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      animation:    "pulse 1.4s ease-in-out infinite",
      "@keyframes pulse": {
        "0%, 100%": { opacity: 1 },
        "50%":      { opacity: 0.4 },
      },
    },

    // ─── FILTER INPUTS ────────────────────────────────────────────────────────
    filterInputSx,
    filterMenuProps: {
      PaperProps: {
        sx: {
          bgcolor: menuBg,
          color:   s.textPrimary,
          border:  `1px solid ${s.borderDefault}`,
        },
      },
    },
    filterMenuItemSx: {
      fontSize: "0.78rem",
      color:    s.textPrimary,
      "&:hover":        { bgcolor: menuItemHover },
      "&.Mui-selected": { bgcolor: isDark ? "rgba(33,150,243,0.15)" : "#e3f2fd" },
    },

    // Shared input style without wrapper (for MUI TextField sx prop directly)
    inputSx: filterInputSx,

    adminManagement: {
      accentBlue,
      accentBlueDark,
      accentBlueMuted,
      inputBg,
      inputBorder,
      pageHeader: managementPageHeader,
      primaryButton: managementPrimaryButton,
      statPills: managementStatPills,
      toolbar: managementToolbar,
      input: managementInput,
      menuPaper: managementMenuPaper,
      table: managementTable,
      statsGrid: managementStatsGrid,
    },

    // ─── TABLE ────────────────────────────────────────────────────────────────
    tableHeaderCell: {
      fontSize:      "0.67rem",
      fontWeight:    800,
      letterSpacing: "0.07em",
      textTransform: "uppercase" as const,
      color:         s.textSecondary,
      borderBottom:  `2px solid ${s.borderDefault}`,
      whiteSpace:    "nowrap" as const,
      bgcolor:       "transparent",
    },
    tableHeaderRow: {
      bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
      "& th": { py: 1.4 },
    },
    tableRow: (isAlt = false) => ({
      "&:hover":        { bgcolor: s.rowHover },
      "&:last-child td":{ border: 0 },
      transition:       "background 0.12s",
      bgcolor:          isAlt ? (isDark ? "rgba(255,255,255,0.012)" : "rgba(0,0,0,0.01)") : "transparent",
    }),
    tableCell: {
      py:           1.2,
      fontSize:     "0.76rem",
      color:        s.textPrimary,
      borderBottom: `1px solid ${s.borderSubtle}`,
    },
    tableCellMuted: {
      py:       1.2,
      fontSize: "0.74rem",
      color:    s.textSecondary,
    },
    tableCellDate: {
      py:        1.2,
      fontSize:  "0.74rem",
      color:     s.textSecondary,
      whiteSpace:"nowrap" as const,
    },
    tableEmptyCell: {
      py:        5,
      fontSize:  "0.82rem",
      textAlign: "center" as const,
      border:    0,
      color:     s.textSecondary,
    },

    // ─── CHIP FACTORIES ───────────────────────────────────────────────────────
    /** Mode-aware status chip: Completed / In Progress / Pending / Rejected / Active / Inactive */
    statusChip: (status: string) => {
      const m = statusColorMap[status] ?? { bg: s.borderSubtle, color: s.textSecondary };
      return {
        fontSize:     "0.63rem",
        fontWeight:   700,
        height:       22,
        borderRadius: "6px",
        bgcolor:      m.bg,
        color:        m.color,
        border:       `1px solid ${alpha(m.color, 0.22)}`,
        "& .MuiChip-label": { px: 1 },
      };
    },

    /** Mode-aware priority chip: High / Medium / Low */
    priorityChip: (priority: string) => {
      const m = priorityColorMap[priority] ?? { bg: s.borderSubtle, color: s.textSecondary };
      return {
        fontSize:     "0.63rem",
        fontWeight:   700,
        height:       22,
        borderRadius: "6px",
        bgcolor:      m.bg,
        color:        m.color,
      };
    },

    /** Generic chip sx factory */
    chip: (bg?: string, color?: string) => ({
      fontSize:     "0.62rem",
      height:       20,
      borderRadius: "5px",
      fontWeight:   700,
      bgcolor:      bg    ?? (isDark ? "rgba(255,255,255,0.07)"  : "#f0f0f0"),
      color:        color ?? (isDark ? "rgba(255,255,255,0.55)"  : "rgba(0,0,0,0.5)"),
    }),

    // ─── FILTER PANEL BACKDROP ────────────────────────────────────────────────
    filterPanel: {
      borderTop:    `1px solid ${s.borderDefault}`,
      borderBottom: `1px solid ${s.borderDefault}`,
      bgcolor:      s.surfaceEl,
      px: 2.5, pt: 2, pb: 2.5,
    },

    // ─── FILTER PANEL HEADER sub-tokens ───────────────────────────────────────
    filterLabel: {
      fontSize:      "0.75rem",
      fontWeight:    700,
      color:         s.textSecondary,
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
    },

    // ─── SECTION HEADER tokens ────────────────────────────────────────────────
    sectionTitle: {
      variant: "subtitle1" as const,
      sx: { fontWeight: 700, color: s.textPrimary },
    },
    sectionMeta: {
      variant: "caption" as const,
      sx: { color: s.textSecondary },
    },
    sectionMetaBold: {
      variant: "caption" as const,
      sx: { color: s.textSuccess, fontWeight: 600 },
    },

    dashboardCharts: {
      cardSx: {
        bgcolor: s.cardBg,
        border: `1px solid ${s.cardBorder}`,
        borderRadius: "16px",
        overflow: "hidden" as const,
        boxShadow: isDark
          ? "0 4px 24px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.25)"
          : "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        transition: "border-color .25s ease, transform .25s ease, box-shadow .25s ease",
        "&:hover": {
          borderColor: s.borderStrong,
          transform: "translateY(-2px)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)"
            : "0 8px 28px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
        },
      },
      headers: {
        line: isDark
          ? "linear-gradient(135deg, #0d3b82 0%, #1565c0 35%, #1e88e5 70%, #42a5f5 100%)"
          : "linear-gradient(135deg, #1565c0 0%, #1976d2 30%, #2196f3 65%, #42a5f5 100%)",
        bar: isDark
          ? "linear-gradient(135deg, #1a0a3e 0%, #4a148c 35%, #7b1fa2 70%, #9c27b0 100%)"
          : "linear-gradient(135deg, #6a1b9a 0%, #8e24aa 30%, #ab47bc 65%, #ce93d8 100%)",
        area: isDark
          ? "linear-gradient(135deg, #1a3c34 0%, #1b5e20 35%, #2e7d32 70%, #43a047 100%)"
          : "linear-gradient(135deg, #2e7d32 0%, #388e3c 30%, #43a047 65%, #66bb6a 100%)",
      },
      headerBox: (background: string) => ({
        background,
        p: 2,
        borderRadius: "14px 14px 0 0",
        position: "relative" as const,
        overflow: "hidden" as const,
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
          pointerEvents: "none",
        },
      }),
      contentSx: {
        px: 2.5,
        pb: 2.5,
        pt: 1.5,
      },
      titleProps: {
        variant: "subtitle1" as const,
        sx: { fontWeight: 700, color: s.textPrimary, letterSpacing: "-0.01em" },
      },
      subtitleProps: {
        variant: "caption" as const,
        sx: { color: s.textSecondary, lineHeight: 1.4 },
      },
      highlightProps: {
        variant: "caption" as const,
        sx: {
          color: isDark ? "#66bb6a" : "#2e7d32",
          fontWeight: 700,
          display: "block",
          mt: 0.35,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.8rem",
        },
      },
      dividerProps: {
        sx: { borderColor: s.borderDefault, my: 1.5 },
      },
      clockIconSx: {
        fontSize: 13,
        color: s.textDisabled,
      },
      timestampProps: {
        variant: "caption" as const,
        sx: { color: s.textDisabled, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem" },
      },
      plotHeight: 180,
      margin: {
        line: { top: 14, right: 16, bottom: 14, left: -18 },
        bar: { top: 10, right: 12, bottom: 14, left: -18 },
      },
      xAxis: {
        disableLine: true,
        disableTicks: true,
        tickLabelStyle: {
          fill: "rgba(255,255,255,0.82)",
          fontSize: 10,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.02em",
        },
      },
      lineSeries: {
        area: true,
        showMark: false,
        curve: "catmullRom" as const,
        color: "rgba(255,255,255,0.95)",
        highlightScope: { highlight: "item" as const, fade: "global" as const },
      },
      barSeries: {
        color: "rgba(255,255,255,0.82)",
        highlightScope: { highlight: "item" as const, fade: "global" as const },
      },
      areaSeries: {
        area: true,
        showMark: false,
        curve: "catmullRom" as const,
        color: "rgba(255,255,255,0.90)",
        highlightScope: { highlight: "item" as const, fade: "global" as const },
      },
      tooltipSlotProps: {
        tooltip: {
          trigger: "axis" as const,
          position: "top" as const,
          sx: {
            "& .MuiChartsTooltip-paper": {
              bgcolor: isDark ? "rgba(8,12,24,0.94)" : "rgba(18,24,40,0.92)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              px: 1.5,
              py: 0.8,
              "& .MuiChartsTooltip-labelCell, & .MuiChartsTooltip-valueCell": {
                fontSize: "0.78rem",
                fontFamily: "'IBM Plex Mono', monospace",
              },
              "& .MuiChartsTooltip-mark": {
                borderRadius: "50%",
                width: 8,
                height: 8,
              },
            },
          },
        },
      },
      lineChartSx: {
        width: "100%",
        "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
          stroke: "rgba(255,255,255,0.10)",
        },
        "& .MuiChartsAxis-tickLabel": {
          fill: "rgba(255,255,255,0.82)",
        },
        "& .MuiChartsGrid-line": {
          stroke: "rgba(255,255,255,0.08)",
          strokeDasharray: "3 6",
        },
        "& .MuiLineElement-root": {
          strokeWidth: 2.5,
          filter: "drop-shadow(0 2px 6px rgba(255,255,255,0.20))",
          transition: "stroke-width .3s cubic-bezier(.4,0,.2,1), opacity .3s ease",
        },
        "& .MuiLineElement-highlighted": {
          strokeWidth: 3.4,
          filter: "drop-shadow(0 3px 12px rgba(255,255,255,0.35))",
        },
        "& .MuiLineElement-faded": {
          opacity: 0.25,
        },
        "& .MuiAreaElement-root": {
          fill: "url(#areaFillGradient)",
          opacity: 0.30,
          transition: "opacity .3s ease",
        },
        "& .MuiAreaElement-faded": {
          opacity: 0.12,
        },
        "& .MuiMarkElement-root": {
          fill: "#fff",
          stroke: "rgba(255,255,255,0.6)",
          strokeWidth: 2,
          r: 4,
          transition: "transform .3s cubic-bezier(.4,0,.2,1), filter .3s ease",
        },
        "& .MuiMarkElement-highlighted": {
          transform: "scale(1.5)",
          filter: "drop-shadow(0 0 6px rgba(255,255,255,0.55))",
          stroke: "#fff",
          strokeWidth: 2.5,
        },
        "& .MuiChartsAxisHighlight-root": {
          stroke: "rgba(255,255,255,0.18)",
          strokeDasharray: "4 4",
        },
      },
      barChartSx: {
        width: "100%",
        "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
          stroke: "rgba(255,255,255,0.10)",
        },
        "& .MuiChartsAxis-tickLabel": {
          fill: "rgba(255,255,255,0.82)",
        },
        "& .MuiChartsGrid-line": {
          stroke: "rgba(255,255,255,0.08)",
          strokeDasharray: "3 6",
        },
        "& .MuiBarElement-root": {
          filter: "drop-shadow(0 2px 8px rgba(255,255,255,0.15))",
          transition: "fill .25s cubic-bezier(.4,0,.2,1), opacity .25s ease, filter .25s ease",
          rx: 4,
          ry: 4,
        },
        "& .MuiBarElement-highlighted": {
          fill: "rgba(255,255,255,0.98)",
          filter: "drop-shadow(0 4px 16px rgba(255,255,255,0.30))",
        },
        "& .MuiBarElement-faded": {
          opacity: 0.22,
        },
        "& .MuiBarElement-root:hover": {
          fill: "rgba(255,255,255,0.96)",
          filter: "drop-shadow(0 4px 16px rgba(255,255,255,0.30))",
        },
        "& .MuiChartsAxisHighlight-root": {
          fill: "rgba(255,255,255,0.06)",
          stroke: "none",
        },
      },
      areaChartSx: {
        width: "100%",
        "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
          stroke: "rgba(255,255,255,0.10)",
        },
        "& .MuiChartsAxis-tickLabel": {
          fill: "rgba(255,255,255,0.82)",
        },
        "& .MuiChartsGrid-line": {
          stroke: "rgba(255,255,255,0.08)",
          strokeDasharray: "3 6",
        },
        "& .MuiLineElement-root": {
          strokeWidth: 2.5,
          filter: "drop-shadow(0 2px 6px rgba(255,255,255,0.20))",
          transition: "stroke-width .3s cubic-bezier(.4,0,.2,1), opacity .3s ease",
        },
        "& .MuiLineElement-highlighted": {
          strokeWidth: 3.2,
          filter: "drop-shadow(0 3px 10px rgba(255,255,255,0.30))",
        },
        "& .MuiLineElement-faded": {
          opacity: 0.25,
        },
        "& .MuiAreaElement-root": {
          fill: "rgba(255,255,255,0.18)",
          transition: "opacity .3s ease",
        },
        "& .MuiAreaElement-faded": {
          opacity: 0.08,
        },
        "& .MuiMarkElement-root": {
          fill: "#fff",
          stroke: "rgba(255,255,255,0.6)",
          strokeWidth: 2,
          r: 3.5,
          transition: "transform .3s cubic-bezier(.4,0,.2,1), filter .3s ease",
        },
        "& .MuiMarkElement-highlighted": {
          transform: "scale(1.5)",
          filter: "drop-shadow(0 0 6px rgba(255,255,255,0.5))",
          stroke: "#fff",
        },
        "& .MuiChartsAxisHighlight-root": {
          stroke: "rgba(255,255,255,0.18)",
          strokeDasharray: "4 4",
        },
      },
    },

    // ─── MENU PAPER ───────────────────────────────────────────────────────────
    menuPaper: {
      PaperProps: {
        sx: {
          bgcolor:      menuBg,
          color:        s.textPrimary,
          border:       `1px solid ${s.borderDefault}`,
          borderRadius: "10px",
          boxShadow:    s.cardShadow,
        },
      },
    },

    // ─── PROGRESS BAR ────────────────────────────────────────────────────────
    progressTrack:      s.progressTrack,
    progressValueColor: s.textSecondary,

    // ─── DIVIDER ─────────────────────────────────────────────────────────────
    divider: { borderColor: s.borderDefault },
  };
};

export type SharedTheme = ReturnType<typeof getSharedTheme>;
