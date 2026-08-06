import { scopedFormKey, type SchemaFormValues } from "../state/formState";
import { buildFlatVisibilityContext } from "../rules/visibility";
import type {
  SchemaBlock,
  SchemaDocumentV2,
  SchemaRowGenerationCountConfig,
  SchemaTableBlock,
  SchemaTableColumn,
} from "../types";
import { flattenTableColumns } from "./schemaUtils";
import { applyRowComputations, getTableRowComputations } from "../rules/tableRowComputations";
import {
  appendTrailingTablePresetRows,
  isTrailingTablePresetRow,
  isWrappedTableValue,
  resolveTableDeletedColumnIds,
  resolveTableExtraColumns,
  shouldWrapTableValue,
  wrapTableValue,
} from "./tableRowUtils";

type IndexedTable = {
  tableId: string;
  scope: string;
  formKey: string;
  block: SchemaTableBlock;
};

/** Child column id → parent column id when names differ (e.g. BEM_NO ← BEM_MOULD_NO). */
const PARENT_COLUMN_ALIASES: Record<string, string> = {
  BEM_NO: "BEM_MOULD_NO",
};

const isFormulaColumn = (col: SchemaTableColumn) =>
  col.fieldType === "formula" || Boolean(col.formula?.expression);

const collectTables = (sections: SchemaDocumentV2["data"]["sections"]): IndexedTable[] => {
  const result: IndexedTable[] = [];

  const walk = (blocks: SchemaBlock[], scope: string) => {
    blocks.forEach((block) => {
      if (block.type === "table") {
        result.push({
          tableId: block.id,
          scope,
          formKey: scopedFormKey(scope, block.id),
          block,
        });
        return;
      }
      if (block.type === "section" && !block.repeat) {
        walk(block.children ?? [], block.id);
        return;
      }
      if (block.type === "group" && !block.repeat) {
        walk(block.children ?? [], scope);
      }
    });
  };

  sections.forEach((section) => walk(section.children ?? [], section.id));
  return result;
};

const readTableRows = (
  values: SchemaFormValues,
  entry: IndexedTable,
): {
  rows: Record<string, unknown>[];
  extraColumns: SchemaTableColumn[];
  deletedColumnIds: string[];
  preserveWrapper: boolean;
} => {
  const raw = values[entry.formKey];
  const extraColumns = resolveTableExtraColumns(raw);
  const deletedColumnIds = resolveTableDeletedColumnIds(raw);
  const preserveWrapper =
    isWrappedTableValue(raw) ||
    extraColumns.length > 0 ||
    deletedColumnIds.length > 0 ||
    Boolean(entry.block.allowAddColumn) ||
    Boolean(entry.block.allowDeleteColumn);

  if (isWrappedTableValue(raw)) {
    return { rows: raw.rows.map((row) => ({ ...row })), extraColumns, deletedColumnIds, preserveWrapper };
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return {
      rows: (raw as Record<string, unknown>[]).map((row) => ({ ...row })),
      extraColumns,
      deletedColumnIds,
      preserveWrapper,
    };
  }

  // Hardware article rows are stored unscoped in the subscale UI panel.
  if (entry.tableId === "ARTICLE_TYPE_TABLE") {
    const unscoped = values.ARTICLE_TYPE_TABLE;
    if (Array.isArray(unscoped) && unscoped.length > 0) {
      return {
        rows: (unscoped as Record<string, unknown>[]).map((row) => ({ ...row })),
        extraColumns: [],
        deletedColumnIds: [],
        preserveWrapper: false,
      };
    }
  }

  return { rows: [], extraColumns, deletedColumnIds, preserveWrapper };
};

const writeTableRows = (
  values: SchemaFormValues,
  entry: IndexedTable,
  rows: Record<string, unknown>[],
  extraColumns: SchemaTableColumn[],
  deletedColumnIds: string[],
  preserveWrapper: boolean,
): SchemaFormValues => ({
  ...values,
  [entry.formKey]: preserveWrapper ? wrapTableValue(rows, extraColumns, deletedColumnIds) : rows,
});

