import type { SchemaFieldType, SchemaTableBlock, SchemaTableColumn, SchemaTableColumnSlot, SchemaTableStoredValue } from "../types";
import { TABLE_EXPANDED_ROLE, TABLE_PICKER_ROLE, rehydrateCommitGroupTableRows } from "../rules/tableCommitGroup";
import { flattenTableColumns, isColumnGroup } from "./schemaUtils";

/** Metadata keys on preset row objects — not column ids */
export const PRESET_ROW_META_KEYS = new Set(["type", "readonly", "label"]);

/** Wrapper keys on table form values — not submitted as row data */
export const TABLE_VALUE_META_KEYS = new Set(["extraColumns", "deletedColumnIds"]);

/** Persisted alongside table row data in section submissions */
export const TABLE_COLUMN_STATE_SUFFIX = "__tableColumns";

export const getTableColumnStateKey = (blockId: string) => `${blockId}${TABLE_COLUMN_STATE_SUFFIX}`;

export type SchemaTableColumnState = {
  extraColumns?: SchemaTableColumn[];
  deletedColumnIds?: string[];
};

export const isWrappedTableValue = (value: unknown): value is SchemaTableStoredValue =>
  Boolean(value && typeof value === "object" && !Array.isArray(value) && Array.isArray((value as SchemaTableStoredValue).rows));

export const resolveTableRows = (
  value: unknown,
  table: SchemaTableBlock,
  buildRows: (table: SchemaTableBlock) => Record<string, unknown>[],
): Record<string, unknown>[] => {
  const maybeRehydrate = (rows: Record<string, unknown>[]) => {
    const withPresets = applyPresetRowMetadata(rows, table);
    if (hasTableCommitGroup(table) && withPresets.length > 0 && !withPresets.some(isPickerRow)) {
      return rehydrateCommitGroupTableRows(table, withPresets);
    }
    return withPresets;
  };

  if (isWrappedTableValue(value) && value.rows.length > 0) {
    return maybeRehydrate(value.rows);
  }
  if (Array.isArray(value) && value.length > 0) {
    return maybeRehydrate(value as Record<string, unknown>[]);
  }
  return buildRows(table);
};

export const resolveTableExtraColumns = (value: unknown): SchemaTableColumn[] =>
  isWrappedTableValue(value) ? (value.extraColumns ?? []) : [];

export const resolveTableDeletedColumnIds = (value: unknown): string[] =>
  isWrappedTableValue(value) ? (value.deletedColumnIds ?? []) : [];

export const wrapTableValue = (
  rows: Record<string, unknown>[],
  extraColumns: SchemaTableColumn[] = [],
  deletedColumnIds: string[] = [],
): SchemaTableStoredValue => ({
  rows,
  ...(extraColumns.length > 0 ? { extraColumns } : {}),
  ...(deletedColumnIds.length > 0 ? { deletedColumnIds } : {}),
});

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const isDeletablePrefixedColumn = (table: SchemaTableBlock, columnId: string): boolean => {
  const prefix = String(table.addColumnPrefix ?? "").trim();
  if (!prefix) return false;
  return new RegExp(`^${escapeRegExp(prefix)}\\d+$`, "i").test(columnId);
};

export const resolveVisibleTableColumns = (
  columns: SchemaTableColumnSlot[],
  deletedColumnIds: string[] = [],
): SchemaTableColumnSlot[] => {
  const deleted = new Set(deletedColumnIds);
  const result: SchemaTableColumnSlot[] = [];

  columns.forEach((slot) => {
    if (isColumnGroup(slot)) {
      const visible = slot.columns.filter((col) => !deleted.has(col.id));
      if (visible.length > 0) {
        result.push({ ...slot, columns: visible });
      }
      return;
    }
    if (!deleted.has(slot.id)) {
      result.push(slot);
    }
  });

  return result;
};

export const resolveDeletableColumnIds = (
  table: SchemaTableBlock,
  extraColumns: SchemaTableColumn[],
  deletedColumnIds: string[] = [],
): string[] => {
  if (!table.allowDeleteColumn) {
    return extraColumns.map((col) => col.id);
  }

  const deleted = new Set(deletedColumnIds);
  const prefixedFromSchema = flattenTableColumns(table.columns)
    .filter((col) => isDeletablePrefixedColumn(table, col.id) && !deleted.has(col.id))
    .map((col) => col.id);

  return [...prefixedFromSchema, ...extraColumns.map((col) => col.id)];
};

export const shouldWrapTableValue = (
  table: SchemaTableBlock,
  extraColumns: SchemaTableColumn[],
  deletedColumnIds: string[] = [],
): boolean =>
  Boolean(table.allowAddColumn) ||
  Boolean(table.allowDeleteColumn) ||
  extraColumns.length > 0 ||
  deletedColumnIds.length > 0;

