import { Typography } from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "../../../../../../app/theme/custom_themes/shared/data_table_theme";

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

export const qcReadOnlyTableHeaderCellSx = uniformTableHeaderCellSx(
  QC_DIVISION_BRAND.primary,
  QC_DIVISION_BRAND.primaryLight,
  {
    headerFontSize: "0.65rem",
    headerLetterSpacing: "0.02em",
    headerPaddingY: 0.5,
    headerPaddingX: 1,
  },
);

export const qcReadOnlyTableContainerSx = {
  border: `1px solid ${QC_DIVISION_BRAND.border}`,
  borderRadius: 1,
  background: "#fff",
  overflowX: "auto" as const,
};

export const qcReadOnlyBodyCellSx = uniformTableBodyCellSx(
  { border: QC_DIVISION_BRAND.border, text: QC_DIVISION_BRAND.text },
  {
    bodyFontSize: "0.72rem",
    bodyPaddingY: 0.5,
    bodyPaddingX: 1,
  },
);
