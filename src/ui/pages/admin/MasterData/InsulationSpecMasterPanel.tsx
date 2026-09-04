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
import useInsulationSpecMasterHook from "@hooks/admin/MasterData/useInsulationSpecMasterHook";
import {
  emptyInsulationCategory,
  emptyInsulationParameter,
  type InsulationCategoryForm,
  type InsulationParameterForm,
  type InsulationSpecFormState,
  type InsulationSpecListPayload,
} from "@data/models/admin/MasterData/InsulationSpecMasterModel";
import type { MasterDataReferenceRange } from "@data/models/admin/MasterData/nestedMasterDataTypes";

const S = STRINGS.MASTER_DATA;

type Props = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  t: any;
  onListPayloadChange?: (payload: InsulationSpecListPayload | null) => void;
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

const ParameterEditor = ({
  parameters,
  disabled,
  onChange,
}: {
  parameters: InsulationParameterForm[];
  disabled?: boolean;
  onChange: (next: InsulationParameterForm[]) => void;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
    {parameters.map((param, idx) => (
      <Box
        key={idx}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
          gap: 1,
          alignItems: "flex-start",
          p: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <AppTextField
          compact
          label="Code"
          value={param.specificationCode}
          disabled={disabled}
          onChange={(e) => {
            const next = [...parameters];
            next[idx] = { ...param, specificationCode: e.target.value };
            onChange(next);
          }}
        />
        <AppTextField
          compact
          label="Name"
          value={param.specificationName}
          disabled={disabled}
          onChange={(e) => {
            const next = [...parameters];
            next[idx] = { ...param, specificationName: e.target.value };
            onChange(next);
          }}
        />
        <IconButton
          size="small"
          disabled={disabled}
          onClick={() => onChange(parameters.filter((_, i) => i !== idx))}
        >
          <icons.Delete fontSize="small" />
        </IconButton>
        <Box sx={{ gridColumn: { md: "1 / -1" } }}>
          <RangeFields
            range={param.referenceRange}
            disabled={disabled}
            onChange={(referenceRange) => {
              const next = [...parameters];
              next[idx] = { ...param, referenceRange };
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
      onClick={() => onChange([...parameters, emptyInsulationParameter()])}
    >
      Add parameter
    </Button>
  </Box>
);

const CategoryEditor = ({
  categories,
  disabled,
  onChange,
}: {
  categories: InsulationCategoryForm[];
  disabled?: boolean;
  onChange: (next: InsulationCategoryForm[]) => void;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
    {categories.map((cat, idx) => (
      <Box
        key={idx}
        sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "action.hover" }}
      >
        <Box sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
          <AppTextField
            compact
            label="Category"
            fullWidth
            value={cat.category}
            disabled={disabled}
            onChange={(e) => {
              const next = [...categories];
              next[idx] = { ...cat, category: e.target.value };
              onChange(next);
            }}
          />
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => onChange(categories.filter((_, i) => i !== idx))}
          >
            <icons.Delete fontSize="small" />
          </IconButton>
        </Box>
        <ParameterEditor
          parameters={cat.parameters}
          disabled={disabled}
          onChange={(parameters) => {
            const next = [...categories];
            next[idx] = { ...cat, parameters };
            onChange(next);
          }}
        />
      </Box>
    ))}
    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...categories, emptyInsulationCategory()])}
    >
      Add category
    </Button>
  </Box>
);

const InsulationFormFields = ({
  form,
  isEdit,
  saving,
  onChange,
}: {
  form: InsulationSpecFormState;
  isEdit: boolean;
  saving: boolean;
  onChange: (next: InsulationSpecFormState) => void;
}) => (
  <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
      <AppTextField
        compact
        label="Type"
        value={form.insulationType}
        disabled={saving || isEdit}
        onChange={(e) => onChange({ ...form, insulationType: e.target.value })}
        sx={{ minWidth: 160 }}
      />
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
    <Typography variant="subtitle2">Categories & parameters</Typography>
    <CategoryEditor
      categories={form.specifications}
      disabled={saving}
      onChange={(specifications) => onChange({ ...form, specifications })}
    />
  </Box>
);

const InsulationSpecMasterPanel = ({
  activeFilter,
  refreshKey,
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
            placeholder="Search insulation type…"
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
                <TableCell sx={table.headerCell}>Type</TableCell>
                <TableCell sx={table.headerCell}>Categories</TableCell>
                <TableCell sx={table.headerCell}>Parameters</TableCell>
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
                  const expanded = hook.expandedId === row.id || (hook.inlineMode === "edit" && hook.form.id === row.id);
                  const paramCount = row.specifications.reduce(
                    (n, c) => n + (c.parameters?.length ?? 0),
                    0,
                  );
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
                          <Typography sx={table.bodyText}>{row.insulationType}</Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.specifications.length}</Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{paramCount}</Typography>
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
                                <InsulationFormFields
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
                                {row.specifications.map((c, i) => (
                                  <Box key={i} sx={{ mb: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                      {c.category}
                                    </Typography>
                                    {c.parameters.map((p, j) => (
                                      <Typography key={j} variant="body2" color="text.secondary">
                                        {p.specificationCode} — {p.specificationName}
                                        {p.referenceRange?.unit
                                          ? ` (${p.referenceRange.minValue ?? "—"}–${p.referenceRange.maxValue ?? "—"} ${p.referenceRange.unit})`
                                          : ""}
                                      </Typography>
                                    ))}
                                  </Box>
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
                    <InsulationFormFields
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
