import { alpha } from "@mui/material/styles";
import { NDT_BRAND } from "./tokens";

export { NDT_BRAND };

export const getNdtTheme = (baseTheme: any) => {
  const palette = baseTheme?.palette ?? {};
  const accentColor = palette.primaryLight ?? NDT_BRAND.primaryLight;

  return {
    brand: {
      ...NDT_BRAND,
      nd: "#1565C0",
      ndLight: "#1976D2",
      primary: palette.primary ?? NDT_BRAND.primary,
      primaryLight: palette.primaryLight ?? NDT_BRAND.primaryLight,
      accent: palette.accent ?? NDT_BRAND.accent,
      warn: palette.warn ?? NDT_BRAND.warn,
      danger: palette.danger ?? NDT_BRAND.danger,
      surface: palette.surface ?? NDT_BRAND.surface,
      border: palette.border ?? NDT_BRAND.border,
      text: palette.text ?? NDT_BRAND.text,
      textSub: palette.textSub ?? NDT_BRAND.textSub,
    },
    flowBar: {
      container: {
        mb: 2.5,
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        border: `1px solid ${alpha(palette.border ?? NDT_BRAND.border, 0.9)}`,
        background: alpha(palette.surface ?? NDT_BRAND.surface, 0.55),
      },
      topRow: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: 2,
      },
      setupHint: {
        fontSize: "0.76rem",
        color: palette.textSub ?? NDT_BRAND.textSub,
        mb: 1.75,
        lineHeight: 1.45,
      },
      actionRow: {
        display: "flex",
        justifyContent: "flex-end",
        pt: 0.5,
      },
      primaryAction: {
        textTransform: "none" as const,
        fontWeight: 700,
        borderRadius: 2,
        px: 2.5,
        background: `linear-gradient(135deg, ${NDT_BRAND.primary}, ${accentColor})`,
        "&:hover": {
          background: `linear-gradient(135deg, ${NDT_BRAND.primary}, ${accentColor})`,
          filter: "brightness(1.05)",
        },
      },
    },
    panel: {
      header: {
        borderRadius: 2.5,
        border: `1px solid ${palette.border ?? NDT_BRAND.border}`,
        background: `linear-gradient(135deg, ${alpha(NDT_BRAND.surface, 0.95)} 0%, ${palette.pageBg ?? "#fff"} 100%)`,
        px: { xs: 1.75, sm: 2 },
        py: 1.75,
        mb: 2.5,
      },
      headerIcon: {
        width: 40,
        height: 40,
        borderRadius: "12px",
        background: `linear-gradient(135deg, #1565C0, #1976D2)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 4px 14px ${alpha("#1565C0", 0.28)}`,
      },
      headerTitle: { fontWeight: 800, fontSize: "1rem", color: palette.text ?? NDT_BRAND.text },
      headerSubtitle: { fontSize: "0.76rem", color: palette.textSub ?? NDT_BRAND.textSub, mt: 0.25 },
      card: {
        borderRadius: 2.5,
        border: `1px solid ${alpha(palette.border ?? NDT_BRAND.border, 0.9)}`,
        background: palette.pageBg ?? "#fff",
        overflow: "hidden",
        mb: 2,
      },
      sectionTitle: {
        fontSize: "0.8rem",
        fontWeight: 700,
        color: palette.text ?? NDT_BRAND.text,
      },
      sectionHeader: {
        px: 1.75,
        py: 1.25,
        borderBottom: `1px solid ${alpha(palette.border ?? NDT_BRAND.border, 0.65)}`,
        background: alpha(palette.surface ?? NDT_BRAND.surface, 0.45),
      },
      motorCard: {
        borderRadius: 2.5,
        border: `1px solid ${palette.border ?? NDT_BRAND.border}`,
        background: palette.surface ?? NDT_BRAND.surface,
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
      },
    },
    table: {
      headerCell: {
        background: `linear-gradient(135deg, ${NDT_BRAND.primary}, ${accentColor})`,
        color: "#fff",
        fontWeight: 700,
        fontSize: "0.65rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
        py: 1.1,
        px: 1.5,
        whiteSpace: "nowrap" as const,
        borderBottom: "none",
      },
      bodyCell: {
        fontSize: "0.8rem",
        py: 1,
        px: 1.5,
        color: palette.text ?? NDT_BRAND.text,
        borderBottom: `1px solid ${alpha(palette.border ?? NDT_BRAND.border, 0.55)}`,
        verticalAlign: "middle" as const,
      },
      row: (index: number) => ({
        background: index % 2 === 0 ? palette.pageBg ?? "#fff" : alpha(palette.surface ?? NDT_BRAND.surface, 0.65),
      }),
    },
    details: {
      bannerStatusConfig: (() => {
        const primary = palette.primary ?? NDT_BRAND.primary;
        const primaryLight = palette.primaryLight ?? NDT_BRAND.primaryLight;
        const success = palette.accent ?? NDT_BRAND.accent;
        const danger = palette.danger ?? NDT_BRAND.danger;
        const warnBase = palette.warn ?? NDT_BRAND.warn;
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
        border: `1px solid ${palette.border ?? NDT_BRAND.border}`,
        boxShadow: `0 4px 24px ${alpha(palette.primary ?? NDT_BRAND.primary, 0.08)}`,
        overflow: "hidden",
        background: palette.pageBg ?? "#fff",
      },
      banner: {
        p: "18px 24px",
        background: `linear-gradient(135deg, ${palette.primary ?? NDT_BRAND.primary}, ${palette.primaryLight ?? NDT_BRAND.primaryLight})`,
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
        border: `1px solid ${alpha(palette.border ?? NDT_BRAND.border, 0.65)}`,
        background: palette.pageBg ?? "#fff",
      },
      sectionTitle: {
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: palette.primaryLight ?? NDT_BRAND.primaryLight,
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
        background: alpha(palette.primaryLight ?? NDT_BRAND.primaryLight, 0.04),
        border: `1px solid ${alpha(palette.primaryLight ?? NDT_BRAND.primaryLight, 0.12)}`,
      },
      metaLabel: {
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: palette.textSub ?? NDT_BRAND.textSub,
      },
      metaValue: {
        fontSize: "0.88rem",
        fontWeight: 700,
        color: palette.text ?? NDT_BRAND.text,
        mt: 0.35,
      },
      materialChip: {
        height: 22,
        fontSize: "0.68rem",
        fontWeight: 800,
        background: `linear-gradient(135deg, ${palette.primary ?? NDT_BRAND.primary}, ${palette.primaryLight ?? NDT_BRAND.primaryLight})`,
        color: "#fff",
      },
      tableContainer: {
        borderRadius: 1.5,
        border: `1px solid ${palette.border ?? NDT_BRAND.border}`,
        overflow: "hidden",
      },
      tableHeaderCell: (isLead: boolean) => ({
        background: isLead
          ? `linear-gradient(135deg, ${palette.primary ?? NDT_BRAND.primary}, ${palette.primaryLight ?? NDT_BRAND.primaryLight})`
          : alpha(palette.primary ?? NDT_BRAND.primary, 0.06),
        color: isLead ? "#fff" : palette.textSub ?? NDT_BRAND.textSub,
        fontWeight: 700,
        fontSize: "0.63rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        py: 1,
        px: 1.5,
        borderBottom: `1px solid ${palette.border ?? NDT_BRAND.border}`,
        whiteSpace: "nowrap",
      }),
      tableRow: (idx: number) => ({
        background: idx % 2 === 0 ? palette.pageBg ?? "#fff" : alpha(palette.surface ?? NDT_BRAND.surface, 0.5),
      }),
      tableCell: { fontSize: "0.82rem", py: 1.1, px: 1.5, color: palette.text ?? NDT_BRAND.text },
      specText: { fontWeight: 600 },
      resultText: { fontWeight: 600, color: palette.text ?? NDT_BRAND.text },
      remarksText: { fontSize: "0.8rem", color: palette.textSub ?? NDT_BRAND.textSub },
      emptyText: {
        fontSize: "0.85rem",
        color: palette.textSub ?? NDT_BRAND.textSub,
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
    },
  };
};

export default getNdtTheme;
