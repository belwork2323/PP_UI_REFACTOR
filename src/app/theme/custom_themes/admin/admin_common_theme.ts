import { alpha } from "@mui/material";
import colors from "@app/theme/colors";
import fonts from "@app/theme/fonts";
import spacing from "@app/theme/spacing";
import layout from "@app/theme/layout";
import general from "@app/theme/custom_themes/common/common_css_theme";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import { getBatchListShellTheme, getFilterToggleSx } from "@app/theme/custom_themes/shared/batchListShell_theme";
import { getTokens } from "@app/theme/tokens/semantics";

const getAdminModalTheme = (
  mode: "light" | "dark",
  tokens: { accentBlue: string; accentBlueDark: string }
) => {
  const d = colors.dashboard[mode];
  const isDark = mode === "dark";
  const { accentBlue, accentBlueDark } = tokens;

  return {
    maxWidth: false,
    header: {
      wrapper: {
        ...general.flexRow,
        alignItems: "center",
        justifyContent: "space-between",
        px: spacing.lg,
        py: 2.5,
        background: `linear-gradient(135deg, ${accentBlueDark} 0%, ${accentBlue} 100%)`,
        borderRadius: `${layout.cardBorderRadius} ${layout.cardBorderRadius} 0 0`,
      },
      titleRow: { display: "flex", alignItems: "center", gap: 1.5 },
      iconBadge: {
        width: 36,
        height: 36,
        borderRadius: general.borderRadius.md,
        bgcolor: colors.overlay.light,
        ...general.flexCenter,
      },
      icon: { color: colors.white.text, fontSize: 20 },
      title: {
        color: colors.white.text,
        fontWeight: fonts.weight.bold,
        fontSize: fonts.size.md,
        lineHeight: fonts.lineHeight.tight,
      },
      subtitle: { color: colors.white.textMuted, fontSize: fonts.size.xs },
      closeButton: {
        color: colors.white.textMuted,
        "&:hover": { bgcolor: colors.overlay.lightHover },
      },
    },
    paperBase: {
      bgcolor: d.cardBg,
      borderRadius: layout.cardBorderRadius,
      border: `1px solid ${d.cardBorder}`,
      boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.70)" : colors.shadow.card,
      display: "flex",
      flexDirection: "column" as const,
    },
    paperLg: {
      width: "75vw",
      maxWidth: "75vw",
      height: "80vh",
      maxHeight: "80vh",
    },
    paperMd: {
      width: "75vw",
      maxWidth: "75vw",
      height: "75vh",
      maxHeight: "75vh",
    },
    contentLg: { px: 6, pt: 5, pb: 3, flex: 1, overflowY: "auto" as const },
    contentMd: { px: 3, pt: 3, pb: 2, flex: 1, overflowY: "auto" as const },
    actionsLg: { px: 6, py: 3.5, gap: spacing.sm },
    actionsMd: { px: 3, py: 2.5, gap: spacing.sm },
    stackSpacing: 3,
    fieldRowSpacing: 3,
    headerGap: {
      mt: 1,
      mb: 3,
      borderBottom: `1px solid ${d.dividerColor}`,
      pb: 3,
    },
    fieldLabel: {
      fontSize: fonts.size.xs,
      fontWeight: fonts.weight.bold,
      color: d.textSecondary,
      letterSpacing: "0.07em",
      textTransform: "uppercase" as const,
      mb: 1,
    },
    menuItemRow: { display: "flex", alignItems: "center", gap: 1 },
    cancelButton: {
      textTransform: "none" as const,
      color: d.textSecondary,
      borderRadius: general.borderRadius.md,
      px: 2.5,
    },
    saveButton: {
      textTransform: "none" as const,
      fontWeight: fonts.weight.bold,
      borderRadius: general.borderRadius.md,
      px: spacing.lg,
      bgcolor: accentBlue,
      boxShadow: `0 4px 14px ${alpha(accentBlue, 0.35)}`,
      "&:hover": { bgcolor: accentBlueDark },
      "&.Mui-disabled": { bgcolor: alpha(accentBlue, 0.4), color: colors.white.text },
    },
    savingSpinner: { color: "inherit", mr: 1 },
  };
};

