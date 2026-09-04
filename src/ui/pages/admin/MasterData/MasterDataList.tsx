import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import AppTextField from "@ui/components/common/AppTextField";
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
  inlineMode: "create" | "edit" | null;
  editTarget: MasterDataRecord | null;
  form: MasterDataFormState;
  saving: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  t: any;
  onFormChange: (key: string, value: string | number | boolean, isAttribute?: boolean) => void;
  onEdit: (row: MasterDataRecord) => void;
  onDisable: (row: MasterDataRecord) => void;
  onSaveInline: () => void;
  onCancelInline: () => void;
  onPageChange: (event: unknown, page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const MasterDataList = ({
  rows,
  loading,
  page,
  totalCount,
  rowsPerPage,
  attributeFields,
  schema,
  inlineMode,
  editTarget,
  form,
  saving,
  search,
  onSearchChange,
  t,
  onFormChange,
  onEdit,
  onDisable,
  onSaveInline,
  onCancelInline,
  onPageChange,
  onRowsPerPageChange,
}: Props) => {
  const { table, tableCell } = t;
  const searchTheme = t.batchListShell?.inputs;
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
  const isEdit = inlineMode === "edit";

  useEffect(() => {
    if (inlineMode) setShowErrors(false);
  }, [inlineMode, editTarget?.id]);

  const fieldErrors = useMemo(
    () => getMasterDataFieldErrors(form, schema, isEdit),
    [form, schema, isEdit],
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

  const colCount = 3 + attributeFields.length + 1; // code, name, attrs..., active, actions

  const renderInlineFields = () => {
    const codeServerGenerated = Boolean(schema?.fields?.find((f) => f.key === "code")?.serverGenerated);
    return (
    <TableRow sx={{ ...table.row, bgcolor: (theme) => theme.palette.action.hover }}>
      <TableCell sx={table.cell}>
        {codeServerGenerated ? (
          <Typography sx={{ ...table.bodyText, color: isEdit ? "text.primary" : "text.secondary", fontStyle: isEdit ? "normal" : "italic" }}>
            {isEdit ? form.code || "—" : "Auto"}
          </Typography>
        ) : (
          <AppTextField
            compact
            fullWidth
            placeholder={S.TABLE.COL_CODE}
            value={form.code}
            onChange={(e) => onFormChange("code", e.target.value)}
            disabled={saving || isEdit}
            error={Boolean(visibleError("code"))}
            helperText={visibleError("code")}
            sx={cellSx}
          />
        )}
      </TableCell>
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
      {attributeFields.map((field) => {
        const isNumeric = field.dataType === "INTEGER" || field.dataType === "NUMBER" || field.dataType === "DOUBLE";
        const readOnly = Boolean(isEdit && field.readOnlyOnUpdate);
        return (
        <TableCell key={field.key} sx={table.cell}>
          <AppTextField
            compact
            fullWidth
            type={isNumeric ? "number" : "text"}
            placeholder={field.label}
            value={form.attributes[field.key] ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (isNumeric) {
                onFormChange(field.key, v === "" ? "" : Number(v), true);
              } else {
                onFormChange(field.key, v, true);
              }
            }}
            disabled={saving || readOnly}
            error={Boolean(visibleError(field.key))}
            helperText={visibleError(field.key)}
            sx={cellSx}
            inputProps={{
              min: field.min ?? undefined,
              max: field.max ?? undefined,
              step: field.dataType === "INTEGER" ? 1 : "any",
            }}
          />
        </TableCell>
        );
      })}
      <TableCell sx={table.cell}>
        <Switch
          size="small"
          checked={Boolean(form.isActive)}
          onChange={(e) => onFormChange("isActive", e.target.checked)}
          disabled={saving}
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
      <Box sx={t.tableSearchBar}>
        <TextField
          size="small"
          fullWidth
          margin="none"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
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
        <Table size="small" sx={{ ...(table.tableRoot ?? {}), borderSpacing: 0 }}>
          <TableHead>
            <TableRow sx={table.headerRow}>
              <TableCell sx={table.headerCell}>{S.TABLE.COL_CODE}</TableCell>
              <TableCell sx={table.headerCell}>{S.TABLE.COL_NAME}</TableCell>
              {attributeFields.map((field) => (
                <TableCell key={field.key} sx={table.headerCell}>
                  {field.label}
                </TableCell>
              ))}
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
              rows.map((row) =>
                inlineMode === "edit" && editTarget?.id === row.id ? (
                  <React.Fragment key={row.id}>{renderInlineFields()}</React.Fragment>
                ) : (
                  <TableRow key={row.id} sx={table.row}>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.code}</Typography>
                    </TableCell>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.name}</Typography>
                    </TableCell>
                    {attributeFields.map((field) => (
                      <TableCell key={field.key} sx={table.cell}>
                        <Typography sx={table.bodyText}>
                          {row.attributes?.[field.key] == null || row.attributes?.[field.key] === ""
                            ? "—"
                            : String(row.attributes[field.key])}
                        </Typography>
                      </TableCell>
                    ))}
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
                            onClick={() => onEdit(row)}
                            disabled={inlineMode != null}
                            sx={tableCell.editButton}
                          >
                            <icons.Edit sx={tableCell.editIcon} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={S.TABLE.DISABLE}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={!row.isActive || inlineMode != null}
                              onClick={() => onDisable(row)}
                              sx={tableCell.deleteButton}
                            >
                              <icons.Delete sx={tableCell.deleteIcon} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ),
              )
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
