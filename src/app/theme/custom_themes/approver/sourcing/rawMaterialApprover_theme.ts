import { alpha } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import fonts from "../../../fonts";
import { getSharedTheme } from "../../shared/shared_theme";

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const getRawMaterialApproverTheme = (mode = "light") => {
  const shared = getSharedTheme(mode);
  const isDark = mode === "dark";

  const palette = {
    primary: isDark ? "#90caf9" : "#1B4F72",
    primaryLight: isDark ? "#64b5f6" : "#2E86C1",
    accent: isDark ? "#80cbc4" : "#148F77",
    accentLight: isDark ? "#4db6ac" : "#1ABC9C",
    warn: isDark ? "#fdd835" : "#D4AC0D",
    danger: isDark ? "#ef5350" : "#C0392B",
    surface: isDark ? "#1e1e1e" : "#F4F6F8",
    border: isDark ? "rgba(255,255,255,0.2)" : "#D5D8DC",
    text: shared.tokens.textPrimary,
    textSub: shared.tokens.textSecondary,
    white: "#fff",
  };

  return {
    palette,
    animation: {
      row: (index: number) => `${slideUp} 0.3s ease ${index * 0.04}s both`,
    },
    table: {
      containerCard: {
        borderRadius: 3,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 2px 12px ${alpha(palette.primary, isDark ? 0.12 : 0.06)}`,
        overflow: "hidden",
      },
      headerCell: {
        background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
        color: palette.white,
        fontWeight: 700,
        fontSize: "0.68rem",
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        padding: "10px 14px",
        whiteSpace: "nowrap",
        borderBottom: "none",
        "&:first-of-type": { borderRadius: "6px 0 0 0" },
        "&:last-of-type": { borderRadius: "0 6px 0 0" },
      },
      bodyCell: {
        padding: "10px 14px",
        fontSize: "0.82rem",
        borderBottom: `1px solid ${alpha(palette.border, 0.55)}`,
        color: palette.text,
        verticalAlign: "middle",
      },
      row: (index: number) => ({
        background: index % 2 === 0 ? (isDark ? alpha(palette.white, 0.02) : "#fff") : alpha(palette.surface, 0.5),
        "&:hover": { background: alpha(palette.primaryLight, 0.04) },
        "&:last-child td": { borderBottom: "none" },
        animation: `${slideUp} 0.3s ease ${index * 0.04}s both`,
      }),
      batchIdText: {
        fontWeight: 800,
        fontSize: "0.82rem",
        color: palette.primary,
      },
      subtleText: {
        fontSize: "0.78rem",
        color: palette.textSub,
      },
      dateText: {
        color: palette.textSub,
        fontSize: "0.76rem",
        whiteSpace: "nowrap",
      },
      actionCell: { textAlign: "center" },
      actionButton: (isEnabled: boolean) => ({
        borderRadius: 2,
        fontWeight: 700,
        fontSize: "0.72rem",
        textTransform: "none",
        px: 1.5,
        py: 0.6,
        borderColor: isEnabled ? palette.primaryLight : palette.border,
        color: isEnabled ? palette.primaryLight : alpha(palette.textSub, 0.4),
        "&:hover": isEnabled ? { background: alpha(palette.primaryLight, 0.06) } : {},
        "&:disabled": { borderColor: palette.border },
      }),
    },
    chips: {
      status: (meta?: { bg: string; color: string; border: string }) => ({
        height: 20,
        fontSize: "0.62rem",
        fontWeight: 700,
        background: meta?.bg,
        color: meta?.color,
        border: `1px solid ${meta?.border}`,
      }),
      priority: (meta?: { bg: string; color: string; border: string }) => ({
        height: 20,
        fontSize: "0.62rem",
        fontWeight: 700,
        background: meta?.bg,
        color: meta?.color,
        border: `1px solid ${meta?.border}`,
      }),
      type: {
        height: 20,
        fontSize: "0.62rem",
        fontWeight: 700,
        background: alpha(palette.primaryLight, 0.1),
        color: palette.primaryLight,
        border: `1px solid ${alpha(palette.primaryLight, 0.2)}`,
      },
      material: {
        height: 22,
        fontSize: "0.68rem",
        fontWeight: 800,
        background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
        color: palette.white,
      },
      inlineMaterial: {
        fontWeight: 800,
        fontSize: "0.7rem",
        background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
        color: palette.white,
        height: 22,
      },
      refRange: {
        height: 18,
        fontSize: "0.64rem",
        fontWeight: 600,
        background: alpha(palette.warn, 0.1),
        color: "#7D6608",
        border: `1px solid ${alpha(palette.warn, 0.3)}`,
      },
    },
    dialog: {
      paper: {
        borderRadius: 3,
        maxHeight: "92vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        m: 2,
      },
      header: {
        p: "14px 20px",
        background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      },
      headerTitle: {
        color: palette.white,
        fontWeight: 800,
        fontSize: "0.95rem",
      },
      headerSubtitle: {
        color: alpha(palette.white, 0.7),
        fontSize: "0.72rem",
      },
      headerIcon: { color: palette.white, fontSize: 19 },
      closeButton: {
        color: alpha(palette.white, 0.8),
        "&:hover": { background: alpha(palette.white, 0.1) },
      },
      pdfButton: {
        borderRadius: 2,
        fontWeight: 700,
        fontSize: "0.72rem",
        textTransform: "none",
        px: 1.6,
        py: "5px",
        whiteSpace: "nowrap",
        background: alpha(palette.white, 0.18),
        color: palette.white,
        border: `1px solid ${alpha(palette.white, 0.3)}`,
        backdropFilter: "blur(8px)",
        "&:hover": { background: alpha(palette.white, 0.28), boxShadow: "none" },
        boxShadow: "none",
      },
      content: {
        p: 2.5,
        overflowY: "auto",
        background: palette.surface,
      },
      loadingContainer: {
        minHeight: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
      },
      loadingSpinner: { color: palette.primaryLight },
      loadingText: {
        fontSize: "0.82rem",
        fontWeight: 600,
        color: palette.textSub,
      },
      emptyText: {
        fontSize: "0.82rem",
        color: palette.textSub,
        textAlign: "center",
        py: 6,
      },
      blockWrapper: (isLast: boolean) => ({
        mb: isLast ? 0 : 2.5,
      }),
      blockMeta: {
        fontSize: "0.72rem",
        color: palette.textSub,
      },
      blockMetaStrong: { color: palette.text },
      innerTableContainer: {
        borderRadius: "6px",
        border: `1px solid ${palette.border}`,
        boxShadow: `0 1px 6px ${alpha(palette.primary, 0.05)}`,
      },
      innerHeaderCell: (isLead: boolean) => ({
        background: isLead
          ? `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`
          : alpha(palette.primary, 0.05),
        color: isLead ? palette.white : palette.textSub,
        fontWeight: 700,
        fontSize: "0.63rem",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "7px 10px",
        borderBottom: `1px solid ${palette.border}`,
        whiteSpace: "nowrap",
      }),
      innerRow: (index: number) => ({
        background: index % 2 === 0 ? "#fff" : alpha(palette.surface, 0.7),
        "&:last-child td": { borderBottom: "none" },
      }),
      innerCell: { padding: "6px 10px" },
      innerLotText: {
        padding: "6px 10px",
        fontSize: "0.78rem",
        color: palette.textSub,
      },
      innerSpecText: {
        padding: "6px 10px",
        fontSize: "0.78rem",
        fontWeight: 500,
        color: palette.text,
      },
      innerResultText: {
        padding: "6px 10px",
        fontSize: "0.78rem",
        fontWeight: 700,
        color: palette.accent,
      },
      innerRemarksText: {
        padding: "6px 10px",
        fontSize: "0.78rem",
        color: palette.textSub,
      },
      footer: {
        p: "12px 20px",
        background: isDark ? "#1e1e1e" : "#fff",
        borderTop: `1px solid ${palette.border}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: 1.5,
        flexShrink: 0,
      },
      closeAction: {
        borderRadius: 2,
        fontWeight: 700,
        fontSize: "0.78rem",
        textTransform: "none",
        borderColor: palette.border,
        color: palette.textSub,
      },
      rejectAction: {
        borderRadius: 2,
        fontWeight: 700,
        fontSize: "0.78rem",
        textTransform: "none",
        background: palette.danger,
        boxShadow: "none",
        "&:hover": { background: "#922B21", boxShadow: "none" },
      },
      approveAction: {
        borderRadius: 2,
        fontWeight: 700,
        fontSize: "0.78rem",
        textTransform: "none",
        background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentLight})`,
        boxShadow: `0 3px 10px ${alpha(palette.accent, 0.35)}`,
        "&:hover": { background: palette.accent, boxShadow: "none" },
      },
    },
    fonts,
  };
};

export default getRawMaterialApproverTheme;
