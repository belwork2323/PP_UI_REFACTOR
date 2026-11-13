import { alpha } from "@mui/material";

export type DocumentAttachmentListPalette = {
  primaryLight: string;
  border: string;
  text: string;
  textSub: string;
  white?: string;
};

export const getDocumentAttachmentListTheme = (palette: DocumentAttachmentListPalette) => ({
  row: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    p: 1,
    borderRadius: 1.5,
    border: `1px solid ${alpha(palette.border, 0.8)}`,
    background: alpha(palette.white ?? "#fff", 0.9),
    "&:hover": { background: alpha(palette.primaryLight, 0.05) },
  },
  fileIcon: { fontSize: 20, color: palette.primaryLight },
  fileName: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: palette.text,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  typeLine: { fontSize: "0.72rem", color: palette.textSub, mt: 0.25 },
  typeLabel: { fontWeight: 700, color: palette.text },
  link: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: palette.primaryLight,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 0.25,
    flexShrink: 0,
  },
  linkIcon: { fontSize: 14 },
});
