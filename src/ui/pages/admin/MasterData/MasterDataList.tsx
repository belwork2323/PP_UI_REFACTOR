import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import AppTextField from "@ui/components/common/AppTextField";
import AppSearchableDropdown from "@ui/components/common/AppSearchableDropdown";
import MasterDataTableToolbar from "./components/MasterDataTableToolbar";
import MasterDataActiveSwitch from "./components/MasterDataActiveSwitch";
import MasterDataEnableDisableField from "./components/MasterDataEnableDisableField";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import {
  MASTER_DATA_AUDIT_COLUMN_COUNT,
  MasterDataAuditHeaderCells,
  MasterDataAuditRowCells,
} from "./components/MasterDataAuditColumns";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";
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
}: Props) => {
  const { table, tableCell } = t;
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
  const showNameColumn = showNameInput || selectedType === "motor-stages";
  const codeRequired = !hideCodeColumn && !codeField?.serverGenerated;
  const colCount =
    (hideCodeColumn ? 0 : 1) +
    (showNameColumn ? 1 : 0) +
    attributeFields.length +
    MASTER_DATA_AUDIT_COLUMN_COUNT +
    2;

  const renderAttributeInput = (field: MasterDataFieldDef) => {
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
        type={isInteger ? "text" : isNumeric ? "number" : "text"}
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
            if (v === "") {
              onFormChange(field.key, "", true);
              return;
            }
            const num = Number(v);
            if (!Number.isFinite(num)) return;
            if (field.min != null && num < field.min) return;
            if (field.max != null && num > field.max) return;
            onFormChange(field.key, num, true);
          } else {
            onFormChange(field.key, v, true);
          }
        }}
        disabled={saving}
        error={Boolean(visibleError(field.key))}
        helperText={visibleError(field.key)}
        sx={cellSx}
        inputProps={{
          inputMode: isInteger ? "numeric" : undefined,
          pattern: isInteger ? (allowNegativeInteger ? "[0-9-]*" : "[0-9]*") : undefined,
          min: !isInteger && field.min != null ? field.min : undefined,
          max: !isInteger && field.max != null ? field.max : undefined,
          step: field.dataType === "INTEGER" ? 1 : "any",
        }}
      />
    );
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
        <TableCell key={field.key} sx={table.cell}>
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
                <TableCell key={field.key} sx={table.headerCell}>
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
                    <TableCell key={field.key} sx={table.cell}>
                      <Typography sx={table.bodyText}>
                        {formatMasterDataAttributeValue(
                          selectedType,
                          field,
                          row.attributes?.[field.key],
                          dynamicAttributeOptions,
                        )}
                      </Typography>
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
