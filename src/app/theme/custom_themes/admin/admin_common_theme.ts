import { alpha } from "@mui/material";
import colors from "@app/theme/colors";
import fonts from "@app/theme/fonts";
import spacing from "@app/theme/spacing";
import layout from "@app/theme/layout";
import general from "@app/theme/custom_themes/common/common_css_theme";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import { getBatchListShellTheme, getFilterToggleSx } from "@app/theme/custom_themes/shared/batchListShell_theme";
import { getTokens } from "@app/theme/tokens/semantics";

export type AdminManagementTableThemeParams = {
  mode: "light" | "dark";
  accentBlue: string;
  accentBlueDark: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  skeletonBase: object;
  cellVariants?: Record<string, object>;
};

/** Shared edit/delete action buttons for admin management list tables. */
export const getAdminManagementTableCellActions = (
  mode: "light" | "dark",
  accentBlue: string,
  accentBlueMuted: string,
) => {
  const isDark = mode === "dark";
  return {
    actionsBox: {
      display: "flex",
      gap: 0.5,
      justifyContent: "flex-end",
      alignItems: "center",
      flexWrap: "wrap" as const,
    },
    editButton: {
      color: accentBlue,
      bgcolor: accentBlueMuted,
      borderRadius: general.borderRadius.sm,
      width: 28,
      height: 28,
      border: `1px solid ${alpha(accentBlue, 0.14)}`,
      "&:hover": { bgcolor: alpha(accentBlue, 0.16) },
    },
    editIcon: { fontSize: 14 },
    deleteButton: {
      color: colors.error.main,
      bgcolor: alpha(colors.error.main, isDark ? 0.1 : 0.06),
      borderRadius: general.borderRadius.sm,
      width: 28,
      height: 28,
      border: `1px solid ${alpha(colors.error.main, 0.16)}`,
      "&:hover": { bgcolor: alpha(colors.error.main, 0.14) },
    },
    deleteIcon: { fontSize: 14 },
  };
};

