import React from "react";
import {
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import AppTextField from "@ui/components/common/AppTextField";
import useMixingCycleMasterHook from "@hooks/admin/MasterData/useMixingCycleMasterHook";
import MasterDataTableToolbar from "./components/MasterDataTableToolbar";
import MasterDataActiveSwitch, { masterDataActiveSwitchSx } from "./components/MasterDataActiveSwitch";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import {
  MASTER_DATA_AUDIT_COLUMN_COUNT,
  MasterDataAuditHeaderCells,
  MasterDataAuditRowCells,
} from "./components/MasterDataAuditColumns";
import {
  emptyMixingOperation,
  type MixingCycleFormState,
  type MixingCycleListPayload,
  type MixingOperationForm,
} from "@data/models/admin/MasterData/MixingCycleMasterModel";

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

const OpEditor = ({
  title,
  ops,
  disabled,
  onChange,
}: {
  title: string;
  ops: MixingOperationForm[];
  disabled?: boolean;
  onChange: (next: MixingOperationForm[]) => void;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <Typography variant="subtitle2">{title}</Typography>
    {ops.map((op, idx) => (
      <Box key={idx} sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <AppTextField
          compact
          label="Operation"
          value={op.operationName}
          disabled={disabled}
          onChange={(e) => {
            const next = [...ops];
            next[idx] = { ...op, operationName: e.target.value };
            onChange(next);
          }}
          sx={{ minWidth: 200, flex: 1 }}
        />
        <Button size="small" color="inherit" disabled={disabled} onClick={() => onChange(ops.filter((_, i) => i !== idx))}>
          Remove
        </Button>
      </Box>
    ))}
    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...ops, emptyMixingOperation()])}
    >
      Add operation
    </Button>
  </Box>
);

