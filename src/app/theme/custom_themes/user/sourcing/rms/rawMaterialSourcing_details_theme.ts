import { alpha } from "@mui/material";
import { createDataTableTheme } from "@app/theme/custom_themes/shared/data_table_theme";
import { createWorkflowDetailsTheme } from "@app/theme/custom_themes/shared/workflow_details_theme";
import { getDocumentAttachmentListTheme } from "@app/theme/custom_themes/shared/documentAttachmentList_theme";

/** RMS lot details theme: shared shell + data table + RMS-only overlays. */
export const createRawMaterialSourcingDetailsTheme = (
  palette: Record<string, any>,
  amberChipSx: Record<string, unknown>,
  mode: string = "light",
) => {
  const isDark = mode === "dark";
  const base = createWorkflowDetailsTheme(palette, mode);
  const dataTable = createDataTableTheme(palette, { mode });
  const attachment = getDocumentAttachmentListTheme({
    primaryLight: palette.primaryLight ?? "#2E86C1",
    border: palette.border ?? "#D5D8DC",
    text: palette.text ?? "#1C2833",
    textSub: palette.textSub ?? "#5D6D7E",
    surface: palette.surface,
    pageBg: palette.pageBg,
  });
  const passColor = palette.success ?? palette.accent ?? "#66bb6a";
  const failColor = palette.danger ?? "#ef5350";
  // Result values: light accent reads well on dark; deep primary on light.
  const resultColor = isDark ? (palette.primaryLight ?? "#64b5f6") : (palette.primary ?? "#1B4F72");

  return {
    ...base,
    ...dataTable,
    tableHeaderCell: dataTable.tableHeaderCell(),
    tableRow: (idx: number, failed?: boolean) => ({
      ...dataTable.tableRow(idx),
      ...(failed
        ? {
            background: alpha(failColor, isDark ? 0.12 : 0.06),
            boxShadow: `inset 3px 0 0 ${failColor}`,
          }
        : {}),
    }),
    specText: { fontWeight: 600, color: palette.text },
    refChip: {
      height: 22,
      fontSize: "0.65rem",
      fontWeight: 600,
      ...amberChipSx,
    },
    resultText: { fontWeight: 700, color: resultColor },
    failedResult: { fontWeight: 700, color: failColor },
    remarksText: { fontSize: "0.8rem", color: palette.textSub },
    certRow: attachment.row,
    certLink: {
      ...attachment.link,
      ...(isDark ? { color: palette.primaryLight ?? "#64b5f6" } : {}),
    },
    specStatusChip: (failed: boolean) => {
      if (isDark) {
        return failed
          ? {
              height: 22,
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.02em",
              background: "#c62828",
              color: "#fff",
              border: "1px solid #ef9a9a",
              "& .MuiChip-label": { color: "#fff", px: 0.9 },
            }
          : {
              height: 22,
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.02em",
              background: "#69f0ae",
              color: "#053016",
              border: "1px solid #00e676",
              "& .MuiChip-label": { color: "#053016", px: 0.9 },
            };
      }
      const color = failed ? failColor : passColor;
      return {
        height: 22,
        fontSize: "0.65rem",
        fontWeight: 800,
        letterSpacing: "0.02em",
        background: alpha(color, 0.14),
        color,
        border: `1px solid ${alpha(color, 0.4)}`,
      };
    },
  };
};
