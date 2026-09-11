import React from "react";
import {
  Box,
  Button,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import useInsulationSpecMasterHook from "@hooks/admin/MasterData/useInsulationSpecMasterHook";
import type { InsulationSpecListPayload } from "@data/models/admin/MasterData/InsulationSpecMasterModel";
import InsulationSpecMasterFormDialog from "./InsulationSpecMasterFormDialog";
import MasterDataTableToolbar from "./components/MasterDataTableToolbar";
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
  onListPayloadChange?: (payload: InsulationSpecListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

const InsulationSpecMasterPanel = ({
  activeFilter,
  refreshKey,
  addButtonLabel,
  onRefresh,
  refreshDisabled = false,
  t,
  onListPayloadChange,
  onStatsChange,
}: Props) => {
  const hook = useInsulationSpecMasterHook({
    activeFilter,
    refreshKey,
    onListPayloadChange,
    onStatsChange,
  });
  const { table, tableCell } = t;
  const formOpen = hook.inlineMode != null;
  const columnCount = 5 + MASTER_DATA_AUDIT_COLUMN_COUNT;

  return (
    <Box>
      <Paper elevation={0} sx={table.paper}>
        <MasterDataTableToolbar
          search={hook.search}
          onSearchChange={hook.setSearch}
          onRefresh={onRefresh}
          refreshDisabled={refreshDisabled || hook.loading}
          t={t}
        />
        <Divider sx={table.divider} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={table.headerRow}>
                <TableCell sx={table.headerCell}>Type</TableCell>
                <TableCell sx={table.headerCell}>Categories</TableCell>
                <TableCell sx={table.headerCell}>Parameters</TableCell>
                <MasterDataAuditHeaderCells table={table} />
                <TableCell sx={table.headerCell}>Active</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>{S.TABLE.COL_ACTIONS}</TableCell>
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
                  const paramCount = row.specifications.reduce(
                    (n, c) => n + (c.parameters?.length ?? 0),
                    0,
                  );
                  return (
                    <TableRow key={row.id} sx={table.row}>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{row.insulationType}</Typography>
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{row.specifications.length}</Typography>
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{paramCount}</Typography>
                      </TableCell>
                      <MasterDataAuditRowCells record={row} table={table} />
                      <TableCell sx={table.cell}>
                        <MasterDataActiveStatusChip isActive={row.isActive} />
                      </TableCell>
                      <TableCell sx={table.cellActionsWrapper}>
                        <Box sx={tableCell.actionsBox}>
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

      <InsulationSpecMasterFormDialog
        open={formOpen}
        isEdit={false}
        form={hook.form}
        saving={hook.saving}
        onClose={hook.closeInline}
        onSave={() => void hook.saveForm()}
        onChange={hook.setForm}
        t={t}
      />

      <ConfirmAlertDialog
        open={!!hook.disableTarget}
        title={S.DISABLE_DIALOG.TITLE}
        message={
          hook.disableTarget
            ? S.DISABLE_DIALOG.BODY(String(hook.disableTarget.insulationType))
            : ""
        }
        confirmLabel={hook.disabling ? S.DISABLE_DIALOG.DISABLING : S.DISABLE_DIALOG.CONFIRM}
        cancelLabel={S.DISABLE_DIALOG.CANCEL}
        onConfirm={hook.confirmDisable}
        onCancel={() => !hook.disabling && hook.setDisableTarget(null)}
        confirmDisabled={hook.disabling}
      />
    </Box>
  );
};

export default InsulationSpecMasterPanel;
