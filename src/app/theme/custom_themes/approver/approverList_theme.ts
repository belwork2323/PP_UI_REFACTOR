import { alpha } from "@mui/material/styles";

import {
  approverSpacing,
  approverTypography,
  type ApproverDepartmentBrand,
  type ApproverStatusMeta,
} from "../../approver";
import spacing from "../../spacing";
import type { ThemeMode } from "@app/theme/tokens";

export const getApproverListTheme = (
  brand: ApproverDepartmentBrand,
  mode: ThemeMode = "light",
) => {
  const isDark = mode === "dark";
  const filterBg = isDark ? "#121212" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.2)" : brand.border;
  const text = isDark ? "#f0f2f8" : brand.text;
  const textSub = isDark ? "rgba(240,242,248,0.65)" : brand.textSub;

  return {
  sections: {
    root: {
      px: { xs: spacing.sm, md: spacing.md },
      pt: { xs: spacing.sm, md: spacing.md },
      pb: { xs: spacing.sm, md: spacing.md },
    },
    statusStack: {
      direction: "row" as const,
      gap: approverSpacing.chipGap,
      flexWrap: "wrap" as const,
      mb: 2,
      p: { xs: spacing.xs, md: spacing.sm },
    },
    filterContainer: {
      mb: 2,
      p: { xs: spacing.sm, md: spacing.md },
      borderRadius: 3,
      background: filterBg,
      border: `1px solid ${border}`,
      boxShadow: `0 1px 6px ${alpha(brand.accent, isDark ? 0.12 : 0.05)}`,
    },
    filterStack: {
      direction: { xs: "column", sm: "row" } as const,
      gap: approverSpacing.inputGap,
      alignItems: { sm: "center" } as const,
      flexWrap: "wrap" as const,
    },
    resultsWrap: {
      ml: "auto",
      display: "flex",
      alignItems: "center",
      gap: 0.75,
    },
    loadingWrap: {
      display: "flex",
      justifyContent: "center",
      py: 4,
    },
    listWrap: {
      px: { xs: spacing.xs, md: spacing.sm },
      pb: { xs: spacing.sm, md: spacing.md },
    },
    emptyWrap: {
      textAlign: "center",
      py: 6,
      color: textSub,
    },
  },
  statusTab: {
    button: (isActive: boolean, meta?: ApproverStatusMeta[string]) => ({
      borderRadius: 2,
      fontFamily: approverTypography.body.fontFamily,
      fontSize: "0.72rem",
      fontWeight: 700,
      px: 2,
      py: "7px",
      textTransform: "none",
      whiteSpace: "nowrap",
      ...(isActive
        ? {
            background: meta
              ? `linear-gradient(135deg, ${meta.color}, ${alpha(meta.color, 0.75)})`
              : `linear-gradient(135deg, ${brand.accent}, ${brand.accentLight})`,
            border: "none",
            boxShadow: `0 2px 8px ${alpha(meta?.color ?? brand.accent, 0.3)}`,
            color: "#ffffff",
          }
        : {
            borderColor: meta ? alpha(meta.color, 0.35) : border,
            color: meta?.color ?? textSub,
            "&:hover": {
              background: meta ? alpha(meta.color, 0.06) : alpha(brand.accent, 0.05),
              borderColor: meta?.color ?? brand.accent,
            },
          }),
    }),
    countChip: (isActive: boolean, meta?: ApproverStatusMeta[string]) => ({
      height: 17,
      minWidth: 22,
      fontSize: "0.6rem",
      fontWeight: 800,
      background: isActive
        ? alpha("#ffffff", 0.25)
        : meta
          ? alpha(meta.color, 0.1)
          : alpha(brand.accent, 0.1),
      color: isActive ? "#ffffff" : meta?.color ?? brand.accent,
      border: "none",
    }),
  },
  inputs: {
    search: {
      flex: 1,
      minWidth: 260,
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        background: filterBg,
        color: text,
        fontFamily: approverTypography.body.fontFamily,
        fontSize: approverTypography.body.fontSize,
        "& .MuiOutlinedInput-input": {
          px: { xs: 1.5, md: 2 },
          py: { xs: 1.1, md: 1.3 },
          color: text,
          "&::placeholder": {
            color: textSub,
            opacity: 1,
          },
        },
        "& fieldset": { borderColor: border },
        "&:hover fieldset": { borderColor: brand.accent },
        "&.Mui-focused fieldset": { borderColor: brand.accent },
      },
      "& .MuiInputBase-input": {
        color: text,
      },
    },
    filter: {
      minWidth: 150,
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        background: filterBg,
        color: text,
        fontFamily: approverTypography.body.fontFamily,
        fontSize: approverTypography.body.fontSize,
        "& fieldset": { borderColor: border },
        "&:hover fieldset": { borderColor: brand.accent },
        "&.Mui-focused fieldset": { borderColor: brand.accent },
      },
      "& .MuiInputLabel-root": { fontSize: "0.8rem", color: textSub },
      "& .MuiSelect-icon": { color: textSub },
    },
    startIcon: {
      search: { fontSize: 16, color: textSub },
      filter: { fontSize: 15, color: textSub },
    },
    menuItem: {
      fontSize: approverTypography.body.fontSize,
      color: text,
    },
  },
  results: {
    icon: { fontSize: 14, color: alpha(brand.accent, 0.55) },
    text: { ...approverTypography.caption, color: textSub, fontWeight: 600 },
  },
  loading: {
    spinner: { color: brand.accent },
  },
  empty: {
    icon: { fontSize: 38, mb: 1, opacity: 0.25 },
    title: { ...approverTypography.title, color: text, fontSize: "0.88rem" },
    subtitle: { ...approverTypography.caption, mt: 0.5, opacity: 0.75, color: textSub },
  },
};
};
