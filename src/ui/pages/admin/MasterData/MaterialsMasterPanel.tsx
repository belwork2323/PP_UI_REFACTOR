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
import AppDropdown from "@ui/components/common/AppDropdown";
import useMaterialsMasterHook from "@hooks/admin/MasterData/useMaterialsMasterHook";
import {
  emptyMaterialGrade,
  emptyMaterialSpec,
  type MaterialGradeForm,
  type MaterialSpecForm,
  type MaterialsMasterFormState,
  type MaterialsMasterListPayload,
} from "@data/models/admin/MasterData/MaterialsMasterModel";
import type { MasterDataReferenceRange } from "@data/models/admin/MasterData/nestedMasterDataTypes";

const S = STRINGS.MASTER_DATA;

type Props = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  t: any;
  onListPayloadChange?: (payload: MaterialsMasterListPayload | null) => void;
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

const SpecEditor = ({
  specs,
  disabled,
  onChange,
}: {
  specs: MaterialSpecForm[];
  disabled?: boolean;
  onChange: (next: MaterialSpecForm[]) => void;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
    {specs.map((spec, idx) => (
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
          label="Spec code"
          value={spec.specificationCode}
          disabled={disabled}
          onChange={(e) => {
            const next = [...specs];
            next[idx] = { ...spec, specificationCode: e.target.value };
            onChange(next);
          }}
        />
        <AppTextField
          compact
          label="Spec name"
          value={spec.specificationName}
          disabled={disabled}
          onChange={(e) => {
            const next = [...specs];
            next[idx] = { ...spec, specificationName: e.target.value };
            onChange(next);
          }}
        />
        <Button size="small" color="inherit" disabled={disabled} onClick={() => onChange(specs.filter((_, i) => i !== idx))}>
          Remove
        </Button>
        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <RangeFields
            range={spec.referenceRange}
            disabled={disabled}
            onChange={(referenceRange) => {
              const next = [...specs];
              next[idx] = { ...spec, referenceRange };
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
      onClick={() => onChange([...specs, emptyMaterialSpec()])}
    >
      Add specification
    </Button>
  </Box>
);

const GradeEditor = ({
  grades,
  disabled,
  onChange,
}: {
  grades: MaterialGradeForm[];
  disabled?: boolean;
  onChange: (next: MaterialGradeForm[]) => void;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
    {grades.map((grade, idx) => (
      <Box
        key={idx}
        sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5, bgcolor: "action.hover" }}
      >
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1, alignItems: "center" }}>
          <AppTextField
            compact
            label="Grade code"
            value={grade.gradeCode}
            disabled={disabled}
            onChange={(e) => {
              const next = [...grades];
              next[idx] = { ...grade, gradeCode: e.target.value };
              onChange(next);
            }}
            sx={{ minWidth: 140 }}
          />
          <AppTextField
            compact
            label="Grade name"
            value={grade.gradeName}
            disabled={disabled}
            onChange={(e) => {
              const next = [...grades];
              next[idx] = { ...grade, gradeName: e.target.value };
              onChange(next);
            }}
            sx={{ minWidth: 180, flex: 1 }}
          />
          <Button size="small" color="inherit" disabled={disabled} onClick={() => onChange(grades.filter((_, i) => i !== idx))}>
            Remove grade
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
          Grade specifications
        </Typography>
        <SpecEditor
          specs={grade.specifications}
          disabled={disabled}
          onChange={(specifications) => {
            const next = [...grades];
            next[idx] = { ...grade, specifications };
            onChange(next);
          }}
        />
      </Box>
    ))}
    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...grades, emptyMaterialGrade()])}
    >
      Add grade
    </Button>
  </Box>
);

