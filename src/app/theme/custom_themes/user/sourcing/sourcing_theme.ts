import { alpha } from "@mui/material";
import { getOperationsTheme } from "../../shared/operations_theme";
import {
  dataTableHeaderDivider,
  uniformTableBodyCellSx,
} from "../../shared/data_table_theme";

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
      /** Shared compact (32px) row height for supply order, receipt date, and manufacturer. */
      metaRowTextField: {
        "& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root": {
          borderRadius: 1.5,
          background: isDark ? palette.pageBg : "#fff",
          fontSize: "0.8rem",
          height: 32,
          minHeight: 32,
          maxHeight: 32,
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
          fontSize: "0.8rem",
          padding: "0 8px",
          height: "100%",
          boxSizing: "border-box",
        },
        "& .MuiInputAdornment-root": {
          marginLeft: 0,
          height: "100%",
          maxHeight: "none",
          "& .MuiIconButton-root": {
            padding: 2,
            width: 24,
            height: 24,
            color: alpha(palette.text, 0.55),
          },
        },
      },
      textField: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 1.5,
          // Lift + stronger edge so the control is obvious on dark pageBg.
          background: isDark ? alpha("#fff", 0.09) : "#fff",
          fontSize: "0.84rem",
          transition: "all 0.18s",
          color: palette.text,
          // MUI light theme paints notchedOutline near-black — beat it on dark pages.
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: isDark ? "rgba(255,255,255,0.5) !important" : palette.border,
            borderWidth: isDark ? "1.5px" : "1px",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: `${palette.primaryLight} !important`,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: `${palette.primaryLight} !important`,
            borderWidth: "1.5px",
          },
          "&.Mui-focused": {
            background: isDark ? alpha("#fff", 0.12) : "#fff",
            boxShadow: `0 0 0 2px ${alpha(palette.primaryLight, 0.18)}`,
          },
          // MUI disabled opacity makes dark fields vanish — keep chrome readable.
          "&.Mui-disabled": {
            opacity: 1,
            background: isDark ? alpha("#fff", 0.05) : alpha(palette.border, 0.35),
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark
                ? "rgba(255,255,255,0.35) !important"
                : palette.border,
            },
          },
        },
        "& .MuiInputBase-input, & .MuiSelect-select": {
          fontWeight: 500,
          color: palette.text,
          WebkitTextFillColor: `${palette.text} !important`,
          padding: "7px 10px",
        },
        "& .MuiOutlinedInput-root.Mui-disabled .MuiSelect-select, & .MuiOutlinedInput-root.Mui-disabled .MuiInputBase-input":
          {
            WebkitTextFillColor: `${palette.textSub} !important`,
            color: palette.textSub,
          },
        "& .MuiSelect-icon": { color: palette.textSub },
        "& .MuiOutlinedInput-root.Mui-disabled .MuiSelect-icon": {
          color: alpha(palette.textSub, 0.7),
        },
        // Do not use `inherit` — MUI light theme text is dark and hides adornments.
        "& .MuiInputAdornment-root .MuiSvgIcon-root": { color: palette.textSub },
      },
      multilineField: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 1.5,
          background: isDark ? palette.pageBg : "#fff",
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
          backgroundColor: isDark ? palette.pageBg : "#fff",
          background: isDark ? palette.pageBg : "#fff",
          fontSize: "0.78rem",
          "& fieldset": { borderColor: alpha(palette.border, 0.6) },
          "&:hover fieldset": { borderColor: palette.primaryLight },
          "&.Mui-focused fieldset": { borderColor: palette.primaryLight, borderWidth: 1.5 },
          "&.Mui-focused": {
            backgroundColor: isDark ? palette.pageBg : "#fff",
            background: isDark ? palette.pageBg : "#fff",
          },
        },
        "& .MuiInputBase-input": {
          fontWeight: 500,
          color: palette.text,
          padding: "5px 7px",
          backgroundColor: isDark ? palette.pageBg : "#fff",
        },
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
        background: `linear-gradient(180deg, ${palette.primaryLight} 0%, ${palette.primary} 100%)`,
        color: "#fff",
        fontWeight: 700,
        fontSize: "0.65rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "10px 12px",
        whiteSpace: "normal",
        lineHeight: 1.3,
        borderBottom: "none",
        borderRight: dataTableHeaderDivider,
        verticalAlign: "middle",
        "&:last-of-type": { borderRight: "none" },
      },
      tableCell: uniformTableBodyCellSx(
        { border: palette.border, text: palette.text },
        {
          bodyFontSize: "0.82rem",
          bodyPaddingY: "8px",
          bodyPaddingX: "12px",
        },
      ),
      blockCard: {
        borderRadius: 3.5,
        border: `1px solid ${palette.border}`,
        background: isDark ? alpha(palette.surface, 0.4) : "#fff",
        overflow: "hidden",
        maxWidth: "100%",
        minWidth: 0,
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
    },
  };
};

export default getSourcingTheme;