const getAdminDeleteDialogTheme = (
  mode: "light" | "dark",
  tokens: { inputBorder: string }
) => {
  const d = colors.dashboard[mode];
  const isDark = mode === "dark";
  const { inputBorder } = tokens;

  return {
    paper: {
      bgcolor: d.cardBg,
      borderRadius: layout.cardBorderRadius,
      border: `1px solid ${d.cardBorder}`,
      boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.70)" : colors.shadow.card,
      width: "100%",
      maxWidth: "420px",
      height: "auto",
      maxHeight: "none",
      display: "flex",
      flexDirection: "column" as const,
    },
    content: { px: spacing.lg, pt: 3.5, pb: spacing.sm, textAlign: "center" as const },
    iconBadge: {
      width: 56,
      height: 56,
      ...general.borderCircle,
      bgcolor: alpha(colors.error.main, 0.12),
      ...general.flexCenter,
      mx: "auto",
      mb: spacing.md,
    },
    warnIcon: { color: colors.error.main, fontSize: 28 },
    title: {
      fontSize: "1.05rem",
      fontWeight: fonts.weight.bold,
      color: d.textPrimary,
      mb: spacing.sm,
    },
    body: {
      fontSize: fonts.size.sm,
      color: d.textSecondary,
      lineHeight: fonts.lineHeight.normal,
    },
    boldName: { fontWeight: fonts.weight.bold, color: d.textPrimary },
    actions: { px: spacing.lg, py: 2.5, gap: spacing.sm, justifyContent: "center" },
    cancelButton: {
      textTransform: "none" as const,
      borderRadius: general.borderRadius.md,
      px: spacing.lg,
      borderColor: inputBorder,
      color: d.textSecondary,
      "&:hover": { borderColor: d.textSecondary },
    },
    deleteButton: {
      textTransform: "none" as const,
      fontWeight: fonts.weight.bold,
      borderRadius: general.borderRadius.md,
      px: spacing.lg,
      bgcolor: colors.error.main,
      boxShadow: `0 4px 14px ${alpha(colors.error.main, 0.30)}`,
      "&:hover": { bgcolor: "#b91c1c" },
      "&.Mui-disabled": { bgcolor: alpha(colors.error.main, 0.4), color: colors.white.text },
    },
    deletingSpinner: { color: "inherit", mr: 1 },
    deleteReasonInput: {
      mt: 2,
      "& .MuiOutlinedInput-root": {
        borderRadius: general.borderRadius.md,
        "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
        "&:hover fieldset": { borderColor: colors.error.main },
        "&.Mui-focused fieldset": { borderColor: colors.error.main },
      },
      "& .MuiInputLabel-root": { color: d.textSecondary },
      "& .MuiInputLabel-root.Mui-focused": { color: colors.error.main },
      "& .MuiInputBase-input": { color: d.textPrimary, fontSize: fonts.size.sm },
    },
  };
};

/** Admin CRUD chrome tokens shared by Batch, User, and Project management pages. */
export const getAdminCommonTheme = (mode: "light" | "dark" = "light") => {
  const base = getSharedTheme(mode).adminManagement;
  const modalBase = getAdminModalTheme(mode, {
    accentBlue: base.accentBlue,
    accentBlueDark: base.accentBlueDark,
  });
  const s = getTokens(mode);
  const d = colors.dashboard[mode];
  const f = colors.admin.filters[mode];
  const semantic = colors.admin.semantic[mode];
  const isDark = mode === "dark";

  const shellPalette = {
    primary: base.accentBlue,
    primaryLight: isDark ? "#90caf9" : base.accentBlue,
    border: s.borderDefault,
    text: s.textPrimary,
    textSub: s.textSecondary,
    surface: s.cardBg,
  };

  const filterToggleTokens = getFilterToggleSx({
    border: s.borderDefault,
    inputFocus: f.inputFocus,
    filterActiveBg: f.filterActiveBg,
    filterBadgeBg: f.filterBadgeBg,
    filterBadgeColor: f.filterBadgeColor,
    textSecondary: s.textSecondary,
  });

  const filterPanelField = {
    "& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root": {
      height: 32,
      minHeight: 32,
      maxHeight: 32,
      fontSize: fonts.typography.label.fontSize,
      borderRadius: "6px",
      bgcolor: semantic.filterInputBg,
      boxSizing: "border-box",
      "& fieldset, & .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: alpha(s.borderDefault, 0.65),
      },
      "&:hover fieldset, &:hover .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: base.accentBlue,
      },
      "&.Mui-focused fieldset, &.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: base.accentBlue,
      },
    },
    "& .MuiInputBase-input, & .MuiPickersSectionList-root, & .MuiSelect-select": {
      fontSize: fonts.typography.label.fontSize,
      padding: "5px 8px",
      minHeight: "unset !important",
    },
    "& .MuiInputLabel-root": {
      fontSize: fonts.typography.label.fontSize,
    },
  };

  return {
    ...base,
    typography: fonts.typography,
    batchListShell: getBatchListShellTheme(shellPalette, { filterInputBg: semantic.filterInputBg }),
    filterToggle: {
      ...filterToggleTokens,
      clearChip: filterToggleTokens.clearChip({
        clearBg: f.clearBg,
        clearColor: f.clearColor,
        clearBorder: f.clearBorder,
      }),
    },
    filterPanel: {
      field: filterPanelField,
      menuItem: {
        fontSize: fonts.typography.label.fontSize,
        py: 0.5,
        minHeight: 32,
      },
      extension: {
        mt: 1.5,
        pt: 2,
        borderTop: `1px solid ${alpha(s.borderDefault, 0.55)}`,
      },
      applyButton: {
        ...base.primaryButton,
        textTransform: "none" as const,
        fontSize: fonts.typography.label.fontSize,
      },
      closeButton: {
        textTransform: "none" as const,
        fontWeight: fonts.weight.bold,
        fontSize: fonts.typography.label.fontSize,
      },
    },
    statusColorMap: colors.admin.statusColors[mode],
    priorityColorMap: colors.admin.priorityColors[mode],
    semantic,
    modal: {
      ...modalBase,
      paper: { ...modalBase.paperBase, ...modalBase.paperLg },
      content: modalBase.contentLg,
      actions: modalBase.actionsLg,
    },
    deleteDialog: getAdminDeleteDialogTheme(mode, { inputBorder: base.inputBorder }),
  };
};

export default getAdminCommonTheme;
