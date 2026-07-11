import { alpha } from "@mui/material/styles";

export const CASTING_CURING_BRAND = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
  accent: "#148F77",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  cc: "#1565C0",
  ccLight: "#1976D2",
} as const;

export const getCastingAndCuringTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  return {
    brand: {
      ...CASTING_CURING_BRAND,
      primary: palette.primary ?? CASTING_CURING_BRAND.primary,
      primaryLight: palette.primaryLight ?? CASTING_CURING_BRAND.primaryLight,
      accent: palette.accent ?? CASTING_CURING_BRAND.accent,
      warn: palette.warn ?? CASTING_CURING_BRAND.warn,
      danger: palette.danger ?? CASTING_CURING_BRAND.danger,
      surface: palette.surface ?? CASTING_CURING_BRAND.surface,
      border: palette.border ?? CASTING_CURING_BRAND.border,
      text: palette.text ?? CASTING_CURING_BRAND.text,
      textSub: palette.textSub ?? CASTING_CURING_BRAND.textSub,
    },
    details: {
      bannerStatusConfig: (() => {
        const primary = palette.primary ?? CASTING_CURING_BRAND.cc;
        const primaryLight = palette.primaryLight ?? CASTING_CURING_BRAND.ccLight;
        const success = palette.accent ?? CASTING_CURING_BRAND.accent;
        const danger = palette.danger ?? CASTING_CURING_BRAND.danger;
        const warnBase = palette.warn ?? CASTING_CURING_BRAND.warn;
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
        border: `1px solid ${palette.border ?? CASTING_CURING_BRAND.border}`,
        boxShadow: `0 4px 24px ${alpha(palette.primary ?? CASTING_CURING_BRAND.cc, 0.08)}`,
        overflow: "hidden",
        background: palette.pageBg ?? "#fff",
      },
      banner: {
        p: "18px 24px",
        background: `linear-gradient(135deg, ${palette.primary ?? CASTING_CURING_BRAND.cc}, ${palette.primaryLight ?? CASTING_CURING_BRAND.ccLight})`,
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
        border: `1px solid ${alpha(palette.border ?? CASTING_CURING_BRAND.border, 0.65)}`,
        background: palette.pageBg ?? "#fff",
      },
      sectionTitle: {
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: palette.primaryLight ?? CASTING_CURING_BRAND.ccLight,
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
        background: alpha(palette.primaryLight ?? CASTING_CURING_BRAND.ccLight, 0.04),
        border: `1px solid ${alpha(palette.primaryLight ?? CASTING_CURING_BRAND.ccLight, 0.12)}`,
      },
      metaLabel: {
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: palette.textSub ?? CASTING_CURING_BRAND.textSub,
      },
      metaValue: {
        fontSize: "0.88rem",
        fontWeight: 700,
        color: palette.text ?? CASTING_CURING_BRAND.text,
        mt: 0.35,
      },
      materialChip: {
        height: 22,
        fontSize: "0.68rem",
        fontWeight: 800,
        background: `linear-gradient(135deg, ${palette.primary ?? CASTING_CURING_BRAND.cc}, ${palette.primaryLight ?? CASTING_CURING_BRAND.ccLight})`,
        color: "#fff",
      },
      tableContainer: {
        borderRadius: 1.5,
        border: `1px solid ${palette.border ?? CASTING_CURING_BRAND.border}`,
        overflow: "hidden",
      },
      tableHeaderCell: (isLead: boolean) => ({
        background: isLead
          ? `linear-gradient(135deg, ${palette.primary ?? CASTING_CURING_BRAND.cc}, ${palette.primaryLight ?? CASTING_CURING_BRAND.ccLight})`
          : alpha(palette.primary ?? CASTING_CURING_BRAND.cc, 0.06),
        color: isLead ? "#fff" : palette.textSub ?? CASTING_CURING_BRAND.textSub,
        fontWeight: 700,
        fontSize: "0.63rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        py: 1,
        px: 1.5,
        borderBottom: `1px solid ${palette.border ?? CASTING_CURING_BRAND.border}`,
        whiteSpace: "nowrap",
      }),
      tableRow: (idx: number) => ({
        background:
          idx % 2 === 0 ? palette.pageBg ?? "#fff" : alpha(palette.surface ?? CASTING_CURING_BRAND.surface, 0.5),
      }),
      tableCell: {
        fontSize: "0.82rem",
        py: 1.1,
        px: 1.5,
        color: palette.text ?? CASTING_CURING_BRAND.text,
      },
      specText: { fontWeight: 600 },
      resultText: { fontWeight: 600, color: palette.text ?? CASTING_CURING_BRAND.text },
      emptyText: {
        fontSize: "0.85rem",
        color: palette.textSub ?? CASTING_CURING_BRAND.textSub,
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
      processToggle: {
        mb: 2,
        "& .MuiToggleButton-root": {
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.78rem",
          color: palette.textSub ?? CASTING_CURING_BRAND.textSub,
          borderColor: alpha(palette.border ?? CASTING_CURING_BRAND.border, 0.85),
          "&.Mui-selected": {
            color: "#fff",
            background: `linear-gradient(135deg, ${CASTING_CURING_BRAND.cc}, ${CASTING_CURING_BRAND.ccLight})`,
            borderColor: CASTING_CURING_BRAND.cc,
            "&:hover": {
              background: `linear-gradient(135deg, ${CASTING_CURING_BRAND.cc}, ${CASTING_CURING_BRAND.ccLight})`,
            },
          },
        },
      },
    },
  };
};

export default getCastingAndCuringTheme;