const uniqueStrings = (values: string[]) => values.filter((value, index) => values.indexOf(value) === index);

const uniqueColumns = (columns: SchemaTableColumn[]) =>
  columns.filter((column, index) => columns.findIndex((item) => item.id === column.id) === index);

const collectSavedDynamicColumnIds = (
  table: SchemaTableBlock,
  rows: Record<string, unknown>[],
): Set<string> => {
  const ids = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (TABLE_ROW_RUNTIME_KEYS.has(key) || isFieldTypeHintKey(key)) return;
      if (isDeletablePrefixedColumn(table, key)) {
        ids.add(key);
      }
    });
  });
  return ids;
};

const buildRehydratedExtraColumn = (table: SchemaTableBlock, columnId: string): SchemaTableColumn => {
  const template = flattenTableColumns(table.columns).find((col) => isDeletablePrefixedColumn(table, col.id));
  return {
    type: "column",
    id: columnId,
    fieldType: template?.fieldType ?? "text",
    label: columnId.replace(/_/g, "-"),
  };
};

/** Restore dynamic column add/delete state after API round-trip (metadata is not persisted). */
export const rehydrateDynamicTableColumnState = (
  table: SchemaTableBlock,
  value: unknown,
  columnState?: SchemaTableColumnState,
): unknown => {
  if (!table.allowAddColumn && !table.allowDeleteColumn) {
    return value;
  }

  const explicitExtra = columnState?.extraColumns ?? [];
  const explicitDeleted = columnState?.deletedColumnIds ?? [];
  if (explicitDeleted.length > 0 || explicitExtra.length > 0) {
    const rows = resolveTableRows(value, table, () => []);
    if (!rows.length) return value;
    const extraColumns = uniqueColumns([
      ...explicitExtra,
      ...resolveTableExtraColumns(value),
    ]);
    const deletedColumnIds = uniqueStrings([
      ...explicitDeleted,
      ...resolveTableDeletedColumnIds(value),
    ]);
    return wrapTableValue(applyExtraColumnCellsToRows(rows, extraColumns), extraColumns, deletedColumnIds);
  }

  const existingExtra = resolveTableExtraColumns(value);
  const existingDeleted = resolveTableDeletedColumnIds(value);
  if (isWrappedTableValue(value) && existingDeleted.length > 0) {
    return value;
  }

  const rows = resolveTableRows(value, table, () => []);
  if (!rows.length) return value;

  const savedDynamicIds = collectSavedDynamicColumnIds(table, rows);
  const schemaColumns = flattenTableColumns(table.columns);
  const schemaColumnIds = new Set(schemaColumns.map((col) => col.id));

  const deletedColumnIds = uniqueStrings([
    ...existingDeleted,
    ...schemaColumns
      .filter((col) => isDeletablePrefixedColumn(table, col.id) && !savedDynamicIds.has(col.id))
      .map((col) => col.id),
  ]);

  const extraColumns = uniqueColumns([
    ...existingExtra,
    ...[...savedDynamicIds]
      .filter((id) => !schemaColumnIds.has(id))
      .map((id) => buildRehydratedExtraColumn(table, id)),
  ]);

  if (!shouldWrapTableValue(table, extraColumns, deletedColumnIds)) {
    return rows;
  }

  return wrapTableValue(applyExtraColumnCellsToRows(rows, extraColumns), extraColumns, deletedColumnIds);
};

/** Re-apply preset row metadata stripped during save/load (header rows, field-type hints, etc.). */
export const applyPresetRowMetadata = (
  rows: Record<string, unknown>[],
  table: SchemaTableBlock,
): Record<string, unknown>[] => {
  const presetRows = table.rows?.presetRows;
  if (!presetRows?.length) return rows;

  const autoKey = table.rows?.autoIncrementKey ?? "srNo";

  return rows.map((row, rowIndex) => {
    const preset = presetRows[rowIndex];
    if (!preset) return row;

    const next = { ...row };

    if (preset.type === "header") {
      next._rowType = "header";
      next._headerLabel = preset.label ?? "";
    }

    if (preset.readonly === true) {
      next._readonly = true;
      if (!Array.isArray(next._readonlyColumns)) {
        next._readonlyColumns = Object.keys(preset).filter(
          (key) => !PRESET_ROW_META_KEYS.has(key) && key !== autoKey && !isFieldTypeHintKey(key),
        );
      }
    }

    Object.entries(preset).forEach(([key, val]) => {
      if (isFieldTypeHintKey(key)) {
        next[key] = val;
      }
    });

    return next;
  });
};

