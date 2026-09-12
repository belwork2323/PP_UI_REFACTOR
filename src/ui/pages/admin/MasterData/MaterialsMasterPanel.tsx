import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
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
import useMaterialsMasterHook from "@hooks/admin/MasterData/useMaterialsMasterHook";
import {
  getRawMaterialCategoryLabel,
  type MaterialsMasterListPayload,
  type MaterialsMasterRecord,
} from "@data/models/admin/MasterData/MaterialsMasterModel";
import MaterialsMasterFormDialog from "./MaterialsMasterFormDialog";
import MaterialsMasterViewDialog from "./MaterialsMasterViewDialog";
import MasterDataTableToolbar from "./components/MasterDataTableToolbar";
import MasterDataActiveSwitch from "./components/MasterDataActiveSwitch";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import {
  MASTER_DATA_AUDIT_COLUMN_COUNT,
  MasterDataAuditHeaderCells,
  MasterDataAuditRowCells,
} from "./components/MasterDataAuditColumns";

const S = STRINGS.MASTER_DATA;

const countSpecifications = (row: MaterialsMasterRecord) => {
  const topLevel = row.specifications.length;
  const inGrades = row.grades.reduce((sum, grade) => sum + (grade.specifications?.length ?? 0), 0);
  return topLevel + inGrades;
};

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
  const columnCount = 7 + MASTER_DATA_AUDIT_COLUMN_COUNT;
  const [viewTarget, setViewTarget] = useState<MaterialsMasterRecord | null>(null);

  return (
    <Box>
      <Paper elevation={0} sx={table.paper}>
        <MasterDataTableToolbar
          search={hook.search}
          onSearchChange={hook.setSearch}
          onRefresh={onRefresh}
          refreshDisabled={refreshDisabled || hook.loading}
          searchPlaceholder={S.MATERIALS.SEARCH_PLACEHOLDER}
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
                <TableCell sx={table.headerCell}>Category</TableCell>
                <TableCell sx={table.headerCell}>Grades</TableCell>
                <TableCell sx={table.headerCell}>Specs</TableCell>
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
                        {getRawMaterialCategoryLabel(row.rawMaterialType)}
                      </Typography>
                      {row.rawMaterialType === "ACEM" && row.preparationType ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.preparationType}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell sx={table.cell}>{row.grades.length}</TableCell>
                    <TableCell sx={table.cell}>{countSpecifications(row)}</TableCell>
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
        isEdit={hook.inlineMode === "edit"}
        form={hook.form}
        saving={hook.saving}
        existingCodes={hook.items.map((item) => item.materialCode)}
        onClose={hook.closeInline}
        onSave={() => void hook.saveForm()}
        onChange={hook.setForm}
        t={t}
      />

      <MaterialsMasterViewDialog
        open={viewTarget != null}
        record={viewTarget}
        onClose={() => setViewTarget(null)}
        t={t}
      />

      <MasterDataToggleConfirmDialog
        target={
          hook.toggleTarget
            ? {
                name: hook.toggleTarget.record.materialName || hook.toggleTarget.record.materialCode,
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

export default MaterialsMasterPanel;
