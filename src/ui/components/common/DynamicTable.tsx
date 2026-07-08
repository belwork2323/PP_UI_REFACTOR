import {
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { SxProps, Theme } from "@mui/material";
import type { SchemaTableBlock, SchemaTableColumn, SchemaTableColumnSlot, SchemaDataSource } from "../../../schema-engine/types";
import { applyFormulaColumns } from "../../../schema-engine/rules/formulaEval";
import { flattenTableColumns, isColumnGroup } from "../../../schema-engine/utils/schemaUtils";
import {
  buildRowApiContext,
  getDependentColumnIds,
  resolveDataSourceApi,
  type SchemaApiContext,
} from "../../../schema-engine/rules/apiDependency";
import {
  commitPickerRow,
  computeExpandedGroupCellSpans,
  countExpandedRowsInGroup,
  findLastPickerRow,
  getMergeExpandedColumns,
  getTableCommitGroup,
  hasTableCommitGroup,
  isCommitAddReady,
  isCommitGroupDividerBefore,
  isExpandedColumnReadonly,
  isPickerColumnVisible,
  isPickerRowAfterGroups,
  removeTableGroup,
  renumberTableRows,
  resolveDerivedColumnValue,
} from "../../../schema-engine/rules/tableCommitGroup";
import type { SchemaThemeTokens } from "../../../schema-engine/utils/schemaUtils";
import {
  isPresetLockedCell,
  isPresetLockedRow,
  isExpandedRow,
  isPickerRow,
  resolveDynamicColumn,
} from "../../../schema-engine/utils/tableRowUtils";
import SchemaApiDropdown from "./SchemaApiDropdown";
import { DateField, DateTimeField, TimeField } from "./DateField";
import FormulaCell from "./FormulaCell";
import SchemaFileField from "./SchemaFileField";
import SchemaReadonlyDisplay from "./SchemaReadonlyDisplay";

type DynamicTableProps = {
  config: SchemaTableBlock;
  rows: Record<string, unknown>[];
  onChange: (rows: Record<string, unknown>[]) => void;
  readOnly?: boolean;
  theme?: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  allowAddColumn?: boolean;
  onAddColumn?: () => void;
  allowDeleteColumn?: boolean;
  deletableColumnIds?: string[];
  onDeleteColumn?: (columnId: string) => void;
};

const spacingMap: Record<string, number> = { xs: 0.5, sm: 1, md: 1.5, lg: 2, xl: 3 };

const parseCssLength = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveColumnMinWidth = (col: SchemaTableColumn): number => {
  if (col.ui?.minWidth) return parseCssLength(col.ui.minWidth, 100);
  if (col.ui?.width) return parseCssLength(col.ui.width, 100);

  if (col.id === "PARAMETER") return 220;
  if (col.id === "INGREDIENT") return 180;
  if (col.id === "SPECIFICATION") return 120;
  if (col.id === "LOT_BATCH_NUMBER") return 190;
  if (col.id === "REMARKS") return 160;

  switch (col.fieldType) {
    case "serial":
      return 52;
    case "number":
    case "decimal":
      return 96;
    case "date":
      return 156;
    case "time":
      return 116;
    case "datetime":
      return 188;
    case "dropdown":
      return col.label.length > 24 ? 180 : 140;
    case "file":
    case "image":
      return 220;
    case "textarea":
      return 180;
    default:
      return 120;
  }
};

const ACTIONS_COLUMN_WIDTH = 88;

const resolveTableMinWidth = (columns: SchemaTableColumn[], allowDelete: boolean) => {
  const columnWidth = columns.reduce((sum, col) => sum + resolveColumnMinWidth(col), 0);
  return columnWidth + (allowDelete ? ACTIONS_COLUMN_WIDTH : 0);
};

const resolveColumnWidthPercent = (
  columnMinWidth: number,
  totalMinWidth: number,
) => `${((columnMinWidth / totalMinWidth) * 100).toFixed(4)}%`;

const cellSx = (col: SchemaTableColumn) => {
  const minWidth = resolveColumnMinWidth(col);
  return {
    ...(col.ui?.width ? { width: col.ui.width } : { minWidth }),
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    verticalAlign: "top" as const,
  };
};

const resolveColumnToolbarSx = (config: SchemaTableBlock): SxProps<Theme> => {
  const position = config.columnActions?.position ?? "top-right";
  const ui = config.columnActions?.ui;
  const sx: Record<string, unknown> = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: position.includes("right") ? "flex-end" : "flex-start",
  };

  if (ui?.gap) sx.gap = spacingMap[ui.gap] ?? 1;
  if (ui?.padding) sx.p = spacingMap[ui.padding] ?? 1;
  if (ui?.justifyContent) sx.justifyContent = ui.justifyContent;
  if (ui?.alignItems) sx.alignItems = ui.alignItems;
  if (ui?.sx) Object.assign(sx, ui.sx);

  return sx as SxProps<Theme>;
};

