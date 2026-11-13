import { alpha } from "@mui/material";

export type DocumentUploadPalette = {
  primaryLight?: string;
  text?: string;
  textSub?: string;
  border?: string;
  danger?: string;
};

export const getDocumentUploadTheme = (
  palette: DocumentUploadPalette,
  typeFieldBaseSx: object = {},
) => {
  const primaryLight = palette.primaryLight ?? "#2E86C1";
  const danger = palette.danger ?? "#C0392B";
  const textSub = palette.textSub ?? "#5D6D7E";
  const border = palette.border ?? "#ccc";
  const dashedTarget = {
    border: `1.5px dashed ${alpha(primaryLight, 0.35)}`,
    borderRadius: 1,
    cursor: "pointer",
    transition: "all 0.18s",
    background: "#fff",
    "&:hover": {
      borderColor: alpha(primaryLight, 0.65),
      background: alpha(primaryLight, 0.03),
    },
  };
  const metaChip = {
    height: 16,
    fontSize: "0.55rem",
    fontWeight: 700,
    "& .MuiChip-label": { px: 0.6 },
  };
  const rowIconButton = {
    alignSelf: { xs: "flex-end", sm: "center" },
    flexShrink: 0,
    p: 0.5,
  };
  const fileLink = {
    fontSize: "0.62rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 0.2,
    cursor: "pointer",
    color: primaryLight,
  };

  return {
    /** Shape expected by `mandatoryAsteriskSx` / `mandatoryFieldInputSx`. */
    validationTheme: { palette: { ...palette, danger } },
    root: { px: 1.5, py: 1, borderTop: `1px solid ${alpha(border, 0.5)}` },
    header: (hasItems: boolean) => ({ mb: hasItems ? 0.85 : 1 }),
    headerText: { minWidth: 0 },
    subtitle: { fontSize: "0.72rem", color: textSub, lineHeight: 1.4, maxWidth: 480 },
    sectionError: { fontSize: "0.6rem", fontWeight: 500, color: danger, mt: 0.35, lineHeight: 1.35 },
    uploadButton: {
      textTransform: "none" as const,
      fontWeight: 600,
      fontSize: "0.68rem",
      flexShrink: 0,
      borderRadius: 1,
      borderColor: primaryLight,
      color: primaryLight,
      cursor: "pointer",
      py: 0.25,
      px: 1,
      minHeight: 28,
      "&:hover": { background: alpha(primaryLight, 0.06) },
    },
    uploadButtonIcon: { fontSize: "14px !important" },
    dropZone: {
      ...dashedTarget,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      py: 1.5,
      px: 1.5,
      textAlign: "center" as const,
    },
    dropZoneIcon: { fontSize: 22, color: alpha(primaryLight, 0.45), mb: 0.5 },
    dropZoneTitle: { fontSize: "0.7rem", fontWeight: 600, color: textSub },
    dropZoneSubtitle: { fontSize: "0.72rem", color: alpha(textSub, 0.85), mt: 0.25 },
    addMore: {
      ...dashedTarget,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 0.5,
      px: 1,
      py: 0.65,
    },
    addMoreIcon: { fontSize: 14, color: alpha(primaryLight, 0.75) },
    addMoreText: { fontSize: "0.68rem", fontWeight: 600, color: primaryLight },
    row: {
      card: {
        px: 1,
        py: 0.75,
        borderRadius: 1,
        background: "#fff",
        border: `1px solid ${alpha(border, 0.85)}`,
      },
      fileIconBox: {
        width: 26,
        height: 26,
        borderRadius: 0.75,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: alpha(primaryLight, 0.08),
        border: `1px solid ${alpha(primaryLight, 0.18)}`,
      },
      fileIcon: { fontSize: 15, color: primaryLight },
      fileName: {
        fontSize: "0.72rem",
        fontWeight: 500,
        color: palette.text,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        lineHeight: 1.3,
      },
      metaLine: { mt: 0.25 },
      extensionChip: {
        ...metaChip,
        background: alpha(primaryLight, 0.1),
        color: primaryLight,
        border: `1px solid ${alpha(primaryLight, 0.22)}`,
      },
      failedChip: { ...metaChip, color: danger },
      fileLink,
      fileLinkIcon: { fontSize: 11 },
      progressBox: { mt: 0.5 },
      progressBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        bgcolor: alpha(primaryLight, 0.12),
        "& .MuiLinearProgress-bar": { borderRadius: 2, bgcolor: primaryLight },
      },
      progressValue: {
        fontSize: "0.62rem",
        fontWeight: 700,
        color: primaryLight,
        minWidth: 28,
        textAlign: "right" as const,
      },
      progressLabel: { fontSize: "0.58rem", color: textSub, mt: 0.2 },
      typeFieldBox: { width: { xs: "100%", sm: 160 }, flexShrink: 0 },
      typeField: {
        ...typeFieldBaseSx,
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#fff",
          background: "#fff",
          minHeight: 32,
          borderRadius: 1,
          fontSize: "0.72rem",
          "&.Mui-focused": { backgroundColor: "#fff", background: "#fff" },
        },
        "& .MuiInputBase-input": {
          fontSize: "0.72rem",
          fontWeight: 500,
          padding: "4px 8px",
          backgroundColor: "#fff",
        },
      },
      typeError: { mx: 0, mt: 0.25, fontSize: "0.6rem", fontWeight: 500 },
      removeButton: {
        ...rowIconButton,
        color: textSub,
        "&:hover": { color: danger, background: alpha(danger, 0.08) },
      },
      retryButton: { ...rowIconButton, color: primaryLight },
      actionIcon: { fontSize: 18 },
    },
  };
};

export type DocumentUploadTheme = ReturnType<typeof getDocumentUploadTheme>;
