import React, { useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import MasterDataToggleConfirmDialog from "./components/MasterDataToggleConfirmDialog";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import useMixingCycleMasterHook from "@hooks/admin/MasterData/useMixingCycleMasterHook";
import useMotorStageOptions from "@hooks/admin/MasterData/useMotorStageOptions";
import {
  formatMotorStageLabel,
  type MixingCycleListPayload,
  type MixingCycleRecord,
} from "@data/models/admin/MasterData/MixingCycleMasterModel";
import MixingCycleMasterFormDialog from "./MixingCycleMasterFormDialog";
import MixingCycleMasterViewDialog from "./MixingCycleMasterViewDialog";
import MixingCycleMasterTableToolbar from "./components/MixingCycleMasterTableToolbar";
import MasterDataActiveSwitch from "./components/MasterDataActiveSwitch";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import {
  MASTER_DATA_AUDIT_COLUMN_COUNT,
  MasterDataAuditHeaderCells,
  MasterDataAuditRowCells,
} from "./components/MasterDataAuditColumns";

const S = STRINGS.MASTER_DATA;

type Props = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  addButtonLabel: string;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  t: any;
  onListPayloadChange?: (payload: MixingCycleListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

const MixingCycleMasterPanel = ({
  activeFilter,
  refreshKey,
  addButtonLabel,
  onRefresh,
  refreshDisabled = false,
  t,
  onListPayloadChange,
  onStatsChange,
}: Props) => {
  const { options: motorStageOptions, loading: motorStageLoading } = useMotorStageOptions(true);
  const hook = useMixingCycleMasterHook({
    activeFilter,
    refreshKey,
    onListPayloadChange,
    onStatsChange,
  });
  const { table, tableCell } = t;
  const formOpen = hook.inlineMode != null;
  const columnCount = 4 + MASTER_DATA_AUDIT_COLUMN_COUNT + 2;
  const [viewTarget, setViewTarget] = useState<MixingCycleRecord | null>(null);

  return (
    <Box>
      <Paper elevation={0} sx={table.paper}>
        <MixingCycleMasterTableToolbar
          search={hook.search}
          onSearchChange={hook.setSearch}
          motorStageFilter={hook.motorStageFilter}
          onMotorStageFilterChange={hook.setMotorStageFilter}
          motorStageOptions={motorStageOptions}
          motorStageLoading={motorStageLoading}
          onRefresh={onRefresh}
          refreshDisabled={refreshDisabled || hook.loading}
          t={t}
        />
        <Divider sx={table.divider} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={table.headerRow}>
                <TableCell sx={table.headerCell}>{S.MIXING_CYCLES.COL_NAME}</TableCell>
                <TableCell sx={table.headerCell}>{S.MIXING_CYCLES.COL_MOTOR_STAGE}</TableCell>
                <TableCell sx={table.headerCell}>{S.MIXING_CYCLES.COL_OPERATIONS}</TableCell>
                <MasterDataAuditHeaderCells table={table} />
                <TableCell sx={table.headerCell}>{S.TABLE.COL_ACTIVE}</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hook.loading ? (
                <SkeletonRow columns={columnCount} />
              ) : hook.paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} sx={table.emptyCell}>
                    <icons.Inventory sx={table.emptyIcon} />
                    <Typography sx={table.emptyText}>{S.TABLE.EMPTY}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hook.paginated.map((row) => {
                  const opCount =
                    (row.cycles.premixOperations?.length ?? 0) + (row.cycles.finalMixOperations?.length ?? 0);
                  return (
                    <TableRow key={row.id} sx={table.row}>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{row.mixingCycleName}</Typography>
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>
                          {formatMotorStageLabel(row.motorStage, motorStageOptions)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{opCount}</Typography>
                      </TableCell>
                      <MasterDataAuditRowCells record={row} table={table} />
                      <TableCell sx={table.cell}>
                        <MasterDataActiveStatusChip isActive={row.isActive} />
                      </TableCell>
                      <TableCell sx={table.cellActionsWrapper}>
                        <Box sx={tableCell.actionsBox}>
                          <Tooltip title={S.TABLE.VIEW}>
                            <IconButton
                              size="small"
                              onClick={() => setViewTarget(row)}
                              disabled={hook.saving || formOpen || hook.disabling || hook.enabling}
                              aria-label={S.TABLE.VIEW}
                            >
                              <icons.visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={S.TABLE.EDIT}>
                            <IconButton
                              size="small"
                              onClick={() => hook.openEdit(row)}
                              disabled={hook.saving || formOpen || hook.disabling || hook.enabling}
                              aria-label={S.TABLE.EDIT}
                            >
                              <icons.Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <MasterDataActiveSwitch
                            isActive={row.isActive}
                            disabled={hook.saving || formOpen || hook.disabling || hook.enabling}
                            onToggle={(nextActive) => hook.handleToggleActive(row, nextActive)}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={hook.items.length}
          page={hook.page}
          onPageChange={(_e, p) => hook.setPage(p)}
          rowsPerPage={hook.rowsPerPage}
          onRowsPerPageChange={(e) => hook.setRowsPerPage(Number(e.target.value))}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      <Box sx={t.addRowBar}>
        <Button
          variant="contained"
          startIcon={<icons.projectMgmt.add />}
          onClick={hook.openCreate}
          disabled={hook.loading || formOpen}
          sx={t.pageHeader.newProjectButton}
        >
          {addButtonLabel}
        </Button>
      </Box>

      <MixingCycleMasterFormDialog
        open={formOpen}
        isEdit={hook.inlineMode === "edit"}
        form={hook.form}
        saving={hook.saving}
        motorStageOptions={motorStageOptions}
        motorStageLoading={motorStageLoading}
        onClose={hook.closeInline}
        onSave={() => void hook.saveForm()}
        onChange={hook.setForm}
        t={t}
      />

      <MixingCycleMasterViewDialog
        open={viewTarget != null}
        record={viewTarget}
        motorStageOptions={motorStageOptions}
        onClose={() => setViewTarget(null)}
        t={t}
      />

      <MasterDataToggleConfirmDialog
        target={
          hook.toggleTarget
            ? {
                name:
                  hook.toggleTarget.record.mixingCycleName || hook.toggleTarget.record.mixingCycleCode,
                nextActive: hook.toggleTarget.nextActive,
              }
            : null
        }
        busy={hook.disabling || hook.enabling}
        onConfirm={() => void hook.confirmToggle()}
        onCancel={hook.cancelToggle}
      />
    </Box>
  );
};

export default MixingCycleMasterPanel;
