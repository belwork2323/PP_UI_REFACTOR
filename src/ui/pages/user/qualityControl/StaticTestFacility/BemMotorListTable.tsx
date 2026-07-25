import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
  alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import fonts from "@/app/theme/fonts";
import { batchStatusConfig } from "@/app/theme/roleConfig";
import { getStatus } from "@/utils/batchManagementUtils";
import getBatchManagementTheme from "@/app/theme/custom_themes/admin/BatchManagement/batchManagement_theme";
import { OPERATION_STATUS } from "@/hooks/operationStatus";
import UserWorkflowStatusAction from "@/ui/components/custom/UserWorkflowStatusAction";
import type { OperationStatusMap } from "@hooks/operationStatus";

const defaultCanViewDetails = (status: string) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

export type BemMotorListTableProps = {
  rows?: any[];
  totalRecords?: number;
  page?: number;
  rowsPerPage?: number;
  search?: string;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onSearchChange?: (search: string) => void;
  renderAction?: (row: any) => React.ReactNode;
  onViewDetails?: (row: any) => void;
  onFillForm?: (row: any) => void;
  onEditForm?: (row: any) => void;
  statusMap?: OperationStatusMap;
  canViewDetails?: (status: string) => boolean;
  actionStrings?: {
    FILL_ACTION?: string;
    CONTINUE_ACTION?: string;
    EDIT_ACTION_TOOLTIP?: string;
    VIEW_DETAILS_TOOLTIP?: string;
  };
  headerAction?: React.ReactNode;
  theme?: any;
};

const BemMotorListTable: React.FC<BemMotorListTableProps> = ({
  rows = [],
  totalRecords = 0,
  page = 0,
  rowsPerPage = 10,
  search = "",
  loading = false,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  renderAction,
  headerAction,
  theme,
}) => {
  const t = theme?.batchList || {};
  const p = theme?.palette || {};
  const batchTheme = getBatchManagementTheme();

  // Define Table Header Styling
  const thSx = {
    background: t.tableHeaderBg || p.primary || "#1976d2",
    color: t.tableHeaderText || "#fff",
    fontWeight: fonts?.weight?.bold ?? 700,
    fontSize: fonts?.size?.xs ?? "0.75rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "11px 14px",
    whiteSpace: "nowrap",
    borderBottom: `2px solid ${t.tableHeaderBorder || "transparent"}`,
  };

  // Define Table Cell Styling
  const tdSx = {
    padding: "10px 14px",
    fontSize: fonts?.size?.sm ?? "0.875rem",
    borderBottom: `1px solid ${alpha(p.border || "#000", 0.15)}`,
    color: p.text || "#000",
    verticalAlign: "middle",
  };

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Search Bar & Header Action Controls */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 0.5 }}
      >
        {/* Search Bar */}
        <TextField
          size="small"
          placeholder="Search by Motor ID, Casing No, Sub Type..."
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              background: p.surface || "#fff",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: p.textSub || "action.active" }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Header Action / Add Button Container */}
        <Box sx={{ flexShrink: 0 }}>{headerAction}</Box>
      </Stack>

      {/* Main Table Paper Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: p.surface || "#fff",
          border: `1.5px solid ${p.border || "#E0E0E0"}`,
          boxShadow: `0 2px 16px ${alpha(p.primary || "#000", 0.07)}`,
        }}
      >
        <TableContainer sx={{ minHeight: 300, position: "relative" }}>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: alpha(p.surface || "#FFF", 0.7),
                zIndex: 2,
              }}
            >
              <CircularProgress size={36} />
            </Box>
          )}

          <Table stickyHeader aria-label="BEM Motor List Table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...thSx, width: 40, textAlign: "center" }}>#</TableCell>
                <TableCell sx={thSx}>Other BEM Motor ID</TableCell>
                <TableCell sx={thSx}>Sub Type</TableCell>
                <TableCell sx={thSx}>STF Test No.</TableCell>
                <TableCell sx={thSx}>Created By</TableCell>
                <TableCell sx={thSx}>Status</TableCell>
                <TableCell align="center" sx={thSx}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary" sx={{ fontSize: fonts?.size?.sm }}>
                      No BEM Motors found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => {
                  const status = getStatus(row);
                  const scStatus = batchStatusConfig[status];

                  return (
                    <TableRow
                      key={row.id || row.motorId || idx}
                      sx={{
                        background:
                          idx % 2 === 0
                            ? t.stripedRowEven || "inherit"
                            : t.stripedRowOdd || alpha(p.primary || "#000", 0.015),
                        "&:hover": {
                          background: alpha(p.primaryLight || p.primary || "#000", 0.05),
                        },
                        "&:last-child td": { borderBottom: "none" },
                        transition: "background 0.15s",
                      }}
                    >
                      <TableCell sx={{ ...tdSx, textAlign: "center" }}>
                        <Typography
                          sx={{
                            fontSize: fonts?.size?.xs,
                            fontWeight: fonts?.weight?.bold,
                            color: p.textSub,
                          }}
                        >
                          {page * rowsPerPage + idx + 1}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...tdSx, fontWeight: fonts?.weight?.bold }}>
                        {row.motorId ?? "—"}
                      </TableCell>
                      <TableCell sx={tdSx}>{row.subType ?? "—"}</TableCell>
                      <TableCell sx={tdSx}>{row.stfTestNo ?? "—"}</TableCell>
                      <TableCell sx={tdSx}>{row.createdBy ?? "—"}</TableCell>
                      <TableCell sx={tdSx}>
                        <Chip
                          icon={scStatus?.Icon ? <scStatus.Icon /> : undefined}
                          label={status.replace(/_/g, " ").toUpperCase()}
                          size="small"
                          sx={batchTheme.tableCell.statusChip(scStatus)}
                        />
                      </TableCell>
                      <TableCell sx={{ ...tdSx, textAlign: "center" }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="center"
                          spacing={0.75}
                        >
                          {renderAction && renderAction(row)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Styled Pagination Controls */}
        <Box
          sx={{
            borderTop: `1px solid ${alpha(p.border || "#000", 0.6)}`,
            background: alpha(p.surface || "#fff", 0.4),
          }}
        >
          <TablePagination
            component="div"
            count={totalRecords}
            page={page}
            onPageChange={(_, newPage) => onPageChange?.(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              color: p.text,
              "& .MuiTablePagination-toolbar": { fontSize: fonts?.size?.xs },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: fonts?.size?.xs,
                color: p.textSub,
              },
              "& .MuiTablePagination-select": { fontSize: fonts?.size?.xs },
              "& .MuiTablePagination-selectIcon": { color: p.textSub },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default BemMotorListTable;
