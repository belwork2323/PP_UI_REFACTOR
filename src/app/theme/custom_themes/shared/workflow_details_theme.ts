import { alpha } from "@mui/material";

type DetailsPalette = {
  primary?: string;
  primaryLight?: string;
  accent?: string;
  success?: string;
  danger?: string;
  warn?: string;
  border?: string;
  text?: string;
  textSub?: string;
  surface?: string;
  pageBg?: string;
};

export type WorkflowDetailsBannerStatusStyle = {
  color: string;
  bg: string;
  border: string;
};

/**
 * Mode-aware status chip colors for details banners.
 * Matches `operations_theme` `batchList.statusConfig` tint rules.
 */
export const createBannerStatusConfig = (
  palette: DetailsPalette = {},
  mode: string = "light",
): Record<string, WorkflowDetailsBannerStatusStyle> => {
  const isDark = mode === "dark";
  const primaryLight = palette.primaryLight ?? "#2E86C1";
  const success = palette.success ?? palette.accent ?? "#148F77";
  const danger = palette.danger ?? "#C0392B";
  const warn = palette.warn ?? "#D4AC0D";
  const initiated = isDark ? "#b0bec5" : "#475569";

  // Light: soft tint. Dark: solid chips — translucent green/yellow vanishes on blue banners.
  const tint = (c: string) => ({
    color: c,
    bg: alpha(c, 0.1),
    border: alpha(c, 0.28),
  });
  const solid = (bg: string, color = "#fff", border?: string) => ({
    color,
    bg,
    border: border ?? alpha(color === "#fff" ? "#fff" : bg, 0.55),
  });

  if (isDark) {
    return {
      ["To Be Initiated"]: solid("#455a64", "#eceff1"),
      ["In Progress"]: solid("#0d47a1", "#e3f2fd", "#64b5f6"),
      ["Waiting for Partial Approval"]: solid("#f9a825", "#1a1a1a", "#fdd835"),
      ["Waiting for Approval"]: solid("#f9a825", "#1a1a1a", "#fdd835"),
      ["Approved"]: solid("#1b5e20", "#fff", "#81c784"),
      ["Completely Approved"]: solid("#1b5e20", "#fff", "#81c784"),
      ["Final Approval Completed"]: solid("#1b5e20", "#fff", "#81c784"),
      ["Waiting For Complete Approval"]: solid("#f9a825", "#1a1a1a", "#fdd835"),
      ["Rejected"]: solid("#b71c1c", "#fff", "#ef9a9a"),
      ["Discarded"]: solid("#b71c1c", "#fff", "#ef9a9a"),
    };
  }

  return {
    ["To Be Initiated"]: tint(initiated),
    ["In Progress"]: tint(primaryLight),
    ["Waiting for Partial Approval"]: tint(warn),
    ["Waiting for Approval"]: tint(warn),
    ["Approved"]: tint(success),
    ["Completely Approved"]: tint(success),
    ["Final Approval Completed"]: tint(success),
    ["Waiting For Complete Approval"]: tint(warn),
    ["Rejected"]: tint(danger),
    ["Discarded"]: tint(danger),
  };
};

/**
 * In dark mode, palette.primary / primaryLight are light accent tokens for text —
 * not fill colors. Banner and table fills need deep blues for contrast.
 */
export const detailsBannerGradientColors = (
  palette: DetailsPalette = {},
  mode: string = "light",
) => {
  const isDark = mode === "dark";
  return {
    from: isDark ? "#0d47a1" : (palette.primary ?? "#1B4F72"),
    to: isDark ? "#1565c0" : (palette.primaryLight ?? "#2E86C1"),
  };
};

/** Shared read-only details shell tokens (banner, sections, meta grid, loading). */
export const createWorkflowDetailsTheme = (
  palette: DetailsPalette = {},
  mode: string = "light",
) => {
  const isDark = mode === "dark";
  const primary = palette.primary ?? "#1B4F72";
  const primaryLight = palette.primaryLight ?? "#2E86C1";
  const border = palette.border ?? "#D5D8DC";
  const text = palette.text ?? "#1C2833";
  const textSub = palette.textSub ?? "#5D6D7E";
  const pageBg = palette.pageBg ?? (isDark ? "#0f1117" : "#fff");
  const surface = palette.surface ?? pageBg;
  const { from: bannerFrom, to: bannerTo } = detailsBannerGradientColors(palette, mode);
  // Section titles: readable accent, not washed-out neon on black.
  const sectionTitleColor = isDark ? "#90caf9" : primaryLight;

  return {
    bannerStatusConfig: createBannerStatusConfig(palette, mode),
    page: { animation: "fadeIn 0.35s ease both" },
    document: {
      borderRadius: 3,
      border: `1px solid ${border}`,
      boxShadow: `0 4px 24px ${alpha(bannerFrom, isDark ? 0.35 : 0.08)}`,
      overflow: "hidden",
      background: pageBg,
    },
    banner: {
      p: "18px 24px",
      background: `linear-gradient(135deg, ${bannerFrom}, ${bannerTo})`,
      color: "#fff",
    },
    bannerTitle: { fontWeight: 800, fontSize: "1.05rem", color: "#fff" },
    bannerSubtitle: { fontSize: "0.78rem", color: alpha("#fff", 0.85), mt: 0.35 },
    bannerIcon: { fontSize: 28, color: "#fff", opacity: 0.95 },
    body: { p: { xs: 2, sm: 3 }, background: surface },
    section: {
      mb: 3,
      p: 2,
      borderRadius: 2,
      border: `1px solid ${alpha(border, isDark ? 0.85 : 0.65)}`,
      background: isDark ? alpha("#fff", 0.03) : pageBg,
    },
    sectionTitle: {
      fontSize: "0.72rem",
      fontWeight: 800,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: sectionTitleColor,
      mb: 1.5,
      display: "flex",
      alignItems: "center",
      gap: 0.75,
    },
    sectionTitleIcon: { fontSize: 18 },
    metaGrid: {
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
      gap: 1.5,
    },
    metaItem: {
      p: 1.25,
      borderRadius: 1.5,
      background: isDark ? alpha("#fff", 0.04) : alpha(primaryLight, 0.04),
      border: `1px solid ${isDark ? alpha("#fff", 0.1) : alpha(primaryLight, 0.12)}`,
    },
    metaLabel: {
      fontSize: "0.62rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: textSub,
    },
    metaValue: { fontSize: "0.88rem", fontWeight: 700, color: text, mt: 0.35 },
    emptyText: { fontSize: "0.85rem", color: textSub, textAlign: "center", py: 4 },
    loadingBox: {
      minHeight: 320,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1.5,
    },
  };
};

export type WorkflowDetailsTheme = ReturnType<typeof createWorkflowDetailsTheme>;
