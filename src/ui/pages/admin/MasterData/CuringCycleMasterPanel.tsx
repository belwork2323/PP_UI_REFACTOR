import React from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import AppTextField from "@ui/components/common/AppTextField";
import useCuringCycleMasterHook from "@hooks/admin/MasterData/useCuringCycleMasterHook";
import {
  emptyCuringCycleStep,
  type CuringCycleFormState,
  type CuringCycleListPayload,
  type CuringCycleStepForm,
} from "@data/models/admin/MasterData/CuringCycleMasterModel";

const S = STRINGS.MASTER_DATA;

type Props = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
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
  onChange,
}: {
  form: CuringCycleFormState;
  isEdit: boolean;
  saving: boolean;
  onChange: (next: CuringCycleFormState) => void;
}) => (
  <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
      <AppTextField
        compact
        type="number"
        label="Motor stage"
        value={form.motorStage}
        disabled={saving || isEdit}
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
        onChange={(e) => onChange({ ...form, motorStageName: e.target.value })}
        sx={{ minWidth: 160 }}
      />
      <AppTextField
        compact
        label="Curing type"
        value={form.curingType}
        disabled={saving}
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2">Active</Typography>
        <Switch
          size="small"
          checked={form.isActive}
          disabled={saving}
          onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
        />
      </Box>
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

const CuringCycleMasterPanel = ({
  activeFilter,
  refreshKey,
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
  const searchTheme = t.batchListShell?.inputs;

  return (
    <Box>
      <Paper elevation={0} sx={table.paper}>
        <Box sx={t.tableSearchBar}>
          <TextField
            size="small"
            fullWidth
            margin="none"
            value={hook.search}
            onChange={(e) => hook.setSearch(e.target.value)}
            placeholder="Search curing cycles…"
            sx={{
              ...(searchTheme?.search ?? t.searchField),
              m: 0,
              mb: 0,
              mt: 0,
              flex: 1,
              minWidth: 0,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={searchTheme?.startIcon?.search} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider sx={table.divider} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={table.headerRow}>
                <TableCell sx={table.headerCell} width={48} />
                <TableCell sx={table.headerCell}>Stage</TableCell>
                <TableCell sx={table.headerCell}>Type</TableCell>
                <TableCell sx={table.headerCell}>Steps</TableCell>
                <TableCell sx={table.headerCell}>Active</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hook.loading ? (
                Array.from({ length: hook.rowsPerPage }).map((_, i) => (
                  <SkeletonRow key={i} columns={6} sx={table.cell} />
                ))
              ) : hook.paginated.length === 0 && hook.inlineMode !== "create" ? (
                <TableRow>
                  <TableCell colSpan={6} sx={table.emptyCell}>
                    <icons.Inventory sx={table.emptyIcon} />
                    <Typography sx={table.emptyText}>{S.TABLE.EMPTY}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hook.paginated.map((row) => {
                  const expanded =
                    hook.expandedId === row.id || (hook.inlineMode === "edit" && hook.form.id === row.id);
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow sx={table.row}>
                        <TableCell sx={table.cell}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              hook.setExpandedId(expanded && hook.inlineMode !== "edit" ? null : row.id)
                            }
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
                        <TableCell sx={table.cell}>
                          <Chip
                            size="small"
                            label={row.isActive ? S.TABLE.YES : S.TABLE.NO}
                            color={row.isActive ? "success" : "default"}
                            variant={row.isActive ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell sx={table.cellActionsWrapper}>
                          <Box sx={tableCell.actionsBox}>
                            <Tooltip title={S.TABLE.EDIT}>
                              <IconButton
                                size="small"
                                onClick={() => hook.openEdit(row)}
                                disabled={hook.inlineMode != null}
                                sx={tableCell.editButton}
                              >
                                <icons.Edit sx={tableCell.editIcon} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={S.TABLE.DISABLE}>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={!row.isActive || hook.inlineMode != null}
                                  onClick={() => hook.setDisableTarget(row)}
                                  sx={tableCell.deleteButton}
                                >
                                  <icons.Delete sx={tableCell.deleteIcon} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            {hook.inlineMode === "edit" && hook.form.id === row.id ? (
                              <>
                                <CuringFormFields
                                  form={hook.form}
                                  isEdit
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
                              </>
                            ) : (
                              <Box sx={{ p: 1.5 }}>
                                {row.cycles.map((c, i) => (
                                  <Typography key={i} variant="body2" color="text.secondary">
                                    Step {c.sequenceNo ?? i + 1}: {c.temperature ?? "—"}° /{" "}
                                    {c.durationMinutes ?? "—"} min
                                  </Typography>
                                ))}
                              </Box>
                            )}
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
          {S.PAGE.NEW_BUTTON}
        </Button>
      </Box>

      <ConfirmAlertDialog
        open={!!hook.disableTarget}
        title={S.DISABLE_DIALOG.TITLE}
        message={
          hook.disableTarget
            ? S.DISABLE_DIALOG.BODY(
                `${hook.disableTarget.curingType} (stage ${hook.disableTarget.motorStage})`,
              )
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

export default CuringCycleMasterPanel;
