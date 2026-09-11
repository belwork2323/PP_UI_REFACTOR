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
import useQualityCheckMasterHook from "@hooks/admin/MasterData/useQualityCheckMasterHook";
import MasterDataTableToolbar from "./components/MasterDataTableToolbar";
import MasterDataActiveSwitch, { masterDataActiveSwitchSx } from "./components/MasterDataActiveSwitch";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import {
  MASTER_DATA_AUDIT_COLUMN_COUNT,
  MasterDataAuditHeaderCells,
  MasterDataAuditRowCells,
} from "./components/MasterDataAuditColumns";
import {
  emptyQualityCheckParam,
  type QualityCheckFormState,
  type QualityCheckListPayload,
  type QualityCheckParamForm,
} from "@data/models/admin/MasterData/QualityCheckMasterModel";
import type { MasterDataReferenceRange } from "@data/models/admin/MasterData/nestedMasterDataTypes";

const S = STRINGS.MASTER_DATA;

type Props = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  addButtonLabel: string;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  t: any;
  onListPayloadChange?: (payload: QualityCheckListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

const RangeFields = ({
  range,
  disabled,
  onChange,
}: {
  range: MasterDataReferenceRange;
  disabled?: boolean;
  onChange: (next: MasterDataReferenceRange) => void;
}) => (
  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
    <AppTextField
      compact
      type="number"
      label="Min"
      value={range.minValue ?? ""}
      disabled={disabled}
      onChange={(e) =>
        onChange({ ...range, minValue: e.target.value === "" ? null : Number(e.target.value) })
      }
      sx={{ width: 100 }}
    />
    <AppTextField
      compact
      type="number"
      label="Max"
      value={range.maxValue ?? ""}
      disabled={disabled}
      onChange={(e) =>
        onChange({ ...range, maxValue: e.target.value === "" ? null : Number(e.target.value) })
      }
      sx={{ width: 100 }}
    />
    <AppTextField
      compact
      label="Unit"
      value={range.unit}
      disabled={disabled}
      onChange={(e) => onChange({ ...range, unit: e.target.value })}
      sx={{ width: 110 }}
    />
  </Box>
);

const ParamEditor = ({
  params,
  disabled,
  onChange,
}: {
  params: QualityCheckParamForm[];
  disabled?: boolean;
  onChange: (next: QualityCheckParamForm[]) => void;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
    {params.map((p, idx) => (
      <Box
        key={idx}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
          gap: 1,
          p: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <AppTextField
          compact
          label="Parameter name"
          value={p.parameterName}
          disabled={disabled}
          onChange={(e) => {
            const next = [...params];
            next[idx] = { ...p, parameterName: e.target.value };
            onChange(next);
          }}
        />
        <AppTextField
          compact
          type="number"
          label="Samples"
          value={p.noOfSamples}
          disabled={disabled}
          onChange={(e) => {
            const next = [...params];
            next[idx] = { ...p, noOfSamples: e.target.value === "" ? "" : Number(e.target.value) };
            onChange(next);
          }}
        />
        <Button size="small" color="inherit" disabled={disabled} onClick={() => onChange(params.filter((_, i) => i !== idx))}>
          Remove
        </Button>
        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <RangeFields
            range={p.specification}
            disabled={disabled}
            onChange={(specification) => {
              const next = [...params];
              next[idx] = { ...p, specification };
              onChange(next);
            }}
          />
        </Box>
      </Box>
    ))}
    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...params, emptyQualityCheckParam()])}
    >
      Add parameter
    </Button>
  </Box>
);

const QualityFormFields = ({
  form,
  isEdit,
  saving,
  onChange,
}: {
  form: QualityCheckFormState;
  isEdit: boolean;
  saving: boolean;
  onChange: (next: QualityCheckFormState) => void;
}) => (
  <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
      <AppTextField
        compact
        label="Mix type"
        value={form.mixType}
        disabled={saving || isEdit}
        onChange={(e) => onChange({ ...form, mixType: e.target.value })}
        sx={{ minWidth: 160 }}
      />
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
    <Divider />
    <Typography variant="subtitle2">Parameters</Typography>
    <ParamEditor
      params={form.qualityChecks}
      disabled={saving}
      onChange={(qualityChecks) => onChange({ ...form, qualityChecks })}
    />
  </Box>
);

const QualityCheckMasterPanel = ({
  activeFilter,
  refreshKey,
  addButtonLabel,
  onRefresh,
  refreshDisabled = false,
  t,
  onListPayloadChange,
  onStatsChange,
}: Props) => {
  const hook = useQualityCheckMasterHook({
    activeFilter,
    refreshKey,
    onListPayloadChange,
    onStatsChange,
  });
  const { table, tableCell } = t;
  const columnCount = 6 + MASTER_DATA_AUDIT_COLUMN_COUNT;

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
                <TableCell sx={table.headerCell}>Mix type</TableCell>
                <TableCell sx={table.headerCell}>Stage</TableCell>
                <TableCell sx={table.headerCell}>Params</TableCell>
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
                          <Typography sx={table.bodyText}>{row.mixType}</Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.motorStage}</Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.qualityChecks.length}</Typography>
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
                              {row.qualityChecks.map((p, i) => (
                                <Typography key={i} variant="body2" color="text.secondary">
                                  {p.parameterName}
                                  {p.specification?.unit
                                    ? ` (${p.specification.minValue ?? "—"}–${p.specification.maxValue ?? "—"} ${p.specification.unit})`
                                    : ""}
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
                    <QualityFormFields
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
            ? S.DISABLE_DIALOG.BODY(
                `${hook.disableTarget.mixType} (stage ${hook.disableTarget.motorStage})`,
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

export default QualityCheckMasterPanel;
