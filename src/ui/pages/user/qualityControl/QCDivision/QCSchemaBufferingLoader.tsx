import { Box, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const BRAND = QC_DIVISION_BRAND;

type QCSchemaBufferingLoaderProps = {
  /** When true, render as an absolute overlay over a positioned parent. */
  overlay?: boolean;
  label?: string;
  minHeight?: number | string;
};

/**
 * Inline dotted buffering spinner (same pattern as Subscale table load).
 * Not a full-viewport loader — use WorkflowFormOpeningLoader for Fill Details only.
 */
const QCSchemaBufferingLoader = ({
  overlay = false,
  label = S.SCHEMA_LOADING_TITLE,
  minHeight = 160,
}: QCSchemaBufferingLoaderProps) => (
  <Box
    sx={{
      ...(overlay
        ? {
            position: "absolute",
            inset: 0,
            zIndex: 20,
            bgcolor: "rgba(255, 255, 255, 0.45)",
            borderRadius: "inherit",
          }
        : {
            borderRadius: 2.5,
            border: `1px solid ${BRAND.border}`,
            background: BRAND.surface,
            minHeight,
          }),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: overlay ? "flex-start" : "center",
      gap: 1.25,
      px: 2,
      py: overlay ? undefined : 5,
      pt: overlay ? { xs: 4, sm: 6 } : undefined,
      "@keyframes qcSchemaDottedSpin": {
        to: { transform: "rotate(360deg)" },
      },
    }}
  >
    <Box
      aria-hidden
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: `3px dotted ${BRAND.primary}`,
        borderTopColor: "transparent",
        animation: "qcSchemaDottedSpin 0.85s linear infinite",
      }}
    />
    <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: BRAND.textSub }}>
      {label}
    </Typography>
  </Box>
);

export default QCSchemaBufferingLoader;
