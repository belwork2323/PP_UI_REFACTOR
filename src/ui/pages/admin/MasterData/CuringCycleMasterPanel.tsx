import React, { useEffect, useMemo, useState } from "react";
import { useAlertStore } from "@app/store/alertStore";
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
import MasterDataToggleConfirmDialog from "./components/MasterDataToggleConfirmDialog";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import AppTextField from "@ui/components/common/AppTextField";
import useCuringCycleMasterHook from "@hooks/admin/MasterData/useCuringCycleMasterHook";
import MasterDataTableToolbar from "./components/MasterDataTableToolbar";
import MasterDataActiveSwitch from "./components/MasterDataActiveSwitch";
import MasterDataEnableDisableField from "./components/MasterDataEnableDisableField";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import {
  MASTER_DATA_AUDIT_COLUMN_COUNT,
  MasterDataAuditHeaderCells,
  MasterDataAuditRowCells,
} from "./components/MasterDataAuditColumns";
import {
  emptyCuringCycleStep,
  getCuringCycleFieldErrors,
  getCuringCycleValidationMessage,
  type CuringCycleFieldErrors,
  type CuringCycleFormState,
  type CuringCycleListPayload,
  type CuringCycleStepForm,
} from "@data/models/admin/MasterData/CuringCycleMasterModel";
import { visibleValidationError } from "./masterDataValidationUtils";

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

const CycleEditor = ({
  cycles,
  disabled,
  onChange,
}: {
  cycles: CuringCycleStepForm[];
  disabled?: boolean;
  onChange: (next: CuringCycleStepForm[]) => void;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    {cycles.map((c, idx) => (
      <Box
        key={idx}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr auto" },
          gap: 1,
          p: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <AppTextField
          compact
          type="number"
          label="Temp"
          value={c.temperature}
          disabled={disabled}
          onChange={(e) => {
            const next = [...cycles];
            next[idx] = { ...c, temperature: e.target.value === "" ? "" : Number(e.target.value) };
            onChange(next);
          }}
        />
        <AppTextField
          compact
          type="number"
          label="Duration (min)"
          value={c.durationMinutes}
          disabled={disabled}
          onChange={(e) => {
            const next = [...cycles];
            next[idx] = { ...c, durationMinutes: e.target.value === "" ? "" : Number(e.target.value) };
            onChange(next);
          }}
        />
        <AppTextField
          compact
          type="number"
          label="Pressure"
          value={c.propellantPressure}
          disabled={disabled}
          onChange={(e) => {
            const next = [...cycles];
            next[idx] = { ...c, propellantPressure: e.target.value === "" ? "" : Number(e.target.value) };
            onChange(next);
          }}
        />
        <Button size="small" color="inherit" disabled={disabled} onClick={() => onChange(cycles.filter((_, i) => i !== idx))}>
          Remove
        </Button>
      </Box>
    ))}
    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...cycles, emptyCuringCycleStep()])}
    >
      Add cycle step
    </Button>
  </Box>
);