const MixingFormFields = ({
  form,
  isEdit,
  saving,
  onChange,
}: {
  form: MixingCycleFormState;
  isEdit: boolean;
  saving: boolean;
  onChange: (next: MixingCycleFormState) => void;
}) => (
  <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
      <AppTextField
        compact
        label="Code"
        value={isEdit ? form.mixingCycleCode : "Auto"}
        disabled
        sx={{ width: 140 }}
      />
      <AppTextField
        compact
        label="Name"
        value={form.mixingCycleName}
        disabled={saving}
        onChange={(e) => onChange({ ...form, mixingCycleName: e.target.value })}
        sx={{ minWidth: 200, flex: 1 }}
      />
      <AppTextField
        compact
        type="number"
        label="Motor stage"
        value={form.motorStage}
        disabled={saving}
        onChange={(e) =>
          onChange({ ...form, motorStage: e.target.value === "" ? "" : Number(e.target.value) })
        }
        sx={{ width: 120 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2">Active</Typography>
        <Switch
          size="small"
          checked={form.isActive}
          disabled={saving}
          onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
          sx={masterDataActiveSwitchSx(form.isActive)}
        />
      </Box>
    </Box>
    <AppTextField
      compact
      label="Description"
      value={form.description}
      disabled={saving}
      onChange={(e) => onChange({ ...form, description: e.target.value })}
      fullWidth
    />
    <Divider />
    <OpEditor
      title="Premix operations"
      ops={form.cycles.premixOperations}
      disabled={saving}
      onChange={(premixOperations) => onChange({ ...form, cycles: { ...form.cycles, premixOperations } })}
    />
    <OpEditor
      title="Final mix operations"
      ops={form.cycles.finalMixOperations}
      disabled={saving}
      onChange={(finalMixOperations) => onChange({ ...form, cycles: { ...form.cycles, finalMixOperations } })}
    />
  </Box>
);

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
  const hook = useMixingCycleMasterHook({
    activeFilter,
    refreshKey,
    onListPayloadChange,
    onStatsChange,
  });
  const { table, tableCell } = t;
  const columnCount = 7 + MASTER_DATA_AUDIT_COLUMN_COUNT;

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
                <TableCell sx={table.headerCell} width={48} />
                <TableCell sx={table.headerCell}>Code</TableCell>
                <TableCell sx={table.headerCell}>Name</TableCell>
                <TableCell sx={table.headerCell}>Stage</TableCell>
                <TableCell sx={table.headerCell}>Ops</TableCell>
                <MasterDataAuditHeaderCells table={table} />
                <TableCell sx={table.headerCell}>Active</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>{S.TABLE.COL_ACTIONS}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hook.loading ? (
                Array.from({ length: hook.rowsPerPage }).map((_, i) => (
                  <SkeletonRow key={i} columns={columnCount} sx={table.cell} />
                ))
              ) : hook.paginated.length === 0 && hook.inlineMode !== "create" ? (
                <TableRow>
                  <TableCell colSpan={columnCount} sx={table.emptyCell}>
                    <icons.Inventory sx={table.emptyIcon} />
                    <Typography sx={table.emptyText}>{S.TABLE.EMPTY}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hook.paginated.map((row) => {
                  const expanded = hook.expandedId === row.id;
                  const opCount =
                    (row.cycles.premixOperations?.length ?? 0) + (row.cycles.finalMixOperations?.length ?? 0);
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow sx={table.row}>
                        <TableCell sx={table.cell}>
                          <IconButton
                            size="small"
                            onClick={() => hook.setExpandedId(expanded ? null : row.id)}
                            disabled={hook.inlineMode === "create"}
                          >
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.mixingCycleCode}</Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.mixingCycleName}</Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.motorStage}</Typography>
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
                            <MasterDataActiveSwitch
                              isActive={row.isActive}
                              disabled={hook.inlineMode != null || hook.saving || hook.disabling || hook.enabling}
                              onToggle={(nextActive) => hook.handleToggleActive(row, nextActive)}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={columnCount} sx={{ p: 0, border: 0 }}>
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 1.5 }}>
                              {row.description ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {row.description}
                                </Typography>
                              ) : null}
                              <Typography variant="subtitle2">Premix</Typography>
                              {row.cycles.premixOperations.map((o, i) => (
                                <Typography key={`p-${i}`} variant="body2" color="text.secondary">
                                  {o.sequenceNo != null ? `${o.sequenceNo}. ` : ""}
                                  {o.operationName}
                                </Typography>
                              ))}
                              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                Final mix
                              </Typography>
                              {row.cycles.finalMixOperations.map((o, i) => (
                                <Typography key={`f-${i}`} variant="body2" color="text.secondary">
                                  {o.sequenceNo != null ? `${o.sequenceNo}. ` : ""}
                                  {o.operationName}
                                </Typography>
                              ))}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}

              {hook.inlineMode === "create" && !hook.loading ? (
                <TableRow sx={{ bgcolor: (theme) => theme.palette.action.hover }}>
                  <TableCell colSpan={7} sx={{ p: 0 }}>
                    <MixingFormFields
                      form={hook.form}
                      isEdit={false}
                      saving={hook.saving}
                      onChange={hook.setForm}
                    />
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", p: 1.5, pt: 0 }}>
                      <Button size="small" onClick={hook.closeInline} disabled={hook.saving}>
                        {S.FORM.CANCEL}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => void hook.saveForm()}
                        disabled={hook.saving}
                        sx={t.pageHeader?.newProjectButton}
                      >
                        {hook.saving ? S.FORM.SAVING : S.FORM.SAVE}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}
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
          disabled={hook.loading || hook.inlineMode != null}
          sx={t.pageHeader.newProjectButton}
        >
          {addButtonLabel}
        </Button>
      </Box>

      <ConfirmAlertDialog
        open={!!hook.disableTarget}
        title={S.DISABLE_DIALOG.TITLE}
        message={
          hook.disableTarget
            ? S.DISABLE_DIALOG.BODY(hook.disableTarget.mixingCycleName || hook.disableTarget.mixingCycleCode)
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

export default MixingCycleMasterPanel;
