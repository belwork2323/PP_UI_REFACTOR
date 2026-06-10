import React from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Box, Typography, Divider, Chip, Button, Tooltip, IconButton,
} from "@mui/material";

import { icons } from "../../../../../../app/theme/icons";
import { STRINGS } from "../../../../../../app/config/strings";

import UserActions from "../../../../../components/common/UserActions";
import SkeletonRow from "../../../../../components/common/SkeletonRow";

import {
  stageConfig,
  statusConfig,
  priorityConfig,
  getBatchId,
  getMotorId,
  getMotorStage,
  getStage,
  getStatus,
  getPriority,
  getSubDept,
  getSystemManagerLabel,
  isIdentificationSheetDraft,
  isIdentificationSheetCompleted,
} from "./BatchConfigs";

const S = STRINGS.BATCH_MANAGEMENT;
const TA = S.TABLE_ACTIONS;

const BatchListTable = ({
  paginated,
  filtered,
  loading,
  departments,
  page,
  totalCount,
  rowsPerPage,
  t,
  onEdit,
  onDelete,
  onCompleteImplementation,
  onViewImplementation,
  onPageChange,
  onRowsPerPageChange,
}: any) => {
  const { table, tableCell } = t;

  return (
    <Paper elevation={0} sx={table.paper}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {S.TABLE_COLS.map((h: string) => (
                <TableCell
                  key={h}
                  sx={{
                    ...table.headerCell,
                    ...(h === "Actions" && table.headerCellActions),
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <SkeletonRow key={i} columns={S.TABLE_COLS.length} sx={table.cell} />
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={S.TABLE_COLS.length} sx={table.emptyCell}>
                  <icons.batchMgmt.emptyBatch sx={table.emptyIcon} />
                  <Typography sx={table.emptyText}>No batches found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((batch: any) => {
                const batchId    = getBatchId(batch);
                const motorId    = getMotorId(batch);
                const motorStage = getMotorStage(batch);
                const stage      = getStage(batch);
                const status     = getStatus(batch);
                const priority   = getPriority(batch);
                const subDept    = getSubDept(batch);
                const systemMgrLabel = getSystemManagerLabel(batch);
                const scStage    = stageConfig[stage];
                const scStatus   = statusConfig[status];
                const pc         = priorityConfig[priority];
                const sheetDraft = isIdentificationSheetDraft(batch);
                const sheetCompleted = isIdentificationSheetCompleted(batch);

                return (
                  <TableRow key={batch.id || batch.batchId} sx={table.row}>

                    {/* Batch ID */}
                    <TableCell sx={table.cell}>
                      <Box sx={tableCell.batchIdBox}>
                        <icons.batchMgmt.batchId sx={tableCell.batchIdIcon} />
                        <Typography sx={tableCell.batchIdText}>{batchId}</Typography>
                      </Box>
                    </TableCell>

                    {/* Motor ID(s) */}
                    <TableCell sx={table.cell}>
                      <Box sx={tableCell.motorIdBox}>
                        <icons.batchMgmt.motorId sx={tableCell.motorIdIcon} />
                        <Typography sx={tableCell.motorIdText}>{motorId}</Typography>
                      </Box>
                    </TableCell>

                    {/* Motor Stage */}
                    <TableCell sx={table.cell}>
                      <Box sx={tableCell.motorIdBox}>
                        <icons.batchMgmt.motorId sx={tableCell.motorIdIcon} />
                        <Typography sx={tableCell.motorIdText}>{motorStage}</Typography>
                      </Box>
                    </TableCell>

                    {/* Stage (shows sub-dept chip) */}
                    <TableCell sx={table.cell}>
                      <Chip
                        icon={scStage ? <scStage.Icon /> : undefined}
                        label={subDept}
                        size="small"
                        sx={tableCell.stageChip(scStage)}
                      />
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={table.cell}>
                      <Chip
                        icon={scStatus ? <scStatus.Icon /> : undefined}
                        label={status}
                        size="small"
                        sx={tableCell.statusChip(scStatus)}
                      />
                    </TableCell>

                    {/* Priority */}
                    <TableCell sx={table.cell}>
                      <Chip
                        label={priority}
                        size="small"
                        sx={tableCell.priorityChip(pc)}
                      />
                    </TableCell>

                    {/* System Manager */}
                    <TableCell sx={table.cell}>
                      <Typography sx={tableCell.motorIdText}>{systemMgrLabel}</Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={table.cellActionsWrapper}>
                      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {sheetDraft && onCompleteImplementation && (
                          <Tooltip title={TA.COMPLETE_IMPLEMENTATION_TOOLTIP}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => onCompleteImplementation(batch)}
                              sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                            >
                              {TA.COMPLETE_IMPLEMENTATION}
                            </Button>
                          </Tooltip>
                        )}
                        {sheetCompleted && onViewImplementation && (
                          <Tooltip title={TA.VIEW_DETAILS_TOOLTIP}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => onViewImplementation(batch)}
                              sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}
                            >
                              {TA.VIEW_DETAILS}
                            </Button>
                          </Tooltip>
                        )}
                        {sheetCompleted && (
                          <UserActions
                            onEdit={() => onEdit(batch)}
                            onDelete={() => onDelete(batch)}
                          />
                        )}
                        {sheetDraft && (
                          <Tooltip title={TA.DELETE_BATCH}>
                            <IconButton size="small" onClick={() => onDelete(batch)} color="error">
                              <icons.Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={table.divider} />
      <TablePagination
        component="div"
        count={totalCount ?? (filtered?.length ?? 0)}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 8, 15, 25]}
        sx={table.pagination}
      />
    </Paper>
  );
};

export default BatchListTable;