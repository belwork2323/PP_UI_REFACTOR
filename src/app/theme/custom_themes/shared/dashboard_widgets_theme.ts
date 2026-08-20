import colors from "../../colors";
import fonts from "../../fonts";
import layout from "../../layout";
import general from "../common/common_css_theme";
import { getTokens } from "../../tokens/semantics";

/** Shared dashboard widget tokens for admin Dashboard + System Manager. */
export const getDashboardWidgetsTheme = (mode: "light" | "dark" = "light") => {
  const s = getTokens(mode);
  const d = colors.dashboard[mode];
  const f = colors.admin.filters[mode];
  const isDark = mode === "dark";
  const cardBase = {
    bgcolor: s.cardBg,
    border: `1px solid ${s.cardBorder}`,
    borderRadius: layout.cardBorderRadius,
    boxShadow: s.cardShadow,
    overflow: "hidden" as const,
    "&:hover": { borderColor: s.borderStrong },
  };

  return {
    kpi: {
      card: cardBase,
      label: {
        variant: "body2" as const,
        sx: { mb: 0.5, color: s.textSecondary, fontSize: fonts.size.sm },
      },
      value: {
        variant: "h4" as const,
        sx: { fontWeight: fonts.weight.extrabold, letterSpacing: "-0.03em", lineHeight: fonts.lineHeight.tight, color: s.textPrimary },
      },
      subRow: (isPositive: boolean) => ({
        color: isPositive ? s.textSuccess : s.textDisabled,
        fontSize: fonts.size.xs,
      }),
      avatarSx: (bg: string) => ({ bgcolor: bg, width: 52, height: 52, borderRadius: general.borderRadius.lg }),
      iconSx: { fontSize: 26, color: colors.white.full },
      trendIcon: { fontSize: 12 },
      avatarColors: colors.admin.kpiAvatar,
      skeleton: {
        label: { backgroundColor: f.skeleton, width: "60%", mb: 1, borderRadius: general.borderRadius.sm },
        value: { backgroundColor: f.skeleton, width: "80%", mb: 1, borderRadius: general.borderRadius.sm },
        sub: { backgroundColor: f.skeleton, width: "50%", height: 16, borderRadius: general.borderRadius.sm },
        avatarBg: f.skeleton,
        avatar: { backgroundColor: f.skeletonAvatar },
      },
    },
    chart: {
      headers: { bar: d.chartHeaderBar, line: d.chartHeaderLine, area: d.chartHeaderArea },
      headerBox: (header: string) => ({
        background: header,
        p: 2,
        borderRadius: `${layout.cardBorderRadius}px ${layout.cardBorderRadius}px 0 0`,
      }),
      tooltip: colors.admin.chartTooltip,
      timestamp: { variant: "caption" as const, sx: { color: s.textDisabled } },
      iconColor: s.textDisabled,
      clockIcon: { fontSize: 13, color: s.textDisabled },
    },
    chartConfig: {
      dimensions: { width: "100%" as const, height: 140 },
      margins: {
        bar: { top: 0, right: 0, left: -30, bottom: 0 },
        line: { top: 5, right: 5, left: -30, bottom: 0 },
        area: { top: 5, right: 5, left: -30, bottom: 0 },
      },
      bar: { fill: colors.admin.chartSeries.barFill, radius: [3, 3, 0, 0] as [number, number, number, number] },
      line: {
        stroke: colors.admin.chartSeries.lineStroke,
        strokeWidth: 2.5,
        dot: { fill: colors.admin.chartSeries.dotFill, r: 3 },
      },
      area: {
        stroke: colors.admin.chartSeries.areaStroke,
        strokeWidth: 2.5,
        dot: { fill: colors.admin.chartSeries.dotFill, r: 3 },
      },
      axisTick: {
        bar: { fill: colors.admin.chartSeries.axisTick, fontSize: 11 },
        line: { fill: colors.admin.chartSeries.axisTick, fontSize: 10 },
        area: { fill: colors.admin.chartSeries.axisTick, fontSize: 10 },
      },
      gradient: {
        id: "areaGrad",
        startColor: colors.admin.chartSeries.gradientStart,
        endColor: colors.admin.chartSeries.gradientEnd,
      },
    },
    stageChip: colors.admin.stageChip[mode],
    typeChip: colors.admin.batchTypeChip[mode],
    filters: f,
    dateFilter: {
      containerSx: {
        display: "flex",
        gap: 1.25,
        alignItems: "flex-end",
        mb: 1.5,
        mt: 1,
        px: 1.25,
        py: 1,
        bgcolor: s.cardBg,
        border: `1px solid ${s.cardBorder}`,
        borderRadius: general.borderRadius.lg,
        boxShadow: s.cardShadow,
        flexWrap: { xs: "wrap", sm: "nowrap" },
      },
    },
    loadingOverlay: {
      ...general.positionAbsolute,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...general.flexCenter,
      bgcolor: f.loadingOverlay,
      zIndex: 1,
    },
    adminWrapper: {
      ...general.fullWidth,
      minHeight: "100vh",
      overflowX: "hidden",
      bgcolor: f.adminWrapperBg,
    },
    isDark,
  };
};

export default getDashboardWidgetsTheme;
