import React, { useEffect, useMemo, useState } from "react";
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
import SkeletonRow from "@ui/components/common/SkeletonRow";
import AppTextField from "@ui/components/common/AppTextField";
import AppSearchableDropdown from "@ui/components/common/AppSearchableDropdown";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";
import { sanitizeMasterDataDecimalInput } from "@data/models/admin/MasterData/masterDataNumericInput";
import MasterDataTableToolbar from "./components/MasterDataTableToolbar";
import MasterDataActiveSwitch from "./components/MasterDataActiveSwitch";
import MasterDataEnableDisableField from "./components/MasterDataEnableDisableField";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import {
  MASTER_DATA_AUDIT_COLUMN_COUNT,
  MasterDataAuditHeaderCells,
  MasterDataAuditRowCells,
} from "./components/MasterDataAuditColumns";
import type { MasterDataProjectOption } from "@/hooks/admin/MasterData/useProjectForMotorStageOptions";
import {
  formatMasterDataAttributeValue,
  getMasterDataAttributeOptions,
} from "./masterDataAttributeOptions";
import { getMasterDataFieldLabel, requiredFieldLabel } from "./masterDataLabels";
import { visibleValidationError } from "./masterDataValidationUtils";
import {
  getMasterDataFieldErrors,
  validateMasterDataForm,
  type MasterDataFieldDef,
  type MasterDataFormState,
  type MasterDataRecord,
  type MasterDataTypeDescriptor,
} from "@data/models/admin/MasterData/MasterDataModel";
import { useAlertStore } from "@app/store/alertStore";

const S = STRINGS.MASTER_DATA;

