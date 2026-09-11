import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
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
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import AppTextField from "@ui/components/common/AppTextField";
import AppDropdown from "@ui/components/common/AppDropdown";
import MasterDataTableToolbar from "./components/MasterDataTableToolbar";
import MasterDataActiveSwitch, { masterDataActiveSwitchSx } from "./components/MasterDataActiveSwitch";
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
import { getMasterDataFieldLabel } from "./masterDataLabels";
import {
  getMasterDataFieldErrors,
  type MasterDataFieldDef,
  type MasterDataFormState,
  type MasterDataRecord,
  type MasterDataTypeDescriptor,
} from "@data/models/admin/MasterData/MasterDataModel";

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
    if (!err) return undefined;
    const raw = key === "code" || key === "name" ? form[key] : form.attributes[key];
    const hasValue = String(raw ?? "").trim() !== "";
    const isRequiredOnly = err.endsWith(" is required");
    if (isRequiredOnly) return showErrors ? err : undefined;
    return hasValue || showErrors ? err : undefined;
  };

  const handleSave = () => {
    setShowErrors(true);
    onSaveInline();
  };

  const hideCodeColumn =
    selectedType === "mixers" ||
    Boolean(schema?.fields?.find((f) => f.key === "code")?.serverGenerated);
  const colCount =
    2 + attributeFields.length + 1 + MASTER_DATA_AUDIT_COLUMN_COUNT + (hideCodeColumn ? 0 : 1); // name, attrs..., active, audit, actions, [code]

  const renderAttributeInput = (field: MasterDataFieldDef) => {
    const dropdownOptions = getMasterDataAttributeOptions(selectedType, field, dynamicAttributeOptions);
    if (dropdownOptions) {
      return (
        <AppDropdown
          compact
          fullWidth
          placeholder={`Select ${getMasterDataFieldLabel(selectedType, field)}`}
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

    const isNumeric =
      field.dataType === "INTEGER" || field.dataType === "NUMBER" || field.dataType === "DOUBLE";
    return (
      <AppTextField
        compact
        fullWidth
        type={isNumeric ? "number" : "text"}
        placeholder={getMasterDataFieldLabel(selectedType, field)}
        value={form.attributes[field.key] ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (isNumeric) {
            onFormChange(field.key, v === "" ? "" : Number(v), true);
          } else {
            onFormChange(field.key, v, true);
          }
        }}
        disabled={saving}
        error={Boolean(visibleError(field.key))}
        helperText={visibleError(field.key)}
        sx={cellSx}
        inputProps={{
          min: field.min ?? undefined,
          max: field.max ?? undefined,
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
            placeholder={S.TABLE.COL_CODE}
            value={form.code}
            onChange={(e) => onFormChange("code", e.target.value)}
            disabled={saving}
            error={Boolean(visibleError("code"))}
            helperText={visibleError("code")}
            sx={cellSx}
          />
        </TableCell>
      ) : null}
      <TableCell sx={table.cell}>
        <AppTextField
          compact
          fullWidth
          placeholder={S.TABLE.COL_NAME}
          value={form.name}
          onChange={(e) => onFormChange("name", e.target.value)}
          disabled={saving}
          error={Boolean(visibleError("name"))}
          helperText={visibleError("name")}
          sx={cellSx}
        />
      </TableCell>
      {attributeFields.map((field) => (
        <TableCell key={field.key} sx={table.cell}>
          {renderAttributeInput(field)}
        </TableCell>
      ))}
      <MasterDataAuditRowCells table={table} />
      <TableCell sx={table.cell}>
        <Switch
          size="small"
          checked={Boolean(form.isActive)}
          onChange={(e) => onFormChange("isActive", e.target.checked)}
          disabled={saving}
          sx={masterDataActiveSwitchSx(Boolean(form.isActive))}
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
                <TableCell sx={table.headerCell}>{S.TABLE.COL_CODE}</TableCell>
              ) : null}
              <TableCell sx={table.headerCell}>{S.TABLE.COL_NAME}</TableCell>
              {attributeFields.map((field) => (
                <TableCell key={field.key} sx={table.headerCell}>
                  {getMasterDataFieldLabel(selectedType, field)}
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
                  <TableCell sx={table.cell}>
                    <Typography sx={table.bodyText}>{row.name}</Typography>
                  </TableCell>
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