const CuringFormFields = ({
  form,
  isEdit,
  saving,
  showErrors,
  fieldErrors,
  onChange,
}: {
  form: CuringCycleFormState;
  isEdit: boolean;
  saving: boolean;
  showErrors: boolean;
  fieldErrors: CuringCycleFieldErrors;
  onChange: (next: CuringCycleFormState) => void;
}) => {
  const stageError = visibleValidationError(fieldErrors.motorStage, form.motorStage !== "", showErrors);
  const stageNameError = visibleValidationError(
    fieldErrors.motorStageName,
    form.motorStageName.trim().length > 0,
    showErrors,
  );
  const curingTypeError = visibleValidationError(
    fieldErrors.curingType,
    form.curingType.trim().length > 0,
    showErrors,
  );

  return (
  <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
      <AppTextField
        compact
        type="number"
        label="Motor stage"
        value={form.motorStage}
        disabled={saving || isEdit}
        error={Boolean(stageError)}
        helperText={stageError}
        onChange={(e) =>
          onChange({ ...form, motorStage: e.target.value === "" ? "" : Number(e.target.value) })
        }
        sx={{ width: 120 }}
      />
      <AppTextField
        compact
        label="Stage name"
        value={form.motorStageName}
        disabled={saving}
        error={Boolean(stageNameError)}
        helperText={stageNameError}
        onChange={(e) => onChange({ ...form, motorStageName: e.target.value })}
        sx={{ minWidth: 160 }}
      />
      <AppTextField
        compact
        label="Curing type"
        value={form.curingType}
        disabled={saving}
        error={Boolean(curingTypeError)}
        helperText={curingTypeError}
        onChange={(e) => onChange({ ...form, curingType: e.target.value })}
        sx={{ minWidth: 180, flex: 1 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2">Show pressure</Typography>
        <Switch
          size="small"
          checked={form.showPropellantPressure}
          disabled={saving}
          onChange={(e) => onChange({ ...form, showPropellantPressure: e.target.checked })}
        />
      </Box>
      <MasterDataEnableDisableField
        checked={form.isActive}
        disabled={saving}
        confirmName={`${form.curingType} (stage ${form.motorStage})`}
        onChange={(isActive) => onChange({ ...form, isActive })}
      />
    </Box>
    <Divider />
    <Typography variant="subtitle2">Cycle steps</Typography>
    <CycleEditor
      cycles={form.cycles}
      disabled={saving}
      onChange={(cycles) => onChange({ ...form, cycles })}
    />
  </Box>
  );
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
  const hook = useCuringCycleMasterHook({
    activeFilter,
    refreshKey,
    onListPayloadChange,
    onStatsChange,
  });
  const { table, tableCell } = t;
  const columnCount = 6 + MASTER_DATA_AUDIT_COLUMN_COUNT;
  const [showErrors, setShowErrors] = useState(false);
  const fieldErrors = useMemo(
    () => getCuringCycleFieldErrors(hook.form, false, hook.items),
    [hook.form, hook.items],
  );

  useEffect(() => {
    if (hook.inlineMode) setShowErrors(false);
  }, [hook.inlineMode]);

  const handleSave = () => {
    setShowErrors(true);
    const err = getCuringCycleValidationMessage(
      getCuringCycleFieldErrors(hook.form, false, hook.items),
    );
    if (err) {
      useAlertStore.getState().showValidationAlert(err);
      return;
    }
    void hook.saveForm();
  };

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
                <TableCell sx={table.headerCell}>Stage</TableCell>
                <TableCell sx={table.headerCell}>Type</TableCell>
                <TableCell sx={table.headerCell}>Steps</TableCell>
                <MasterDataAuditHeaderCells table={table} />
                <TableCell sx={table.headerCell}>{S.TABLE.COL_ACTIVE}</TableCell>
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
                          <Typography sx={table.bodyText}>
                            {row.motorStageName || `Stage ${row.motorStage}`}
                          </Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.curingType}</Typography>
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
                              {row.cycles.map((c, i) => (
                                <Typography key={i} variant="body2" color="text.secondary">
                                  Step {c.sequenceNo ?? i + 1}: {c.temperature ?? "—"}° /{" "}
                                  {c.durationMinutes ?? "—"} min
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
                  <TableCell colSpan={6} sx={{ p: 0 }}>
                    <CuringFormFields
                      form={hook.form}
                      isEdit={false}
                      saving={hook.saving}
                      showErrors={showErrors}
                      fieldErrors={fieldErrors}
                      onChange={hook.setForm}
                    />
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", p: 1.5, pt: 0 }}>
                      <Button size="small" onClick={hook.closeInline} disabled={hook.saving}>
                        {S.FORM.CANCEL}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSave}
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

      <MasterDataToggleConfirmDialog
        target={
          hook.toggleTarget
            ? {
                name: `${hook.toggleTarget.record.curingType} (stage ${hook.toggleTarget.record.motorStage})`,
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
