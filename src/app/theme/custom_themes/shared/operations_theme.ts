import { alpha } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import fonts from "../../fonts";
import { getSharedTheme } from "./shared_theme";
import { dataTableHeaderBackground } from "./data_table_theme";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const getOperationsTheme = (mode = "light") => {
  const shared = getSharedTheme(mode);
  const isDark = mode === "dark";

  const palette = {
    primary: isDark ? "#90caf9" : "#1B4F72",
    primaryLight: isDark ? "#64b5f6" : "#2E86C1",
    accent: isDark ? "#80cbc4" : "#148F77",
    accentLight: isDark ? "#4db6ac" : "#1ABC9C",
    warn: isDark ? "#fdd835" : "#D4AC0D",
    danger: isDark ? "#ef5350" : "#C0392B",
    success: isDark ? "#66bb6a" : "#148F77",
    surface: isDark ? "#1e1e1e" : "#F4F6F8",
    border: isDark ? "rgba(255,255,255,0.2)" : "#D5D8DC",
    text: shared.tokens.textPrimary,
    textSub: shared.tokens.textSecondary,
    pageBg: shared.tokens.pageBg,
  };

  return {
    palette,
    dashboard: {
      container: {
        p: 3,
        background: palette.pageBg,
        minHeight: "100vh",
      },
      content: { mt: 2 },
    },
    workflow: {
      animatedContainer: { animation: `${fadeIn} 0.3s ease` },
      loadingContainer: { display: "flex", justifyContent: "center", py: 8 },
      formHeader: {
        /** Compact single-row card — same density for RMC and all subdepartments */
        container: (isEdit: boolean) => ({
          mb: 1.5,
          py: 0.65,
          px: 1.25,
          borderRadius: 2,
          background: isEdit
            ? `linear-gradient(135deg, ${alpha(palette.danger, 0.06)}, ${alpha(palette.danger, 0.02)})`
            : `linear-gradient(135deg, ${alpha(palette.primary, 0.06)}, ${alpha(palette.primaryLight, 0.03)})`,
          border: `1px solid ${isEdit ? alpha(palette.danger, 0.2) : alpha(palette.primaryLight, 0.25)}`,
          animation: `${fadeIn} 0.3s ease`,
        }),
        backButton: {
          fontWeight: 700,
          fontSize: "0.72rem",
          textTransform: "none",
          color: palette.textSub,
          px: 1,
          py: 0.35,
          minHeight: 0,
          borderRadius: 1.5,
          flexShrink: 0,
          "&:hover": { background: alpha(palette.border, 0.5), color: palette.text },
        },
        divider: { borderColor: alpha(palette.border, 0.6) },
        batchId: { fontWeight: 800, fontSize: "0.82rem", color: palette.text, lineHeight: 1.25 },
        bullet: { fontSize: "0.72rem", color: palette.textSub },
        motorId: { fontSize: "0.7rem", color: palette.textSub, lineHeight: 1.25 },
        rejectionBox: {
          px: 1.25,
          py: 0.65,
          borderRadius: 1.5,
          background: alpha(palette.danger, 0.05),
          border: `1px solid ${alpha(palette.danger, 0.15)}`,
          maxWidth: 300,
        },
        rejectionTitle: { fontSize: "0.65rem", fontWeight: 700, color: palette.danger, mb: 0.15 },
        rejectionText: { fontSize: "0.7rem", color: palette.danger, lineHeight: 1.4 },
        chips: {
          edit: {
            height: 22,
            fontSize: "0.65rem",
            fontWeight: 700,
            background: alpha(palette.danger, 0.08),
            color: palette.danger,
            border: `1px solid ${alpha(palette.danger, 0.22)}`,
          },
          new: {
            height: 22,
            fontSize: "0.65rem",
            fontWeight: 700,
            background: alpha(palette.primary, 0.08),
            color: palette.primary,
            border: `1px solid ${alpha(palette.primary, 0.2)}`,
          },
          motorType: {
            height: 22,
            fontSize: "0.65rem",
            fontWeight: 600,
            background: alpha(palette.primaryLight, 0.1),
            color: palette.primaryLight,
          },
          priority: {
            height: 22,
            fontSize: "0.65rem",
            fontWeight: 600,
            background: alpha(palette.warn, 0.1),
            color: palette.warn,
          },
        },
      },
    },
    batchList: {
      // Same uniform header as form data tables (vertical gradient + white column dividers).
      tableHeaderBg: isDark
        ? "#1a1d27"
        : dataTableHeaderBackground(palette.primary, palette.primaryLight),
      tableHeaderText: "#fff",
      tableHeaderBorder: "transparent",
      filterInputBg: isDark ? "#121212" : "#f8fafc",
      /** Compact inputs for "Refine lot/batch list" filter panels */
      filterPanelField: {
        mt: 0,
        "& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root": {
          height: 32,
          minHeight: 32,
          maxHeight: 32,
          fontSize: "0.72rem",
          borderRadius: "6px",
          bgcolor: isDark ? "#121212" : "#f8fafc",
          boxSizing: "border-box",
          "& fieldset, & .MuiPickersOutlinedInput-notchedOutline": {
            borderColor: alpha(palette.border, 0.65),
          },
          "&:hover fieldset, &:hover .MuiPickersOutlinedInput-notchedOutline": {
            borderColor: palette.primaryLight,
          },
          "&.Mui-focused fieldset, &.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
            borderColor: palette.primaryLight,
          },
        },
        "& .MuiInputBase-input, & .MuiPickersSectionList-root, & .MuiSelect-select": {
          fontSize: "0.72rem",
          padding: "5px 8px",
          minHeight: "unset !important",
          "&::placeholder": {
            fontSize: "0.68rem",
            opacity: 0.65,
          },
        },
        "& .MuiInputLabel-root": {
          fontSize: "0.72rem",
        },
        "& .MuiInputLabel-shrink": {
          transform: "translate(14px, -8px) scale(0.85)",
        },
        "& .MuiInputAdornment-root .MuiIconButton-root": {
          padding: 2,
        },
      },
      filterPanelMenuItem: {
        fontSize: "0.72rem",
        py: 0.5,
        minHeight: 32,
      },
      stripedRowEven: isDark ? "#1e1e1e" : "#fff",
      stripedRowOdd: isDark ? alpha(palette.surface, 0.5) : alpha(palette.surface, 0.5),

      batchIdText: { fontWeight: 800, fontSize: "0.84rem", color: palette.primary },
      normalText: { fontSize: "0.8rem", fontWeight: 500, color: palette.textSub },
      subtleText: { fontSize: "0.78rem", color: palette.text },
      icon: { fontSize: 13, color: palette.textSub },
      projectCell: {
        display: "flex",
        alignItems: "center",
        gap: 0.8,
      },
      projectIcon: {
        fontSize: 14,
        color: palette.textSub,
        opacity: 0.75,
        flexShrink: 0,
      },
      projectInfo: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 0,
      },
      projectName: {
        fontSize: "0.85rem",
        fontWeight: 500,
        color: palette.text,
        lineHeight: 1.2,
      },
      projectId: {
        fontSize: "0.65rem",
        fontWeight: 400,
        color: palette.textSub,
        lineHeight: 1.2,
        mt: 0.25,
      },
      batchTypeChip: {
        height: 20,
        fontSize: "0.62rem",
        fontWeight: 700,
        background: alpha(palette.primary, 0.08),
        color: palette.primary,
        border: `1px solid ${alpha(palette.primary, 0.18)}`,
      },
      action: {
        primary: {
          borderRadius: 2,
          fontWeight: fonts.weight.bold,
          fontSize: fonts.size.xs,
          textTransform: "none",
          px: 1.8,
          py: "5px",
          color: isDark ? "#000000" : "#ffffff", // explicitly enforce contrast
          whiteSpace: "nowrap",
          background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
          boxShadow: `0 2px 8px ${alpha(palette.primary, 0.28)}`,
          "&:hover": {
            boxShadow: `0 4px 12px ${alpha(palette.primary, 0.38)}`,
            transform: "translateY(-1px)",
          },
          transition: "all 0.18s",
        },
        secondary: {
          borderRadius: 2,
          fontWeight: 700,
          fontSize: "0.72rem",
          textTransform: "none",
          px: 1.8,
          py: "5px",
          whiteSpace: "nowrap",
          borderColor: palette.primaryLight,
          color: palette.primaryLight,
          "&:hover": { background: alpha(palette.primaryLight, 0.06) },
        },
        danger: {
          borderRadius: 2,
          fontWeight: 700,
          fontSize: "0.72rem",
          textTransform: "none",
          px: 1.8,
          py: "5px",
          whiteSpace: "nowrap",
          borderColor: palette.danger,
          color: palette.danger,
          "&:hover": { background: alpha(palette.danger, 0.06) },
        },
      },
      chips: {
        waiting: {
          fontWeight: 600,
          fontSize: "0.68rem",
          height: 24,
          background: alpha(palette.warn, 0.1),
          color: palette.warn,
          border: `1px solid ${alpha(palette.warn, 0.3)}`,
        },
        approved: {
          fontWeight: 700,
          fontSize: "0.68rem",
          height: 24,
          background: alpha(palette.success, 0.1),
          color: palette.success,
          border: `1px solid ${alpha(palette.success, 0.3)}`,
        },
        reasonText: {
          fontSize: "0.62rem",
          color: palette.danger,
          mt: 0.4,
          cursor: "help",
          textDecoration: "underline dotted",
          fontWeight: 600,
        },
      },
      priorityConfig: {
        Critical: { color: isDark ? "#ef5350" : "#922B21", bg: alpha(isDark ? "#ef5350" : "#C0392B", 0.08), border: alpha(isDark ? "#ef5350" : "#C0392B", 0.22) },
        High: { color: isDark ? "#fbc02d" : "#7D6608", bg: alpha(isDark ? "#fbc02d" : "#D4AC0D", 0.1), border: alpha(isDark ? "#fbc02d" : "#D4AC0D", 0.28) },
        Medium: { color: isDark ? "#64b5f6" : "#1A5276", bg: alpha(isDark ? "#64b5f6" : "#2E86C1", 0.1), border: alpha(isDark ? "#64b5f6" : "#2E86C1", 0.28) },
        Low: { color: isDark ? "#b0bec5" : "#2E4053", bg: alpha(isDark ? "#b0bec5" : "#5D6D7E", 0.08), border: alpha(isDark ? "#b0bec5" : "#5D6D7E", 0.2) },
      } as Record<string, { color: string; bg: string; border: string }>,
      statusConfig: {
        ["To Be Initiated"]: {
          color: isDark ? "#b0bec5" : "#475569",
          bg: alpha(isDark ? "#b0bec5" : "#475569", 0.08),
          border: alpha(isDark ? "#b0bec5" : "#475569", 0.2),
          label: "To Be Initiated",
        },
        ["In Progress"]: {
          color: palette.primaryLight,
          bg: alpha(palette.primaryLight, 0.1),
          border: alpha(palette.primaryLight, 0.25),
          label: "In Progress",
        },
        ["Waiting for Partial Approval"]: {
          color: palette.warn,
          bg: alpha(palette.warn, 0.1),
          border: alpha(palette.warn, 0.3),
          label: "Waiting for Partial Approval",
        },
        ["Waiting for Approval"]: {
          color: palette.warn,
          bg: alpha(palette.warn, 0.1),
          border: alpha(palette.warn, 0.3),
          label: "Waiting for Approval",
        },
        ["Approved"]: {
          color: palette.success,
          bg: alpha(palette.success, 0.1),
          border: alpha(palette.success, 0.25),
          label: "Approved",
        },
        ["Completely Approved"]: {
          color: palette.success,
          bg: alpha(palette.success, 0.1),
          border: alpha(palette.success, 0.25),
          label: "Completely Approved",
        },
        ["Final Approval Completed"]: {
          color: palette.success,
          bg: alpha(palette.success, 0.1),
          border: alpha(palette.success, 0.25),
          label: "Final Approval Completed",
        },
        ["Waiting For Complete Approval"]: {
          color: palette.warn,
          bg: alpha(palette.warn, 0.1),
          border: alpha(palette.warn, 0.3),
          label: "Waiting For Complete Approval",
        },
        ["Rejected"]: {
          color: palette.danger,
          bg: alpha(palette.danger, 0.1),
          border: alpha(palette.danger, 0.25),
          label: "Rejected",
        },
      } as Record<string, { color: string; bg: string; border: string; label: string }>,
      tableLabel: {
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontSize: fonts.size.xs,
      },
    },
  };
};

export default getOperationsTheme;
