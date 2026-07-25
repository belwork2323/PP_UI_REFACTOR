import { alpha } from "@mui/material";
import { icons } from "@app/theme/icons";
import colors from "@app/theme/colors";
import fonts from "@app/theme/fonts";
import general from "@app/theme/custom_themes/common/common_css_theme";
import { getSharedTheme } from "@app/theme/custom_themes/shared/shared_theme";
import { getAdminCommonTheme } from "@app/theme/custom_themes/admin/admin_common_theme";

const getBatchManagementTheme = (mode: "light" | "dark" = "light") => {
  const shared = getSharedTheme(mode);
  const adminTheme = getAdminCommonTheme(mode);
  const d = colors.dashboard[mode as "light" | "dark"];
  const semantic = adminTheme.semantic;

  const isDark = mode === "dark";
  const accentBlue = adminTheme.accentBlue;
  const accentBlueDark = adminTheme.accentBlueDark;
  const accentBlueMuted = adminTheme.accentBlueMuted;

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
      skeletonRowAction: { ...skeletonBase, width: 60 },
    },

    tableCell: {
      batchIdBox: { display: "flex", alignItems: "center", gap: 0.8 },
      motorIdBox: { display: "flex", alignItems: "center", gap: 0.6 },
      assignedToBox: { display: "flex", alignItems: "center", gap: 1 },
      createdByBox: { display: "flex", alignItems: "center", gap: 0.6, mb: 0.4 },
      projectInfo: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      },

      projectName: {
        fontSize: "0.85rem",
        fontWeight: 500,
        color: d.textPrimary,
        lineHeight: 1.2,
      },

      projectId: {
        fontSize: "0.65rem",
        fontWeight: 400,
        color: d.textSecondary,
        lineHeight: 1.2,
        mt: 0.25,
      },

      projectIdIcon: {
        color: "auto",
      },
      batchIdIcon: { fontSize: 14, color: accentBlue, opacity: 0.7 },
      batchIdText: {
        fontSize: fonts.size.sm,
        fontWeight: fonts.weight.extrabold,
        color: accentBlue,
        letterSpacing: "0.04em",
        fontFamily: fonts.family.monospace,
        ...general.noWrap,
      },
      motorIdIcon: { fontSize: 13, color: d.textDisabled },
      motorIdText: {
        fontSize: fonts.size.base,
        fontWeight: fonts.weight.semibold,
        color: d.textSecondary,
        fontFamily: fonts.family.monospace,
        ...general.noWrap,
      },
      motorIdCellText: {
        fontSize: fonts.size.base,
        fontWeight: fonts.weight.semibold,
        color: d.textSecondary,
        fontFamily: fonts.family.monospace,
        lineHeight: 1.35,
        wordBreak: "break-word",
      },

      stageChip: (sc) => ({
        bgcolor: sc?.bg ?? accentBlueMuted,
        color: sc?.color ?? accentBlue,
        fontWeight: fonts.weight.semibold,
        fontSize: fonts.typography.chip.fontSize,
        border: `1px solid ${alpha(sc?.color ?? accentBlue, 0.25)}`,
        "& .MuiChip-icon": { color: sc?.color ?? accentBlue },
        height: 24,
      }),
      statusChip: (sc) => ({
        bgcolor: sc?.bg ?? semantic.chipFallbackBg,
        color: sc?.color ?? semantic.chipFallbackColor,
        fontWeight: fonts.typography.chip.fontWeight,
        fontSize: fonts.typography.chip.fontSize,
        border: `1px solid ${alpha(sc?.color ?? semantic.chipFallbackColor, 0.25)}`,
        "& .MuiChip-icon": { color: sc?.color ?? semantic.chipFallbackColor },
        height: 24,
      }),
      priorityChip: (pc) => ({
        bgcolor: pc?.bg ?? semantic.chipFallbackBg,
        color: pc?.color ?? semantic.chipFallbackColor,
        fontWeight: fonts.weight.bold,
        fontSize: fonts.typography.chipSm.fontSize,
        border: `1px solid ${alpha(pc?.color ?? semantic.chipFallbackColor, 0.3)}`,
        height: 22,
      }),
      deptChip: (dc) => ({
        bgcolor: dc.bg,
        color: dc.color,
        fontWeight: fonts.weight.semibold,
        fontSize: fonts.typography.chip.fontSize,
        border: `1px solid ${alpha(dc.color, 0.25)}`,
        height: 24,
      }),

      assignedAvatar: {
        width: 28,
        height: 28,
        fontSize: fonts.size.tight,
        fontWeight: fonts.weight.bold,
        flexShrink: 0,
      },
      assignedName: {
        fontSize: fonts.size.sm,
        fontWeight: fonts.weight.semibold,
        color: d.textPrimary,
        ...general.noWrap,
      },
      assignedEmpty: { fontSize: fonts.size.sm, color: d.textDisabled },

      notesText: {
        ...fonts.typography.bodyMuted,
        color: d.textSecondary,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: 180,
      },
      notesEmpty: { ...fonts.typography.bodyMuted, color: d.textDisabled },

      createdOnDate: { ...fonts.typography.bodyMuted, color: d.textSecondary, ...general.noWrap },
      createdOnTime: {
        fontSize: fonts.size.tight,
        color: d.textDisabled,
        ...general.noWrap,
        mt: 0.2,
      },
      createdOnEmpty: { ...fonts.typography.bodyMuted, color: d.textDisabled },

      createdByIcon: { fontSize: 12, color: d.textDisabled },
      createdByUsername: {
        fontSize: fonts.size.xs,
        fontWeight: fonts.weight.semibold,
        color: accentBlue,
        fontFamily: fonts.family.monospace,
        ...general.noWrap,
      },
      createdByEmpty: { ...fonts.typography.bodyMuted, color: d.textDisabled },

      editButton: {
        color: accentBlue,
        bgcolor: accentBlueMuted,
        borderRadius: general.borderRadius.sm,
        width: 30,
        height: 30,
        "&:hover": { bgcolor: alpha(accentBlue, 0.2) },
      },
      editIcon: { fontSize: 14 },
      deleteButton: {
        color: colors.error.main,
        bgcolor: alpha(colors.error.main, isDark ? 0.1 : 0.06),
        borderRadius: general.borderRadius.sm,
        width: 30,
        height: 30,
        "&:hover": { bgcolor: alpha(colors.error.main, 0.18) },
      },
      deleteIcon: { fontSize: 14 },
    },

    details: {
      dialogPaper: {
        borderRadius: "20px",
        width: "95vw",
        maxWidth: "1800px",
        height: "90vh",
        overflow: "hidden",
        background: d.cardBg,
        display: "flex",
        flexDirection: "column",
      },
      document: {
        borderRadius: 3,
        border: `1px solid ${d.cardBorder}`,
        boxShadow: `0 4px 24px ${alpha(accentBlue, 0.08)}`,
        overflow: "hidden",
        background: d.cardBg,
      },
      banner: {
        p: "18px 24px",
        background: `linear-gradient(135deg, ${accentBlueDark}, ${accentBlue})`,
        color: "#fff",
      },
      bannerIcon: { fontSize: 28, color: "#fff", opacity: 0.95 },
      bannerTitle: { fontWeight: 800, fontSize: "1.05rem", color: "#fff" },
      bannerSubtitle: { fontSize: "0.78rem", color: alpha("#fff", 0.78), mt: 0.35 },
      body: {
        p: { xs: 2, sm: 3 },
        background: isDark ? d.pageBg : alpha(accentBlue, 0.03),
        overflowY: "auto",
        maxHeight: "calc(90vh - 140px)",
      },
      section: {
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "#E5E7EB"}`,
        background: d.cardBg,
      },
      sectionTitle: {
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: accentBlue,
        mb: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 0.75,
      },
      metaGrid: {
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
        gap: 1.5,
      },
      metaItem: {
        p: 1.25,
        borderRadius: 1.5,
        background: alpha(accentBlue, isDark ? 0.08 : 0.04),
        border: `1px solid ${alpha(accentBlue, isDark ? 0.2 : 0.12)}`,
      },
      metaLabel: {
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: d.textSecondary,
      },
      metaValue: {
        fontSize: "0.88rem",
        fontWeight: 700,
        color: d.textPrimary,
        mt: 0.35,
        wordBreak: "break-word",
      },
      tableContainer: {
        borderRadius: 1.5,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "#E5E7EB"}`,
        overflow: "auto",
      },
      tableHeaderCell: (isLead = false) => ({
        background: isLead
          ? `linear-gradient(135deg, ${accentBlueDark}, ${accentBlue})`
          : alpha(accentBlue, isDark ? 0.16 : 0.06),
        color: isLead ? "#fff" : d.textSecondary,
        fontWeight: 700,
        fontSize: "0.72rem",
        letterSpacing: "0.01em",
        textTransform: "none",
        py: 1,
        px: 1.5,
        borderBottom: `1px solid ${d.dividerColor}`,
        whiteSpace: "nowrap",
      }),
      tableRow: (idx: number) => ({
        background: idx % 2 === 0 ? d.cardBg : alpha(accentBlue, isDark ? 0.06 : 0.03),
      }),
      tableCell: {
        fontSize: "0.82rem",
        py: 1.1,
        px: 1.5,
        color: d.textPrimary,
        whiteSpace: "nowrap",
      },
      emptyText: {
        fontSize: "0.85rem",
        color: d.textSecondary,
        textAlign: "center",
        py: 3,
      },
      loadingBox: {
        minHeight: 280,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
      },
      statusChip: {
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        bgcolor: alpha("#fff", 0.18),
        color: "#fff",
        border: `1px solid ${alpha("#fff", 0.35)}`,
      },
      actions: {
        px: 3,
        py: 2,
        borderTop: `1px solid ${d.dividerColor}`,
        background: d.cardBg,
      },
    },

    /** Select material — same theme as other fields (subtle focus blue). */
    materialSelectField: {
      ...adminTheme.input,
      mb: 0,
    },

    materialsTable: {
      container: {
        borderRadius: 2,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#E5E7EB"}`,
        overflow: "auto",
        bgcolor: d.cardBg,
        boxShadow: isDark ? "none" : "0 1px 3px rgba(15,23,42,0.06)",
      },
      headerRow: {
        bgcolor: isDark ? alpha(accentBlue, 0.12) : alpha(accentBlue, 0.06),
      },
      headerCell: {
        bgcolor: isDark ? alpha(accentBlue, 0.12) : alpha(accentBlue, 0.06),
        color: d.textSecondary,
        fontWeight: 700,
        fontSize: "0.72rem",
        letterSpacing: "0.02em",
        textTransform: "none" as const,
        py: 1.1,
        px: 1.25,
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
        whiteSpace: "nowrap" as const,
        lineHeight: 1.3,
      },
      bodyCell: {
        fontSize: "0.8rem",
        py: 0.85,
        px: 1.25,
        color: d.textPrimary,
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9"}`,
        verticalAlign: "middle" as const,
      },
      textCell: {
        fontSize: "0.8rem",
        fontWeight: 500,
        color: d.textPrimary,
        lineHeight: 1.35,
      },
      dateControl: {
        mb: 0,
        width: "100%",
        minWidth: 138,
      },
      compositionControl: {
        mb: 0,
        width: 120,
        minWidth: 120,
      },
      lotControl: {
        mb: 0,
        minWidth: 130,
        width: 140,
      },
      prcDateField: {
        mb: 0,
        maxWidth: 280,
        ...adminTheme.input,
      },
    },

    modal: {
      ...adminTheme.modal,
      projectOption: {
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        py: 0.25,
        width: "100%",
      },
      projectOptionName: {
        fontSize: fonts.size.sm,
        fontWeight: fonts.weight.semibold,
        color: d.textPrimary,
        lineHeight: 1.3,
      },
      projectOptionId: {
        fontSize: fonts.size.xs,
        fontWeight: fonts.weight.bold,
        color: accentBlue,
        fontFamily: fonts.family.monospace,
        letterSpacing: "0.04em",
        lineHeight: 1.2,
      },
      projectOptionSelected: {
        display: "flex",
        alignItems: "baseline",
        gap: 1,
        minWidth: 0,
        overflow: "hidden",
      },
      motorStageOption: {
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        py: 0.25,
        width: "100%",
      },
      motorStageLabel: {
        fontSize: fonts.size.sm,
        fontWeight: fonts.weight.semibold,
        color: d.textPrimary,
        lineHeight: 1.3,
      },
      motorStageMeta: {
        fontSize: fonts.size.xs,
        fontWeight: fonts.weight.medium,
        color: accentBlue,
        letterSpacing: "0.03em",
        lineHeight: 1.2,
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
        background: isDark
          ? "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(56,189,248,0.05) 0%, transparent 70%)"
          : "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(3,105,161,0.04) 0%, transparent 70%)",
      },
    },
  };
};

export default getBatchManagementTheme;
