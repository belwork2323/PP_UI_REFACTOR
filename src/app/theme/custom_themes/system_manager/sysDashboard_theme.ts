import { alpha } from "@mui/material";
import colors  from "../../colors";
import fonts   from "../../fonts";
import spacing from "../../spacing";
import layout  from "../../layout";
import general from "../common/common_css_theme";
import { getAccents }    from "../../tokens/accents";
import { getSharedTheme }      from "../shared/shared_theme";
import { getBatchDetailsTheme } from "./batchDetails_theme";

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM MANAGER DASHBOARD THEME
//
// Consume with:  const t = getSystemManagerTheme(mode);
//
//   "light" → #f5f6fa page, white cards, dark text, coloured accents on white
//   "dark"  → #0f1117 page, #111827 cards, white text, vivid neon accents
//
// Accent palette → getAccents(mode) (no inline duplication)
// Common tokens  → getSharedTheme(mode).tokens (no inline surface re-computation)
// ─────────────────────────────────────────────────────────────────────────────

const getSystemManagerTheme = (mode = "dark") => {
  const isDark  = mode === "dark";
  const d       = colors.dashboard[mode as "light" | "dark"];
  const shared  = getSharedTheme(mode);
  const s       = shared.tokens;           // semantic tokens
  const accent  = getAccents(mode as "light" | "dark");  // vivid accent palette

  // ── Backward-compat surface aliases (used throughout this file as `surface.*`) ──
  const surface = {
    bg:        s.pageBg,
    surface:   s.cardBg,
    surfaceEl: s.surfaceEl,
    border:    s.cardBorder,
    borderHov: s.borderStrong,
    text:      s.textPrimary,
    textSub:   s.textSecondary,
    textMuted: s.textDisabled,
    mono: "'IBM Plex Mono', monospace",
    sans: "'IBM Plex Sans', sans-serif",
  };

  const tokens = { ...surface, ...accent };

  // ── Skeleton — now from shared ──────────────────────────────────────────────
  const skeletonBase = shared.skeletonBase;

  // ── Shared input style (popup fields) ───────────────────────────────────────
  const inputBg     = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  // ── "Not Started" badge bg — alpha("#fff",0.05) is invisible in light ───────
  const notStartedBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  return {

    // ── Re-exports ─────────────────────────────────────────────────────────────
    general,
    tokens,

    dashboardConfig: {
      stageConfig: [
        { key: "sourcing", label: "Sourcing", color: accent.cyan, iconKey: "Inventory2" },
        { key: "manufacturing", label: "Manufacturing", color: accent.purple, iconKey: "Science" },
        { key: "quality", label: "Quality", color: accent.green, iconKey: "Verified" },
        { key: "dispatch", label: "Dispatch", color: accent.amber, iconKey: "LocalShipping" },
      ],
      stageColors: {
        sourcing: accent.cyan,
        manufacturing: accent.purple,
        quality: accent.green,
        dispatch: accent.amber,
        fallback: accent.blue,
      },
      kpiVariants: {
        total: { color: "#0f766e", iconKey: "Inventory2" },
        inProgress: { color: accent.blue, iconKey: "TrendingUp" },
        completed: { color: accent.green, iconKey: "CheckCircle" },
        pending: { color: accent.amber, iconKey: "Warning" },
        rejected: { color: accent.red, iconKey: "Block" },
        fallback: { color: accent.blue, iconKey: "Inventory2" },
      },
    },

    dashboardLayout: {
      loadingPage: {
        ...general.flexCenter,
        minHeight: 400,
      },
      kpiGrid: {
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(5,1fr)" },
        gap: 2,
        mb: 2.5,
      },
      middleGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 2,
        mb: 2.5,
      },
      bottomGrid: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 2,
        mb: 2.5,
      },
      lowerGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 2,
      },
      stageMetaText: {
        fontSize: "0.68rem",
        color: d.textSecondary,
      },
      dateRangeBar: {
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        mb: 2.5,
        p: 1.5,
        bgcolor: d.cardBg,
        border: `1px solid ${d.cardBorder}`,
        borderRadius: "10px",
        boxShadow: d.cardShadow,
        flexWrap: "wrap",
      },
      dateSelect: shared.filterInputSx,
      dateMenuProps: shared.filterMenuProps,
      dateMenuItemSx: shared.filterMenuItemSx,
      chartMetaPositive: {
        fontSize: "0.68rem",
        color: accent.green,
      },
      xAxisTick: {
        fill: d.textSecondary,
        fontSize: 10,
      },
      expandedStageIcon: (color: string) => ({
        fontSize: 14,
        color,
      }),
      expandedStageStatusIcon: (approved: boolean) => ({
        fontSize: 12,
        color: approved ? accent.green : d.textDisabled,
      }),
      approvalHeaderSpacer: {
        p: 1,
      },
      approvalHeaderCell: {
        p: 1,
        textAlign: "center",
      },
      approvalRowLabelCell: {
        p: 1,
        display: "flex",
        alignItems: "center",
      },
      approvalStatusCell: {
        p: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      legendApprovedIcon: {
        fontSize: 12,
        color: accent.green,
      },
      legendPendingIcon: {
        fontSize: 12,
        color: accent.amber,
      },
      menuItemText: {
        fontSize: "0.78rem",
      },
    },

    sharedDashboard: {
      kpiCard: {
        cardSx: {
          bgcolor: d.cardBg,
          border: `1px solid ${d.cardBorder}`,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.40), 0 1px 4px rgba(0,0,0,0.22)"
            : "0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          transition: "border-color .25s ease, transform .25s ease, box-shadow .25s ease",
          "&:hover": {
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.16)",
            transform: "translateY(-2px)",
            boxShadow: isDark
              ? "0 8px 28px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30)"
              : "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
          },
        },
        labelProps: {
          sx: {
            fontSize: "0.7rem",
            fontFamily: surface.mono,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: d.textSecondary,
            mb: 1.5,
          },
        },
        valueProps: {
          sx: {
            fontSize: "2.2rem",
            fontWeight: fonts.weight.extrabold,
            lineHeight: 1,
            color: d.textPrimary,
            letterSpacing: "-0.02em",
          },
        },
        subRowSx: (positive: boolean) => ({
          color: positive ? accent.green : d.textSecondary,
          fontSize: "0.7rem",
          fontWeight: fonts.weight.medium,
        }),
        trendIconSx: {
          fontSize: 12,
        },
        avatarSx: (bg: string) => ({
          bgcolor: alpha(bg, 0.12),
          border: `1px solid ${alpha(bg, 0.25)}`,
          color: bg,
          width: 44,
          height: 44,
        }),
        iconSx: {
          fontSize: 22,
        },
      },
      chartCard: {
        cardSx: {
          bgcolor: d.cardBg,
          border: `1px solid ${d.cardBorder}`,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.40), 0 1px 4px rgba(0,0,0,0.22)"
            : "0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          transition: "border-color .25s ease, transform .25s ease, box-shadow .25s ease",
          "&:hover": {
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.16)",
            transform: "translateY(-2px)",
            boxShadow: isDark
              ? "0 8px 28px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30)"
              : "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
          },
        },
        headerBoxSx: {
          px: 1,
          pt: 2,
          pb: 1,
        },
        contentSx: {
          px: 2.5,
          pb: 2.5,
        },
        titleProps: {
          sx: {
            fontSize: "0.78rem",
            fontWeight: fonts.weight.semibold,
            color: d.textPrimary,
          },
        },
        subtitleProps: {
          sx: {
            fontSize: "0.7rem",
            color: d.textSecondary,
            mt: 0.3,
          },
        },
        dividerProps: {
          sx: {
            borderColor: d.dividerColor,
            my: 1.5,
          },
        },
        clockIconSx: {
          fontSize: 12,
          color: d.textSecondary,
        },
        timestampProps: {
          sx: {
            fontSize: "0.68rem",
            color: d.textSecondary,
          },
        },
      },
    },

    sharedCharts: shared.dashboardCharts,

    // ─── PAGE ──────────────────────────────────────────────────────────────────
    page: {
      minHeight: "100vh",
      bgcolor: d.pageBg,
      p: { xs: spacing.sm, md: spacing.md },
      fontFamily: surface.sans,
      color: d.textPrimary,
      "& *": { boxSizing: "border-box" },
    },

    // ─── PAGE HEADER ───────────────────────────────────────────────────────────
    pageHeader: {
      wrapper: {
        ...general.flexRow,
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
      },
      eyebrow: {
        fontFamily: surface.mono,
        fontSize: "0.7rem",
        letterSpacing: "0.15em",
        color: d.textSecondary,
        textTransform: "uppercase",
        mb: 0.5,
      },
      title: {
        fontSize: "1.6rem",
        fontWeight: fonts.weight.extrabold,
        letterSpacing: "-0.02em",
        color: d.textPrimary,
        lineHeight: fonts.lineHeight.tight,
      },
      notifBox: {
        bgcolor: isDark ? "#1a2235" : d.pageBg,
        border: `1px solid ${d.cardBorder}`,
        borderRadius: "10px",
        p: 0.9,
        display: "flex",
        cursor: "pointer",
      },
      notifIcon: { fontSize: 18, color: d.textSecondary },
      liveChip: {
        bgcolor: accent.greenDim,
        color: accent.green,
        fontFamily: surface.mono,
        fontSize: "0.68rem",
        fontWeight: fonts.weight.bold,
        border: `1px solid ${alpha(accent.green, 0.25)}`,
      },
    },

    // ─── KPI CARD ──────────────────────────────────────────────────────────────
    kpiCard: {
      inner: { p: 2.5 },
      label: {
        fontSize: "0.7rem",
        fontFamily: surface.mono,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: d.textSecondary,       // 🔄 aligned with dashboard_theme kpi.label
        mb: 1.5,
      },
      value: {
        fontSize: "2.2rem",
        fontWeight: fonts.weight.extrabold,
        lineHeight: 1,
        color: d.textPrimary,         // 🔄 aligned with dashboard_theme kpi.value
        letterSpacing: "-0.02em",
      },
      trendText: (color) => ({ fontSize: "0.7rem", color, fontWeight: fonts.weight.medium }),
      trendIcon: { fontSize: 12 },
      iconBox: (color) => ({
        bgcolor: alpha(color, 0.12),
        border: `1px solid ${alpha(color, 0.25)}`,
        borderRadius: "10px",
        p: 1.2,
        display: "flex",
        alignItems: "center",
      }),
      icon: (color) => ({ fontSize: 22, color }),
    },

    // ─── STAGE METRICS PANEL (legacy — kept for backward compat) ───────────────
    stageMetrics: {
      inner: { p: 2.5 },
      rowLabel: { fontSize: "0.78rem", fontWeight: fonts.weight.semibold, color: d.textPrimary },
      completed: { fontSize: "0.7rem", color: accent.green },
      pending: { fontSize: "0.7rem", color: accent.amber },
      trackBox: {
        position: "relative",
        height: 6,
        bgcolor: d.progressTrack,
        borderRadius: 3,
        overflow: "hidden",
      },
      fill: (color, pct) => ({
        position: "absolute",
        left: 0, top: 0,
        height: "100%",
        width: `${pct}%`,
        bgcolor: color,
        borderRadius: 3,
        transition: "width .5s ease",
      }),
      pctLabel: { fontSize: "0.65rem", color: d.textSecondary, mt: 0.4 },
    },

    // ─── STAGE STATUS PANEL (new) ──────────────────────────────────────────────
    // ─── STAGE STATUS PANEL (carousel) ────────────────────────────────────────
    stagePanel: {
      inner: { p: 2 },
      summaryRow: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        mb: 1.5,
      },
      summarySubLabel: {
        fontSize: "0.6rem",
        color: d.textSecondary,
        textTransform: "uppercase" as const,
        letterSpacing: "0.09em",
        fontFamily: surface.mono,
        mb: 0.25,
      },
      summaryTotal: {
        fontSize: "1.5rem",
        fontWeight: fonts.weight.bold,
        color: d.textPrimary,
        fontFamily: surface.mono,
        lineHeight: 1.1,
      },
      periodBadge: {
        px: "10px",
        py: "3px",
        borderRadius: "8px",
        bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${d.cardBorder}`,
        alignSelf: "flex-start",
      },
      periodText: {
        fontSize: "0.6rem",
        fontFamily: surface.mono,
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        color: d.textSecondary,
      },
      // ── Horizontal scroll carousel ─────────────────────────────────────────
      carouselWrap: {
        display: "flex",
        gap: 1,
        overflowX: "auto",
        pb: 0.5,
        scrollSnapType: "x mandatory",
        scrollBehavior: "smooth",
        "&::-webkit-scrollbar": { height: 4, borderRadius: 2 },
        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
          borderRadius: 2,
        },
      },
      card: (color: string) => ({
        flexShrink: 0,
        width: 132,
        scrollSnapAlign: "start",
        border: `1px solid ${alpha(color, 0.22)}`,
        borderRadius: "12px",
        p: 1.25,
        bgcolor: isDark ? alpha(color, 0.07) : alpha(color, 0.04),
        display: "flex",
        flexDirection: "column" as const,
        gap: 0.7,
        transition: "border-color .2s, background .2s, transform .2s, box-shadow .2s",
        cursor: "default",
        "&:hover": {
          borderColor: alpha(color, 0.5),
          bgcolor: isDark ? alpha(color, 0.13) : alpha(color, 0.09),
          transform: "translateY(-2px)",
          boxShadow: `0 6px 20px ${alpha(color, isDark ? 0.25 : 0.15)}`,
        },
      }),
      cardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      },
      avatar: (color: string) => ({
        width: 26,
        height: 26,
        bgcolor: alpha(color, isDark ? 0.18 : 0.12),
      }),
      avatarIcon: (color: string) => ({
        fontSize: 14,
        color,
      }),
      pctBadge: (color: string) => ({
        fontSize: "0.6rem",
        fontFamily: surface.mono,
        fontWeight: 700,
        color,
        px: "5px",
        py: "2px",
        borderRadius: "5px",
        bgcolor: alpha(color, isDark ? 0.18 : 0.1),
      }),
      stageName: {
        fontSize: "0.7rem",
        fontWeight: fonts.weight.semibold,
        color: d.textPrimary,
        lineHeight: 1.2,
        mt: 0.25,
      },
      statsRow: {
        display: "flex",
        gap: 1.5,
        alignItems: "flex-end",
        mt: 0.25,
      },
      batchCount: (color: string) => ({
        fontSize: "1.15rem",
        fontWeight: fonts.weight.bold,
        color,
        lineHeight: 1,
        fontFamily: surface.mono,
      }),
      pendingCount: {
        fontSize: "1.15rem",
        fontWeight: fonts.weight.bold,
        color: d.textSecondary,
        lineHeight: 1,
        fontFamily: surface.mono,
      },
      countLabel: {
        fontSize: "0.53rem",
        color: d.textDisabled,
        textTransform: "uppercase" as const,
        letterSpacing: "0.09em",
        fontFamily: surface.mono,
        mt: 0.2,
      },
      progressTrackColor: d.progressTrack,
      progressValueColor: d.textSecondary,
      emptyText: {
        fontSize: "0.76rem",
        color: d.textSecondary,
        py: 2,
        textAlign: "center" as const,
      },
    },

    // ─── CHARTS ───────────────────────────────────────────────────────────────
    charts: {
      panelInner: { px: 1, pt: 2, pb: 1 },
      footer: { px: 2.5, pb: 2.5 },
      footerTitle: { fontSize: "0.78rem", fontWeight: fonts.weight.semibold, color: d.textPrimary },
      footerSub: { fontSize: "0.7rem", color: d.textSecondary, mt: 0.3 },
      // default tooltip (plain card bg)
      tooltipStyle: {
        background: d.cardBg,
        border: `1px solid ${d.cardBorder}`,
        borderRadius: 8,
        color: d.textPrimary,
        fontSize: 12,
        boxShadow: isDark ? "0 8px 24px rgba(0,0,0,.5)" : "0 4px 16px rgba(0,0,0,.1)",
      },
      tooltipLabelStyle: {
        color: d.textSecondary,
        fontSize: 11,
        marginBottom: 2,
      },
      tooltipItemStyle: {
        color: d.textPrimary,
        fontWeight: 600,
      },
      // colored-card tooltip variant (used when chart card has gradient bg)
      tooltipStyleOnColor: {
        background: "rgba(8,12,28,0.82)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 8,
        color: "#fff",
        fontSize: 12,
        backdropFilter: "blur(6px)",
        boxShadow: "0 8px 24px rgba(0,0,0,.55)",
      },
      tooltipLabelStyleOnColor: { color: "rgba(255,255,255,0.62)", fontSize: 11, marginBottom: 2 },
      tooltipItemStyleOnColor:  { color: "#fff", fontWeight: 600 },
      axisTickFill: d.textSecondary,
      axisTickFillOnColor: "rgba(255,255,255,0.7)",
      gridColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
      gridColorOnColor: "rgba(255,255,255,0.07)",
      gridDashArray: "3 3",
      cursorFill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      cursorFillOnColor: "rgba(255,255,255,0.07)",
      // Area chart
      areaGradient: {
        start: { color: "rgba(255,255,255,0.55)", opacity: 1 },
        end:   { color: "rgba(255,255,255,0)",    opacity: 1 },
      },
      areaStroke: "rgba(255,255,255,0.92)",
      areaStrokeWidth: 2.5,
      areaDot: { fill: "rgba(255,255,255,0.92)", r: 3.5, strokeWidth: 0 },
      areaActiveDot: { r: 6, stroke: "#fff", strokeWidth: 2, fill: "rgba(0,0,0,0.35)" },
      // Bar chart
      barGradient: {
        start: { color: "rgba(255,255,255,0.88)", opacity: 1 },
        end:   { color: "rgba(255,255,255,0.4)",  opacity: 1 },
      },
      barFill: "rgba(255,255,255,0.75)",
      barRadius: [4, 4, 0, 0] as [number, number, number, number],
      barActiveBar: { fill: "rgba(255,255,255,0.97)" },
    },

    // ─── GRADIENT CHART CARD OVERRIDES ────────────────────────────────────────
    areaChartCard: {
      cardSx: {
        background: isDark
          ? `linear-gradient(145deg, #0d1e45 0%, #0a2860 55%, #112040 100%)`
          : `linear-gradient(145deg, #1565c0 0%, #1976d2 60%, #0288d1 100%)`,
        border: `1px solid ${alpha(accent.blue, isDark ? 0.3 : 0.25)}`,
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: isDark
          ? `0 4px 28px ${alpha(accent.blue, 0.25)}`
          : `0 2px 14px ${alpha(accent.blue, 0.35)}`,
        transition: "box-shadow .25s, transform .25s",
        "&:hover": {
          boxShadow: isDark
            ? `0 10px 36px ${alpha(accent.blue, 0.4)}`
            : `0 6px 24px ${alpha(accent.blue, 0.45)}`,
          transform: "translateY(-2px)",
        },
      },
      headerBoxSx: { px: 1, pt: 2, pb: 1 },
      contentSx: { px: 2.5, pb: 2.5 },
      titleProps: { sx: { fontSize: "0.78rem", fontWeight: fonts.weight.semibold, color: "rgba(255,255,255,0.95)" } },
      subtitleProps: { sx: { fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", mt: 0.3 } },
      dividerProps: { sx: { borderColor: "rgba(255,255,255,0.12)", my: 1.5 } },
      clockIconSx: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
      timestampProps: { sx: { fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" } },
    },

    barChartCard: {
      cardSx: {
        background: isDark
          ? `linear-gradient(145deg, #1a0a38 0%, #2d1060 55%, #1a0a45 100%)`
          : `linear-gradient(145deg, #6a1b9a 0%, #7b1fa2 60%, #4a148c 100%)`,
        border: `1px solid ${alpha(accent.purple, isDark ? 0.32 : 0.28)}`,
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: isDark
          ? `0 4px 28px ${alpha(accent.purple, 0.25)}`
          : `0 2px 14px ${alpha(accent.purple, 0.35)}`,
        transition: "box-shadow .25s, transform .25s",
        "&:hover": {
          boxShadow: isDark
            ? `0 10px 36px ${alpha(accent.purple, 0.4)}`
            : `0 6px 24px ${alpha(accent.purple, 0.45)}`,
          transform: "translateY(-2px)",
        },
      },
      headerBoxSx: { px: 1, pt: 2, pb: 1 },
      contentSx: { px: 2.5, pb: 2.5 },
      titleProps: { sx: { fontSize: "0.78rem", fontWeight: fonts.weight.semibold, color: "rgba(255,255,255,0.95)" } },
      subtitleProps: { sx: { fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", mt: 0.3 } },
      dividerProps: { sx: { borderColor: "rgba(255,255,255,0.12)", my: 1.5 } },
      clockIconSx: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
      timestampProps: { sx: { fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" } },
    },

    // ─── ACTIVE BATCHES TABLE ──────────────────────────────────────────────────
    batchTable: {
      overflowWrapper: { overflowX: "auto" },
      headerCell: {
        fontFamily: surface.mono,
        fontSize: "0.62rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: d.tableHeaderText,
        borderBottom: `2px solid ${d.tableHeaderBorder}`,   // 🔄 aligned with dashboard_theme table.header
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
        py: 1.2,
      },
      row: {
        cursor: "pointer",
        "&:hover": { bgcolor: d.tableRowHover },
        transition: "background .15s",
      },
      cell: {
        borderBottom: `1px solid ${d.dividerColor}`,
        py: 1.5,
      },
      cellActions: {
        borderBottom: `1px solid ${d.dividerColor}`,
        py: 1.5,
        width: 40,
      },
      cellProgress: {
        borderBottom: `1px solid ${d.dividerColor}`,
        minWidth: 90,
      },
      batchId: (color) => ({
        fontSize: "0.75rem",
        fontFamily: surface.mono,
        color,
        fontWeight: fonts.weight.semibold,
      }),
      motorId: { fontSize: "0.65rem", color: d.textSecondary },   // 🔄
      stageName: { fontSize: "0.73rem", color: d.textPrimary },     // 🔄
      substage: { fontSize: "0.73rem", color: d.textSecondary },   // 🔄
      progressTrack: {
        flex: 1,
        height: 4,
        bgcolor: d.progressTrack,
        borderRadius: 2,
        overflow: "hidden",
      },
      progressFill: (color, pct) => ({
        height: "100%",
        width: `${pct}%`,
        bgcolor: color,
        borderRadius: 2,
      }),
      progressLabel: {
        fontSize: "0.65rem",
        fontFamily: surface.mono,
        color: d.textSecondary,    // 🔄
        minWidth: 28,
      },
      updatedIcon: { fontSize: 11, color: d.textSecondary },   // 🔄
      updatedText: { fontSize: "0.65rem", color: d.textSecondary },  // 🔄
      moreButton: {
        color: d.textSecondary,
        "&:hover": { color: d.textPrimary, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" },
        borderRadius: "6px",
        p: 0.5,
      },
      moreIcon: { fontSize: 16 },
      expandedRow: {
        bgcolor: isDark ? "#1a2235" : d.pageBg,
        borderBottom: `1px solid ${d.dividerColor}`,
        px: 3,
        py: 2,
      },
      expandedStageLabel: { fontSize: "0.7rem", color: d.textSecondary },  // 🔄
      skeleton: { ...skeletonBase, width: "80%" },
    },

    // ─── ALERTS ────────────────────────────────────────────────────────────────
    alerts: {
      liveDot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        bgcolor: accent.red,
        boxShadow: `0 0 8px ${accent.red}`,
      },
      row: (isLast) => ({
        px: 2,
        py: 1.5,
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
        borderBottom: isLast ? "none" : `1px solid ${d.dividerColor}`,
        "&:hover": { bgcolor: d.tableRowHover },
        transition: "background .15s",
      }),
      msg: { fontSize: "0.73rem", color: d.textPrimary, lineHeight: fonts.lineHeight.normal },   // 🔄
      time: { fontSize: "0.65rem", color: d.textSecondary, mt: 0.3 },                             // 🔄
      iconColor: { error: accent.red, warning: accent.amber, info: accent.green },
    },

    notificationMenu: {
      menuProps: {
        PaperProps: {
          sx: {
            mt: 1,
            width: 400,
            maxWidth: "calc(100vw - 24px)",
            bgcolor: d.cardBg,
            border: `1px solid ${d.cardBorder}`,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: isDark
              ? "0 24px 56px rgba(0,0,0,0.60), 0 4px 16px rgba(0,0,0,0.35)"
              : "0 20px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)",
            backdropFilter: "blur(8px)",
          },
        },
      },
      header: {
        px: 2,
        py: 1.4,
        borderBottom: `1px solid ${d.dividerColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      },
      title: {
        fontFamily: surface.mono,
        fontWeight: fonts.weight.semibold,
        fontSize: "0.76rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: d.textPrimary,
      },
      body: {
        maxHeight: 420,
        overflowY: "auto",
      },
      loadingBox: {
        ...general.flexCenter,
        minHeight: 120,
      },
      emptyText: {
        px: 2,
        py: 3,
        fontSize: "0.74rem",
        color: d.textSecondary,
      },
      metaRow: {
        mt: 0.4,
      },
      metaText: {
        fontSize: "0.64rem",
        color: d.textSecondary,
        fontFamily: surface.mono,
      },
    },

    // ─── BLOCKCHAIN TIMELINE ───────────────────────────────────────────────────
    blockTimeline: {
      inner: { p: 2.5 },
      emptyText: {
        px: 0.5,
        py: 1,
        fontSize: "0.74rem",
        color: d.textSecondary,
      },
      immutableChip: {
        bgcolor: accent.greenDim,
        color: accent.green,
        fontFamily: surface.mono,
        fontSize: "0.6rem",
        letterSpacing: "0.1em",
        height: 20,
      },
      connector: (isLast) => isLast ? null : {
        position: "absolute",
        left: 14, top: 28,
        width: 2,
        height: "calc(100% - 14px)",
        bgcolor: d.dividerColor,
        zIndex: 0,
        borderRadius: 1,
        background: `linear-gradient(180deg, ${d.dividerColor} 0%, transparent 100%)`,
      },
      avatar: (color) => ({
        width: 30,
        height: 30,
        bgcolor: alpha(color, 0.15),
        border: `2px solid ${alpha(color, 0.35)}`,
        fontSize: "0.75rem",
        color,
        zIndex: 1,
        flexShrink: 0,
        fontFamily: surface.mono,
        boxShadow: `0 2px 8px ${alpha(color, 0.20)}`,
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": {
          transform: "scale(1.1)",
          boxShadow: `0 4px 14px ${alpha(color, 0.30)}`,
        },
      }),
      motorId: (color) => ({
        fontSize: "0.72rem",
        fontFamily: surface.mono,
        color,
        fontWeight: fonts.weight.semibold,
      }),
      label: { fontSize: "0.73rem", color: d.textPrimary },       // 🔄
      timeIcon: { fontSize: 10, color: d.textSecondary },            // 🔄
      timeText: { fontSize: "0.65rem", color: d.textSecondary },     // 🔄
    },

    // ─── APPROVAL MATRIX ──────────────────────────────────────────────────────
    approvalMatrix: {
      inner: { p: 2.5 },
      pendingMeta: { fontSize: "0.68rem", color: accent.amber },
      grid: { display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", gap: 0 },
      stageHeader: (color) => ({
        fontSize: "0.6rem",
        color,
        fontFamily: surface.mono,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }),
      approverLabel: { fontSize: "0.68rem", color: d.textSecondary, whiteSpace: "nowrap" },  // 🔄
      approvedIcon: { fontSize: 16, color: accent.green },
      pendingIcon: { fontSize: 16, color: accent.amber },
      divider: { borderColor: d.dividerColor, my: 2 },
      legendApproved: { fontSize: "0.68rem", color: d.textSecondary },  // 🔄
      legendPending: { fontSize: "0.68rem", color: d.textSecondary },  // 🔄
    },

    batchStatusDetails: {
      emptyText: {
        fontSize: "0.76rem",
        color: d.textSecondary,
        p: 2,
      },
      card: {
        border: `1px solid ${d.cardBorder}`,
        borderRadius: "12px",
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
        p: 1.25,
      },
      cardHeader: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 1,
      },
      batchId: {
        fontSize: "0.78rem",
        fontFamily: surface.mono,
        fontWeight: fonts.weight.semibold,
        color: d.textPrimary,
      },
      metaText: {
        fontSize: "0.68rem",
        color: d.textSecondary,
      },
      progressText: {
        fontSize: "0.78rem",
        fontFamily: surface.mono,
        color: d.textPrimary,
      },
      expandBtn: {
        color: d.textSecondary,
        p: 0.4,
      },
      expandIcon: (open) => ({
        fontSize: 18,
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform .2s ease",
      }),
      progressWrap: {
        mt: 0.8,
      },
      progressBar: {
        color: accent.blue,
        trackColor: d.progressTrack,
        valueColor: d.textSecondary,
      },
      topMetaRow: {
        mt: 0.8,
      },

      // ── Stage Timeline ─────────────────────────────────────────────────────
      timelineWrap: {
        mt: 1.5,
        border: `1px solid ${d.cardBorder}`,
        borderRadius: "10px",
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.6)",
        p: 1.25,
      },
      timelineHeader: {
        fontSize: "0.62rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: surface.mono,
        color: d.textSecondary,
        mb: 1.25,
      },
      timelineItem: {
        display: "flex",
        gap: 1.25,
        alignItems: "flex-start",
      },
      timelineRail: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
        mt: "2px",
      },
      timelineDotDone: {
        width: 20,
        height: 20,
        borderRadius: "50%",
        bgcolor: accent.green,
        flexShrink: 0,
      },
      timelineDotActive: {
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `2px solid ${accent.blue}`,
        bgcolor: alpha(accent.blue, isDark ? 0.15 : 0.1),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      },
      timelineDotActiveInner: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: accent.blue,
      },
      timelineConnector: (variant: "done" | "active") => ({
        width: 2,
        flex: 1,
        minHeight: 18,
        mt: "3px",
        mb: "3px",
        borderRadius: 4,
        bgcolor: variant === "done"
          ? alpha(accent.green, 0.35)
          : alpha(accent.blue, 0.18),
      }),
      timelineContent: (isLast: boolean) => ({
        flex: 1,
        pb: isLast ? 0 : 1.75,
      }),
      timelineStageName: {
        fontSize: "0.8rem",
        fontWeight: fonts.weight.semibold,
        color: d.textPrimary,
        lineHeight: 1.3,
      },
      timelineStageRow: {
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        mt: 0.5,
        flexWrap: "wrap",
      },
      timelineFirstBadge: {
        fontSize: "0.58rem",
        fontFamily: surface.mono,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        px: 0.7,
        py: 0.2,
        borderRadius: "6px",
        bgcolor: alpha(accent.blue, isDark ? 0.18 : 0.12),
        color: accent.blue,
        fontWeight: 700,
        userSelect: "none" as const,
      },
      timelineEmpty: {
        fontSize: "0.72rem",
        color: d.textDisabled,
        py: 0.5,
      },
    },

    // ─── SHARED PANEL ─────────────────────────────────────────────────────────
    panel: {
      wrapper: {
        bgcolor: d.cardBg,
        border: `1px solid ${d.cardBorder}`,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.40), 0 1px 4px rgba(0,0,0,0.22)"
          : "0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        transition: "border-color .25s ease, transform .25s ease, box-shadow .25s ease",
        "&:hover": {
          borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.16)",
          transform: "translateY(-1px)",
          boxShadow: isDark
            ? "0 8px 28px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.30)"
            : "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
        },
      },
      header: {
        wrapper: {
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${d.dividerColor}`,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        title: {
          fontFamily: surface.mono,
          fontWeight: fonts.weight.semibold,
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          color: d.textPrimary,   // 🔄 was d.tableHeaderText → matches dashboard_theme card titles
          textTransform: "uppercase",
        },
        metaStack: { display: "flex", flexDirection: "row", alignItems: "center", gap: 1 },
      },
    },

    // ─── STATUS CHIP ──────────────────────────────────────────────────────────
    statusChip: {
      dot: (status) => {
        const c = {
          "In Progress": accent.blue,
          "Pending Approval": accent.amber,
          "Completed": accent.green,
          "Delayed": accent.red,
        }[status] ?? d.textSecondary;
        return { fontSize: 7, color: c };
      },
      box: (status) => {
        const map = {
          "In Progress": { bg: accent.blueDim, color: accent.blue },
          "Pending Approval": { bg: accent.amberDim, color: accent.amber },
          "Completed": { bg: accent.greenDim, color: accent.green },
          "Delayed": { bg: accent.redDim, color: accent.red },
        }[status] ?? { bg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: d.textSecondary };
        return {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.6,
          bgcolor: map.bg,
          border: `1px solid ${alpha(map.color, 0.22)}`,
          borderRadius: "6px",
          px: 1,
          py: 0.3,
        };
      },
      text: (status) => {
        const color = {
          "In Progress": accent.blue,
          "Pending Approval": accent.amber,
          "Completed": accent.green,
          "Delayed": accent.red,
        }[status] ?? d.textSecondary;
        return {
          fontSize: "0.68rem",
          fontWeight: fonts.weight.semibold,
          color,
          fontFamily: surface.mono,
          letterSpacing: "0.04em",
        };
      },
    },

    // ─── LIFECYCLE STEPPER ────────────────────────────────────────────────────
    lifecycleDot: {
      dot: (i, active) => ({
        width: 18,
        height: 18,
        borderRadius: "50%",
        bgcolor: i < active ? accent.green : i === active ? accent.blue : (isDark ? "#1a2235" : d.pageBg),
        border: `2px solid ${i < active ? accent.green : i === active ? accent.blue : d.cardBorder}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
      }),
      connector: (i, active) => ({
        width: 16,
        height: 2,
        bgcolor: i < active ? accent.green : d.progressTrack,
      }),
      doneIcon: { fontSize: 10, color: "#fff" },
      activeIcon: { fontSize: 7, color: "#fff" },
    },

    // ─── CONTEXT MENU ─────────────────────────────────────────────────────────
    contextMenu: {
      PaperProps: {
        sx: {
          bgcolor: d.cardBg,
          border: `1px solid ${d.cardBorder}`,
          borderRadius: "10px",
          minWidth: 170,
          boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)",
          "& .MuiMenuItem-root": {
            fontSize: "0.78rem",
            color: d.textPrimary,
            py: 1.2,
            px: 2,
            "&:hover": { bgcolor: d.tableRowHover },
          },
        },
      },
    },

    // ─── BATCH DETAIL POPUP ───────────────────────────────────────────────────
    popup: {
      statusColor: (status) => {
        switch (String(status ?? "").toLowerCase()) {
          case "approved":
          case "completed":
            return accent.green;
          case "rejected":
          case "failed":
            return accent.red;
          case "waiting for approval":
          case "in progress":
          case "pending approval":
            return accent.blue;
          case "not started":
            return d.textSecondary;
          default:
            return accent.blue;
        }
      },
      modal: {
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1400,
      },
      body: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
      },
      paper: {
        width: "92vw",
        maxWidth: "1680px",
        height: "88vh",
        maxHeight: "940px",
        bgcolor: d.cardBg,
        border: `1px solid ${d.cardBorder}`,
        borderRadius: "18px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: isDark ? "0 40px 100px rgba(0,0,0,0.7)" : "0 24px 60px rgba(0,0,0,0.18)",
      },

      header: {
        wrapper: {
          px: 3.5,
          py: 2.5,
          borderBottom: `1px solid ${d.dividerColor}`,
          bgcolor: isDark ? "#1a2235" : d.pageBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        },
        iconBox: {
          bgcolor: alpha(accent.blue, 0.12),
          border: `1px solid ${alpha(accent.blue, 0.25)}`,
          borderRadius: "10px",
          p: 1,
          display: "flex",
        },
        icon: { fontSize: 20, color: accent.blue },
        batchId: { fontSize: "1.1rem", fontWeight: fonts.weight.bold, color: d.textPrimary },
        motorLabel:      { fontSize: "0.72rem", fontWeight: 600, color: accent.blue,   bgcolor: accent.blueDim,   px: 0.8, py: 0.25, borderRadius: "4px", fontFamily: surface.mono },
        motorTypeLabel:  { fontSize: "0.72rem", fontWeight: 600, color: accent.cyan,   bgcolor: accent.cyanDim,   px: 0.8, py: 0.25, borderRadius: "4px" },
        batchTypeLabel:  { fontSize: "0.72rem", fontWeight: 600, color: accent.purple, bgcolor: accent.purpleDim, px: 0.8, py: 0.25, borderRadius: "4px" },
        assignedToLabel: { fontSize: "0.72rem", fontWeight: 600, color: accent.green,  bgcolor: accent.greenDim,  px: 0.8, py: 0.25, borderRadius: "4px" },
        createdOnLabel:  { fontSize: "0.72rem", fontWeight: 600, color: accent.amber,  bgcolor: accent.amberDim,  px: 0.8, py: 0.25, borderRadius: "4px" },
        batchAgeLabel:   { fontSize: "0.72rem", fontWeight: 600, color: accent.red,    bgcolor: accent.redDim,    px: 0.8, py: 0.25, borderRadius: "4px" },
        bullet: { fontSize: "0.72rem", color: d.textSecondary },
        progressLabel: { fontSize: "0.72rem", color: d.textSecondary },
        progressValue: {
          fontSize: "0.9rem",
          fontWeight: fonts.weight.bold,
          color: d.textPrimary,
          fontFamily: surface.mono,
        },
        progressTrack: {
          width: 100,
          height: 6,
          bgcolor: d.progressTrack,
          borderRadius: 3,
          overflow: "hidden",
        },
        progressBar: {
          color: accent.blue,
          trackColor: d.progressTrack,
          valueColor: d.textSecondary,
        },
        closeButton: {
          color: d.textSecondary,
          "&:hover": { color: d.textPrimary, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" },
        },
        closeIcon: { fontSize: 18 },
      },

      sidebar: {
        wrapper: {
          width: 250,
          bgcolor: isDark ? "#1a2235" : d.pageBg,
          borderRight: `1px solid ${d.dividerColor}`,
          py: 2,
        },
        statusWrap: {
          ml: 5,
          display: "flex",
        },
        sectionLabel: {
          px: 2.5,
          mb: 1.5,
          fontSize: "0.62rem",
          fontFamily: surface.mono,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: d.textDisabled,
        },
        item: (isActive, color) => ({
          mx: 1.5,
          mb: 0.5,
          px: 1.5,
          py: 1.5,
          borderRadius: "10px",
          cursor: "pointer",
          bgcolor: isActive ? alpha(color, 0.10) : "transparent",
          border: `1px solid ${isActive ? alpha(color, 0.25) : "transparent"}`,
          "&:hover": { bgcolor: alpha(color, 0.06), borderColor: alpha(color, 0.18) },
          transition: "all .15s",
        }),
        iconBox: (color) => ({
          width: 28,
          height: 28,
          borderRadius: "8px",
          bgcolor: alpha(color, 0.12),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
        icon: (isActive, color) => ({ fontSize: 14, color: isActive ? color : d.textSecondary }),
        label: (isActive) => ({
          fontSize: "0.78rem",
          fontWeight: isActive ? fonts.weight.semibold : fonts.weight.regular,
          color: isActive ? d.textPrimary : d.textSecondary,
        }),
      },

      detail: {
        wrapper: { flex: 1, overflowY: "auto", p: 3.5 },
        stageIconBox: (color) => ({
          bgcolor: alpha(color, 0.12),
          border: `1px solid ${alpha(color, 0.25)}`,
          borderRadius: "10px",
          p: 1,
          display: "flex",
        }),
        stageIcon: (color) => ({ fontSize: 18, color }),
        stageTitle: { fontSize: "1rem", fontWeight: fonts.weight.bold, color: d.textPrimary },
        stageDate: { fontSize: "0.7rem", color: d.textSecondary },

        // Risk Level Box
        riskLevelBox: {
          flex: 1,
          p: 1.5,
          bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          borderRadius: "8px",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        },
        riskLevelLabel: {
          fontSize: "0.75rem",
          fontWeight: 600,
          color: d.textSecondary,
          mb: 0.5,
        },
        riskLevelDot: (color) => ({
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          bgcolor: color,
        }),
        riskLevelValue: {
          fontSize: "0.875rem",
          fontWeight: 600,
          color: d.textPrimary,
        },

        // Sub-Department Item
        subDeptItemBox: (isExpanded) => ({
          p: 1.5,
          bgcolor: isExpanded ? alpha(accent.blue, 0.08) : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: "8px",
          cursor: "pointer",
          "&:hover": { bgcolor: alpha(accent.blue, 0.12) },
          transition: "all 0.2s",
        }),
        subDeptItemDot: (color) => ({
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          bgcolor: color,
        }),
        subDeptItemName: {
          fontSize: "0.875rem",
          fontWeight: 600,
          color: d.textPrimary,
        },
        subDeptItemPercentage: {
          fontSize: "0.75rem",
          fontWeight: 600,
          color: d.textSecondary,
        },
        subDeptItemToggle: (isExpanded) => ({
          fontSize: "0.75rem",
          fontWeight: 600,
          color: isExpanded ? accent.blue : d.textSecondary,
        }),

        // Sub-Department Details (Collapse content)
        subDeptDetailsWrapper: {
          mt: 1.25,
          ml: 1.5,
          pl: 2,
          borderLeft: `2px solid ${alpha(accent.blue, 0.3)}`,
        },
        subDeptDetailLabel: {
          fontSize: "0.75rem",
          color: d.textSecondary,
        },
        subDeptDetailValue: (color) => ({
          fontSize: "0.75rem",
          fontWeight: 600,
          color: color || d.textPrimary,
        }),
        subDeptFlag: (flagColor) => ({
          fontSize: "0.75rem",
          color: flagColor,
          fontWeight: 600,
        }),

        // Sub-Sections Header
        subSectionHeader: {
          fontSize: "0.875rem",
          fontWeight: 700,
          color: d.textPrimary,
        },

        // No Stage Data Text
        noStageDataText: {
          color: d.textSecondary,
          p: 2,
        },

        // Loading spinner
        loadingBox: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        },
      },

      subProcess: {
        sectionLabel: {
          fontSize: "0.68rem",
          fontFamily: surface.mono,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: d.textSecondary,
          mb: 1.5,
        },
        grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 },
        card: {
          bgcolor: isDark ? "#1a2235" : d.pageBg,
          border: `1px solid ${d.cardBorder}`,
          borderRadius: "10px",
          p: 1.8,
        },
        name: { fontSize: "0.75rem", color: d.textSecondary, fontWeight: fonts.weight.medium },
        pct: (color) => ({ fontSize: "0.68rem", fontFamily: surface.mono, color }),
        track: {
          mt: 1, height: 5,
          bgcolor: d.progressTrack,
          borderRadius: 3,
          overflow: "hidden",
        },
        fill: (color, pct) => ({ height: "100%", width: `${pct}%`, bgcolor: color, borderRadius: 3 }),
        status: (color) => ({ fontSize: "0.62rem", color, mt: 0.6, fontWeight: fonts.weight.medium }),
        spColor: (status) =>
          status === "Completed" ? accent.green :
            status === "In Progress" ? accent.blue :
              d.textDisabled,
      },

      params: {
        sectionLabel: {
          fontSize: "0.68rem",
          fontFamily: surface.mono,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: d.textSecondary,
          mb: 1.5,
        },
        row: (ok) => ({
          bgcolor: isDark ? "#1a2235" : d.pageBg,
          border: `1px solid ${ok ? alpha(accent.green, 0.20) : alpha(accent.red, 0.15)}`,
          borderRadius: "10px",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }),
        okIcon: { fontSize: 15, color: accent.green },
        pendingIcon: { fontSize: 15, color: accent.amber },
        label: { fontSize: "0.73rem", color: d.textSecondary, fontFamily: surface.mono },
        value: (ok) => ({
          fontSize: "0.75rem",
          color: ok ? d.textPrimary : d.textDisabled,
          fontWeight: fonts.weight.medium,
        }),
      },
    },

    // ─── STAGE STATUS BADGE (popup-only, includes "Not Started") ─────────────
    stageBadge: {
      box: (status) => {
        const map = {
          "Completed": { bg: alpha(accent.green, 0.12), color: accent.green },
          "In Progress": { bg: alpha(accent.blue, 0.15), color: accent.blue },
          "Pending Approval": { bg: alpha(accent.amber, 0.15), color: accent.amber },
          "Not Started": { bg: notStartedBg, color: d.textSecondary },
        }[status] ?? { bg: notStartedBg, color: d.textSecondary };
        return {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: map.bg,
          border: `1px solid ${alpha(map.color, 0.20)}`,
          borderRadius: "6px",
          px: 1,
          py: 0.3,
        };
      },
      dot: (status) => {
        const color = {
          "Completed": accent.green,
          "In Progress": accent.blue,
          "Pending Approval": accent.amber,
          "Not Started": d.textSecondary,
        }[status] ?? d.textSecondary;
        return { fontSize: 7, color };
      },
      text: (status) => {
        const color = {
          "Completed": accent.green,
          "In Progress": accent.blue,
          "Pending Approval": accent.amber,
          "Not Started": d.textSecondary,
        }[status] ?? d.textSecondary;
        return {
          fontSize: "0.67rem",
          fontWeight: fonts.weight.semibold,
          color,
          fontFamily: surface.mono,
          letterSpacing: "0.04em",
        };
      },
    },

    /* ─────────────────────────────────────────────────────────────────────────
       Sub-Department Details Panel (Batch Details drawer)
    ───────────────────────────────────────────────────────────────────────── */
    sd: getBatchDetailsTheme(mode),
  };
};

export default getSystemManagerTheme;