type Props = {
  rows: MasterDataRecord[];
  loading: boolean;
  page: number;
  totalCount: number;
  rowsPerPage: number;
  attributeFields: MasterDataFieldDef[];
  schema: MasterDataTypeDescriptor | null;
  selectedType?: string;
  inlineMode: "create" | "edit" | null;
  form: MasterDataFormState;
  saving: boolean;
  togglingStatus?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshDisabled?: boolean;
  t: any;
  onFormChange: (key: string, value: string | number | boolean, isAttribute?: boolean) => void;
  onToggleActive: (row: MasterDataRecord, nextActive: boolean) => void;
  onSaveInline: () => void;
  onCancelInline: () => void;
  onPageChange: (event: unknown, page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  dynamicAttributeOptions?: Record<string, AppDropdownOption[]>;
  projectSelectOptions?: MasterDataProjectOption[];
  projectSelectLoading?: boolean;
  projectFilter?: string;
  onProjectFilterChange?: (value: string) => void;
  motorStageFilter?: string;
  onMotorStageFilterChange?: (value: string) => void;
  motorStageFilterOptions?: AppDropdownOption[];
};

const MasterDataList = ({
  rows,
  loading,
  page,
  totalCount,
  rowsPerPage,
  attributeFields,
  schema,
  selectedType = "",
  inlineMode,
  form,
  saving,
  togglingStatus = false,
  search,
  onSearchChange,
  onRefresh,
  refreshDisabled = false,
  t,
  onFormChange,
  onToggleActive,
  onSaveInline,
  onCancelInline,
  onPageChange,
  onRowsPerPageChange,
  dynamicAttributeOptions,
  projectSelectOptions = [],
  projectSelectLoading = false,
  projectFilter = "",
  onProjectFilterChange,
  motorStageFilter = "",
  onMotorStageFilterChange,
  motorStageFilterOptions = [],
}: Props) => {
  const { table, tableCell } = t;
  const mode = useThemeStore((s) => s.mode);
  const batchTheme = useMemo(() => getBatchManagementTheme(mode), [mode]);
  const { modal: batchModal, tableCell: batchTableCell } = batchTheme;
  const cellSx = t.inlineFormCell ?? {
    "& .MuiOutlinedInput-root": {
      fontSize: "0.8rem",
      bgcolor: "background.paper",
    },
    "& .MuiOutlinedInput-input": {
      py: 0.75,
      px: 1,
    },
  };
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (inlineMode) setShowErrors(false);
  }, [inlineMode]);

  const fieldErrors = useMemo(
    () => getMasterDataFieldErrors(form, schema, false),
    [form, schema],
  );

  const visibleError = (key: string): string | undefined => {
    const err = fieldErrors[key];
    const raw = key === "code" || key === "name" ? form[key] : form.attributes[key];
    return visibleValidationError(err, String(raw ?? "").trim() !== "", showErrors);
  };

  const handleSave = () => {
    setShowErrors(true);
    const err = validateMasterDataForm(form, schema, false);
    if (err) {
      useAlertStore.getState().showValidationAlert(err);
      return;
    }
    onSaveInline();
  };

  const codeField = schema?.fields?.find((f) => f.key === "code");
  const nameField = schema?.fields?.find((f) => f.key === "name");
  const hideCodeColumn =
    selectedType === "mixers" || Boolean(codeField?.serverGenerated);
  const showNameInput = !nameField?.serverGenerated;
  const showNameColumn = showNameInput;
  const codeRequired = !hideCodeColumn && !codeField?.serverGenerated;
  const colCount =
    (hideCodeColumn ? 0 : 1) +
    (showNameColumn ? 1 : 0) +
    attributeFields.length +
    MASTER_DATA_AUDIT_COLUMN_COUNT +
    2;

  const resolveProject = (projectId: string) =>
    projectSelectOptions.find((p) => p.projectId === projectId) ??
    (() => {
      const opts = dynamicAttributeOptions?.projectId;
      const match = opts?.find((o) => o.value === projectId);
      if (!match) return null;
      return {
        projectId,
        projectName: String(match.label ?? projectId),
      };
    })();

  const projectDropdownOptions: AppDropdownOption[] = useMemo(
    () =>
      projectSelectOptions.map((project) => ({
        value: project.projectId,
        label: project.projectName || project.projectId,
      })),
    [projectSelectOptions],
  );

  const renderProjectCell = (rawProjectId: unknown) => {
    const projectId = String(rawProjectId ?? "").trim();
    if (!projectId) {
      return <Typography sx={table.bodyText}>—</Typography>;
    }
    const project = resolveProject(projectId);
    const projectName = project?.projectName?.trim() || projectId;
    return (
      <Box sx={batchTableCell.batchIdBox}>
        <icons.batchMgmt.projectId
          sx={{ ...batchTableCell.batchIdIcon, ...batchTableCell.projectIdIcon }}
        />
        <Box sx={batchTableCell.projectInfo}>
          <Typography sx={batchTableCell.projectName}>{projectName}</Typography>
          <Typography sx={batchTableCell.projectId}>{projectId}</Typography>
        </Box>
      </Box>
    );
  };

  const renderAttributeInput = (field: MasterDataFieldDef) => {
    if (field.key === "projectId") {
      const placeholder = projectSelectLoading
        ? "Loading projects..."
        : `Select ${requiredFieldLabel(getMasterDataFieldLabel(selectedType, field), Boolean(field.required))}`;
      return (
        <AppSearchableDropdown
          compact
          fullWidth
          placeholder={placeholder}
          loading={projectSelectLoading}
          value={String(form.attributes[field.key] ?? "")}
          onChange={(value) => onFormChange(field.key, value, true)}
          disabled={saving || projectSelectLoading}
          error={Boolean(visibleError(field.key))}
          helperText={visibleError(field.key)}
          options={projectDropdownOptions}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.value}>
              <Box sx={batchModal.projectOption}>
                <Typography sx={batchModal.projectOptionName}>{String(option.label)}</Typography>
                <Typography sx={batchModal.projectOptionId}>{option.value}</Typography>
              </Box>
            </Box>
          )}
          sx={cellSx}
        />
      );
    }

    const dropdownOptions = getMasterDataAttributeOptions(selectedType, field, dynamicAttributeOptions);
    if (dropdownOptions) {
      return (
        <AppSearchableDropdown
          compact
          fullWidth
          placeholder={`Select ${requiredFieldLabel(getMasterDataFieldLabel(selectedType, field), Boolean(field.required))}`}
          value={String(form.attributes[field.key] ?? "")}
          onChange={(value) => onFormChange(field.key, value, true)}
          disabled={saving}
          error={Boolean(visibleError(field.key))}
          helperText={visibleError(field.key)}
          options={dropdownOptions}
          sx={cellSx}
        />
      );
    }

    const isInteger = field.dataType === "INTEGER";
    const isNumeric =
      isInteger || field.dataType === "NUMBER" || field.dataType === "DOUBLE";
    const allowNegativeInteger = field.min == null || field.min < 0;
    const integerInputPattern = allowNegativeInteger ? /^-?\d*$/ : /^\d*$/;
    return (
      <AppTextField
        compact
        fullWidth
        type={isInteger || isNumeric ? "text" : "text"}
        placeholder={requiredFieldLabel(
          getMasterDataFieldLabel(selectedType, field),
          Boolean(field.required),
        )}
        value={form.attributes[field.key] ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (isInteger) {
            if (v === "") {
              onFormChange(field.key, "", true);
              return;
            }
            if (!integerInputPattern.test(v)) return;
            const num = Number(v);
            if (!Number.isInteger(num)) return;
            if (field.min != null && num < field.min) return;
            if (field.max != null && num > field.max) return;
            onFormChange(field.key, num, true);
          } else if (isNumeric) {
            const sanitized = sanitizeMasterDataDecimalInput(v);
            if (sanitized === null) return;
            onFormChange(field.key, sanitized, true);
          } else {
            onFormChange(field.key, v, true);
          }
        }}
        disabled={saving}
        error={Boolean(visibleError(field.key))}
        helperText={visibleError(field.key)}
        sx={cellSx}
        inputProps={{
          inputMode: isInteger ? "numeric" : isNumeric ? "decimal" : undefined,
          pattern: isInteger ? (allowNegativeInteger ? "[0-9-]*" : "[0-9]*") : undefined,
          min: !isInteger && field.min != null ? field.min : undefined,
          max: !isInteger && field.max != null ? field.max : undefined,
          step: field.dataType === "INTEGER" ? 1 : "any",
        }}
      />
    );
  };

  const attributeCellSx = (field: MasterDataFieldDef) => {
    if (field.key === "projectId") {
      return { ...table.cell, minWidth: 280, width: 280 };
    }
    if (field.key === "motorStage") {
      return { ...table.cell, minWidth: 120, width: 120, maxWidth: 140 };
    }
    return table.cell;
  };
  const attributeHeaderCellSx = (field: MasterDataFieldDef) => {
    if (field.key === "projectId") {
      return { ...table.headerCell, minWidth: 280, width: 280 };
    }
    if (field.key === "motorStage") {
      return { ...table.headerCell, minWidth: 120, width: 120, maxWidth: 140 };
    }
    return table.headerCell;
  };

  const renderInlineFields = () => {
    return (
      <TableRow sx={{ ...table.row, bgcolor: (theme) => theme.palette.action.hover }}>
        {!hideCodeColumn ? (
          <TableCell sx={table.cell}>
            <AppTextField
              compact
              fullWidth
              placeholder={requiredFieldLabel(S.TABLE.COL_CODE, codeRequired)}
              value={form.code}
              onChange={(e) => onFormChange("code", e.target.value)}
              disabled={saving}
              error={Boolean(visibleError("code"))}
              helperText={visibleError("code")}
              sx={cellSx}
            />
          </TableCell>
        ) : null}
        {showNameInput ? (
          <TableCell sx={table.cell}>
            <AppTextField
              compact
              fullWidth
              placeholder={requiredFieldLabel(S.TABLE.COL_NAME, true)}
              value={form.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              disabled={saving}
              error={Boolean(visibleError("name"))}
              helperText={visibleError("name")}
              sx={cellSx}
            />
          </TableCell>
        ) : showNameColumn ? (
          <TableCell sx={table.cell} />
        ) : null}
        {attributeFields.map((field) => (
          <TableCell key={field.key} sx={attributeCellSx(field)}>
            {renderAttributeInput(field)}
          </TableCell>
        ))}
        <MasterDataAuditRowCells table={table} />
        <TableCell sx={table.cell}>
          <MasterDataEnableDisableField
            checked={Boolean(form.isActive)}
            disabled={saving}
            confirmName={
              !showNameInput && form.attributes.motorStage !== "" && form.attributes.motorStage != null
                ? `Stage ${form.attributes.motorStage}`
                : form.name || form.code || "record"
            }
            labelVariant="caption"
            minWidth={72}
            onChange={(isActive) => onFormChange("isActive", isActive)}
          />
        </TableCell>
        <TableCell sx={table.cellActionsWrapper}>
          <Box sx={tableCell.actionsBox}>
            <Button size="small" onClick={onCancelInline} disabled={saving}>
              {S.FORM.CANCEL}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={t.pageHeader?.newProjectButton}
            >
              {saving ? S.FORM.SAVING : S.FORM.SAVE}
            </Button>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Paper elevation={0} sx={table.paper}>
      <MasterDataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
        refreshDisabled={refreshDisabled}
        t={t}
        showMotorStageFilters={selectedType === "motor-stages"}
        projectFilter={projectFilter}
        onProjectFilterChange={onProjectFilterChange}
        projectOptions={projectDropdownOptions}
        projectLoading={projectSelectLoading}
        motorStageFilter={motorStageFilter}
        onMotorStageFilterChange={onMotorStageFilterChange}
        motorStageOptions={motorStageFilterOptions}
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
        <Table size="small" sx={{ ...(table.tableRoot ?? {}), borderSpacing: 0 }}>
          <TableHead>
            <TableRow sx={table.headerRow}>
              {!hideCodeColumn ? (
                <TableCell sx={table.headerCell}>
                  {requiredFieldLabel(S.TABLE.COL_CODE, codeRequired)}
                </TableCell>
              ) : null}
              {showNameColumn ? (
                <TableCell sx={table.headerCell}>
                  {requiredFieldLabel(S.TABLE.COL_NAME, showNameInput)}
                </TableCell>
              ) : null}
              {attributeFields.map((field) => (
                <TableCell key={field.key} sx={attributeHeaderCellSx(field)}>
                  {requiredFieldLabel(
                    getMasterDataFieldLabel(selectedType, field),
                    Boolean(field.required),
                  )}
                </TableCell>
              ))}
              <MasterDataAuditHeaderCells table={table} />
              <TableCell sx={table.headerCell}>{S.TABLE.COL_ACTIVE}</TableCell>
              <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>
                {S.TABLE.COL_ACTIONS}
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <SkeletonRow key={i} columns={colCount} sx={table.cell} />
              ))
            ) : rows.length === 0 && inlineMode !== "create" ? (
              <TableRow>
                <TableCell colSpan={colCount} sx={table.emptyCell}>
                  <icons.Inventory sx={table.emptyIcon} />
                  <Typography sx={table.emptyText}>{S.TABLE.EMPTY}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} sx={table.row}>
                  {!hideCodeColumn ? (
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.code}</Typography>
                    </TableCell>
                  ) : null}
                  {showNameColumn ? (
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.name}</Typography>
                    </TableCell>
                  ) : null}
                  {attributeFields.map((field) => (
                    <TableCell key={field.key} sx={attributeCellSx(field)}>
                      {field.key === "projectId" ? (
                        renderProjectCell(row.attributes?.[field.key])
                      ) : (
                        <Typography sx={table.bodyText}>
                          {formatMasterDataAttributeValue(
                            selectedType,
                            field,
                            row.attributes?.[field.key],
                            dynamicAttributeOptions,
                          )}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                  <MasterDataAuditRowCells record={row} table={table} />
                  <TableCell sx={table.cell}>
                    <MasterDataActiveStatusChip isActive={row.isActive} />
                  </TableCell>
                  <TableCell sx={table.cellActionsWrapper}>
                    <Box sx={tableCell.actionsBox}>
                      <MasterDataActiveSwitch
                        isActive={row.isActive}
                        disabled={inlineMode != null || saving || togglingStatus}
                        onToggle={(nextActive) => onToggleActive(row, nextActive)}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}

            {inlineMode === "create" && !loading ? renderInlineFields() : null}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={table.divider} />
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25]}
        sx={table.pagination}
      />
    </Paper>
  );
};

export default MasterDataList;
