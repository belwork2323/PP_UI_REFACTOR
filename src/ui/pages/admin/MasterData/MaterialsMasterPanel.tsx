import React from "react";
import {
  Box,
  Button,
  Chip,
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
import useMaterialsMasterHook from "@hooks/admin/MasterData/useMaterialsMasterHook";
import type { MaterialsMasterListPayload } from "@data/models/admin/MasterData/MaterialsMasterModel";
import MaterialsMasterFormDialog from "./MaterialsMasterFormDialog";
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
  onListPayloadChange?: (payload: MaterialsMasterListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

const MaterialsMasterPanel = ({
  activeFilter,
  refreshKey,
  addButtonLabel,
  onRefresh,
  refreshDisabled = false,
  t,
  onListPayloadChange,
  onStatsChange,
}: Props) => {
  const hook = useMaterialsMasterHook({
    activeFilter,
    refreshKey,
    onListPayloadChange,
    onStatsChange,
  });
  const { table, tableCell } = t;
  const formOpen = hook.inlineMode != null;
  const columnCount = 8 + MASTER_DATA_AUDIT_COLUMN_COUNT;

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
                <TableCell sx={table.headerCell}>Code</TableCell>
                <TableCell sx={table.headerCell}>Name</TableCell>
                <TableCell sx={table.headerCell}>Type</TableCell>
                <TableCell sx={table.headerCell}>Raw type</TableCell>
                <TableCell sx={table.headerCell}>Grades</TableCell>
                <TableCell sx={table.headerCell}>Specs</TableCell>
                <MasterDataAuditHeaderCells table={table} />
                <TableCell sx={table.headerCell}>{S.TABLE.COL_ACTIVE}</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>{S.TABLE.COL_ACTIONS}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hook.loading ? (
                <SkeletonRow columns={columnCount} />
              ) : hook.paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Typography sx={table.emptyText}>{S.TABLE.EMPTY}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hook.paginated.map((row) => (
                  <TableRow key={row.materialId} sx={table.row}>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.materialCode}</Typography>
                    </TableCell>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.materialName}</Typography>
                    </TableCell>
                    <TableCell sx={table.cell}>
                      <Chip size="small" label={row.materialType} variant="outlined" />
                    </TableCell>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>
                        {row.rawMaterialType === "ACEM" ? "ACEM" : "Normal"}
                      </Typography>
                      {row.rawMaterialType === "ACEM" && row.preparationType ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.preparationType}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell sx={table.cell}>{row.grades.length}</TableCell>
                    <TableCell sx={table.cell}>{row.specifications.length}</TableCell>
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
                ))
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

      <MaterialsMasterFormDialog
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
            ? S.DISABLE_DIALOG.BODY(hook.disableTarget.materialName || hook.disableTarget.materialCode)
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

export default MaterialsMasterPanel;
