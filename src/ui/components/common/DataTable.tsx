import type { Key, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  type SxProps,
  type Theme,
} from "@mui/material";

type SxObject = Record<string, unknown>;

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  /** Merged over the table-level `headerCellSx`; receives the column index. */
  headerSx?: SxObject | ((columnIndex: number) => SxObject);
  /** Merged over the table-level `bodyCellSx`. */
  cellSx?: SxObject | ((row: T, index: number) => SxObject);
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => Key;
  size?: "small" | "medium";
  containerSx?: SxProps<Theme>;
  headerCellSx?: SxObject | ((columnIndex: number) => SxObject);
  bodyCellSx?: SxObject;
  rowSx?: (row: T, index: number) => SxProps<Theme>;
};

const resolve = <A extends unknown[]>(
  value: SxObject | ((...args: A) => SxObject) | undefined,
  ...args: A
): SxObject | undefined => (typeof value === "function" ? value(...args) : value);

/** Column-driven read-only table; layout only, all styling comes from the caller's theme. */
function DataTable<T>({
  columns,
  rows,
  getRowKey,
  size = "medium",
  containerSx,
  headerCellSx,
  bodyCellSx,
  rowSx,
}: DataTableProps<T>) {
  return (
    <TableContainer sx={containerSx}>
      <Table size={size}>
        <TableHead>
          <TableRow>
            {columns.map((column, columnIndex) => (
              <TableCell
                key={column.key}
                sx={{
                  ...resolve(headerCellSx, columnIndex),
                  ...resolve(column.headerSx, columnIndex),
                }}
              >
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={getRowKey(row, index)} sx={rowSx?.(row, index)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  sx={{ ...bodyCellSx, ...resolve(column.cellSx, row, index) }}
                >
                  {column.render(row, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DataTable;
