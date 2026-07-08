import type { SchemaFieldType, SchemaTableBlock, SchemaTableColumn, SchemaTableStoredValue } from "../types";
import { TABLE_EXPANDED_ROLE, TABLE_PICKER_ROLE, rehydrateCommitGroupTableRows } from "../rules/tableCommitGroup";
import { flattenTableColumns } from "./schemaUtils";

/** Metadata keys on preset row objects — not column ids */
export const PRESET_ROW_META_KEYS = new Set(["type", "readonly", "label"]);

/** Wrapper keys on table form values — not submitted as row data */
export const TABLE_VALUE_META_KEYS = new Set(["extraColumns"]);

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

export const wrapTableValue = (
  rows: Record<string, unknown>[],
  extraColumns: SchemaTableColumn[],
): SchemaTableStoredValue => ({ rows, extraColumns });

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
): SchemaTableColumn => {
  const prefix = String(table.addColumnPrefix ?? "FM").trim() || "FM";
  const pattern = new RegExp(`^${prefix}(\\d+)$`, "i");
  const numbers = flattenTableColumns([...table.columns, ...extraColumns])
    .map((col) => col.id.match(pattern))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => Number.parseInt(match[1], 10));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  const id = `${prefix}${next}`;
  return { type: "column", id, fieldType: "text", label: id };
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