/** Shared list-table chrome for User / Project / Batch management pages. */
export const getAdminManagementTableTheme = ({
  mode,
  accentBlue,
  accentBlueDark,
  cardBg,
  textPrimary,
  textSecondary,
  textDisabled,
  skeletonBase,
  cellVariants = {},
}: AdminManagementTableThemeParams) => {
  const isDark = mode === "dark";
  const tableHeaderBg = isDark
    ? `linear-gradient(180deg, ${alpha(accentBlue, 0.26)} 0%, ${alpha(accentBlueDark, 0.18)} 100%)`
    : `linear-gradient(180deg, ${alpha(accentBlue, 0.13)} 0%, ${alpha(accentBlueDark, 0.07)} 100%)`;
  const tableBorderColor = isDark ? alpha(accentBlue, 0.2) : alpha(accentBlue, 0.13);
  const tableBorder = `1px solid ${tableBorderColor}`;
  const tableBodyBg = isDark ? cardBg : "#fff";

  const tableBodyCellBase = {
    fontSize: "0.8rem",
    fontWeight: 500,
    py: 0.65,
    px: 1.5,
    color: textPrimary,
    border: tableBorder,
    bgcolor: tableBodyBg,
    verticalAlign: "middle" as const,
  };

  const variantCells = Object.fromEntries(
    Object.entries(cellVariants).map(([key, extra]) => [key, { ...tableBodyCellBase, ...extra }]),
  );

  return {
    tableRoot: {
      borderCollapse: "collapse" as const,
      width: "100%",
    },
    paper: {
      bgcolor: cardBg,
      border: `1px solid ${alpha(accentBlue, isDark ? 0.22 : 0.14)}`,
      borderRadius: general.borderRadius.lg,
      boxShadow: isDark
        ? `0 8px 32px ${alpha("#000", 0.35)}`
        : `0 4px 24px ${alpha(accentBlue, 0.08)}, 0 1px 3px ${alpha(accentBlueDark, 0.05)}`,
      overflow: "hidden",
    },
    headerRow: {
      background: tableHeaderBg,
    },
    headerCell: {
      fontSize: "0.68rem",
      fontWeight: fonts.weight.bold,
      color: isDark ? alpha("#fff", 0.95) : accentBlueDark,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      borderBottom: tableBorder,
      borderRight: tableBorder,
      borderTop: tableBorder,
      borderLeft: tableBorder,
      py: 1,
      px: 1.5,
      bgcolor: "transparent",
      whiteSpace: "nowrap" as const,
      lineHeight: 1.35,
      verticalAlign: "middle" as const,
    },
    headerCellActions: {
      textAlign: "right" as const,
      pr: 2.5,
    },
    row: {
      bgcolor: tableBodyBg,
      "&:hover": {
        bgcolor: isDark ? alpha(accentBlue, 0.08) : alpha(accentBlue, 0.04),
      },
      transition: "background 0.15s ease",
    },
    cell: tableBodyCellBase,
    cellActionsWrapper: {
      ...tableBodyCellBase,
      py: 0.5,
      textAlign: "right" as const,
      pr: 2,
    },
    bodyText: {
      fontSize: "0.8rem",
      fontWeight: 500,
      color: textPrimary,
      lineHeight: 1.35,
    },
    emptyCell: {
      textAlign: "center" as const,
      py: 6,
    },
    emptyText: {
      fontSize: fonts.size.sm,
      color: textDisabled,
    },
    emptyIcon: {
      fontSize: 40,
      mb: spacing.sm,
      display: "block",
      mx: "auto",
      opacity: 0.35,
      color: accentBlue,
    },
    divider: {
      borderColor: tableBorderColor,
    },
    pagination: {
      px: 1.5,
      py: 0.35,
      color: textSecondary,
      bgcolor: isDark ? alpha(accentBlue, 0.05) : alpha(accentBlue, 0.025),
      borderTop: tableBorder,
      "& .MuiTablePagination-select": { color: textPrimary },
      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
        fontSize: fonts.size.xs,
      },
      "& .MuiSvgIcon-root": { color: accentBlue },
    },
    skeletonRow: skeletonBase,
    skeletonRowDefault: { ...skeletonBase, width: "80%" },
    skeletonRowAction: { ...skeletonBase, width: 60 },
    ...variantCells,
  };
};

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

  const primaryLight = isDark ? "#90caf9" : base.accentBlue;

  const filterPanelField = {
    mt: 0,
    mb: 0,
    "& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root": {
      height: 32,
      minHeight: 32,
      maxHeight: 32,
      fontSize: "0.72rem",
      borderRadius: "6px",
      bgcolor: semantic.filterInputBg,
      boxSizing: "border-box",
      "& fieldset, & .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: alpha(s.borderDefault, 0.65),
      },
      "&:hover fieldset, &:hover .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: primaryLight,
      },
      "&.Mui-focused fieldset, &.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: primaryLight,
      },
    },
    "& .MuiInputBase-input, & .MuiPickersSectionList-root, & .MuiSelect-select": {
      fontSize: "0.72rem",
      padding: "5px 8px",
      minHeight: "unset !important",
      "&::placeholder": {
        fontSize: "0.68rem",
        opacity: 0.65,
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.72rem",
    },
    "& .MuiInputLabel-shrink": {
      transform: "translate(14px, -8px) scale(0.85)",
    },
    "& .MuiInputAdornment-root .MuiIconButton-root": {
      padding: 2,
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
      filterPanelHeader: { alignItems: "center", pb: 0.5 },
      filterPanelIcon: { fontSize: 18, color: primaryLight },
      filterPanelLabel: { fontSize: "0.82rem", fontWeight: 700, color: s.textPrimary },
      filterPanelBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.65rem",
        fontWeight: 800,
        bgcolor: alpha(primaryLight, 0.15),
        color: primaryLight,
      },
      filterPanelClearChip: {
        fontWeight: 700,
        fontSize: "0.75rem",
        height: "28px",
        px: 0.5,
        borderColor: alpha(colors.error.main, 0.35),
        color: colors.error.main,
        "& .MuiChip-label": { px: 1.5 },
      },
    },
    filterPanel: {
      field: filterPanelField,
      menuItem: {
        fontSize: "0.72rem",
        py: 0.5,
        minHeight: 32,
      },
      fieldsRow: {
        width: "100%",
        alignSelf: "stretch",
      },
      fieldItem: {
        flex: "1 1 160px",
        minWidth: { xs: "100%", sm: 140 },
        maxWidth: "100%",
        "& > .MuiTextField-root": {
          width: "100%",
        },
      },
      fieldItemWide: {
        flex: "1 1 180px",
        minWidth: { xs: "100%", sm: 180 },
        maxWidth: "100%",
        "& > .MuiTextField-root": {
          width: "100%",
        },
      },
      fieldItemGrow: {
        flex: "2 1 200px",
        minWidth: { xs: "100%", sm: 160 },
        maxWidth: "100%",
        "& > .MuiTextField-root": {
          width: "100%",
        },
      },
      extension: {
        mt: 1.5,
        width: "100%",
        alignSelf: "stretch",
      },
      applyButton: {
        textTransform: "none" as const,
        fontWeight: fonts.weight.bold,
        fontSize: fonts.size.xs,
        borderRadius: 2,
        px: 1.8,
        py: "5px",
        color: isDark ? "#000000" : "#ffffff",
        whiteSpace: "nowrap" as const,
        background: `linear-gradient(135deg, ${base.accentBlue}, ${primaryLight})`,
        boxShadow: `0 2px 8px ${alpha(base.accentBlue, 0.28)}`,
        "&:hover": {
          boxShadow: `0 4px 12px ${alpha(base.accentBlue, 0.38)}`,
          transform: "translateY(-1px)",
        },
        transition: "all 0.18s",
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