const resolveParentColumnId = (
  childColumnId: string,
  parentColumnIds: Set<string>,
): string | null => {
  if (parentColumnIds.has(childColumnId)) return childColumnId;
  const alias = PARENT_COLUMN_ALIASES[childColumnId];
  return alias && parentColumnIds.has(alias) ? alias : null;
};

const mergeChildRowFromParent = (
  parentRow: Record<string, unknown>,
  childRow: Record<string, unknown>,
  childColumns: SchemaTableColumn[],
  parentColumnIds: Set<string>,
  autoKey: string,
  rowIndex: number,
): Record<string, unknown> => {
  const next: Record<string, unknown> = { ...childRow, [autoKey]: rowIndex + 1 };

  childColumns.forEach((col) => {
    if (col.fieldType === "serial" || isFormulaColumn(col)) return;

    const shouldCopyFromParent = col.readonly === true;
    if (!shouldCopyFromParent) return;

    const parentColumnId = resolveParentColumnId(col.id, parentColumnIds);
    if (!parentColumnId) return;

    const parentValue = parentRow[parentColumnId];
    if (parentValue !== undefined && parentValue !== null && String(parentValue).trim() !== "") {
      next[col.id] = parentValue;
    }
  });

  return next;
};

const rowHasUserData = (row: Record<string, unknown>, autoKey: string) =>
  Object.entries(row).some(([key, value]) => {
    if (key === autoKey || key.startsWith("_")) return false;
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

const syncChildFromParent = (
  child: IndexedTable,
  parent: IndexedTable,
  values: SchemaFormValues,
): SchemaFormValues => {
  const parentState = readTableRows(values, parent);
  const childState = readTableRows(values, child);

  if (parentState.rows.length === 0) {
    return values;
  }

  const childColumns = flattenTableColumns(child.block.columns);
  const parentColumnIds = new Set(flattenTableColumns(parent.block.columns).map((col) => col.id));
  const autoKey = child.block.rows?.autoIncrementKey ?? "SR_NO";

  // Keep saved/API casting rows — do not regenerate from hardware once casting has data.
  if (
    child.tableId === "CASTING_TABLE" &&
    childState.rows.some((row) => rowHasUserData(row, autoKey))
  ) {
    return values;
  }

  const childHasData = childState.rows.some((row) => rowHasUserData(row, autoKey));

  // Preserve existing child row count when user/API data is present; only sync readonly fields.
  const rowCount = childHasData
    ? childState.rows.length
    : parentState.rows.length;

  const nextRows = Array.from({ length: rowCount }, (_, index) =>
    mergeChildRowFromParent(
      parentState.rows[index] ?? {},
      childState.rows[index] ?? {},
      childColumns,
      parentColumnIds,
      autoKey,
      index,
    ),
  );

  return writeTableRows(
    values,
    child,
    nextRows,
    childState.extraColumns,
    childState.deletedColumnIds,
    childState.preserveWrapper,
  );
};

const clampCount = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.floor(n)));

export const resolveRowGenerationCount = (
  config: SchemaRowGenerationCountConfig,
  values: SchemaFormValues,
  rowsMax?: number,
): number => {
  const ctx = buildFlatVisibilityContext(values);
  const min = config.min ?? 0;
  const max = config.max ?? rowsMax ?? 24;

  const byValue = config.countByFieldValue;
  if (byValue?.field) {
    const key = String(ctx[byValue.field] ?? "").trim();
    if (key && byValue.values[key] != null) {
      const mapped = Number(byValue.values[key]);
      if (Number.isFinite(mapped) && mapped > 0) {
        return clampCount(mapped, Math.max(min, 1), max);
      }
    }
  }

  if (config.countField) {
    const raw = Number(ctx[config.countField]);
    if (Number.isFinite(raw) && raw > 0) {
      return clampCount(raw, Math.max(min, 1), max);
    }
  }

  return Math.max(min, 0) === 0 ? 0 : clampCount(min, min, max);
};

