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
import useCuringCycleMasterHook from "@hooks/admin/MasterData/useCuringCycleMasterHook";
import useMotorStageOptions from "@hooks/admin/MasterData/useMotorStageOptions";
import useProjectForMotorStageOptions from "@hooks/admin/MasterData/useProjectForMotorStageOptions";
import useCuringTypeOptions from "@hooks/admin/MasterData/useCuringTypeOptions";
import {
  formatMotorStageLabel,
  type CuringCycleListPayload,
  type CuringCycleRecord,
} from "@data/models/admin/MasterData/CuringCycleMasterModel";
import { formatCuringTypeLabel } from "@hooks/user/manufacturing/castingCuringFlowConfig";
import CuringCycleMasterFormDialog from "./CuringCycleMasterFormDialog";
import CuringCycleMasterViewDialog from "./CuringCycleMasterViewDialog";
import CuringCycleMasterTableToolbar from "./components/CuringCycleMasterTableToolbar";
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
  onListPayloadChange?: (payload: CuringCycleListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

const CuringCycleMasterPanel = ({
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
  const { options: curingTypeOptions } = useCuringTypeOptions();
  const hook = useCuringCycleMasterHook({
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
  const [viewTarget, setViewTarget] = useState<CuringCycleRecord | null>(null);

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
        <CuringCycleMasterTableToolbar
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
                  {S.CURING_CYCLES.COL_PROJECT}
                </TableCell>
                <TableCell sx={table.headerCell}>{S.CURING_CYCLES.COL_MOTOR_STAGE}</TableCell>
                <TableCell sx={table.headerCell}>{S.CURING_CYCLES.COL_CURING_TYPE}</TableCell>
                <TableCell sx={table.headerCell}>{S.CURING_CYCLES.COL_STEPS}</TableCell>
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
                      <Typography sx={table.bodyText}>{formatCuringTypeLabel(row.curingType)}</Typography>
                    </TableCell>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.cycles.length}</Typography>
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
                            disabled={
                              hook.saving ||
                              formOpen ||
                              hook.disabling ||
                              hook.enabling
                            }
                            aria-label={S.TABLE.VIEW}
                          >
                            <icons.visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={S.TABLE.EDIT}>
                          <IconButton
                            size="small"
                            onClick={() => hook.openEdit(row)}
                            disabled={
                              hook.saving ||
                              formOpen ||
                              hook.disabling ||
                              hook.enabling
                            }
                            aria-label={S.TABLE.EDIT}
                          >
                            <icons.Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <MasterDataActiveSwitch
                          isActive={row.isActive}
                          disabled={
                            hook.saving ||
                            formOpen ||
                            hook.disabling ||
                            hook.enabling
                          }
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

      <CuringCycleMasterFormDialog
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
        curingTypeOptions={curingTypeOptions}
        existingRecords={hook.items}
        onClose={hook.closeInline}
        onSave={() => void hook.saveForm()}
        onChange={hook.setForm}
        t={t}
      />

      <CuringCycleMasterViewDialog
        open={viewTarget != null}
        record={viewTarget}
        projectOptions={projectOptions}
        motorStageOptions={filterMotorStageOptions}
        onClose={() => setViewTarget(null)}
        t={t}
      />

      <MasterDataToggleConfirmDialog
        target={
          hook.toggleTarget
            ? {
                name:
                  hook.toggleTarget.record.curingCycleCode ||
                  `${formatCuringTypeLabel(hook.toggleTarget.record.curingType)} (stage ${hook.toggleTarget.record.motorStage})`,
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

export default CuringCycleMasterPanel;
