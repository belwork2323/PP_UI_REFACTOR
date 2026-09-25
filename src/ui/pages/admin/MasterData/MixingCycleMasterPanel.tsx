import React, { useMemo, useState } from "react";
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
import { useThemeStore } from "@app/store/themeStore";
import getBatchManagementTheme from "@app/theme/custom_themes/admin/BatchManagement/batchManagement_theme";
import MasterDataToggleConfirmDialog from "./components/MasterDataToggleConfirmDialog";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import useMixingCycleMasterHook from "@hooks/admin/MasterData/useMixingCycleMasterHook";
import useMotorStageOptions from "@hooks/admin/MasterData/useMotorStageOptions";
import useProjectForMotorStageOptions from "@hooks/admin/MasterData/useProjectForMotorStageOptions";
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
  const mode = useThemeStore((s) => s.mode);
  const batchTheme = useMemo(() => getBatchManagementTheme(mode), [mode]);
  const { modal: batchModal, tableCell: batchTableCell } = batchTheme;

  const { projects: projectSelectOptions, options: projectOptions, loading: projectLoading } =
    useProjectForMotorStageOptions(true);
  const hook = useMixingCycleMasterHook({
    activeFilter,
    refreshKey,
    onListPayloadChange,
    onStatsChange,
  });

  const filterProjectId = hook.projectFilter || "";
  const { options: filterMotorStageOptions, loading: filterMotorStageLoading } =
    useMotorStageOptions(true, filterProjectId || undefined);

  const createProjectId = hook.form.projectId || "";
  const { options: createMotorStageOptions, loading: createMotorStageLoading } =
    useMotorStageOptions(hook.inlineMode === "create", createProjectId || "");

  const { options: editMotorStageOptions } = useMotorStageOptions(
    hook.inlineMode === "edit",
    hook.form.projectId || undefined,
  );

  const { table, tableCell } = t;
  const formOpen = hook.inlineMode != null;
  const columnCount = 4 + MASTER_DATA_AUDIT_COLUMN_COUNT + 2;
  const [viewTarget, setViewTarget] = useState<MixingCycleRecord | null>(null);

  const viewProjectId = viewTarget?.projectId || "";
  const { options: viewMotorStageOptions } = useMotorStageOptions(
    viewTarget != null,
    viewProjectId || undefined,
  );

  const resolveProject = (projectId: string) => {
    const match = projectSelectOptions.find((p) => p.projectId === projectId);
    if (match) return match;
    const opt = projectOptions.find((o) => o.value === projectId);
    if (!opt) return null;
    return { projectId, projectName: String(opt.label ?? projectId) };
  };

  const renderProjectCell = (projectId: string) => {
    const id = String(projectId ?? "").trim();
    if (!id) return <Typography sx={table.bodyText}>—</Typography>;
    const project = resolveProject(id);
    const projectName = project?.projectName?.trim() || id;
    return (
      <Box sx={batchTableCell.batchIdBox}>
        <icons.batchMgmt.projectId
          sx={{ ...batchTableCell.batchIdIcon, ...batchTableCell.projectIdIcon }}
        />
        <Box sx={batchTableCell.projectInfo}>
          <Typography sx={batchTableCell.projectName}>{projectName}</Typography>
          <Typography sx={batchTableCell.projectId}>{id}</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Paper elevation={0} sx={table.paper}>
        <MixingCycleMasterTableToolbar
          search={hook.search}
          onSearchChange={hook.setSearch}
          projectFilter={hook.projectFilter}
          onProjectFilterChange={hook.setProjectFilter}
          projectOptions={projectOptions}
          projectLoading={projectLoading}
          motorStageFilter={hook.motorStageFilter}
          onMotorStageFilterChange={hook.setMotorStageFilter}
          motorStageOptions={filterMotorStageOptions}
          motorStageLoading={filterMotorStageLoading}
          onRefresh={onRefresh}
          refreshDisabled={refreshDisabled || hook.loading}
          t={t}
          renderProjectOption={(props, option) => (
            <Box component="li" {...props} key={option.value}>
              <Box sx={batchModal.projectOption}>
                <Typography sx={batchModal.projectOptionName}>{String(option.label)}</Typography>
                <Typography sx={batchModal.projectOptionId}>{option.value}</Typography>
              </Box>
            </Box>
          )}
        />
        <Divider sx={table.divider} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={table.headerRow}>
                <TableCell sx={{ ...table.headerCell, minWidth: 220 }}>
                  {S.MIXING_CYCLES.COL_PROJECT}
                </TableCell>
                <TableCell sx={table.headerCell}>{S.MIXING_CYCLES.COL_MOTOR_STAGE}</TableCell>
                <TableCell sx={table.headerCell}>{S.MIXING_CYCLES.COL_NAME}</TableCell>
                <TableCell sx={table.headerCell}>{S.MIXING_CYCLES.COL_OPERATIONS}</TableCell>
                <MasterDataAuditHeaderCells table={table} />
                <TableCell sx={table.headerCell}>{S.TABLE.COL_ACTIVE}</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>
                  Actions
                </TableCell>
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
                    (row.cycles.premixOperations?.length ?? 0) +
                    (row.cycles.finalMixOperations?.length ?? 0);
                  return (
                    <TableRow key={row.id} sx={table.row}>
                      <TableCell sx={{ ...table.cell, minWidth: 220 }}>
                        {renderProjectCell(row.projectId)}
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>
                          {formatMotorStageLabel(row.motorStage, filterMotorStageOptions)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{row.mixingCycleName}</Typography>
                        {row.mixingCycleCode ? (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {row.mixingCycleCode}
                          </Typography>
                        ) : null}
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
        projectOptions={projectOptions}
        projectLoading={projectLoading}
        motorStageOptions={
          hook.inlineMode === "edit" ? editMotorStageOptions : createMotorStageOptions
        }
        motorStageLoading={hook.inlineMode === "create" ? createMotorStageLoading : false}
        existingRecords={hook.items}
        onClose={hook.closeInline}
        onSave={() => void hook.saveForm()}
        onChange={hook.setForm}
        t={t}
      />

      <MixingCycleMasterViewDialog
        open={viewTarget != null}
        record={viewTarget}
        projectOptions={projectOptions}
        motorStageOptions={viewMotorStageOptions}
        onClose={() => setViewTarget(null)}
        t={t}
      />

      <MasterDataToggleConfirmDialog
        target={
          hook.toggleTarget
            ? {
                name:
                  hook.toggleTarget.record.mixingCycleName ||
                  hook.toggleTarget.record.mixingCycleCode,
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