const buildCountGeneratedRows = (
  block: SchemaTableBlock,
  count: number,
  existing: Record<string, unknown>[],
): Record<string, unknown>[] => {
  const config = block.rows?.rowGenerationCount;
  if (!config || count <= 0) return [];

  const columns = flattenTableColumns(block.columns);
  const autoKey = block.rows?.autoIncrementKey ?? "SR_NO";
  const labelCol = config.labelColumn ?? "parameter";
  const template = config.labelTemplate ?? "Temperature @ {n} Hour";
  const defaults = config.rowDefaults ?? {};

  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    const prev = existing[index] ?? {};
    const row: Record<string, unknown> = { ...prev };

    columns.forEach((col) => {
      if (col.fieldType === "serial") return;
      if (row[col.id] === undefined) {
        row[col.id] = col.defaultValue ?? "";
      }
    });

    row[autoKey] = n;
    row[labelCol] = template.replace(/\{n\}/g, String(n));
    Object.entries(defaults).forEach(([key, val]) => {
      if (typeof val === "string") {
        row[key] = val.replace(/\{n\}/g, String(n));
      } else if (key.endsWith("__fieldType") || row[key] === undefined) {
        row[key] = val;
      }
    });
    // Keep parameter label locked; user edits value/remarks.
    row._readonly = true;
    row._readonlyColumns = Array.from(
      new Set([...(Array.isArray(row._readonlyColumns) ? (row._readonlyColumns as string[]) : []), labelCol]),
    );

    return row;
  });
};

const syncCountBasedTable = (entry: IndexedTable, values: SchemaFormValues): SchemaFormValues => {
  const config = entry.block.rows?.rowGenerationCount;
  if (!config) return values;

  const count = resolveRowGenerationCount(config, values, entry.block.rows?.max);
  const state = readTableRows(values, entry);
  const autoKey = entry.block.rows?.autoIncrementKey ?? "SR_NO";
  const dataExisting = state.rows.filter((row) => !isTrailingTablePresetRow(row, autoKey));
  const generatedRows = buildCountGeneratedRows(entry.block, count, dataExisting);
  const nextRows = applyRowComputations(
    appendTrailingTablePresetRows(generatedRows, entry.block, state.rows),
    entry.block,
  );

  const labelCol = config.labelColumn ?? "parameter";
  const unchanged =
    state.rows.length === nextRows.length &&
    nextRows.every((row, index) => {
      const prev = state.rows[index];
      if (!prev) return false;
      if (String(prev[labelCol] ?? "") !== String(row[labelCol] ?? "")) return false;
      if (String(prev[autoKey] ?? "") !== String(row[autoKey] ?? "")) return false;
      const hintKeys = Object.keys(config.rowDefaults ?? {}).filter((k) => k.endsWith("__fieldType"));
      return hintKeys.every((key) => prev[key] === row[key]);
    });
  if (unchanged) return values;

  return writeTableRows(
    values,
    entry,
    nextRows,
    state.extraColumns,
    state.deletedColumnIds,
    state.preserveWrapper,
  );
};

/**
 * Keeps tables with `rowGenerationSource` aligned to their parent table row count
 * and copies readonly column values from the parent row (e.g. curing BEM mould no ← casting).
 * Also regenerates tables driven by `rowGenerationCount` (field / recipe map).
 */
