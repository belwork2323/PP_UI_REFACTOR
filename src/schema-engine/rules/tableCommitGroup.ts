import type {
  SchemaCommitFieldMapping,
  SchemaFieldValueTransform,
  SchemaTableBlock,
  SchemaTableColumn,
  SchemaTableCommitGroupConfig,
} from "../types";
import { applyFormulaColumns } from "./formulaEval";
import {
  buildRowApiContext,
  fetchSchemaDataSourceOptions,
  type SchemaApiContext,
} from "./apiDependency";

export const TABLE_PICKER_ROLE = "picker";
export const TABLE_EXPANDED_ROLE = "expanded";

const TEMPLATE_PATTERN = /\$\{(\w+)\}/g;

export const hasTableCommitGroup = (table: SchemaTableBlock) =>
  Boolean(table.rows?.commitGroup?.expandFromColumn);

export const getTableCommitGroup = (
  table: SchemaTableBlock,
): SchemaTableCommitGroupConfig | null => table.rows?.commitGroup ?? null;

export const isPickerRow = (row: Record<string, unknown>) => row._rowRole === TABLE_PICKER_ROLE;

export const isExpandedRow = (row: Record<string, unknown>) => row._rowRole === TABLE_EXPANDED_ROLE;

export const getMergeExpandedColumns = (commitGroup: SchemaTableCommitGroupConfig): string[] =>
  commitGroup.mergeExpandedColumns ?? [];

export const shouldShowGroupHeader = (commitGroup: SchemaTableCommitGroupConfig): boolean =>
  commitGroup.showGroupHeader ?? getMergeExpandedColumns(commitGroup).length === 0;

export type ExpandedGroupCellSpan = {
  rowSpan: number;
  isContinuation: boolean;
};

export const computeExpandedGroupCellSpans = (
  rows: Record<string, unknown>[],
  mergeColumnIds: string[],
): Map<string, ExpandedGroupCellSpan> => {
  const result = new Map<string, ExpandedGroupCellSpan>();
  if (!mergeColumnIds.length) return result;

  let groupId: string | null = null;
  let startIdx = -1;

  const assignGroup = (start: number, end: number) => {
    const span = end - start + 1;
    mergeColumnIds.forEach((colId) => {
      result.set(`${start}:${colId}`, { rowSpan: span, isContinuation: false });
      for (let i = start + 1; i <= end; i += 1) {
        result.set(`${i}:${colId}`, { rowSpan: 0, isContinuation: true });
      }
    });
  };

  rows.forEach((row, idx) => {
    const rowGroupId = row._groupId ? String(row._groupId) : null;
    if (isExpandedRow(row) && rowGroupId) {
      if (rowGroupId !== groupId) {
        if (groupId != null && startIdx >= 0) assignGroup(startIdx, idx - 1);
        groupId = rowGroupId;
        startIdx = idx;
      }
    } else {
      if (groupId != null && startIdx >= 0) assignGroup(startIdx, idx - 1);
      groupId = null;
      startIdx = -1;
    }
  });

  if (groupId != null && startIdx >= 0) assignGroup(startIdx, rows.length - 1);
  return result;
};

export const countExpandedRowsInGroup = (
  rows: Record<string, unknown>[],
  groupId: string,
): number => rows.filter((row) => isExpandedRow(row) && String(row._groupId) === groupId).length;

const isCommitGroupRow = (row: Record<string, unknown>) =>
  row._rowType === "header" || isExpandedRow(row);

/** True when this row starts a new committed ingredient group after a previous one. */
export const isCommitGroupDividerBefore = (
  rows: Record<string, unknown>[],
  rowIndex: number,
): boolean => {
  const row = rows[rowIndex];
  if (!row?._groupId || !isCommitGroupRow(row)) return false;

  const groupId = String(row._groupId);
  for (let idx = rowIndex - 1; idx >= 0; idx -= 1) {
    const prev = rows[idx];
    if (!isCommitGroupRow(prev)) continue;
    return String(prev._groupId ?? "") !== groupId;
  }
  return false;
};

/** True when the picker row follows one or more committed ingredient groups. */
export const isPickerRowAfterGroups = (
  rows: Record<string, unknown>[],
  rowIndex: number,
): boolean => {
  const row = rows[rowIndex];
  if (!isPickerRow(row)) return false;
  return rows.slice(0, rowIndex).some(isCommitGroupRow);
};

