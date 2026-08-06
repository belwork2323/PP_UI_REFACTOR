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
    const matchedReadonly = findMatchingReadonlyPreset(row, rowIndex, presetRows, autoKey);
    const headerPreset =
      presetRows.find(
        (preset) =>
          preset.type === "header" &&
          String(preset.label ?? "").trim() !== "" &&
          String(row._headerLabel ?? "").trim() === String(preset.label ?? "").trim(),
      ) ??
      (presetRows[rowIndex]?.type === "header" ? presetRows[rowIndex] : undefined);

    const hintSource = matchedReadonly ?? (headerPreset as Record<string, unknown> | undefined);
    const next = { ...row };

    if (headerPreset?.type === "header") {
      next._rowType = "header";
      next._headerLabel = headerPreset.label ?? "";
    }

    if (matchedReadonly) {
      next._readonly = true;
      next._readonlyColumns = Object.keys(matchedReadonly).filter(
        (key) => !PRESET_ROW_META_KEYS.has(key) && key !== autoKey && !isFieldTypeHintKey(key),
      );
    } else if (isLikelyBlankInsertedRow(row, autoKey)) {
      // Clear stale locks if a prior index-based apply tagged a blank inserted row.
      delete next._readonly;
      delete next._readonlyColumns;
    }

    if (hintSource) {
      Object.entries(hintSource).forEach(([key, val]) => {
        if (isFieldTypeHintKey(key)) {
          next[key] = val;
        }
      });
    }

    return next;
  });
};

