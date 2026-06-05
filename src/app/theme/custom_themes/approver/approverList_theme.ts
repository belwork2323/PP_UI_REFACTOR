import { alpha } from "@mui/material/styles";

import {
  approverSpacing,
  approverTypography,
  type ApproverDepartmentBrand,
  type ApproverStatusMeta,
} from "../../approver";
import spacing from "../../spacing";

export const getApproverListTheme = (brand: ApproverDepartmentBrand) => ({
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
      background: "#ffffff",
      border: `1px solid ${brand.border}`,
      boxShadow: `0 1px 6px ${alpha(brand.accent, 0.05)}`,
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
      color: brand.textSub,
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
            borderColor: meta ? alpha(meta.color, 0.35) : brand.border,
            color: meta?.color ?? brand.textSub,
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
        fontFamily: approverTypography.body.fontFamily,
        fontSize: approverTypography.body.fontSize,
        "& .MuiOutlinedInput-input": {
          px: { xs: 1.5, md: 2 },
          py: { xs: 1.1, md: 1.3 },
        },
        "& fieldset": { borderColor: brand.border },
        "&:hover fieldset": { borderColor: brand.accent },
        "&.Mui-focused fieldset": { borderColor: brand.accent },
      },
    },
    filter: {
      minWidth: 150,
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        fontFamily: approverTypography.body.fontFamily,
        fontSize: approverTypography.body.fontSize,
        "& fieldset": { borderColor: brand.border },
        "&:hover fieldset": { borderColor: brand.accent },
        "&.Mui-focused fieldset": { borderColor: brand.accent },
      },
      "& .MuiInputLabel-root": { fontSize: "0.8rem" },
    },
    startIcon: {
      search: { fontSize: 16, color: brand.textSub },
      filter: { fontSize: 15, color: brand.textSub },
    },
    menuItem: {
      fontSize: approverTypography.body.fontSize,
    },
  },
  results: {
    icon: { fontSize: 14, color: alpha(brand.accent, 0.55) },
    text: { ...approverTypography.caption, color: brand.textSub, fontWeight: 600 },
  },
  loading: {
    spinner: { color: brand.accent },
  },
  empty: {
    icon: { fontSize: 38, mb: 1, opacity: 0.25 },
    title: { ...approverTypography.title, color: brand.text, fontSize: "0.88rem" },
    subtitle: { ...approverTypography.caption, mt: 0.5, opacity: 0.75 },
  },
});
