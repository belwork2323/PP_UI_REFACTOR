import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SchemaSectionSubmission } from "../../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "../../../../../../app/theme/custom_themes/shared/data_table_theme";
import {
  collectPrepSectionNestedTableRows,
  expandRawMaterialPrepSectionRows,
  extractPrepSectionNestedTableKeys,
  formatPrepSectionCellValue,
  formatPrepSectionLabel,
  orderPrepSectionColumns,
} from "../../../../../../data/models/user/RawMaterialPreparationModel";

const BRAND = QC_DIVISION_BRAND;

const headerCellSx = uniformTableHeaderCellSx(BRAND.primary, BRAND.primaryLight, {
  headerFontSize: "0.65rem",
  headerLetterSpacing: "0.02em",
  headerPaddingY: 0.55,
  headerPaddingX: 1,
});

const bodyCellSx = {
  ...uniformTableBodyCellSx(
    { border: BRAND.border, text: BRAND.text },
    {
      bodyFontSize: "0.72rem",
      bodyPaddingY: 0.55,
      bodyPaddingX: 1,
    },
  ),
  fontWeight: 600,
  verticalAlign: "top" as const,
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-word" as const,
};

const collectColumns = (tableRows: Record<string, unknown>[], skipKeys?: Set<string>) =>
  orderPrepSectionColumns(
    Array.from(
      tableRows.reduce((keys, row) => {
        Object.keys(row ?? {}).forEach((key) => {
          if (key.startsWith("_")) return;
          if (skipKeys?.has(key)) return;
          keys.add(key);
        });
        return keys;
      }, new Set<string>()),
    ),
  );

const SectionDataTable = ({
  rows,
  columns,
}: {
  rows: Record<string, unknown>[];
  columns: string[];
}) => {
  if (!rows.length || !columns.length) return null;

  return (
    <TableContainer
      sx={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: 1,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={column} sx={headerCellSx}>
                {formatPrepSectionLabel(column)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{
                background: rowIndex % 2 === 0 ? "#fff" : alpha(BRAND.primaryLight, 0.03),
              }}
            >
              {columns.map((column) => (
                <TableCell key={column} sx={bodyCellSx}>
                  {formatPrepSectionCellValue(row?.[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type QCDivisionSavedSectionsDisplayProps = {
  sections: SchemaSectionSubmission[];
};

/**
 * Compact tabular read-only view for QC saved sections (same shape as RMP process sections).
 * Each section becomes one table: columns = field keys, rows = sectionData entries.
 */
const QCDivisionSavedSectionsDisplay = ({ sections }: QCDivisionSavedSectionsDisplayProps) => {
  if (!sections.length) return null;

  return (
    <Stack spacing={1.5}>
      {sections.map((section, sectionIndex) => {
        const rows = expandRawMaterialPrepSectionRows(
          (section.sectionData ?? []) as Record<string, unknown>[],
        );
        if (!rows.length) return null;

        const nestedTableKeys = extractPrepSectionNestedTableKeys(rows);
        const nestedKeySet = new Set(nestedTableKeys);
        const mainColumns = collectColumns(rows, nestedKeySet);

        return (
          <Box key={`${section.sectionId}-${sectionIndex}`}>
            <Box
              sx={{
                px: 1.25,
                py: 0.75,
                mb: 0.75,
                background: alpha(BRAND.primary, 0.06),
                borderRadius: 1,
                borderLeft: `3px solid ${BRAND.primary}`,
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "0.76rem", color: BRAND.primary }}>
                {formatPrepSectionLabel(section.sectionId)}
              </Typography>
            </Box>

            <SectionDataTable rows={rows} columns={mainColumns} />

            {nestedTableKeys.map((nestedKey) => {
              const nestedRows = collectPrepSectionNestedTableRows(rows, nestedKey);
              const nestedColumns = collectColumns(nestedRows);
              if (!nestedRows.length || !nestedColumns.length) return null;

              return (
                <Box key={nestedKey} sx={{ mt: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: BRAND.textSub,
                      mb: 0.5,
                    }}
                  >
                    {formatPrepSectionLabel(nestedKey)}
                  </Typography>
                  <SectionDataTable rows={nestedRows} columns={nestedColumns} />
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Stack>
  );
};

export default QCDivisionSavedSectionsDisplay;