const isToolbarTop = (config: SchemaTableBlock) =>
  (config.columnActions?.position ?? "top-right").startsWith("top");

const isFormulaCol = (col: SchemaTableColumn) =>
  col.fieldType === "formula" || Boolean(col.formula?.expression);

const isReadonlyCol = (col: SchemaTableColumn) =>
  col.readonly || col.fieldType === "static" || col.fieldType === "serial" || isFormulaCol(col);

const isDisplayOnlyCol = (col: SchemaTableColumn) =>
  col.fieldType === "static" || col.fieldType === "serial" || isFormulaCol(col);

const actionsColumnSx = {
  width: ACTIONS_COLUMN_WIDTH,
  minWidth: ACTIONS_COLUMN_WIDTH,
  maxWidth: ACTIONS_COLUMN_WIDTH,
};

const commitGroupDividerSx = (theme?: SchemaThemeTokens) => ({
  borderTop: `2px solid ${theme?.border ?? "#B0BEC5"}`,
  "& > td": {
    pt: 1.25,
    borderTop: "inherit",
  },
});

const commitGroupBlockSx = {
  background: "rgba(21,101,192,0.035)",
  "& > td": {
    borderBottom: "1px solid rgba(21,101,192,0.08)",
  },
};

const renderFlatHeaderCells = (
  columns: SchemaTableColumnSlot[],
  options?: {
    deletableColumnIds?: Set<string>;
    allowDeleteColumn?: boolean;
    onDeleteColumn?: (columnId: string) => void;
    readOnly?: boolean;
  },
) =>
  columns.flatMap((slot) => {
    if (isColumnGroup(slot)) {
      return slot.columns.map((col) => (
        <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: "0.72rem", ...cellSx(col) }}>
          {renderColumnHeaderLabel(col, options)}
        </TableCell>
      ));
    }
    return (
      <TableCell key={slot.id} sx={{ fontWeight: 700, fontSize: "0.72rem", ...cellSx(slot) }}>
        {renderColumnHeaderLabel(slot, options)}
      </TableCell>
    );
  });

