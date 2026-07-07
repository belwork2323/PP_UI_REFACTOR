import { scopedFormKey, type SchemaFormValues } from "../state/formState";
import type { SchemaBlock, SchemaDocumentV2, SchemaTableBlock, SchemaTableColumn } from "../types";
import { flattenTableColumns } from "./schemaUtils";
import {
  isWrappedTableValue,
  resolveTableExtraColumns,
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
  preserveWrapper: boolean;
} => {
  const raw = values[entry.formKey];
  const extraColumns = resolveTableExtraColumns(raw);
  const preserveWrapper =
    isWrappedTableValue(raw) || extraColumns.length > 0 || Boolean(entry.block.allowAddColumn);

  if (isWrappedTableValue(raw)) {
    return { rows: raw.rows.map((row) => ({ ...row })), extraColumns, preserveWrapper };
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return { rows: (raw as Record<string, unknown>[]).map((row) => ({ ...row })), extraColumns, preserveWrapper };
  }

  // Hardware article rows are stored unscoped in the subscale UI panel.
  if (entry.tableId === "ARTICLE_TYPE_TABLE") {
    const unscoped = values.ARTICLE_TYPE_TABLE;
    if (Array.isArray(unscoped) && unscoped.length > 0) {
      return {
        rows: (unscoped as Record<string, unknown>[]).map((row) => ({ ...row })),
        extraColumns: [],
        preserveWrapper: false,
      };
    }
  }

  return { rows: [], extraColumns, preserveWrapper };
};

const writeTableRows = (
  values: SchemaFormValues,
  entry: IndexedTable,
  rows: Record<string, unknown>[],
  extraColumns: SchemaTableColumn[],
  preserveWrapper: boolean,
): SchemaFormValues => ({
  ...values,
  [entry.formKey]: preserveWrapper ? wrapTableValue(rows, extraColumns) : rows,
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

  return writeTableRows(values, child, nextRows, childState.extraColumns, childState.preserveWrapper);
};

/**
 * Keeps tables with `rowGenerationSource` aligned to their parent table row count
 * and copies readonly column values from the parent row (e.g. curing BEM mould no ← casting).
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

  return next;
};
