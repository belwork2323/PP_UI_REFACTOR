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
import useInsulationSpecMasterHook from "@hooks/admin/MasterData/useInsulationSpecMasterHook";
import type {
  InsulationSpecListPayload,
  InsulationSpecRecord,
} from "@data/models/admin/MasterData/InsulationSpecMasterModel";
import InsulationSpecMasterFormDialog from "./InsulationSpecMasterFormDialog";
import InsulationSpecViewDialog from "./InsulationSpecViewDialog";
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
  const [viewTarget, setViewTarget] = useState<InsulationSpecRecord | null>(null);

  const formatCategoryNames = (row: InsulationSpecRecord) => {
    const names = row.specifications.map((c) => c.category.trim()).filter(Boolean);
    return names.length > 0 ? names.join(", ") : "—";
  };

  return (
    <Box>
      <Paper elevation={0} sx={table.paper}>
        <MasterDataTableToolbar
          search={hook.search}
          onSearchChange={hook.setSearch}
          onRefresh={onRefresh}
          refreshDisabled={refreshDisabled || hook.loading}
          searchPlaceholder={S.INSULATION_SPEC.SEARCH_PLACEHOLDER}
          t={t}
        />
        <Divider sx={table.divider} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={table.headerRow}>
                <TableCell sx={table.headerCell}>{S.INSULATION_SPEC.COL_INSULATION_TYPE}</TableCell>
                <TableCell sx={table.headerCell}>Categories</TableCell>
                <TableCell sx={table.headerCell}>Parameters</TableCell>
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
                  const paramCount = row.specifications.reduce(
                    (n, c) => n + (c.parameters?.length ?? 0),
                    0,
                  );
                  return (
                    <TableRow key={row.insulationSpecId || row.insulationType} sx={table.row}>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{row.insulationType}</Typography>
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Tooltip title={formatCategoryNames(row)} placement="top-start">
                          <Typography sx={table.bodyText} noWrap>
                            {formatCategoryNames(row)}
                          </Typography>
                        </Tooltip>
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

      <InsulationSpecMasterFormDialog
        open={formOpen}
        isEdit={hook.inlineMode === "edit"}
        form={hook.form}
        saving={hook.saving}
        existingTypes={hook.items.map((item) => item.insulationType)}
        onClose={hook.closeInline}
        onSave={() => void hook.saveForm()}
        onChange={hook.setForm}
        t={t}
      />

      <InsulationSpecViewDialog
        open={viewTarget != null}
        record={viewTarget}
        onClose={() => setViewTarget(null)}
        t={t}
      />

      <MasterDataToggleConfirmDialog
        target={
          hook.toggleTarget
            ? {
                name: String(hook.toggleTarget.record.insulationType),
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

export default InsulationSpecMasterPanel;
