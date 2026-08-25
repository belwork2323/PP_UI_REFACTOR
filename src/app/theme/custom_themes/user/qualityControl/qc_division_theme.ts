import { alpha } from "@mui/material/styles";
import { createDataTableTheme } from "../../shared/data_table_theme";
import { QC_DIVISION_BRAND } from "./tokens";

export { QC_DIVISION_BRAND };

export const getQcDivisionTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  const accentColor = palette.primaryLight ?? QC_DIVISION_BRAND.primaryLight;

  return {
    brand: {
      ...QC_DIVISION_BRAND,
      primary: palette.primary ?? QC_DIVISION_BRAND.primary,
      primaryLight: palette.primaryLight ?? QC_DIVISION_BRAND.primaryLight,
      accent: palette.accent ?? QC_DIVISION_BRAND.accent,
      warn: palette.warn ?? QC_DIVISION_BRAND.warn,
      danger: palette.danger ?? QC_DIVISION_BRAND.danger,
      surface: palette.surface ?? QC_DIVISION_BRAND.surface,
      border: palette.border ?? QC_DIVISION_BRAND.border,
      text: palette.text ?? QC_DIVISION_BRAND.text,
      textSub: palette.textSub ?? QC_DIVISION_BRAND.textSub,
    },
    details: {
      bannerStatusConfig: (() => {
        const primary = palette.primary ?? QC_DIVISION_BRAND.primary;
        const primaryLight = palette.primaryLight ?? QC_DIVISION_BRAND.primaryLight;
        const success = palette.accent ?? QC_DIVISION_BRAND.accent;
        const danger = palette.danger ?? QC_DIVISION_BRAND.danger;
        const warnBase = palette.warn ?? QC_DIVISION_BRAND.warn;
        return {
          ["To Be Initiated"]: { color: "#334155", bg: "#F8FAFC", border: "#CBD5E1" },
          ["In Progress"]: { color: primary, bg: "#E8F4FC", border: alpha(primaryLight, 0.5) },
          ["Waiting for Approval"]: { color: "#7D6608", bg: "#FFF4D6", border: warnBase },
          ["Approved"]: { color: success, bg: "#E8F8F5", border: alpha(success, 0.5) },
          ["Rejected"]: { color: danger, bg: "#FDEDEC", border: alpha(danger, 0.5) },
        } as Record<string, { color: string; bg: string; border: string }>;
      })(),
      page: { animation: "fadeIn 0.35s ease both" },
      document: {
        borderRadius: 3,
        border: `1px solid ${palette.border ?? QC_DIVISION_BRAND.border}`,
        boxShadow: `0 4px 24px ${alpha(palette.primary ?? QC_DIVISION_BRAND.primary, 0.08)}`,
        overflow: "hidden",
        background: palette.pageBg ?? "#fff",
      },
      banner: {
        p: "18px 24px",
        background: `linear-gradient(135deg, ${palette.primary ?? QC_DIVISION_BRAND.primary}, ${palette.primaryLight ?? QC_DIVISION_BRAND.primaryLight})`,
        color: "#fff",
      },
      bannerIcon: { fontSize: 28, color: "#fff", opacity: 0.95 },
      bannerTitle: { fontWeight: 800, fontSize: "1.05rem", color: "#fff" },
      bannerSubtitle: { fontSize: "0.78rem", color: alpha("#fff", 0.78), mt: 0.35 },
      body: { p: { xs: 2, sm: 3 }, background: palette.surface ?? palette.pageBg },
      section: {
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(palette.border ?? QC_DIVISION_BRAND.border, 0.65)}`,
        background: palette.pageBg ?? "#fff",
      },
      sectionTitle: {
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: palette.primaryLight ?? QC_DIVISION_BRAND.primaryLight,
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
        background: alpha(palette.primaryLight ?? QC_DIVISION_BRAND.primaryLight, 0.04),
        border: `1px solid ${alpha(palette.primaryLight ?? QC_DIVISION_BRAND.primaryLight, 0.12)}`,
      },
      metaLabel: {
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: palette.textSub ?? QC_DIVISION_BRAND.textSub,
      },
      metaValue: {
        fontSize: "0.88rem",
        fontWeight: 700,
        color: palette.text ?? QC_DIVISION_BRAND.text,
        mt: 0.35,
      },
      emptyText: {
        fontSize: "0.85rem",
        color: palette.textSub ?? QC_DIVISION_BRAND.textSub,
        textAlign: "center",
        py: 4,
      },
      loadingBox: {
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
      },
      ...createDataTableTheme({ ...QC_DIVISION_BRAND, ...palette }),
    },
  };
};

export default getQcDivisionTheme;