const renderColumnHeaderLabel = (
  col: SchemaTableColumn,
  options?: {
    deletableColumnIds?: Set<string>;
    allowDeleteColumn?: boolean;
    onDeleteColumn?: (columnId: string) => void;
    readOnly?: boolean;
  },
) => {
  const canDelete =
    !options?.readOnly &&
    options?.allowDeleteColumn &&
    options.deletableColumnIds?.has(col.id) &&
    options.onDeleteColumn;

  if (!canDelete) {
    return (
      <>
        {col.label}
        {col.unit ? ` (${col.unit})` : ""}
      </>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.5,
        width: "100%",
        minHeight: 28,
      }}
    >
      <Box
        component="span"
        sx={{ flex: 1, lineHeight: 1.3, fontWeight: 700, fontSize: "inherit", pr: 0.5 }}
      >
        {col.label}
        {col.unit ? ` (${col.unit})` : ""}
      </Box>
      <IconButton
        size="small"
        color="error"
        aria-label={`Delete ${col.label} column`}
        onClick={() => options.onDeleteColumn?.(col.id)}
        sx={{
          flexShrink: 0,
          p: 0.25,
          ml: "auto",
          alignSelf: "center",
        }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
};

const renderGroupedSubHeaderCells = (
  columns: SchemaTableColumnSlot[],
  options?: {
    deletableColumnIds?: Set<string>;
    allowDeleteColumn?: boolean;
    onDeleteColumn?: (columnId: string) => void;
    readOnly?: boolean;
  },
) =>
  columns.flatMap((slot) => {
    if (!isColumnGroup(slot)) return [];
    return slot.columns.map((col) => (
      <TableCell key={col.id} sx={{ fontWeight: 700, fontSize: "0.72rem", ...cellSx(col) }}>
        {renderColumnHeaderLabel(col, options)}
      </TableCell>
    ));
  });

const renderGroupHeaderRow = (columns: SchemaTableColumnSlot[], allowDelete: boolean) => (
  <TableRow sx={{ background: "rgba(21,101,192,0.06)" }}>
    {columns.map((slot) => {
      if (isColumnGroup(slot)) {
        return (
          <TableCell
            key={slot.id}
            colSpan={slot.columns.length}
            align="center"
            sx={{ fontWeight: 700, fontSize: "0.72rem" }}
          >
            {slot.label}
          </TableCell>
        );
      }
      return (
        <TableCell key={slot.id} rowSpan={2} sx={{ fontWeight: 700, fontSize: "0.72rem", ...cellSx(slot) }}>
          {slot.label}
          {slot.unit ? ` (${slot.unit})` : ""}
        </TableCell>
      );
    })}
    {allowDelete ? (
      <TableCell rowSpan={2} sx={{ ...actionsColumnSx, fontWeight: 700, fontSize: "0.72rem" }}>
        Actions
      </TableCell>
    ) : null}
  </TableRow>
);


const isCompactWrapDropdown = (col: SchemaTableColumn) => col.id === "INGREDIENT";

const renderCellEditor = (
  col: SchemaTableColumn,
  value: string,
  onChange: (next: string) => void,
  readOnly: boolean,
  apiContext?: SchemaApiContext,
  onOptionsCountChange?: (count: number) => void,
) => {
  if (readOnly && col.fieldType === "dropdown" && col.dataSource) {
    return (
      <SchemaApiDropdown
        value={value}
        onChange={onChange}
        dataSource={col.dataSource}
        apiContext={apiContext}
        disabled
        compact
        compactWrap={isCompactWrapDropdown(col)}
        placeholder={col.ui?.placeholder}
        onOptionsCountChange={onOptionsCountChange}
      />
    );
  }

  if (isDisplayOnlyCol(col)) {
    return <FormulaCell value={value} unit={col.unit} />;
  }

  const cellDisabled = readOnly || col.readonly === true;

  switch (col.fieldType) {
    case "dropdown":
      return (
        <SchemaApiDropdown
          value={value}
          onChange={onChange}
          dataSource={col.dataSource}
          apiContext={apiContext}
          disabled={cellDisabled}
          compact
          compactWrap={isCompactWrapDropdown(col)}
          placeholder={col.ui?.placeholder}
          onOptionsCountChange={onOptionsCountChange}
        />
      );
    case "date":
      return <DateField value={value} onChange={onChange} disabled={cellDisabled} compact />;
    case "time":
      return <TimeField value={value} onChange={onChange} disabled={cellDisabled} compact />;
    case "datetime":
      return <DateTimeField value={value} onChange={onChange} disabled={cellDisabled} compact />;
    case "textarea":
      return (
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={value}
          disabled={cellDisabled}
          onChange={(e) => onChange(e.target.value)}
          inputProps={{ style: { fontSize: "0.78rem" } }}
          sx={{ minWidth: 140 }}
        />
      );
    case "file":
    case "image":
      return (
        <SchemaFileField
          value={value}
          onChange={onChange}
          disabled={cellDisabled}
          compact
          accept={col.fieldType === "image" ? "image/*,video/*" : "image/*,video/*,application/pdf"}
          emptyLabel={col.label || "Upload"}
          multiple
        />
      );
    case "number":
    case "decimal":
      return (
        <TextField
          size="small"
          fullWidth
          type="number"
          value={value}
          disabled={cellDisabled}
          onChange={(e) => onChange(e.target.value)}
          inputProps={{ style: { fontSize: "0.78rem" } }}
          sx={{ minWidth: 80 }}
        />
      );
    default:
      return (
        <TextField
          size="small"
          fullWidth
          value={value}
          disabled={cellDisabled}
          onChange={(e) => onChange(e.target.value)}
          inputProps={{ style: { fontSize: "0.78rem" } }}
          sx={{ minWidth: 120 }}
        />
      );
  }
};

const DynamicTable = ({
  config,
  rows,
  onChange,
  readOnly = false,
  theme,
  apiContext,
  allowAddColumn = false,
  onAddColumn,
  allowDeleteColumn = false,
  deletableColumnIds = [],
  onDeleteColumn,
}: DynamicTableProps) => {
  const flatColumns = flattenTableColumns(config.columns);
  const hasColumnGroups = config.columns.some(isColumnGroup);
  const autoKey = config.rows?.autoIncrementKey ?? "srNo";
  const commitGroup = getTableCommitGroup(config);
  const isCommitGroupMode = hasTableCommitGroup(config);
  const mergeExpandedColumns = commitGroup ? getMergeExpandedColumns(commitGroup) : [];
  const expandedGroupCellSpans =
    isCommitGroupMode && mergeExpandedColumns.length
      ? computeExpandedGroupCellSpans(rows, mergeExpandedColumns)
      : new Map();
  const [pickerOptionCounts, setPickerOptionCounts] = useState<Record<string, number>>({});
  const pickerRow = findLastPickerRow(rows);
  const primaryPickerColumn = commitGroup?.pickerColumns[0];
  const pickerMaterialValue = pickerRow ? String(pickerRow[primaryPickerColumn ?? ""] ?? "") : "";

  useEffect(() => {
    const dependentPickerColumns = commitGroup?.pickerColumns.slice(1) ?? [];
    if (!dependentPickerColumns.length) return;
    setPickerOptionCounts((prev) => {
      const next = { ...prev };
      dependentPickerColumns.forEach((columnId) => {
        delete next[columnId];
      });
      return next;
    });
  }, [pickerMaterialValue, commitGroup]);

  const handlePickerOptionCountChange = useCallback((columnId: string, count: number) => {
    setPickerOptionCounts((prev) => {
      if (prev[columnId] === count) return prev;
      return { ...prev, [columnId]: count };
    });
  }, []);
  const allowAdd = config.rows?.allowAdd !== false && !readOnly;
  const allowDelete = config.rows?.allowDelete !== false && !readOnly;
  const deletableIds = new Set(deletableColumnIds);
  const headerOptions = {
    deletableColumnIds: deletableIds,
    allowDeleteColumn,
    onDeleteColumn,
    readOnly,
  };
  const toolbarTop = isToolbarTop(config);
  const addColumnLabel = config.columnActions?.addLabel ?? "Add Column";
  const showColumnToolbar = allowAddColumn && onAddColumn && !readOnly;
  const tableMinWidth = resolveTableMinWidth(flatColumns, allowDelete);
  const columnMinWidths = flatColumns.map((col) => resolveColumnMinWidth(col));

  const renderColumnToolbar = () =>
    showColumnToolbar ? (
      <Stack direction="row" sx={resolveColumnToolbarSx(config)}>
        <Button
          size="small"
          variant="outlined"
          onClick={onAddColumn}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {addColumnLabel}
        </Button>
      </Stack>
    ) : null;

  const updateCell = (rowIndex: number, colId: string, value: string) => {
    const changedColumn = flatColumns.find((col) => col.id === colId);
    const dependentColumnIds = getDependentColumnIds(flatColumns, colId);
    const nextRows = rows.map((row, idx) => {
      if (idx !== rowIndex) return row;
      const updated: Record<string, unknown> = { ...row, [colId]: value };
      dependentColumnIds.forEach((dependentId) => {
        updated[dependentId] = "";
      });
      if (changedColumn?.derive?.sourceField) {
        const targetColumn = changedColumn.derive.targetColumn;
        if (targetColumn) updated[targetColumn] = "";
      }
      return applyFormulaColumns(updated, flatColumns);
    });
    onChange(nextRows);

    if (changedColumn?.derive && value) {
      const rowApiContext = buildRowApiContext(apiContext, nextRows[rowIndex] ?? {});
      void resolveDerivedColumnValue(changedColumn, value, rowApiContext).then((derivedValue) => {
        if (!derivedValue || !changedColumn.derive?.targetColumn) return;
        onChange(
          nextRows.map((row, idx) =>
            idx === rowIndex
              ? applyFormulaColumns({ ...row, [changedColumn.derive!.targetColumn!]: derivedValue }, flatColumns)
              : row,
          ),
        );
      });
    }
  };

  const handleRemoveGroup = (groupId: string) => {
    onChange(removeTableGroup(rows, groupId, flatColumns, autoKey));
  };

  const addRow = () => {
    if (isCommitGroupMode && commitGroup) {
      void commitPickerRow(config, rows, apiContext, flatColumns, autoKey, pickerOptionCounts).then((nextRows) => {
        if (nextRows) onChange(nextRows);
      });
      return;
    }

    const row: Record<string, unknown> = { [autoKey]: rows.length + 1 };
    flatColumns.forEach((col) => {
      if (col.fieldType !== "serial") row[col.id] = "";
    });
    onChange([...rows, applyFormulaColumns(row, flatColumns)]);
  };

  const removeRow = (rowIndex: number) => {
    const row = rows[rowIndex];
    const groupId = row._groupId ? String(row._groupId) : "";

    if (groupId && row._rowType === "header") {
      handleRemoveGroup(groupId);
      return;
    }

    if (isExpandedRow(row) && groupId && countExpandedRowsInGroup(rows, groupId) <= 1) {
      handleRemoveGroup(groupId);
      return;
    }

    if (isPickerRow(row) && rows.filter(isPickerRow).length <= 1) {
      return;
    }

    const minRows = isCommitGroupMode ? 1 : (config.rows?.min ?? 0);
    if (rows.length <= minRows) return;

    onChange(
      renumberTableRows(
        rows.filter((_, idx) => idx !== rowIndex),
        autoKey,
      ),
    );
  };

  const addRowDisabled =
    isCommitGroupMode && commitGroup
      ? !isCommitAddReady(commitGroup, pickerRow, pickerOptionCounts)
      : false;
  const addRowLabel =
    config.rows?.addLabel ?? commitGroup?.addLabel ?? "Add Row";

  return (
    <TableContainer
      sx={{
        width: "100%",
        overflowX: "auto",
        border: `1px solid ${theme?.border ?? "#D5D8DC"}`,
        borderRadius: 2,
      }}
    >
      {toolbarTop && showColumnToolbar ? renderColumnToolbar() : null}
      {config.label ?? config.title ? (
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: theme?.primary, p: 1 }}>
          {config.label ?? config.title}
        </Typography>
      ) : null}
      <Table
        size="small"
        sx={{
          tableLayout: "fixed",
          width: "100%",
          minWidth: tableMinWidth,
        }}
      >
        <colgroup>
          {flatColumns.map((col, index) => (
            <col
              key={col.id}
              style={{ width: resolveColumnWidthPercent(columnMinWidths[index], tableMinWidth) }}
            />
          ))}
          {allowDelete ? (
            <col style={{ width: resolveColumnWidthPercent(ACTIONS_COLUMN_WIDTH, tableMinWidth) }} />
          ) : null}
        </colgroup>
        <TableHead>
          {hasColumnGroups ? (
            <>
              {renderGroupHeaderRow(config.columns, allowDelete)}
              <TableRow sx={{ background: "rgba(21,101,192,0.06)" }}>
                {renderGroupedSubHeaderCells(config.columns, headerOptions)}
              </TableRow>
            </>
          ) : (
            <TableRow sx={{ background: "rgba(21,101,192,0.06)" }}>
              {renderFlatHeaderCells(config.columns, headerOptions)}
              {allowDelete ? (
                <TableCell sx={{ ...actionsColumnSx, fontWeight: 700, fontSize: "0.72rem" }}>
                  Actions
                </TableCell>
              ) : null}
            </TableRow>
          )}
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => {
            if (row._rowType === "header") {
              const groupId = row._groupId ? String(row._groupId) : "";
              return (
                <TableRow
                  key={rowIndex}
                  sx={{
                    ...commitGroupBlockSx,
                    ...(isCommitGroupDividerBefore(rows, rowIndex) ? commitGroupDividerSx(theme) : {}),
                    background: "rgba(21,101,192,0.06)",
                  }}
                >
                  <TableCell
                    colSpan={flatColumns.length + (allowDelete ? 1 : 0)}
                    sx={{ fontWeight: 700, fontSize: "0.78rem", color: theme?.primary }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <span>{String(row._headerLabel ?? "")}</span>
                      {allowDelete && groupId ? (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveGroup(groupId)}
                          sx={{ textTransform: "none", fontWeight: 700, flexShrink: 0 }}
                        >
                          {commitGroup?.removeGroupLabel ?? "Remove Group"}
                        </Button>
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            }

            const rowPresetLocked = isPresetLockedRow(row, rowIndex, config.rows?.presetRows);
            const isPicker = isCommitGroupMode && isPickerRow(row);
            const isExpanded = isCommitGroupMode && isExpandedRow(row);
            const rowGroupId = row._groupId ? String(row._groupId) : "";
            const showGroupDivider =
              isCommitGroupMode &&
              (isCommitGroupDividerBefore(rows, rowIndex) || isPickerRowAfterGroups(rows, rowIndex));

            return (
              <TableRow
                key={rowIndex}
                sx={{
                  ...(isExpanded ? commitGroupBlockSx : {}),
                  ...(showGroupDivider ? commitGroupDividerSx(theme) : {}),
                  ...(isPicker ? { background: "rgba(21,101,192,0.02)" } : {}),
                }}
              >
                {flatColumns.map((col) => {
                  const mergeSpan = expandedGroupCellSpans.get(`${rowIndex}:${col.id}`);
                  if (mergeSpan?.isContinuation) return null;

                  if (col.fieldType === "serial") {
                    return (
                      <TableCell key={col.id} sx={cellSx(col)}>
                        {isPicker ? "" : String(row[autoKey] ?? rowIndex + 1)}
                      </TableCell>
                    );
                  }

                  if (isPicker && commitGroup && !isPickerColumnVisible(commitGroup, col.id)) {
                    return <TableCell key={col.id} />;
                  }

                  const nestedOptionsApi =
                    col.dataSource?.type === "api"
                      ? resolveDataSourceApi(col.dataSource as SchemaDataSource & Record<string, unknown>)
                      : null;

                  const nestedParentColumnId = nestedOptionsApi?.parentMatchContextKey?.trim();
                  const nestedParentSelected = nestedParentColumnId
                    ? String(row[nestedParentColumnId] ?? "").trim() !== ""
                    : false;

                  if (
                    isPicker &&
                    nestedOptionsApi?.nestedOptionsKey &&
                    nestedParentSelected &&
                    pickerOptionCounts[col.id] === 0
                  ) {
                    return (
                      <TableCell key={col.id} sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
                        N/A
                      </TableCell>
                    );
                  }

                  const resolvedCol = resolveDynamicColumn(
                    col,
                    row,
                    rowIndex,
                    config.rows?.presetRows,
                  );
                  const cellValue = String(row[col.id] ?? "");
                  const cellReadOnly =
                    readOnly ||
                    isReadonlyCol(resolvedCol) ||
                    isPresetLockedCell(row, col.id, rowIndex, config.rows?.presetRows, autoKey) ||
                    (isExpanded && commitGroup
                      ? isExpandedColumnReadonly(commitGroup, col.id)
                      : false);
                  const rowApiContext = buildRowApiContext(apiContext, row);
                  const trackPickerOptionCount = isPicker && Boolean(nestedOptionsApi?.nestedOptionsKey);
                  const showGroupRemove =
                    allowDelete &&
                    isExpanded &&
                    rowGroupId &&
                    mergeSpan &&
                    mergeExpandedColumns.includes(col.id);
                  const isReadonlyExpandedDisplay =
                    isExpanded &&
                    commitGroup &&
                    isExpandedColumnReadonly(commitGroup, col.id);
                  const isMergedPrimaryColumn =
                    mergeExpandedColumns.length > 0 && mergeExpandedColumns[0] === col.id;

                  return (
                    <TableCell
                      key={col.id}
                      rowSpan={mergeSpan?.rowSpan && mergeSpan.rowSpan > 1 ? mergeSpan.rowSpan : undefined}
                      sx={cellSx(resolvedCol)}
                    >
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {isReadonlyExpandedDisplay ? (
                          <SchemaReadonlyDisplay
                            value={cellValue}
                            dataSource={resolvedCol.dataSource}
                            apiContext={rowApiContext}
                            emphasis={isMergedPrimaryColumn}
                          />
                        ) : (
                          renderCellEditor(
                            resolvedCol,
                            cellValue,
                            (v) => updateCell(rowIndex, col.id, v),
                            cellReadOnly,
                            rowApiContext,
                            trackPickerOptionCount
                              ? (count) => {
                                  if (!nestedParentSelected) return;
                                  handlePickerOptionCountChange(col.id, count);
                                }
                              : undefined,
                          )
                        )}
                        {showGroupRemove ? (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveGroup(rowGroupId)}
                            sx={{ textTransform: "none", fontWeight: 700, alignSelf: "flex-start" }}
                          >
                            {commitGroup?.removeGroupLabel ?? "Remove Group"}
                          </Button>
                        ) : null}
                      </Box>
                    </TableCell>
                  );
                })}
                {allowDelete ? (
                  <TableCell sx={actionsColumnSx}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeRow(rowIndex)}
                      disabled={
                        isPicker ||
                        rowPresetLocked ||
                        (rows.length <= (isCommitGroupMode ? 1 : (config.rows?.min ?? 0)) &&
                          !isCommitGroupMode)
                      }
                    >
                      Remove
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {allowAdd ? (
        <Button
          size="small"
          onClick={addRow}
          disabled={addRowDisabled}
          sx={{ mt: 1, mx: 1, mb: 0, textTransform: "none", fontWeight: 700 }}
        >
          {addRowLabel}
        </Button>
      ) : null}
      {!toolbarTop && showColumnToolbar ? (
        <Box sx={{ px: 1, pb: 1 }}>{renderColumnToolbar()}</Box>
      ) : null}
    </TableContainer>
  );
};

export default DynamicTable;