export const findLastPickerIndex = (rows: Record<string, unknown>[]) => {
  for (let idx = rows.length - 1; idx >= 0; idx -= 1) {
    if (isPickerRow(rows[idx])) return idx;
  }
  return -1;
};

export const findLastPickerRow = (rows: Record<string, unknown>[]) => {
  const index = findLastPickerIndex(rows);
  return index >= 0 ? rows[index] : null;
};

export const renumberTableRows = (rows: Record<string, unknown>[], autoKey: string) =>
  rows.map((row, idx) => ({ ...row, [autoKey]: idx + 1 }));

export const formatReferenceRangeValue = (referenceRange?: Record<string, unknown> | null): string => {
  if (!referenceRange || typeof referenceRange !== "object") return "";

  const minValue = referenceRange.minValue;
  const maxValue = referenceRange.maxValue;
  const unit = referenceRange.unit ? ` ${referenceRange.unit}` : "";

  if (minValue != null && maxValue != null) return `${minValue} - ${maxValue}${unit}`;
  if (minValue != null) return `>= ${minValue}${unit}`;
  if (maxValue != null) return `<= ${maxValue}${unit}`;
  return "";
};

export const applyFieldTransform = (
  value: unknown,
  transform?: SchemaFieldValueTransform,
): unknown => {
  if (transform === "referenceRange") {
    return formatReferenceRangeValue((value as Record<string, unknown> | undefined) ?? null);
  }
  return value == null ? "" : String(value);
};

export const resolveRowTemplate = (
  template: string,
  row: Record<string, unknown>,
): string =>
  template.replace(TEMPLATE_PATTERN, (match, token: string) => {
    const value = row[token];
    return value != null && String(value).trim() !== "" ? String(value) : match;
  });

export const buildEmptyPickerRow = (
  flatColumns: SchemaTableColumn[],
  autoKey: string,
): Record<string, unknown> => {
  const row: Record<string, unknown> = {
    [autoKey]: 0,
    _rowRole: TABLE_PICKER_ROLE,
  };
  flatColumns.forEach((col) => {
    if (col.fieldType !== "serial") row[col.id] = "";
  });
  return row;
};

export const createGroupHeaderRow = (
  commitGroup: SchemaTableCommitGroupConfig,
  sourceRow: Record<string, unknown>,
  groupId: string,
): Record<string, unknown> => {
  const template = commitGroup.headerLabelTemplate ?? "${value}";
  const primaryColumn = commitGroup.pickerColumns[0];
  const label = template.includes("${")
    ? resolveRowTemplate(template, sourceRow)
    : `${template} ${primaryColumn ? String(sourceRow[primaryColumn] ?? "") : ""}`.trim();

  return {
    _rowType: "header",
    _headerLabel: label,
    _groupId: groupId,
  };
};

export const mapApiItemToRow = (
  item: Record<string, unknown>,
  mappings: SchemaCommitFieldMapping[],
  sourceRow: Record<string, unknown>,
  carryColumns: string[],
  flatColumns: SchemaTableColumn[],
): Record<string, unknown> => {
  const row: Record<string, unknown> = { ...sourceRow };

  carryColumns.forEach((columnId) => {
    if (sourceRow[columnId] != null) row[columnId] = sourceRow[columnId];
  });

  mappings.forEach((mapping) => {
    row[mapping.targetColumn] = applyFieldTransform(item[mapping.sourceField], mapping.transform);
  });

  return applyFormulaColumns(applyColumnDefaults(row, flatColumns), flatColumns);
};

const applyColumnDefaults = (
  row: Record<string, unknown>,
  flatColumns: SchemaTableColumn[],
): Record<string, unknown> => {
  const next = { ...row };
  flatColumns.forEach((col) => {
    if ((next[col.id] == null || next[col.id] === "") && col.defaultValue != null) {
      next[col.id] = col.defaultValue;
    }
  });
  return next;
};

