import { alpha } from "@mui/material";
import { getOperationsTheme } from "../../shared/operations_theme";
import { getRawMaterialProcurementTheme } from "./rawMaterialProcurement_theme";
import { getRocketMotorCasingTheme } from "./rocketMotorCasing_theme";

const getSourcingWorkflowTheme = (baseTheme: any, mode = "light") => {
  const isDark = mode === "dark";
  const palette = baseTheme.palette;

  return {
    formElements: {
      fieldLabel: {
        fontSize: "0.67rem",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: palette.textSub,
        marginBottom: "4px",
      },
      /** Shared 40px row height for supply order, receipt date, and manufacturer fields. */
      metaRowTextField: {
        "& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root": {
          borderRadius: 1.5,
          background: palette.surface,
          fontSize: "0.84rem",
          height: 40,
          minHeight: 40,
          maxHeight: 40,
          boxSizing: "border-box",
          transition: "all 0.18s",
          "& fieldset, & .MuiPickersOutlinedInput-notchedOutline": { borderColor: palette.border },
          "&:hover fieldset, &:hover .MuiPickersOutlinedInput-notchedOutline": {
            borderColor: palette.primaryLight,
          },
          "&.Mui-focused fieldset, &.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
            borderColor: palette.primaryLight,
            borderWidth: 1.5,
          },
          "&.Mui-focused": {
            background: isDark ? palette.pageBg : "#fff",
            boxShadow: `0 0 0 2px ${alpha(palette.primaryLight, 0.1)}`,
          },
        },
        "& .MuiInputBase-input, & .MuiPickersSectionList-root": {
          fontWeight: 500,
          color: palette.text,
          fontSize: "0.84rem",
          padding: "8.5px 10px",
          height: "100%",
          boxSizing: "border-box",
        },
        "& .MuiInputAdornment-root": {
          marginLeft: 0,
          height: "100%",
          maxHeight: "none",
          "& .MuiIconButton-root": {
            padding: 4,
            width: 28,
            height: 28,
            color: alpha(palette.text, 0.55),
          },
        },
      },
      textField: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 1.5,
          background: palette.surface,
          fontSize: "0.84rem",
          transition: "all 0.18s",
          "& fieldset": { borderColor: palette.border },
          "&:hover fieldset": { borderColor: palette.primaryLight },
          "&.Mui-focused fieldset": { borderColor: palette.primaryLight, borderWidth: 1.5 },
          "&.Mui-focused": { background: isDark ? palette.pageBg : "#fff", boxShadow: `0 0 0 2px ${alpha(palette.primaryLight, 0.1)}` },
        },
        "& .MuiInputBase-input": { fontWeight: 500, color: palette.text, padding: "7px 10px" },
      },
      multilineField: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 1.5,
          background: palette.surface,
          fontSize: "0.84rem",
          transition: "all 0.18s",
          alignItems: "flex-start",
          "& fieldset": { borderColor: palette.border },
          "&:hover fieldset": { borderColor: palette.primaryLight },
          "&.Mui-focused fieldset": { borderColor: palette.primaryLight, borderWidth: 1.5 },
          "&.Mui-focused": { background: isDark ? palette.pageBg : "#fff", boxShadow: `0 0 0 2px ${alpha(palette.primaryLight, 0.1)}` },
        },
        "& .MuiInputBase-input": { fontWeight: 500, color: palette.text },
      },
      cellField: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 1,
          background: isDark ? palette.pageBg : "#fff",
          fontSize: "0.78rem",
          "& fieldset": { borderColor: alpha(palette.border, 0.6) },
          "&:hover fieldset": { borderColor: palette.primaryLight },
          "&.Mui-focused fieldset": { borderColor: palette.primaryLight, borderWidth: 1.5 },
          "&.Mui-focused": { background: isDark ? palette.pageBg : "#fff" },
        },
        "& .MuiInputBase-input": { fontWeight: 500, color: palette.text, padding: "5px 7px" },
      },
      sectionRow: { display: "flex", alignItems: "center", gap: 1, marginBottom: "10px" },
      sectionBlock: (borderColor: string) => ({
        padding: "14px 16px",
        borderRadius: 2,
        background: isDark ? alpha(palette.surface, 0.3) : "#fff",
        border: `1px solid ${palette.border}`,
        borderLeft: `3px solid ${borderColor}`,
        marginBottom: "12px",
      }),
      tableHeader: {
        background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
        color: "#fff",
        fontWeight: 700,
        fontSize: "0.65rem",
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        padding: "8px 10px",
        whiteSpace: "nowrap",
        borderBottom: "none",
        "&:first-of-type": { borderRadius: "6px 0 0 0" },
        "&:last-of-type": { borderRadius: "0 6px 0 0" },
      },
      tableCell: {
        padding: "6px 10px",
        borderBottom: `1px solid ${alpha(palette.border, 0.5)}`,
        verticalAlign: "middle",
        fontSize: "0.82rem",
        color: palette.text,
      },
      blockCard: {
        borderRadius: 3.5,
        border: `1px solid ${palette.border}`,
        background: isDark ? alpha(palette.surface, 0.4) : "#fff",
        overflow: "hidden",
        boxShadow: `0 2px 14px ${alpha(palette.primary, isDark ? 0.02 : 0.07)}`,
      },
      blockHeader: {
        padding: "12px 18px",
        background: `linear-gradient(135deg, ${alpha(palette.primary, 0.06)}, ${alpha(palette.primaryLight, 0.04)})`,
        borderBottom: `1px solid ${palette.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      },
      emptyStateBox: {
        textAlign: "center", py: 3, borderRadius: 2,
        border: `1px dashed ${palette.border}`,
        background: alpha(palette.surface, 0.5),
      },
      primaryGradientChip: {
        height: 20, fontSize: "0.62rem", fontWeight: 700, color: "#fff",
        background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
      },
      primaryLightChip: {
        height: 20, fontSize: "0.62rem", fontWeight: 700,
        background: alpha(palette.primaryLight, 0.1), color: palette.primaryLight,
        border: `1px solid ${alpha(palette.primaryLight, 0.2)}`,
      },
      infoFooterNote: {
        borderRadius: 2,
        background: alpha(palette.primaryLight, 0.05),
        border: `1px dashed ${alpha(palette.primaryLight, 0.25)}`,
      },
    },
    actionBar: {
      container: {
        mt: 3,
        p: "16px 20px",
        borderRadius: 3,
        background: isDark ? alpha(palette.surface, 0.4) : "#fff",
        border: `1.5px solid ${palette.border}`,
        boxShadow: `0 -2px 16px ${alpha(palette.primary, 0.06)}`,
      },
      primaryText: { fontSize: "0.78rem", fontWeight: 700, color: palette.text },
      secondaryText: { fontSize: "0.7rem", color: palette.textSub, mt: 0.3 },
      saveButton: {
        borderRadius: 2.5,
        fontWeight: 700,
        fontSize: "0.82rem",
        textTransform: "none",
        px: 2.5,
        py: 1,
        borderColor: palette.primaryLight,
        color: palette.primaryLight,
        "&:hover": { background: alpha(palette.primaryLight, 0.06) },
      },
      submitButton: {
        borderRadius: 2.5,
        fontWeight: 800,
        fontSize: "0.82rem",
        textTransform: "none",
        px: 2.5,
        py: 1,
        background: `linear-gradient(135deg, ${palette.success}, ${palette.primaryLight})`,
        boxShadow: `0 4px 14px ${alpha(palette.success, 0.35)}`,
        "&:hover": {
          boxShadow: `0 6px 18px ${alpha(palette.success, 0.45)}`,
          transform: "translateY(-1px)",
        },
        "&:disabled": { background: palette.border, boxShadow: "none", color: "#fff" },
        transition: "all 0.2s",
      },
    },
  };
};

export const getSourcingTheme = (mode = "light") => {
  const baseTheme = getOperationsTheme(mode);
  const sourcingWorkflow = getSourcingWorkflowTheme(baseTheme, mode);

  return {
    ...baseTheme,
    workflow: {
      ...baseTheme.workflow,
      ...sourcingWorkflow,
    },
    sourcing: {
      dashboard: {
        departmentName: "Sourcing Department",
      },
      rawMaterial: getRawMaterialProcurementTheme(baseTheme),
      rocketMotor: getRocketMotorCasingTheme(baseTheme),
    },
  };
};

export default getSourcingTheme;