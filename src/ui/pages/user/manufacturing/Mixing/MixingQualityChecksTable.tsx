import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { createDataTableTheme } from "../../../../../app/theme/custom_themes/shared/data_table_theme";
import type { QualityCheckRow } from "../../../../../data/models/user/MixingFormModel";
import { MixingTableInput } from "./MixingFormFields";

const S = STRINGS.MANUFACTURING.MIXING;
const BRAND = MIXING_BRAND;
const dt = createDataTableTheme({ ...MIXING_BRAND });
const observedGroupBorder = `2px solid ${alpha(BRAND.mx, 0.22)}`;
const OBSERVED_FIELDS = ["observed1", "observed2", "observed3", "observed4"] as const;

type QualityCheckObservedField = (typeof OBSERVED_FIELDS)[number];

type MixingQualityChecksTableProps = {
  rows: QualityCheckRow[];
  readOnly?: boolean;
  onChange?: (parameterId: string, field: QualityCheckObservedField, value: string) => void;
};

const resolveRowSampleCount = (row: QualityCheckRow): number => {
  const parsed = Number(row.sampleCount);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.max(1, Math.min(4, Math.floor(parsed)));
  }
  return row.observedLayout === "quad" ? 4 : 1;
};

const displayValue = (value: string | undefined, emptyFallback = "—") => {
  const trimmed = String(value ?? "").trim();
  return trimmed || emptyFallback;
};

const MixingQualityChecksTable = ({
  rows,
  readOnly = false,
  onChange,
}: MixingQualityChecksTableProps) => {
  const columnCount = Math.max(1, ...rows.map(resolveRowSampleCount), 1);
  const observedFields = OBSERVED_FIELDS.slice(0, columnCount);

  return (
    <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 720, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "16%" }} />
          {observedFields.map((field) => (
            <col key={field} style={{ width: `${62 / columnCount}%` }} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell
              rowSpan={columnCount > 1 ? 2 : 1}
              sx={{ ...dt.tableHeaderCell(true), minWidth: 140 }}
            >
              {S.COL_PARAMETER}
            </TableCell>
            <TableCell
              rowSpan={columnCount > 1 ? 2 : 1}
              sx={{ ...dt.tableHeaderCell(false), minWidth: 120 }}
            >
              {S.COL_SPECIFICATION}
            </TableCell>
            <TableCell
              colSpan={columnCount}
              align="center"
              sx={{
                ...dt.tableHeaderCell(false),
                borderLeft: observedGroupBorder,
              }}
            >
              {S.COL_OBSERVED_VALUES}
            </TableCell>
          </TableRow>
          {columnCount > 1 ? (
            <TableRow>
              {observedFields.map((field, index) => (
                <TableCell
                  key={field}
                  align="center"
                  sx={{
                    ...dt.tableHeaderCell(false),
                    borderLeft:
                      index === 0 ? observedGroupBorder : `1px solid ${alpha("#fff", 0.32)}`,
                    fontSize: "0.65rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  {index + 1}
                </TableCell>
              ))}
            </TableRow>
          ) : null}
        </TableHead>
        <TableBody>
          {rows.map((row, rowIdx) => {
            const rowObservedFieldCount = resolveRowSampleCount(row);

            return (
              <TableRow
                key={row.parameterId || `${row.parameter}-${rowIdx}`}
                sx={dt.tableRow(rowIdx)}
              >
                <TableCell sx={{ ...dt.tableCell, fontWeight: 700 }}>
                  {row.parameter}
                </TableCell>
                <TableCell sx={dt.tableCell}>
                  {displayValue(row.specification, S.PLACEHOLDER_SPEC_NA)}
                </TableCell>
                {observedFields.map((field, index) => {
                  const shouldRenderValue = index < rowObservedFieldCount;

                  return (
                    <TableCell
                      key={field}
                      sx={{
                        ...dt.tableCell,
                        borderLeft:
                          index === 0
                            ? observedGroupBorder
                            : `1px solid ${alpha(BRAND.border, 0.45)}`,
                      }}
                    >
                      {shouldRenderValue ? (
                        readOnly ? (
                          displayValue(row[field])
                        ) : (
                          <MixingTableInput
                            value={row[field]}
                            placeholder={S.PLACEHOLDER_OBSERVED_VALUE}
                            onChange={(value) => onChange?.(row.parameterId, field, value)}
                          />
                        )
                      ) : null}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MixingQualityChecksTable;
