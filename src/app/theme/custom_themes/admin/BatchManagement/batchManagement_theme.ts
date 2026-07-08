import { alpha }  from "@mui/material";
import { icons }  from "@app/theme/icons";
import colors      from "@app/theme/colors";
import fonts       from "@app/theme/fonts";
import spacing     from "@app/theme/spacing";
import layout      from "@app/theme/layout";
import general     from "@app/theme/custom_themes/common/common_css_theme";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import { getAdminCommonTheme } from "@app/theme/custom_themes/admin/admin_common_theme";

const getBatchManagementTheme = (mode: "light" | "dark" = "light") => {
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
      newBatchButton: adminTheme.primaryButton,
    },

    batchListShell: adminTheme.batchListShell,
    filterToggle: adminTheme.filterToggle,
    filterPanel: adminTheme.filterPanel,

    toolbar: adminTheme.toolbar,

    input: adminTheme.input,

    menuPaper: adminTheme.menuPaper,

    table: {
      ...adminTheme.table,
      cellNotes: { borderBottom: `1px solid ${d.dividerColor}`, py: 1.5, maxWidth: 200 },
      skeletonRowDefault: { ...skeletonBase, width: "80%" },
      skeletonRowAction:  { ...skeletonBase, width: 60 },
    },

    tableCell: {
      batchIdBox:    { display: "flex", alignItems: "center", gap: 0.8 },
      motorIdBox:    { display: "flex", alignItems: "center", gap: 0.6 },
      assignedToBox: { display: "flex", alignItems: "center", gap: 1 },
      createdByBox:  { display: "flex", alignItems: "center", gap: 0.6, mb: 0.4 },

      batchIdIcon: { fontSize: 14, color: accentBlue, opacity: 0.7 },
      batchIdText: {
        fontSize:      fonts.size.sm,
        fontWeight:    fonts.weight.extrabold,
        color:         accentBlue,
        letterSpacing: "0.04em",
        fontFamily:    fonts.family.monospace,
        ...general.noWrap,
      },
      motorIdIcon: { fontSize: 13, color: d.textDisabled },
      motorIdText: {
        fontSize:   fonts.size.base,
        fontWeight: fonts.weight.semibold,
        color:      d.textSecondary,
        fontFamily: fonts.family.monospace,
        ...general.noWrap,
      },

      stageChip: (sc) => ({
        bgcolor:    sc?.bg    ?? accentBlueMuted,
        color:      sc?.color ?? accentBlue,
        fontWeight: fonts.weight.semibold,
        fontSize:   fonts.typography.chip.fontSize,
        border:     `1px solid ${alpha(sc?.color ?? accentBlue, 0.25)}`,
        "& .MuiChip-icon": { color: sc?.color ?? accentBlue },
        height: 24,
      }),
      statusChip: (sc) => ({
        bgcolor:    sc?.bg    ?? semantic.chipFallbackBg,
        color:      sc?.color ?? semantic.chipFallbackColor,
        fontWeight: fonts.typography.chip.fontWeight,
        fontSize:   fonts.typography.chip.fontSize,
        border:     `1px solid ${alpha(sc?.color ?? semantic.chipFallbackColor, 0.25)}`,
        "& .MuiChip-icon": { color: sc?.color ?? semantic.chipFallbackColor },
        height: 24,
      }),
      priorityChip: (pc) => ({
        bgcolor:    pc?.bg    ?? semantic.chipFallbackBg,
        color:      pc?.color ?? semantic.chipFallbackColor,
        fontWeight: fonts.weight.bold,
        fontSize:   fonts.typography.chipSm.fontSize,
        border:     `1px solid ${alpha(pc?.color ?? semantic.chipFallbackColor, 0.30)}`,
        height:     22,
      }),
      deptChip: (dc) => ({
        bgcolor:    dc.bg,
        color:      dc.color,
        fontWeight: fonts.weight.semibold,
        fontSize:   fonts.typography.chip.fontSize,
        border:     `1px solid ${alpha(dc.color, 0.25)}`,
        height:     24,
      }),

      assignedAvatar: { width: 28, height: 28, fontSize: fonts.size.tight, fontWeight: fonts.weight.bold, flexShrink: 0 },
      assignedName:   { fontSize: fonts.size.sm, fontWeight: fonts.weight.semibold, color: d.textPrimary, ...general.noWrap },
      assignedEmpty:  { fontSize: fonts.size.sm, color: d.textDisabled },

      notesText: { ...fonts.typography.bodyMuted, color: d.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 },
      notesEmpty: { ...fonts.typography.bodyMuted, color: d.textDisabled },

      createdOnDate:  { ...fonts.typography.bodyMuted, color: d.textSecondary, ...general.noWrap },
      createdOnTime:  { fontSize: fonts.size.tight, color: d.textDisabled, ...general.noWrap, mt: 0.2 },
      createdOnEmpty: { ...fonts.typography.bodyMuted, color: d.textDisabled },

      createdByIcon:     { fontSize: 12, color: d.textDisabled },
      createdByUsername: { fontSize: fonts.size.xs, fontWeight: fonts.weight.semibold, color: accentBlue, fontFamily: fonts.family.monospace, ...general.noWrap },
      createdByEmpty:    { ...fonts.typography.bodyMuted, color: d.textDisabled },

      editButton: {
        color:        accentBlue,
        bgcolor:      accentBlueMuted,
        borderRadius: general.borderRadius.sm,
        width:        30,
        height:       30,
        "&:hover":    { bgcolor: alpha(accentBlue, 0.2) },
      },
      editIcon:  { fontSize: 14 },
      deleteButton: {
        color:        colors.error.main,
        bgcolor:      alpha(colors.error.main, isDark ? 0.10 : 0.06),
        borderRadius: general.borderRadius.sm,
        width:        30,
        height:       30,
        "&:hover":    { bgcolor: alpha(colors.error.main, 0.18) },
      },
      deleteIcon: { fontSize: 14 },
    },

    modal: {
      ...adminTheme.modal,
      projectOption: {
        display:       "flex",
        flexDirection: "column",
        gap:           0.25,
        py:            0.25,
        width:         "100%",
      },
      projectOptionName: {
        fontSize:   fonts.size.sm,
        fontWeight: fonts.weight.semibold,
        color:      d.textPrimary,
        lineHeight: 1.3,
      },
      projectOptionId: {
        fontSize:      fonts.size.xs,
        fontWeight:    fonts.weight.bold,
        color:         accentBlue,
        fontFamily:    fonts.family.monospace,
        letterSpacing: "0.04em",
        lineHeight:    1.2,
      },
      projectOptionSelected: {
        display:    "flex",
        alignItems: "baseline",
        gap:        1,
        minWidth:   0,
        overflow:   "hidden",
      },
      motorStageOption: {
        display:       "flex",
        flexDirection: "column",
        gap:           0.25,
        py:            0.25,
        width:         "100%",
      },
      motorStageLabel: {
        fontSize:   fonts.size.sm,
        fontWeight: fonts.weight.semibold,
        color:      d.textPrimary,
        lineHeight: 1.3,
      },
      motorStageMeta: {
        fontSize:      fonts.size.xs,
        fontWeight:    fonts.weight.medium,
        color:         accentBlue,
        letterSpacing: "0.03em",
        lineHeight:    1.2,
      },
    },

    deleteDialog: adminTheme.deleteDialog,

    // ─── RICH STATS GRID ─────────────────────────────────────────────────────
    statsGrid: {
      ...adminTheme.statsGrid,
      outerWrap: {
        ...adminTheme.statsGrid.outerWrap,
        overflowX: "auto",
      },
      innerGrid: {
        ...adminTheme.statsGrid.innerGrid,
        gridTemplateColumns: "repeat(5, minmax(180px, 1fr))",
        minWidth: 900,
      },

      colors: colors.admin.batchStats[mode as "light" | "dark"],
      bgDecor: {
        background:    isDark
          ? "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(56,189,248,0.05) 0%, transparent 70%)"
          : "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(3,105,161,0.04) 0%, transparent 70%)",
      },
    },

  };
};

export default getBatchManagementTheme;