/** Blank user-inserted row (no identity values from fixed presets). */
const isLikelyBlankInsertedRow = (row: Record<string, unknown>, autoKey: string): boolean => {
  const key = String(row[autoKey] ?? "").trim();
  if (key && !/^\d+$/.test(key)) return false;

  return Object.entries(row).every(([field, value]) => {
    if (field === autoKey || TABLE_ROW_RUNTIME_KEYS.has(field) || isFieldTypeHintKey(field)) {
      return true;
    }
    return String(value ?? "").trim() === "";
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
  autoKey = "srNo",
): SchemaFieldType | undefined => {
  const hintKey = `${columnId}${FIELD_TYPE_HINT_SUFFIX}`;
  const rowHint = row[hintKey];
  if (rowHint !== undefined && rowHint !== null && rowHint !== "") {
    return String(rowHint) as SchemaFieldType;
  }
  const matchedPreset = findMatchingReadonlyPreset(row, rowIndex, presetRows, autoKey);
  const presetHint = matchedPreset?.[hintKey];
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
  autoKey = "srNo",
): SchemaTableColumn => {
  const fieldType = resolveColumnFieldTypeHint(col.id, row, rowIndex, presetRows, autoKey);
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
  if (row._readonly === false) return [];
  if (Array.isArray(row._readonlyColumns)) {
    return row._readonlyColumns as string[];
  }

  const preset = findMatchingReadonlyPreset(row, rowIndex, presetRows, autoKey);
  if (!preset) return [];

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
  autoKey = "srNo",
): boolean => {
  if (row._readonly === false) return false;
  if (row._readonly === true) return true;
  return Boolean(findMatchingReadonlyPreset(row, rowIndex, presetRows, autoKey));
};

/**
 * Resolve which readonly preset a live row belongs to.
 * Prefer autoKey / column identity over raw rowIndex so inserted rows
 * (e.g. before a TOTAL footer) are not locked by the wrong preset.
 */
const findMatchingReadonlyPreset = (
  row: Record<string, unknown>,
  rowIndex: number,
  presetRows: Record<string, unknown>[] | undefined,
  autoKey: string,
): Record<string, unknown> | undefined => {
  if (!presetRows?.length) return undefined;

  const rowKey = String(row[autoKey] ?? "").trim();
  if (rowKey) {
    const byKey = presetRows.find(
      (preset) =>
        preset.readonly === true && String(preset[autoKey] ?? "").trim() === rowKey,
    );
    if (byKey) return byKey;
  }

  const getIdentityKeys = (preset: Record<string, unknown>) =>
    Object.keys(preset).filter(
      (key) =>
        !PRESET_ROW_META_KEYS.has(key) &&
        key !== autoKey &&
        !isFieldTypeHintKey(key) &&
        String(preset[key] ?? "").trim() !== "",
    );

  for (const preset of presetRows) {
    if (preset.readonly !== true) continue;
    const identityKeys = getIdentityKeys(preset);
    if (!identityKeys.length) continue;
    const matches = identityKeys.every(
      (key) => String(row[key] ?? "").trim() === String(preset[key] ?? "").trim(),
    );
    if (matches) return preset;
  }

  // Index fallback only when that slot is a numeric data preset and the row
  // still carries the same non-empty identity values (not a blank inserted row).
  const byIndex = presetRows[rowIndex];
  if (byIndex?.readonly === true) {
    const presetKey = String(byIndex[autoKey] ?? "").trim();
    if (presetKey && !/^\d+$/.test(presetKey)) {
      return rowKey === presetKey ? byIndex : undefined;
    }
    const identityKeys = getIdentityKeys(byIndex);
    if (
      identityKeys.length > 0 &&
      identityKeys.every(
        (key) => String(row[key] ?? "").trim() === String(byIndex[key] ?? "").trim(),
      )
    ) {
      return byIndex;
    }
  }

  return undefined;
};

/**
 * Trailing footer presets (e.g. Total Slurry Cast) use a non-numeric auto key
 * so they sit after count/API-generated data rows.
 */
export const isTrailingTablePresetRow = (
  row: Record<string, unknown>,
  autoKey: string,
): boolean => {
  const key = String(row[autoKey] ?? "").trim();
  return Boolean(key) && !/^\d+$/.test(key);
};

export const getTrailingTablePresetRows = (
  table: SchemaTableBlock,
): Record<string, unknown>[] => {
  const presetRows = table.rows?.presetRows ?? [];
  const autoKey = table.rows?.autoIncrementKey ?? "srNo";
  const columns = flattenTableColumns(table.columns);

  return presetRows
    .filter((preset) => isTrailingTablePresetRow(preset, autoKey))
    .map((preset) => {
      const row: Record<string, unknown> = {};

      if (preset.readonly === true) {
        row._readonly = true;
        row._readonlyColumns = Object.keys(preset).filter(
          (key) => !PRESET_ROW_META_KEYS.has(key) && key !== autoKey && !isFieldTypeHintKey(key),
        );
      }

      row[autoKey] = preset[autoKey];

      columns.forEach((col) => {
        if (col.fieldType === "serial") return;
        if (col.id in preset && preset[col.id] !== undefined) {
          row[col.id] = preset[col.id];
        } else {
          row[col.id] = col.defaultValue ?? "";
        }
      });

      Object.entries(preset).forEach(([key, val]) => {
        if (isFieldTypeHintKey(key)) {
          row[key] = val;
        }
      });

      return row;
    });
};

/** Keep generated/API data rows, then append trailing presets (preserving prior values). */
export const appendTrailingTablePresetRows = (
  dataRows: Record<string, unknown>[],
  table: SchemaTableBlock,
  previousRows: Record<string, unknown>[] = [],
): Record<string, unknown>[] => {
  const trailing = getTrailingTablePresetRows(table);
  if (!trailing.length) return dataRows;

  const autoKey = table.rows?.autoIncrementKey ?? "srNo";
  const previousByKey = new Map(
    previousRows
      .filter((row) => isTrailingTablePresetRow(row, autoKey))
      .map((row) => [String(row[autoKey] ?? "").trim(), row] as const),
  );

  const mergedTrailing = trailing.map((presetRow) => {
    const key = String(presetRow[autoKey] ?? "").trim();
    const previous = previousByKey.get(key);
    if (!previous) return presetRow;

    const next = { ...presetRow };
    Object.entries(previous).forEach(([field, value]) => {
      if (TABLE_ROW_RUNTIME_KEYS.has(field) || isFieldTypeHintKey(field)) return;
      if (field === autoKey) return;
      // Keep preset label / locked display values from the schema definition.
      if (Array.isArray(presetRow._readonlyColumns) && presetRow._readonlyColumns.includes(field)) {
        return;
      }
      if (presetRow[field] !== undefined && String(presetRow[field]).trim() !== "") return;
      next[field] = value;
    });
    return next;
  });

  const withoutTrailing = dataRows.filter((row) => !isTrailingTablePresetRow(row, autoKey));
  return [...withoutTrailing, ...mergedTrailing];
};

export type PresetMergedCellSpan = {
  rowSpan: number;
  isContinuation: boolean;
};

export const getMergePresetColumns = (table: SchemaTableBlock): string[] =>
  table.rows?.mergePresetColumns ?? [];

export const computePresetMergedCellSpans = (
  rowCount: number,
  mergeColumnIds: string[],
  presetRowCount: number,
): Map<string, PresetMergedCellSpan> => {
  const result = new Map<string, PresetMergedCellSpan>();
  if (!mergeColumnIds.length || presetRowCount <= 1) return result;

  const span = Math.min(presetRowCount, rowCount);
  if (span <= 1) return result;

  mergeColumnIds.forEach((colId) => {
    result.set(`0:${colId}`, { rowSpan: span, isContinuation: false });
    for (let i = 1; i < span; i += 1) {
      result.set(`${i}:${colId}`, { rowSpan: 0, isContinuation: true });
    }
  });

  return result;
};

export const resolveMergedPresetCellValue = (
  rows: Record<string, unknown>[],
  colId: string,
  rowIndex: number,
  mergeColumnIds: string[],
  presetRowCount: number,
): string => {
  if (mergeColumnIds.includes(colId) && presetRowCount > 1 && rowIndex < presetRowCount) {
    for (let i = 0; i < presetRowCount; i += 1) {
      const value = rows[i]?.[colId];
      if (value != null && String(value).trim() !== "") return String(value);
    }
    return "";
  }

  return String(rows[rowIndex]?.[colId] ?? "");
};

export const syncMergedPresetColumnValues = (
  rows: Record<string, unknown>[],
  colId: string,
  value: string,
  mergeColumnIds: string[],
  presetRowCount: number,
): Record<string, unknown>[] => {
  if (!mergeColumnIds.includes(colId) || presetRowCount <= 1) return rows;

  return rows.map((row, idx) => (idx < presetRowCount ? { ...row, [colId]: value } : row));
};