const MaterialFormFields = ({
  form,
  isEdit,
  saving,
  onChange,
}: {
  form: MaterialsMasterFormState;
  isEdit: boolean;
  saving: boolean;
  onChange: (next: MaterialsMasterFormState) => void;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 1.5 }}>
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
      <AppTextField
        compact
        label="Material code"
        value={form.materialCode}
        disabled={saving || isEdit}
        onChange={(e) => onChange({ ...form, materialCode: e.target.value })}
        sx={{ minWidth: 160 }}
      />
      <AppTextField
        compact
        label="Name"
        value={form.materialName}
        disabled={saving}
        onChange={(e) => onChange({ ...form, materialName: e.target.value })}
        sx={{ minWidth: 200, flex: 1 }}
      />
      <AppDropdown
        compact
        label="Type"
        value={form.materialType}
        disabled={saving}
        onChange={(value) => onChange({ ...form, materialType: value as "SOLID" | "LIQUID" })}
        options={[
          { value: "SOLID", label: "SOLID" },
          { value: "LIQUID", label: "LIQUID" },
        ]}
        sx={{ minWidth: 140 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2">{S.FORM.ACTIVE_LABEL}</Typography>
        <Switch
          size="small"
          checked={form.isActive}
          disabled={saving}
          onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
        />
      </Box>
    </Box>

    <Typography variant="subtitle2">Grades</Typography>
    <GradeEditor
      grades={form.grades}
      disabled={saving}
      onChange={(grades) => onChange({ ...form, grades })}
    />

    <Typography variant="subtitle2">Top-level specifications</Typography>
    <SpecEditor
      specs={form.specifications}
      disabled={saving}
      onChange={(specifications) => onChange({ ...form, specifications })}
    />
  </Box>
);

const MaterialsMasterPanel = ({
  activeFilter,
  refreshKey,
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
  const searchTheme = t.batchListShell?.inputs;
  const isCreate = hook.inlineMode === "create";
  const isEdit = hook.inlineMode === "edit";

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
            placeholder={S.TOOLBAR.SEARCH_PLACEHOLDER}
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
                <TableCell sx={table.headerCell} width={40} />
                <TableCell sx={table.headerCell}>Code</TableCell>
                <TableCell sx={table.headerCell}>Name</TableCell>
                <TableCell sx={table.headerCell}>Type</TableCell>
                <TableCell sx={table.headerCell}>Grades</TableCell>
                <TableCell sx={table.headerCell}>Specs</TableCell>
                <TableCell sx={table.headerCell}>{S.TABLE.COL_ACTIVE}</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>{S.TABLE.COL_ACTIONS}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hook.loading ? (
                <SkeletonRow columns={8} />
              ) : hook.paginated.length === 0 && !isCreate ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography sx={table.emptyText}>{S.TABLE.EMPTY}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hook.paginated.map((row) => {
                  const expanded = hook.expandedId === row.materialId;
                  const editing = isEdit && hook.form.materialId === row.materialId;
                  return (
                    <React.Fragment key={row.materialId}>
                      <TableRow sx={table.row}>
                        <TableCell sx={table.cell}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              hook.setExpandedId(expanded ? null : row.materialId)
                            }
                          >
                            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.materialCode}</Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Typography sx={table.bodyText}>{row.materialName}</Typography>
                        </TableCell>
                        <TableCell sx={table.cell}>
                          <Chip size="small" label={row.materialType} variant="outlined" />
                        </TableCell>
                        <TableCell sx={table.cell}>{row.grades.length}</TableCell>
                        <TableCell sx={table.cell}>{row.specifications.length}</TableCell>
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
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={hook.saving || hook.inlineMode != null}
                                  onClick={() => hook.openEdit(row)}
                                  sx={tableCell.editButton}
                                >
                                  <icons.Edit sx={tableCell.editIcon} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={S.TABLE.DISABLE}>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={!row.isActive || hook.saving || hook.inlineMode != null}
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
                        <TableCell colSpan={8} sx={{ py: 0, borderBottom: expanded || editing ? undefined : "none" }}>
                          <Collapse in={expanded || editing} timeout="auto" unmountOnExit>
                            {editing ? (
                              <>
                                <MaterialFormFields
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
                                <Typography variant="caption" color="text.secondary">
                                  {row.grades.length} grade(s), {row.specifications.length} top-level spec(s). Click
                                  Edit to modify.
                                </Typography>
                              </Box>
                            )}
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
              {isCreate ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0 }}>
                    <MaterialFormFields
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
