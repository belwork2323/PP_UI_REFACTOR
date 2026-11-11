import type { ReactNode } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";

export type DetailsFixedColumn = {
  key: string;
  label: string;
  emphasize?: "result" | "spec" | "remarks";
};

export type DetailsFixedColumnsTheme = {
  tableContainer: SxProps<Theme>;
  tableHeaderCell: (isFirst: boolean) => SxProps<Theme>;
  tableRow: (index: number) => SxProps<Theme>;
  tableCell: SxProps<Theme>;
  resultText?: SxProps<Theme>;
  specText?: SxProps<Theme>;
  remarksText?: SxProps<Theme>;
};

export type DetailsFixedColumnsTableProps = {
  title: string;
  rows: Record<string, unknown>[];
  columns: DetailsFixedColumn[];
  theme: DetailsFixedColumnsTheme;
  /** Resolve display value for a cell; defaults to row[key] with srNo fallback. */
  getCellValue?: (
    row: Record<string, unknown>,
    column: DetailsFixedColumn,
    rowIndex: number,
  ) => unknown;
  renderCell: (args: {
    value: unknown;
    row: Record<string, unknown>;
    column: DetailsFixedColumn;
    rowIndex: number;
  }) => ReactNode;
  minWidth?: number;
  overflowX?: boolean;
};

export const defaultDetailsFixedCellValue = (
  row: Record<string, unknown>,
  column: DetailsFixedColumn,
  rowIndex: number,
): unknown => {
  if (column.key === "srNo") {
    const raw = row.srNo ?? row.SR_NO;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    return rowIndex + 1;
  }
  return row[column.key];
};

/**
 * Shared read-only details table with UI-owned column order.
 * Subdepartments supply theme tokens + cell renderer; values come from API rows.
 */
const DetailsFixedColumnsTable = ({
  title,
  rows,
  columns,
  theme: dt,
  getCellValue = defaultDetailsFixedCellValue,
  renderCell,
  minWidth,
  overflowX = false,
}: DetailsFixedColumnsTableProps) => {
  if (!rows.length || !columns.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
        {title}
      </Typography>
      <TableContainer
        sx={{
          ...dt.tableContainer,
          ...(overflowX ? { overflowX: "auto" } : {}),
        }}
      >
        <Table
          size="small"
          sx={minWidth != null ? { minWidth } : undefined}
        >
          <TableHead>
            <TableRow>
              {columns.map((column, columnIndex) => (
                <TableCell key={column.key} sx={dt.tableHeaderCell(columnIndex === 0)}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                {columns.map((column) => {
                  const value = getCellValue(row, column, rowIndex);
                  return (
                    <TableCell
                      key={column.key}
                      sx={{
                        ...dt.tableCell,
                        ...(column.emphasize === "result" ? (dt.resultText ?? {}) : {}),
                        ...(column.emphasize === "spec" ? (dt.specText ?? {}) : {}),
                        ...(column.emphasize === "remarks" ? (dt.remarksText ?? {}) : {}),
                      }}
                    >
                      {renderCell({ value, row, column, rowIndex })}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DetailsFixedColumnsTable;
