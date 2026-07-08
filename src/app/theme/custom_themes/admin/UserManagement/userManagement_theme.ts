import { alpha }  from "@mui/material";
import { icons }  from "@app/theme/icons";
import colors      from "@app/theme/colors";
import fonts       from "@app/theme/fonts";
import spacing     from "@app/theme/spacing";
import layout      from "@app/theme/layout";
import general     from "@app/theme/custom_themes/common/common_css_theme";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import { getAdminCommonTheme } from "@app/theme/custom_themes/admin/admin_common_theme";

const getUserManagementTheme = (mode: "light" | "dark" = "light") => {
  const shared  = getSharedTheme(mode);
  const adminTheme = getAdminCommonTheme(mode);
  const d = colors.dashboard[mode as "light" | "dark"];
  const semantic = adminTheme.semantic;

  const isDark          = mode === "dark";
  const accentBlue      = adminTheme.accentBlue;
  const accentBlueDark  = adminTheme.accentBlueDark;
  const accentBlueMuted = adminTheme.accentBlueMuted;
  const inputBg         = adminTheme.inputBg;
  const inputBorder     = adminTheme.inputBorder;

  const skeletonBase = shared.skeletonBase;


  return {

    general,

    page: shared.page,

    pageHeader: {
      ...adminTheme.pageHeader,
      title: { ...adminTheme.pageHeader.title, ...fonts.typography.display },
      subtitle: { ...adminTheme.pageHeader.subtitle, ...fonts.typography.subtitle },
      newUserButton: adminTheme.primaryButton,
    },

    batchListShell: adminTheme.batchListShell,
    filterToggle: adminTheme.filterToggle,
    filterPanel: adminTheme.filterPanel,

    toolbar: adminTheme.toolbar,

    input: adminTheme.input,

    menuPaper: adminTheme.menuPaper,

    table: {
      ...adminTheme.table,
      cellSubDepts: {
        borderBottom: `1px solid ${d.dividerColor}`,
        py:           1.5,
        maxWidth:     240,
      },
      skeletonRow: skeletonBase,
      skeletonRowDefault: { ...skeletonBase, width: "80%" },
      skeletonRowAction:  { ...skeletonBase, width: 60 },
    },

    tableCell: {
      userBox:       { display: "flex", alignItems: "center", gap: 1.5 },
      usernameBox:   { display: "flex", alignItems: "center", gap: 0.6 },
      createdByBox:  { display: "flex", alignItems: "center", gap: 0.6, mb: 0.4 },
      actionsBox:    { display: "flex", gap: 0.5, justifyContent: "flex-end" },
      avatar: {
        width: 34, height: 34,
        fontSize: fonts.size.dense, fontWeight: fonts.weight.bold, flexShrink: 0,
      },
      userName: {
        fontSize: fonts.size.sm, fontWeight: fonts.weight.semibold,
        color: d.textPrimary, ...general.noWrap,
      },
      usernameIcon:  { fontSize: 13, color: d.textDisabled },
      usernameText: {
        fontSize: fonts.size.base, fontWeight: fonts.weight.semibold,
        color: accentBlue, letterSpacing: "0.03em", fontFamily: fonts.family.monospace,
      },
      roleChip: (rc) => ({
        bgcolor: rc.bg, color: rc.color, fontWeight: fonts.weight.semibold,
        fontSize: fonts.size.compact, border: `1px solid ${alpha(rc.color, 0.25)}`,
        "& .MuiChip-icon": { color: rc.color }, height: 24,
      }),
      deptChip: (dc) => ({
        bgcolor: dc.bg, color: dc.color, fontWeight: fonts.weight.semibold,
        fontSize: fonts.size.compact, border: `1px solid ${alpha(dc.color, 0.25)}`, height: 24,
      }),
      subDeptChip: {
        height: 20,
        fontSize: fonts.typography.chipSm.fontSize,
        fontWeight: fonts.typography.chipSm.fontWeight,
        color: semantic.subDeptChipColor,
        bgcolor: semantic.subDeptChipBg,
        border: `1px solid ${semantic.subDeptChipBorder}`,
        "& .MuiChip-label": { px: 1 },
      },
      statusChip: (sc) => ({
        bgcolor: sc.bg, color: sc.color, fontWeight: fonts.weight.semibold,
        fontSize: fonts.size.compact, border: `1px solid ${alpha(sc.color, 0.25)}`,
        "& .MuiChip-icon": { color: sc.color }, height: 24,
      }),
      createdOnDate:  { ...fonts.typography.bodyMuted, color: d.textSecondary, ...general.noWrap },
      createdOnTime:  { fontSize: fonts.size.tight, color: d.textDisabled, ...general.noWrap, mt: 0.2 },
      createdOnEmpty: { ...fonts.typography.bodyMuted, color: d.textDisabled },
      createdByIcon:     { fontSize: 12, color: d.textDisabled },
      createdByUsername: {
        fontSize: fonts.size.xs, fontWeight: fonts.weight.semibold,
        color: accentBlue, fontFamily: fonts.family.monospace, ...general.noWrap,
      },
      createdByChip: (rc) => ({
        height: 18, fontSize: fonts.size["2xs"], fontWeight: fonts.weight.bold,
        bgcolor: rc?.bg    ?? "rgba(71,85,105,0.10)",
        color:   rc?.color ?? "#475569",
        border:  `1px solid ${alpha(rc?.color ?? "#475569", 0.22)}`,
        "& .MuiChip-label": { px: 0.9 },
      }),
      createdByEmpty: { ...fonts.typography.bodyMuted, color: d.textDisabled },
      editButton: {
        color: accentBlue, bgcolor: accentBlueMuted,
        borderRadius: general.borderRadius.sm, width: 30, height: 30,
        "&:hover": { bgcolor: alpha(accentBlue, 0.2) },
      },
      editIcon:  { fontSize: 14 },
      deleteButton: {
        color: colors.error.main,
        bgcolor: alpha(colors.error.main, isDark ? 0.10 : 0.06),
        borderRadius: general.borderRadius.sm, width: 30, height: 30,
        "&:hover": { bgcolor: alpha(colors.error.main, 0.18) },
      },
      deleteIcon: { fontSize: 14 },
    },

    modal: {
      ...adminTheme.modal,
      paper: { ...adminTheme.modal.paper, height: "75vh", maxHeight: "75vh" },
      passwordToggle: { color: d.textSecondary, "&:hover": { color: d.textPrimary } },
      subDeptsGrid: { display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 },
      subDeptsListItem: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        px: 1.5, py: 0.75, borderRadius: general.borderRadius.md,
        bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
        border: `1px solid ${d.cardBorder}`,
        width: "calc(33.333% - 6px)", flexShrink: 0, minWidth: 0,
      },
      subDeptsListItemText: { fontSize: fonts.size.sm, fontWeight: fonts.weight.medium, color: d.textPrimary },
      subDeptsRemoveButton: { color: colors.error.main, p: 0.4, "&:hover": { bgcolor: "rgba(220,38,38,0.10)" } },
      subDeptsEmpty:   { fontSize: fonts.size.sm, color: d.textDisabled, textAlign: "center", py: 1.5 },
      subDeptsBlocked: { fontSize: fonts.size.sm, color: d.textDisabled, textAlign: "center", py: 1.5, fontStyle: "italic" },
      subDeptsChipsBox: { display: "flex", flexWrap: "wrap", gap: 0.5 },
      statusFormControl: {
        minWidth: 140,
        "& .MuiOutlinedInput-root": {
          bgcolor: inputBg, borderRadius: general.borderRadius.md,
          "& fieldset":             { borderColor: inputBorder },
          "&:hover fieldset":       { borderColor: accentBlue },
          "&.Mui-focused fieldset": { borderColor: accentBlue },
        },
        "& .MuiInputLabel-root":             { color: d.textSecondary },
        "& .MuiInputLabel-root.Mui-focused": { color: accentBlue },
        "& .MuiInputBase-input":             { color: d.textPrimary },
        "& .MuiSelect-icon":                 { color: d.textSecondary },
      },
      subDeptChip: {
        height: 20, fontSize: fonts.size.tight, fontWeight: fonts.weight.semibold,
        bgcolor: accentBlueMuted, color: accentBlue,
        "& .MuiChip-label": { px: spacing.sm },
      },

      // ── Sub-department selector (floating overlay) ──────────────────────
      selectionCountChip: {
        height: 22, fontSize: fonts.size.compact, fontWeight: fonts.weight.semibold, ml: 1,
      },
      selectorToggleBase: {
        fontSize: fonts.size.xs, fontWeight: fonts.weight.semibold, textTransform: "none",
        borderRadius: "6px", px: 1.5, py: 0.4,
      },
      selectorToggleOpen: {
        bgcolor: "primary.main", color: "#fff",
        "&:hover": { bgcolor: "primary.dark" },
      },
      selectorToggleClosed: (theme) => ({
        borderColor: theme.palette.primary.main, color: theme.palette.primary.main,
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06) },
      }),
      selectorWrapper: { position: "relative", zIndex: 1200 },
      selectorCollapse: {
        position: "absolute", top: 4, left: 0, right: 0,
        boxShadow: 3, borderRadius: "10px",
      },
      selectorCard: {
        borderRadius: "10px", overflow: "hidden",
        borderColor: "primary.light", bgcolor: "background.paper",
        display: "flex", flexDirection: "column",
      },
      selectorHeader: (theme) => ({
        px: 1.5, pt: 1, pb: 1, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      }),
      selectorHeaderCount: { fontSize: fonts.size.xs, color: "text.secondary", fontWeight: fonts.weight.semibold },
      clearAllButton: {
        fontSize: fonts.size.compact, textTransform: "none", color: "error.main",
        p: 0, minWidth: 0,
        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
      },
      selectorCloseIcon: { p: 0.3, color: "text.disabled", "&:hover": { color: "error.main" } },
      selectorSearchBox: { px: 1.5, pb: 1.5, pt: 0.5, flexShrink: 0 },
      selectorSearchInput: { fontSize: fonts.size.sm, borderRadius: "6px" },
      selectorSearchIcon: { fontSize: 16, color: "text.disabled" },
      selectorListBox: {
        maxHeight: 220, overflowY: "auto",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 4 },
      },
      selectorEmptyText: {
        fontSize: fonts.size.base, color: "text.disabled",
        textAlign: "center", py: 3,
      },
      selectorListItem: (checked, theme) => ({
        display: "flex", alignItems: "center", gap: 1.5,
        px: 1.5, py: 0.85, cursor: "pointer",
        bgcolor: checked ? alpha(theme.palette.primary.main, 0.06) : "transparent",
        "&:hover": {
          bgcolor: checked
            ? alpha(theme.palette.primary.main, 0.1)
            : "action.hover",
        },
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
      }),
      selectorCheckbox: { p: 0, "& .MuiSvgIcon-root": { fontSize: 17 } },
      selectorItemText: (checked) => ({
        fontSize: fonts.size.sm, lineHeight: 1.4, userSelect: "none",
        fontWeight: checked ? 600 : 400,
        color: checked ? "primary.main" : "text.primary",
        flex: 1,
      }),
      selectorItemDot: {
        width: 6, height: 6, borderRadius: "50%",
        bgcolor: "primary.main", flexShrink: 0,
      },

      // ── Selected sub-dept cards ─────────────────────────────────────────
      restrictedBox: (theme) => ({
        display: "flex", alignItems: "center", gap: 1,
        px: 1.5, py: 1.2,
        bgcolor: alpha(theme.palette.warning.main, 0.06),
        border: "1px dashed", borderColor: "warning.light", borderRadius: "8px",
      }),
      restrictedIcon: { fontSize: 14, color: "warning.main", flexShrink: 0 },
      restrictedText: { fontSize: fonts.size.base, color: "text.secondary" },
      emptySubDeptsBox: (borderError) => ({
        display: "flex", alignItems: "center", gap: 1,
        px: 1.5, py: 1.2, bgcolor: "action.hover",
        border: "1px dashed",
        borderColor: borderError ? "error.light" : "divider",
        borderRadius: "8px",
      }),
      emptySubDeptsText: (isError) => ({
        fontSize: fonts.size.base,
        color: isError ? "error.main" : "text.disabled",
      }),
      selectedCard: (theme) => ({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        px: 1.5, py: 0.9, boxShadow: "none", borderRadius: "8px",
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.18),
        transition: "border-color 0.15s",
        "&:hover": { borderColor: "primary.light" },
      }),
      selectedCardDot: {
        width: 7, height: 7, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0,
      },
      selectedCardText: { fontSize: fonts.size.sm, fontWeight: fonts.weight.medium, color: "text.primary" },
      selectedCardRemove: (theme) => ({
        color: "text.disabled", p: 0.4,
        "&:hover": {
          color: "error.main",
          bgcolor: alpha(theme.palette.error.main, 0.08),
        },
      }),
      selectedCardRemoveIcon: { fontSize: 14 },
    },

    deleteDialog: adminTheme.deleteDialog,

    // ─── RICH STATS GRID ────────────────────────────────────────────────────────
    statsGrid: {
      ...adminTheme.statsGrid,

      colors: colors.admin.userStats[mode as "light" | "dark"],
    },

  };
};

export default getUserManagementTheme;