import { Box, CircularProgress, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const BRAND = QC_DIVISION_BRAND;

type QCDivisionInlineLoaderProps = {
  label?: string;
  minHeight?: number | string;
};

/** Inline division/content loader — same pattern as Subscale particulars table load. */
const QCDivisionInlineLoader = ({
  label = S.SCHEMA_LOADING_TITLE,
  minHeight = 220,
}: QCDivisionInlineLoaderProps) => (
  <Box
    sx={{
      minHeight,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1.5,
      borderRadius: 1.5,
      border: `1px solid ${BRAND.border}`,
      background: "rgba(27,79,114,0.04)",
      mt: 1.25,
    }}
  >
    <CircularProgress size={36} sx={{ color: BRAND.primary }} />
    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: BRAND.text }}>
      {label}
    </Typography>
  </Box>
);

export default QCDivisionInlineLoader;
