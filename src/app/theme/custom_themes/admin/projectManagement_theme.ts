import { alpha } from "@mui/material";
import colors from "../../colors";
import fonts from "../../fonts";
import spacing from "../../spacing";
import layout from "../../layout";
import general from "../common/common_css_theme";
import { getSharedTheme } from "../shared/shared_theme";

const getProjectManagementTheme = (mode = "light") => {
  const shared = getSharedTheme(mode);
  const adminTheme = shared.adminManagement;
  const d = colors.dashboard[mode as "light" | "dark"];

  const isDark = mode === "dark";
  const accentBlue = adminTheme.accentBlue;
  const accentBlueDark = adminTheme.accentBlueDark;
  const accentBlueMuted = adminTheme.accentBlueMuted;
  const inputBg = adminTheme.inputBg;
  const inputBorder = adminTheme.inputBorder;

  const skeletonBase = shared.skeletonBase;

  return {
    general,

    page: shared.page,

    pageHeader: {
      ...adminTheme.pageHeader,
      newProjectButton: adminTheme.primaryButton,
    },

    statsGrid: {
      ...adminTheme.statsGrid,
      outerWrap: {
        ...adminTheme.statsGrid.outerWrap,
      },
      innerGrid: {
        ...adminTheme.statsGrid.innerGrid,
      },
      card: adminTheme.statsGrid.card,
      accentBar: adminTheme.statsGrid.accentBar,
      iconWrap: adminTheme.statsGrid.iconWrap,
      textWrap: adminTheme.statsGrid.textWrap,
      value: adminTheme.statsGrid.value,
      label: adminTheme.statsGrid.label,
      subLabel: adminTheme.statsGrid.subLabel,
      cornerDot: adminTheme.statsGrid.cornerDot,
      bgDecor: adminTheme.statsGrid.bgDecor,
      colors: {
        total: {
          accent: colors.info.main,
          iconBg: alpha(colors.info.main, 0.08),
          iconBorder: colors.info.main,
          iconColor: colors.info.main,
          value: colors.info.main,
        },
        today: {
          accent: colors.success.main,
          iconBg: alpha(colors.success.main, 0.08),
          iconBorder: colors.success.main,
          iconColor: colors.success.main,
          value: colors.success.main,
        },
        month: {
          accent: colors.warning.main,
          iconBg: alpha(colors.warning.main, 0.08),
          iconBorder: colors.warning.main,
          iconColor: colors.warning.main,
          value: colors.warning.main,
        },
        active: {
          accent: colors.success.main,
          iconBg: alpha(colors.success.main, 0.08),
          iconBorder: colors.success.main,
          iconColor: colors.success.main,
          value: colors.success.main,
        },
        idle: {
          accent: colors.error.main,
          iconBg: alpha(colors.error.main, 0.08),
          iconBorder: colors.error.main,
          iconColor: colors.error.main,
          value: colors.error.main,
        },
      },
    },

    toolbar: adminTheme.toolbar,

    input: adminTheme.input,

    menuPaper: adminTheme.menuPaper,

    table: {
      ...adminTheme.table,
      containerSx: {
        borderRadius: layout.cardBorderRadius,
        border: `1px solid ${d.cardBorder}`,
        bgcolor: d.cardBg,
        overflow: "hidden",
      },
      headerRow: {
        bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
        borderBottom: ` 1px solid ${d.dividerColor}`,
      },
      headerCell: {
        padding: spacing.md,
        borderBottomColor: d.dividerColor,
      },
      headerText: {
        fontSize: fonts.size.xs,
        fontWeight: fonts.weight.bold,
        color: d.textSecondary,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      },
      bodyRow: {
        "&:hover": {
          bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
        },
        borderBottomColor: d.dividerColor,
      },
      bodyCell: {
        padding: spacing.md,
        borderBottomColor: d.dividerColor,
      },
      bodyText: {
        fontSize: fonts.size.sm,
        color: d.textPrimary,
      },
      actionButton: {
        padding: spacing.xs,
        color: accentBlue,
        bgcolor: "transparent",
        "&:hover": {
          bgcolor: alpha(accentBlue, 0.1),
        },
      },
      emptyCell: {
        textAlign: "center",
        padding: spacing.lg,
      },
      emptyText: {
        fontSize: fonts.size.sm,
        color: d.textDisabled,
      },
      pagination: {
        borderTopColor: d.dividerColor,
      },
      skeletonRow: skeletonBase,
      skeletonRowDefault: { ...skeletonBase, width: "80%" },
      skeletonRowAction: { ...skeletonBase, width: 60 },
    },

    modal: {
      maxWidth: false,
      paper: {
        bgcolor: d.cardBg,
        borderRadius: layout.cardBorderRadius,
        border: `1px solid ${d.cardBorder}`,
        boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.70)" : colors.shadow.card,
      },
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
      content: { px: 3, pt: 3, pb: 2, flex: 1, overflowY: "auto" },
      actions: { px: 3, py: 2.5, gap: spacing.sm },
      stackSpacing: 2.5,
      fieldRowSpacing: 2.5,
      headerGap: {
        mt: 3,
        mb: 2,
      },
      fieldLabel: {
        fontSize: fonts.size.xs,
        fontWeight: fonts.weight.bold,
        color: d.textSecondary,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        mb: 1,
      },
      cancelButton: {
        textTransform: "none",
        color: d.textSecondary,
        borderRadius: general.borderRadius.md,
        px: 2.5,
      },
      saveButton: {
        textTransform: "none",
        fontWeight: fonts.weight.bold,
        borderRadius: general.borderRadius.md,
        px: spacing.lg,
        bgcolor: accentBlue,
        boxShadow: `0 4px 14px ${alpha(accentBlue, 0.35)}`,
        "&:hover": { bgcolor: accentBlueDark },
        "&.Mui-disabled": { bgcolor: alpha(accentBlue, 0.4), color: colors.white.text },
      },
      savingSpinner: { color: "inherit", mr: 1 },
    },

    modalTitle: {
      fontSize: fonts.size.lg,
      fontWeight: fonts.weight.bold,
      color: d.textPrimary,
    },
  };
};

export default getProjectManagementTheme;
