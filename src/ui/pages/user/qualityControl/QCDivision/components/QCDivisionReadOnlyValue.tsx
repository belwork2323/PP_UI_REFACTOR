import { Typography, alpha } from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../../app/theme/custom_themes/user/qualityControl/tokens";

export const displayQcReadOnlyValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || "—";
};

type QCDivisionReadOnlyValueProps = {
  value: unknown;
  muted?: boolean;
};

/** Plain read-only cell text — matches Raw Material Revalidation / Processing approved theme. */
export const QCDivisionReadOnlyValue = ({
  value,
  muted = false,
}: QCDivisionReadOnlyValueProps) => (
  <Typography
    sx={{
      fontSize: "0.72rem",
      fontWeight: muted ? 500 : 600,
      color: muted ? QC_DIVISION_BRAND.textSub : QC_DIVISION_BRAND.text,
      lineHeight: 1.35,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}
  >
    {displayQcReadOnlyValue(value)}
  </Typography>
);

export const qcReadOnlyTableHeaderCellSx = {
  fontSize: "0.65rem",
  fontWeight: 800,
  letterSpacing: "0.02em",
  textTransform: "uppercase" as const,
  color: QC_DIVISION_BRAND.primary,
  background: alpha(QC_DIVISION_BRAND.primaryLight, 0.08),
  whiteSpace: "nowrap" as const,
  py: 0.5,
  px: 1,
  verticalAlign: "middle" as const,
  borderColor: alpha("#1B4F72", 0.12),
};

export const qcReadOnlyTableContainerSx = {
  border: `1px solid ${QC_DIVISION_BRAND.border}`,
  borderRadius: 1,
  background: "#fff",
  overflowX: "auto" as const,
};

export const qcReadOnlyBodyCellSx = {
  fontSize: "0.72rem",
  py: 0.5,
  px: 1,
  verticalAlign: "middle" as const,
  borderColor: alpha("#1B4F72", 0.12),
};
