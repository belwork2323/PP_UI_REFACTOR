// src/app/theme/custom_themes/system_manager/batchDetails_theme.ts
//
// Theme tokens for the Sub-Department Batch Details panel.
// Consumed as `t.sd` via getSystemManagerTheme() or directly via getBatchDetailsTheme().
// Contains NO hardcoded colours — all values come from accent / semantic tokens.
//
// Usage (direct):
//   import { getBatchDetailsTheme } from "./batchDetails_theme";
//   const sd = getBatchDetailsTheme(mode);
//
// Usage (via SM theme):
//   const t  = getSystemManagerTheme(mode);
//   const sd = t.sd;

import { alpha } from "@mui/material";
import colors  from "../../colors";
import fonts   from "../../fonts";
import { getAccents } from "../../tokens/accents";

export const getBatchDetailsTheme = (mode = "dark") => {
  const isDark = mode === "dark";
  const d      = colors.dashboard[mode as "light" | "dark"];
  const accent = getAccents(mode as "light" | "dark");
  const mono   = "'IBM Plex Mono', monospace";

  // ── Semantic color palette —————————————————————————————————————————————────
  // All component logic references these keys; ZERO hex literals in the UI.
  const c = {
    passed:        accent.green,
    passedDim:     accent.greenDim,
    failed:        accent.red,
    failedDim:     accent.redDim,
    info:          accent.blue,
    infoDim:       accent.blueDim,
    warn:          accent.amber,
    warnDim:       accent.amberDim,
    neutral:       d.textSecondary,
    progressTrack: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    valueText:     d.textSecondary,
  };

  const toneColor = (tone: string) => {
    if (tone === "passed") return c.passed;
    if (tone === "failed") return c.failed;
    if (tone === "warn") return c.warn;
    if (tone === "info") return c.info;
    return c.neutral;
  };

  // ── Timeline event → colour mapper ────────────────────────────────────────
  const timelineColor = (event: string): string => {
    if (event === "Approved")            return c.passed;
    if (event.includes("Reject"))        return c.failed;
    if (event.includes("Progress"))      return c.info;
    if (event.includes("Submit"))        return c.warn;
    return c.neutral;
  };

  return {
    // Expose semantic palette so components can do  sd.colors.passed  etc.
    colors: c,
    timelineColor,

    // ── Outer panel ──────────────────────────────────────────────────────────
    panel: {
      width: "100%",
      display: "flex",
      flexDirection: "column" as const,
      gap: 3,
    },
    heroCard: {
      bgcolor: isDark ? alpha(accent.blue, 0.08) : alpha(accent.blue, 0.04),
      border: `1px solid ${alpha(accent.blue, 0.18)}`,
      borderRadius: "16px",
      p: 2.25,
      display: "flex",
      flexDirection: "column" as const,
      gap: 1.75,
    },
    heroHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 1.5,
      flexWrap: "wrap" as const,
    },
    heroTitleBlock: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 0.4,
    },
    heroTitle: {
      fontSize: "1.05rem",
      fontWeight: fonts.weight.bold,
      color: d.textPrimary,
    },
    heroSubtitle: {
      fontSize: "0.8rem",
      color: d.textSecondary,
    },
    heroMetaRow: {
      display: "flex",
      gap: 1,
      flexWrap: "wrap" as const,
    },
    heroMetaCard: {
      minWidth: 150,
      p: 1.1,
      borderRadius: "12px",
      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
      border: `1px solid ${d.cardBorder}`,
    },
    heroMetaLabel: {
      fontSize: "0.66rem",
      color: d.textSecondary,
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      fontFamily: mono,
      mb: 0.35,
    },
    heroMetaValue: {
      fontSize: "0.82rem",
      fontWeight: fonts.weight.semibold,
      color: d.textPrimary,
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 1.25,
    },
    summaryCard: (tone: string) => {
      const color = toneColor(tone);
      return {
        p: 1.35,
        borderRadius: "12px",
        bgcolor: alpha(color, 0.08),
        border: `1px solid ${alpha(color, 0.2)}`,
        display: "flex",
        flexDirection: "column" as const,
        gap: 0.35,
      };
    },
    summaryValue: (tone: string) => ({
      fontSize: "1.15rem",
      fontWeight: fonts.weight.bold,
      color: toneColor(tone),
      lineHeight: 1.1,
    }),
    summaryLabel: {
      fontSize: "0.68rem",
      color: d.textSecondary,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontFamily: mono,
    },
    summaryMeta: {
      fontSize: "0.72rem",
      color: d.textPrimary,
      fontWeight: fonts.weight.medium,
    },
    overviewGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 1.5,
    },
    overviewCard: {
      bgcolor: isDark ? d.cardBg : "#fff",
      border: `1px solid ${d.cardBorder}`,
      borderRadius: "14px",
      p: 1.5,
      display: "flex",
      flexDirection: "column" as const,
      gap: 1,
    },
    overviewTitle: {
      fontSize: "0.72rem",
      fontWeight: 700,
      fontFamily: mono,
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
      color: d.textSecondary,
    },
    readinessGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 0.8,
    },
    readinessItem: (tone: string, isActive: boolean) => {
      const color = toneColor(tone);
      return {
        p: 1,
        borderRadius: "10px",
        border: `1px solid ${alpha(color, isActive ? 0.2 : 0.12)}`,
        bgcolor: alpha(color, isActive ? 0.1 : 0.04),
      };
    },
    readinessLabel: {
      fontSize: "0.68rem",
      color: d.textSecondary,
      mb: 0.25,
      fontFamily: mono,
    },
    readinessValue: (tone: string) => ({
      fontSize: "0.8rem",
      fontWeight: fonts.weight.semibold,
      color: toneColor(tone),
    }),
    noticeBox: (tone: string) => {
      const color = toneColor(tone);
      return {
        p: 1.25,
        borderRadius: "12px",
        bgcolor: alpha(color, 0.08),
        border: `1px solid ${alpha(color, 0.2)}`,
        display: "flex",
        flexDirection: "column" as const,
        gap: 0.35,
      };
    },
    noticeTitle: (tone: string) => ({
      fontSize: "0.8rem",
      fontWeight: fonts.weight.semibold,
      color: toneColor(tone),
    }),
    noticeText: {
      fontSize: "0.74rem",
      color: d.textSecondary,
    },

    // ── Loading / error state ─────────────────────────────────────────────────
    centerBox: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 220,
      gap: 1.5,
    },
    errorText: { fontSize: "0.85rem", color: c.failed, fontWeight: 600 },
    retryBtn: {
      fontSize: "0.78rem",
      color: c.info,
      cursor: "pointer",
      textDecoration: "underline",
      border: "none",
      background: "none",
      p: 0,
    },

    // ── Section card ──────────────────────────────────────────────────────────
    sectionCard: {
      bgcolor: isDark ? d.cardBg : "#fff",
      border: `1px solid ${d.cardBorder}`,
      borderRadius: "14px",
      p: 2.1,
    },
    sectionTitle: {
      fontSize: "0.72rem",
      fontWeight: 700,
      fontFamily: mono,
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
      color: d.textSecondary,
      mb: 1.5,
    },

    // ── KPI grid (3-up by default) ────────────────────────────────────────────
    kpiGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 1.5,
    },
    kpiBox: (color: string) => ({
      p: 1.5,
      borderRadius: "10px",
      bgcolor: alpha(color, 0.08),
      border: `1px solid ${alpha(color, 0.18)}`,
      textAlign: "center" as const,
    }),
    kpiValue: (color: string) => ({
      fontSize: "1.4rem",
      fontWeight: fonts.weight.bold,
      color,
      lineHeight: 1,
    }),
    kpiLabel: {
      fontSize: "0.68rem",
      color: d.textSecondary,
      mt: 0.4,
      fontFamily: mono,
    },

    // ── Info row (label : value) ───────────────────────────────────────────────
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      py: 0.8,
      borderBottom: `1px solid ${d.dividerColor}`,
      "&:last-child": { borderBottom: "none" },
    },
    infoLabel: { fontSize: "0.75rem", color: d.textSecondary },
    infoValue: { fontSize: "0.8rem", fontWeight: 600, color: d.textPrimary, fontFamily: mono },
    noteText: {
      fontSize: "0.75rem",
      color: d.textSecondary,
      mt: 0.8,
    },
    progressWrap: {
      mt: 1.5,
    },
    flagRow: {
      mt: 1.5,
      display: "flex",
      flexWrap: "wrap" as const,
      gap: 1,
    },
    flagBoxWithMargin: (color: string) => ({
      ...{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        borderRadius: "8px",
        bgcolor: alpha(color, 0.08),
        border: `1px solid ${alpha(color, 0.2)}`,
      },
      mt: 1,
    }),
    flagBoxLargeMargin: (color: string) => ({
      ...{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        borderRadius: "8px",
        bgcolor: alpha(color, 0.08),
        border: `1px solid ${alpha(color, 0.2)}`,
      },
      mt: 1.5,
    }),
    flagList: {
      mt: 1,
      display: "flex",
      flexDirection: "column" as const,
      gap: 0.35,
    },
    flagListItem: (color: string) => ({
      fontSize: "0.78rem",
      fontWeight: 600,
      color,
    }),

    // ── Materials ─────────────────────────────────────────────────────────────
    matRow: (passed: boolean) => ({
      bgcolor: passed ? alpha(accent.green, 0.05) : alpha(accent.red, 0.05),
      border: `1px solid ${passed ? alpha(accent.green, 0.12) : alpha(accent.red, 0.14)}`,
      borderRadius: "10px",
      "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" },
    }),
    matBadge: (status: string) => {
      const ok = status === "Passed";
      return {
        fontSize: "0.68rem",
        fontWeight: 700,
        color:   ok ? c.passed : c.failed,
        bgcolor: ok ? alpha(c.passed, 0.12) : alpha(c.failed, 0.12),
        px: 0.8,
        py: 0.2,
        borderRadius: "4px",
        display: "inline-block",
      };
    },
    matName: { fontSize: "0.8rem", fontWeight: 600, color: d.textPrimary },
    matHeaderRow: {
      px: 0.5,
      py: 0.8,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1,
      flexWrap: "wrap" as const,
    },
    matMeta: {
      fontSize: "0.68rem",
      color: d.textSecondary,
      fontFamily: mono,
    },
    matStatsRow: {
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      flexWrap: "wrap" as const,
    },
    matProgressWrap: {
      px: 0.5,
      pb: 0.8,
    },
    matFailureWrap: {
      px: 0.5,
      pb: 0.8,
      display: "flex",
      flexDirection: "column" as const,
      gap: 0.35,
    },

    // ── Timeline ──────────────────────────────────────────────────────────────
    timelineList: {
      position: "relative" as const,
    },
    timelineItem: {
      display: "flex",
      gap: 1.5,
      pb: 1.5,
      position: "relative" as const,
    },
    timelineMarkerWrap: {
      position: "relative" as const,
      flexShrink: 0,
    },
    timelineDot: (_isLast: boolean, color: string) => ({
      width: 10,
      height: 10,
      borderRadius: "50%",
      bgcolor: color,
      flexShrink: 0,
      mt: 0.5,
      boxShadow: `0 0 0 3px ${alpha(color, 0.2)}`,
    }),
    timelineConnector: (isLast: boolean) => ({
      position: "absolute" as const,
      left: 4,
      top: 12,
      bottom: 0,
      width: "1.5px",
      bgcolor: isLast ? "transparent" : d.dividerColor,
    }),
    timelineEvent: { fontSize: "0.8rem", fontWeight: 600, color: d.textPrimary },
    timelineUser:  { fontSize: "0.72rem", color: d.textSecondary },
    timelineTime:  { fontSize: "0.68rem", color: d.textDisabled, fontFamily: mono },
    timelineContent: {
      pb: 1,
    },

    // ── Documents ─────────────────────────────────────────────────────────────
    docRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      p: 1,
      borderRadius: "8px",
      bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      border: `1px solid ${d.cardBorder}`,
      "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
    },
    docName: { fontSize: "0.8rem", fontWeight: 600, color: d.textPrimary },
    docType: { fontSize: "0.68rem", color: d.textSecondary },
    docMeta: { fontSize: "0.68rem", color: d.textDisabled, fontFamily: mono },
    docMetaColumn: {
      textAlign: "right" as const,
    },

    // ── Header fallbacks ──────────────────────────────────────────────────────
    headerTitle: {
      fontSize: "1rem",
      fontWeight: fonts.weight.bold,
      color: d.textPrimary,
    },

    // ── Flags / alert banners ────────────────────────────────────────────────
    flagBox: (color: string) => ({
      display: "flex",
      alignItems: "center",
      gap: 1,
      p: 1,
      borderRadius: "8px",
      bgcolor: alpha(color, 0.08),
      border: `1px solid ${alpha(color, 0.2)}`,
    }),
    flagText: (color: string) => ({
      fontSize: "0.78rem",
      fontWeight: 600,
      color,
    }),

    // ── Risk score badge ──────────────────────────────────────────────────────
    riskScoreBadge: (level: string) => {
      const color = level === "High" ? c.failed : level === "Medium" ? c.warn : c.passed;
      return {
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1,
        py: 0.3,
        borderRadius: "6px",
        bgcolor: alpha(color, 0.12),
        color,
        fontSize: "0.75rem",
        fontWeight: 700,
        border: `1px solid ${alpha(color, 0.25)}`,
      };
    },

    // ── Empty state ───────────────────────────────────────────────────────────
    emptyText: {
      fontSize: "0.78rem",
      color: d.textDisabled,
      fontStyle: "italic",
      py: 1,
    },
  };
};

export type BatchDetailsTheme = ReturnType<typeof getBatchDetailsTheme>;