export const createNextPrefixedTableColumn = (
  table: SchemaTableBlock,
  extraColumns: SchemaTableColumn[],
  deletedColumnIds: string[] = [],
): SchemaTableColumn => {
  const prefix = String(table.addColumnPrefix ?? "FM").trim() || "FM";
  const pattern = new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`, "i");
  const visibleSchemaColumns = resolveVisibleTableColumns(table.columns, deletedColumnIds);
  const numbers = flattenTableColumns([...visibleSchemaColumns, ...extraColumns])
    .map((col) => col.id.match(pattern))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => Number.parseInt(match[1], 10));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  const id = `${prefix}${next}`;
  const templateColumn = flattenTableColumns([...visibleSchemaColumns, ...extraColumns]).find((col) =>
    isDeletablePrefixedColumn(table, col.id),
  );
  return {
    type: "column",
    id,
    fieldType: templateColumn?.fieldType ?? "text",
    label: id,
  };
};

export const buildInitialExtraColumns = (table: SchemaTableBlock): SchemaTableColumn[] => {
  const count = table.initialExtraColumnCount ?? (table.allowAddColumn ? 1 : 0);
  const extraColumns: SchemaTableColumn[] = [];
  for (let i = 0; i < count; i += 1) {
    extraColumns.push(createNextPrefixedTableColumn(table, extraColumns));
  }
  return extraColumns;
};

export const applyExtraColumnCellsToRows = (
  rows: Record<string, unknown>[],
  extraColumns: SchemaTableColumn[],
): Record<string, unknown>[] => {
  if (!extraColumns.length) return rows;
  return rows.map((row) => {
    if (row._rowType === "header") return row;
    const next = { ...row };
    extraColumns.forEach((col) => {
      next[col.id] = next[col.id] ?? "";
    });
    return next;
  });
};

const FIELD_TYPE_HINT_SUFFIX = "__fieldType";

export const isFieldTypeHintKey = (key: string): boolean => key.endsWith(FIELD_TYPE_HINT_SUFFIX);

const resolveColumnFieldTypeHint = (
  columnId: string,
  row: Record<string, unknown>,
  rowIndex: number,
  presetRows?: Record<string, unknown>[],
): SchemaFieldType | undefined => {
  const hintKey = `${columnId}${FIELD_TYPE_HINT_SUFFIX}`;
  const rowHint = row[hintKey];
  if (rowHint !== undefined && rowHint !== null && rowHint !== "") {
    return String(rowHint) as SchemaFieldType;
  }
  const presetHint = presetRows?.[rowIndex]?.[hintKey];
  if (presetHint !== undefined && presetHint !== null && presetHint !== "") {
    return String(presetHint) as SchemaFieldType;
  }
  return undefined;
};

/** Apply per-row fieldType overrides from preset hints (e.g. `value__fieldType: "datetime"`). */
export const resolveDynamicColumn = (
  col: SchemaTableColumn,
  row: Record<string, unknown>,
  rowIndex: number,
  presetRows?: Record<string, unknown>[],
): SchemaTableColumn => {
  const fieldType = resolveColumnFieldTypeHint(col.id, row, rowIndex, presetRows);
  if (!fieldType || fieldType === col.fieldType) return col;
  return { ...col, fieldType };
};

export const isPickerRow = (row: Record<string, unknown>) => row._rowRole === TABLE_PICKER_ROLE;

export const isExpandedRow = (row: Record<string, unknown>) => row._rowRole === TABLE_EXPANDED_ROLE;

export const hasTableCommitGroup = (table: SchemaTableBlock) => Boolean(table.rows?.commitGroup);

/** Runtime-only row keys — never submitted */
export const TABLE_ROW_RUNTIME_KEYS = new Set([
  "_rowType",
  "_headerLabel",
  "_readonly",
  "_readonlyColumns",
  "_key",
  "_rowRole",
  "_groupId",
]);

export const getPresetLockedColumnIds = (
  row: Record<string, unknown>,
  rowIndex: number,
  presetRows?: Record<string, unknown>[],
  autoKey = "srNo",
): string[] => {
  if (Array.isArray(row._readonlyColumns)) {
    return row._readonlyColumns as string[];
  }

  const preset = presetRows?.[rowIndex];
  if (preset?.readonly !== true) return [];

  return Object.keys(preset).filter(
    (key) => !PRESET_ROW_META_KEYS.has(key) && key !== autoKey && !isFieldTypeHintKey(key),
  );
};

export const isPresetLockedCell = (
  row: Record<string, unknown>,
  colId: string,
  rowIndex: number,
  presetRows?: Record<string, unknown>[],
  autoKey = "srNo",
): boolean => getPresetLockedColumnIds(row, rowIndex, presetRows, autoKey).includes(colId);

export const isPresetLockedRow = (
  row: Record<string, unknown>,
  rowIndex: number,
  presetRows?: Record<string, unknown>[],
): boolean => {
  if (row._readonly === true) return true;
  return presetRows?.[rowIndex]?.readonly === true;
};
