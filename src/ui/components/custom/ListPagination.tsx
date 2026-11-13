import { alpha, Box, TablePagination } from "@mui/material";

import fonts from "../../../app/theme/fonts";

type ListPaginationProps = {
  count: number;
  page: number;
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  palette: { border?: string; surface?: string; text?: string; textSub?: string };
};

const ListPagination = ({
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions,
  onPageChange,
  onRowsPerPageChange,
  palette: p,
}: ListPaginationProps) => (
  <Box
    sx={{
      borderTop: `1px solid ${alpha(p.border || "#000", 0.6)}`,
      background: alpha(p.surface || "#fff", 0.4),
    }}
  >
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={(_, nextPage) => onPageChange(nextPage)}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
      rowsPerPageOptions={rowsPerPageOptions}
      sx={{
        color: p.text,
        "& .MuiTablePagination-toolbar": { fontSize: fonts.size.xs },
        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
          fontSize: fonts.size.xs,
          color: p.textSub,
        },
        "& .MuiTablePagination-select": { fontSize: fonts.size.xs },
        "& .MuiTablePagination-selectIcon": { color: p.textSub },
      }}
    />
  </Box>
);

export default ListPagination;