export const syncRowGenerationTables = (
  schema: SchemaDocumentV2 | null | undefined,
  values: SchemaFormValues,
): SchemaFormValues => {
  const sections = schema?.data?.sections;
  if (!sections?.length) return values;

  const tables = collectTables(sections);
  const tablesById = Object.fromEntries(tables.map((entry) => [entry.tableId, entry]));

  const resolveParentTable = (sourceId: string): IndexedTable | undefined => {
    if (tablesById[sourceId]) return tablesById[sourceId];
    const scopedTables = tables.filter((entry) => entry.scope === sourceId);
    if (scopedTables.length === 0) return undefined;
    return (
      scopedTables.find((entry) => entry.tableId === "ARTICLE_TYPE_TABLE") ?? scopedTables[0]
    );
  };

  let next = values;
  // Multiple passes support chained sources (parent → child → grandchild).
  for (let pass = 0; pass < 4; pass += 1) {
    tables.forEach((child) => {
      const sourceId = child.block.rows?.rowGenerationSource;
      if (!sourceId) return;
      const parent = resolveParentTable(sourceId);
      if (!parent) return;
      next = syncChildFromParent(child, parent, next);
    });
  }

  tables.forEach((entry) => {
    if (!entry.block.rows?.rowGenerationCount) return;
    next = syncCountBasedTable(entry, next);
  });

  return next;
};

const tableUsesRowGeneration = (entry: IndexedTable) =>
  Boolean(entry.block.rows?.rowGenerationSource || entry.block.rows?.rowGenerationCount);

export const schemaHasRowGenerationTables = (schema: SchemaDocumentV2 | null | undefined): boolean => {
  const sections = schema?.data?.sections;
  if (!sections?.length) return false;
  return collectTables(sections).some(tableUsesRowGeneration);
};

export const getRowGenerationTableIds = (schema: SchemaDocumentV2 | null | undefined): Set<string> => {
  const sections = schema?.data?.sections;
  if (!sections?.length) return new Set();
  return new Set(collectTables(sections).filter(tableUsesRowGeneration).map((entry) => entry.tableId));
};

export const getRowGenerationParentSourceIds = (schema: SchemaDocumentV2 | null | undefined): Set<string> => {
  const sections = schema?.data?.sections;
  if (!sections?.length) return new Set();
  const ids = new Set<string>();
  collectTables(sections).forEach((entry) => {
    const sourceId = entry.block.rows?.rowGenerationSource;
    if (sourceId) ids.add(sourceId);
  });
  return ids;
};

/** Field ids that should trigger count-based row regeneration when changed. */
export const getRowGenerationCountTriggerFields = (
  schema: SchemaDocumentV2 | null | undefined,
): Set<string> => {
  const sections = schema?.data?.sections;
  if (!sections?.length) return new Set();
  const ids = new Set<string>();
  collectTables(sections).forEach((entry) => {
    const config = entry.block.rows?.rowGenerationCount;
    if (!config) return;
    if (config.countField) ids.add(config.countField);
    if (config.countByFieldValue?.field) ids.add(config.countByFieldValue.field);
  });
  return ids;
};

const applyTableRowComputationsToStoredValue = (
  table: SchemaTableBlock,
  value: unknown,
): unknown => {
  if (!getTableRowComputations(table).length) return value;

  if (isWrappedTableValue(value)) {
    return { ...value, rows: applyRowComputations(value.rows, table) };
  }

  if (Array.isArray(value)) {
    return applyRowComputations(value as Record<string, unknown>[], table);
  }

  return value;
};

/** Sync generated rows and apply table computations before building submit payload. */
export const prepareSchemaValuesForSubmission = (
  schema: SchemaDocumentV2 | null | undefined,
  values: SchemaFormValues,
): SchemaFormValues => {
  if (!schema?.data?.sections?.length) return values;

  let next = syncRowGenerationTables(schema, values);
  const tables = collectTables(schema.data.sections);

  tables.forEach((entry) => {
    if (!getTableRowComputations(entry.block).length) return;
    const updated = applyTableRowComputationsToStoredValue(entry.block, next[entry.formKey]);
    if (updated !== next[entry.formKey]) {
      next = { ...next, [entry.formKey]: updated };
    }
  });

  return next;
};
