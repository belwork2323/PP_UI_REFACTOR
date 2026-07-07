import { alpha }  from "@mui/material";
import { icons }  from "../../../icons";
import colors      from "../../../colors";
import fonts       from "../../../fonts";
import spacing     from "../../../spacing";
import layout      from "../../../layout";
import general     from "../../common/common_css_theme";
import { getSharedTheme } from "../../shared/shared_theme";
import { getAdminCommonTheme } from "../admin_common_theme";

const getBatchManagementTheme = (mode: "light" | "dark" = "light") => {
  const shared  = getSharedTheme(mode);
  const adminTheme = getAdminCommonTheme(mode);
  const d = colors.dashboard[mode as "light" | "dark"];

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
      newBatchButton: adminTheme.primaryButton,
    },

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
        fontSize:   "0.8rem",
        fontWeight: fonts.weight.semibold,
        color:      d.textSecondary,
        fontFamily: fonts.family.monospace,
        ...general.noWrap,
      },

      stageChip: (sc) => ({
        bgcolor:    sc?.bg    ?? accentBlueMuted,
        color:      sc?.color ?? accentBlue,
        fontWeight: fonts.weight.semibold,
        fontSize:   "0.72rem",
        border:     `1px solid ${alpha(sc?.color ?? accentBlue, 0.25)}`,
        "& .MuiChip-icon": { color: sc?.color ?? accentBlue },
        height: 24,
      }),
      statusChip: (sc) => ({
        bgcolor:    sc?.bg    ?? "rgba(107,114,128,0.10)",
        color:      sc?.color ?? "#6b7280",
        fontWeight: fonts.weight.semibold,
        fontSize:   "0.72rem",
        border:     `1px solid ${alpha(sc?.color ?? "#6b7280", 0.25)}`,
        "& .MuiChip-icon": { color: sc?.color ?? "#6b7280" },
        height: 24,
      }),
      priorityChip: (pc) => ({
        bgcolor:    pc?.bg    ?? "rgba(180,83,9,0.10)",
        color:      pc?.color ?? "#b45309",
        fontWeight: fonts.weight.bold,
        fontSize:   "0.70rem",
        border:     `1px solid ${alpha(pc?.color ?? "#b45309", 0.30)}`,
        height:     22,
      }),
      deptChip: (dc) => ({
        bgcolor:    dc.bg,
        color:      dc.color,
        fontWeight: fonts.weight.semibold,
        fontSize:   "0.72rem",
        border:     `1px solid ${alpha(dc.color, 0.25)}`,
        height:     24,
      }),

      assignedAvatar: { width: 28, height: 28, fontSize: "0.7rem", fontWeight: fonts.weight.bold, flexShrink: 0 },
      assignedName:   { fontSize: fonts.size.sm, fontWeight: fonts.weight.semibold, color: d.textPrimary, ...general.noWrap },
      assignedEmpty:  { fontSize: fonts.size.sm, color: d.textDisabled },

      notesText: { fontSize: "0.78rem", color: d.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 },
      notesEmpty: { fontSize: "0.78rem", color: d.textDisabled },

      createdOnDate:  { fontSize: "0.78rem", color: d.textSecondary, ...general.noWrap },
      createdOnTime:  { fontSize: "0.7rem",  color: d.textDisabled,  ...general.noWrap, mt: 0.2 },
      createdOnEmpty: { fontSize: "0.78rem", color: d.textDisabled },

      createdByIcon:     { fontSize: 12, color: d.textDisabled },
      createdByUsername: { fontSize: "0.75rem", fontWeight: fonts.weight.semibold, color: accentBlue, fontFamily: fonts.family.monospace, ...general.noWrap },
      createdByEmpty:    { fontSize: "0.78rem", color: d.textDisabled },

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
      maxWidth: false,
      paper: {
        bgcolor:       d.cardBg,
        borderRadius:  layout.cardBorderRadius,
        border:        `1px solid ${d.cardBorder}`,
        boxShadow:     isDark ? "0 24px 80px rgba(0,0,0,0.70)" : colors.shadow.card,
        width:         "75vw",
        maxWidth:      "75vw",
        height:        "80vh",
        maxHeight:     "80vh",
        display:       "flex",
        flexDirection: "column",
      },
      header: {
        wrapper: {
          ...general.flexRow,
          alignItems:     "center",
          justifyContent: "space-between",
          px:             spacing.lg,
          py:             2.5,
          background:     `linear-gradient(135deg, ${accentBlueDark} 0%, ${accentBlue} 100%)`,
          borderRadius:   `${layout.cardBorderRadius} ${layout.cardBorderRadius} 0 0`,
        },
        titleRow:  { display: "flex", alignItems: "center", gap: 1.5 },
        iconBadge: { width: 36, height: 36, borderRadius: general.borderRadius.md, bgcolor: colors.overlay.light, ...general.flexCenter },
        icon:      { color: colors.white.text, fontSize: 20 },
        title:     { color: colors.white.text, fontWeight: fonts.weight.bold, fontSize: fonts.size.md, lineHeight: fonts.lineHeight.tight },
        subtitle:  { color: colors.white.textMuted, fontSize: fonts.size.xs },
        closeButton: { color: colors.white.textMuted, "&:hover": { bgcolor: colors.overlay.lightHover } },
      },
      content:         { px: 6, pt: 5, pb: 3, flex: 1, overflowY: "auto" },
      actions:         { px: 6, py: 3.5, gap: spacing.sm },
      stackSpacing:    3,
      fieldRowSpacing: 3,
      headerGap:       { mt: 1, mb: 3, borderBottom: `1px solid ${d.dividerColor}`, pb: 3 },
      fieldLabel: {
        fontSize:      fonts.size.xs,
        fontWeight:    fonts.weight.bold,
        color:         d.textSecondary,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        mb:            1,
      },
      menuItemRow:   { display: "flex", alignItems: "center", gap: 1 },
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
      cancelButton:  { textTransform: "none", color: d.textSecondary, borderRadius: general.borderRadius.md, px: 2.5 },
      saveButton: {
        textTransform: "none",
        fontWeight:    fonts.weight.bold,
        borderRadius:  general.borderRadius.md,
        px:            spacing.lg,
        bgcolor:       accentBlue,
        boxShadow:     `0 4px 14px ${alpha(accentBlue, 0.35)}`,
        "&:hover":     { bgcolor: accentBlueDark },
        "&.Mui-disabled": { bgcolor: alpha(accentBlue, 0.4), color: colors.white.text },
      },
      savingSpinner: { color: "inherit", mr: 1 },
    },

    deleteDialog: {
      paper: {
        bgcolor:       d.cardBg,
        borderRadius:  layout.cardBorderRadius,
        border:        `1px solid ${d.cardBorder}`,
        boxShadow:     isDark ? "0 24px 80px rgba(0,0,0,0.70)" : colors.shadow.card,
        width:         "420px",
        maxWidth:      "90vw",
        display:       "flex",
        flexDirection: "column",
      },
      content:   { px: spacing.lg, pt: 3.5, pb: spacing.sm, textAlign: "center" },
      iconBadge: { width: 56, height: 56, ...general.borderCircle, bgcolor: alpha(colors.error.main, 0.12), ...general.flexCenter, mx: "auto", mb: spacing.md },
      warnIcon:  { color: colors.error.main, fontSize: 28 },
      title:     { fontSize: "1.05rem", fontWeight: fonts.weight.bold, color: d.textPrimary, mb: spacing.sm },
      body:      { fontSize: fonts.size.sm, color: d.textSecondary, lineHeight: fonts.lineHeight.normal },
      boldName:  { fontWeight: fonts.weight.bold, color: d.textPrimary },
      actions:   { px: spacing.lg, py: 2.5, gap: spacing.sm, justifyContent: "center" },
      cancelButton: {
        textTransform: "none",
        borderRadius:  general.borderRadius.md,
        px:            spacing.lg,
        borderColor:   inputBorder,
        color:         d.textSecondary,
        "&:hover":     { borderColor: d.textSecondary },
      },
      deleteButton: {
        textTransform: "none",
        fontWeight:    fonts.weight.bold,
        borderRadius:  general.borderRadius.md,
        px:            spacing.lg,
        bgcolor:       colors.error.main,
        boxShadow:     `0 4px 14px ${alpha(colors.error.main, 0.30)}`,
        "&:hover":     { bgcolor: "#b91c1c" },
        "&.Mui-disabled": { bgcolor: alpha(colors.error.main, 0.4), color: colors.white.text },
      },
      deletingSpinner: { color: "inherit", mr: 1 },
      deleteReasonInput: {
        mt: 2,
        "& .MuiOutlinedInput-root": {
          borderRadius: general.borderRadius.md,
          "& fieldset":             { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
          "&:hover fieldset":       { borderColor: colors.error.main },
          "&.Mui-focused fieldset": { borderColor: colors.error.main },
        },
        "& .MuiInputLabel-root":             { color: d.textSecondary },
        "& .MuiInputLabel-root.Mui-focused": { color: colors.error.main },
        "& .MuiInputBase-input":             { color: d.textPrimary, fontSize: "0.88rem" },
      },
    },

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