export const buildExpandedRowsFromItems = (
  items: Record<string, unknown>[],
  commitGroup: SchemaTableCommitGroupConfig,
  sourceRow: Record<string, unknown>,
  groupId: string,
  flatColumns: SchemaTableColumn[],
): Record<string, unknown>[] => {
  const carryColumns = commitGroup.carryColumns ?? [];

  if (!items.length) {
    return [
      {
        ...applyFormulaColumns({ ...sourceRow }, flatColumns),
        _rowRole: TABLE_EXPANDED_ROLE,
        _groupId: groupId,
      },
    ];
  }

  return items.map((item) => ({
    ...mapApiItemToRow(item, commitGroup.fieldMappings, sourceRow, carryColumns, flatColumns),
    _rowRole: TABLE_EXPANDED_ROLE,
    _groupId: groupId,
  }));
};

export const isPickerColumnVisible = (
  commitGroup: SchemaTableCommitGroupConfig,
  columnId: string,
) => commitGroup.pickerColumns.includes(columnId);

export const isExpandedColumnReadonly = (
  commitGroup: SchemaTableCommitGroupConfig,
  columnId: string,
) => (commitGroup.readonlyExpandedColumns ?? []).includes(columnId);

export const isCommitAddReady = (
  commitGroup: SchemaTableCommitGroupConfig,
  pickerRow: Record<string, unknown> | null,
  pickerOptionCounts: Record<string, number> = {},
) => {
  if (!pickerRow) return false;
  return commitGroup.pickerColumns.every((columnId) => {
    const optionCount = pickerOptionCounts[columnId];

    // No selectable options for this column — selection is not required.
    if (optionCount === 0) return true;

    const value = pickerRow[columnId];
    return value != null && String(value).trim() !== "";
  });
};

export const removeTableGroup = (
  rows: Record<string, unknown>[],
  groupId: string,
  flatColumns: SchemaTableColumn[],
  autoKey: string,
) => {
  let nextRows = rows.filter((row) => row._groupId !== groupId);
  if (!nextRows.some(isPickerRow)) {
    nextRows = [...nextRows, buildEmptyPickerRow(flatColumns, autoKey)];
  }
  return renumberTableRows(nextRows, autoKey);
};

export const commitPickerRow = async (
  table: SchemaTableBlock,
  rows: Record<string, unknown>[],
  apiContext: SchemaApiContext | undefined,
  flatColumns: SchemaTableColumn[],
  autoKey: string,
  pickerOptionCounts: Record<string, number> = {},
): Promise<Record<string, unknown>[] | null> => {
  const commitGroup = getTableCommitGroup(table);
  if (!commitGroup) return null;

  const pickerIndex = findLastPickerIndex(rows);
  const pickerRow = pickerIndex >= 0 ? rows[pickerIndex] : null;
  if (!pickerRow || !isCommitAddReady(commitGroup, pickerRow, pickerOptionCounts)) return null;

  const expandColumn = flatColumns.find((col) => col.id === commitGroup.expandFromColumn);
  if (!expandColumn?.dataSource) return null;

  const primaryValue = String(pickerRow[commitGroup.pickerColumns[0]] ?? "").trim();
  const groupId = `${primaryValue}-${Date.now()}`;
  const rowApiContext = buildRowApiContext(apiContext, pickerRow);
  const { options } = await fetchSchemaDataSourceOptions(expandColumn.dataSource, rowApiContext);

  const headerRow = shouldShowGroupHeader(commitGroup)
    ? createGroupHeaderRow(commitGroup, pickerRow, groupId)
    : null;
  const expandedRows = buildExpandedRowsFromItems(
    options,
    commitGroup,
    pickerRow,
    groupId,
    flatColumns,
  );
  const withoutPicker = rows.filter((_, idx) => idx !== pickerIndex);
  const newPicker = buildEmptyPickerRow(flatColumns, autoKey);

  return renumberTableRows(
    [...withoutPicker, ...(headerRow ? [headerRow] : []), ...expandedRows, newPicker],
    autoKey,
  );
};

export const resolveDerivedColumnValue = async (
  column: SchemaTableColumn,
  selectedValue: string,
  rowApiContext: SchemaApiContext,
): Promise<string> => {
  const derive = column.derive;
  if (!derive || !column.dataSource || !selectedValue) return "";

  const { options } = await fetchSchemaDataSourceOptions(column.dataSource, rowApiContext);
  const matchFields = derive.matchFields ?? [];
  const match = options.find((option) =>
    matchFields.some((field) => String(option[field] ?? "") === selectedValue),
  );
  if (!match) return "";

  return String(applyFieldTransform(match[derive.sourceField], derive.transform));
};
