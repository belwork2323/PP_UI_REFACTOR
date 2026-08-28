import type { ReactNode } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Divider,
} from "@mui/material";
import SkeletonRow from "@ui/components/common/SkeletonRow";

export type AdminManagementColumn<T> = {
  id: string;
  label: string;
  align?: "left" | "right";
  isActions?: boolean;
  headerSx?: object;
  cellSx?: object;
  render: (row: T) => ReactNode;
};

export type AdminManagementTableTheme = {
  paper?: object;
  tableRoot?: object;
  headerRow?: object;
  headerCell?: object;
  headerCellActions?: object;
  row?: object;
  cell?: object;
  cellActionsWrapper?: object;
  emptyCell?: object;
  emptyIcon?: object;
  emptyText?: object;
  divider?: object;
  pagination?: object;
};

export type AdminManagementDataTableProps<T> = {
  columns: AdminManagementColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: unknown, page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  emptyState: { icon: ReactNode; message: string };
  theme: { table: AdminManagementTableTheme };
  rowsPerPageOptions?: number[];
};

const AdminManagementDataTable = <T,>({
  columns,
  rows,
  rowKey,
  loading,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  emptyState,
  theme,
  rowsPerPageOptions = [5, 8, 15, 25],
}: AdminManagementDataTableProps<T>) => {
  const table = theme.table;

  return (
    <Paper elevation={0} sx={table.paper}>
      <TableContainer>
        <Table size="small" sx={{ ...(table.tableRoot ?? {}), borderSpacing: 0 }}>
          <TableHead>
            <TableRow sx={table.headerRow}>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  sx={{
                    ...table.headerCell,
                    ...(col.isActions && table.headerCellActions),
                    ...col.headerSx,
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <SkeletonRow key={i} columns={columns.length} sx={table.cell} />
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={table.emptyCell}>
                  {emptyState.icon}
                  <Typography sx={table.emptyText}>{emptyState.message}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)} sx={table.row}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      sx={{
                        ...(col.isActions ? table.cellActionsWrapper : table.cell),
                        ...col.cellSx,
                      }}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={table.divider} />
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={rowsPerPageOptions}
        sx={table.pagination}
      />
    </Paper>
  );
};

export default AdminManagementDataTable;
