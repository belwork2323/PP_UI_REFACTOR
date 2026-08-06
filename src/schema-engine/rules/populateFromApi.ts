import type {
  SchemaBlock,
  SchemaDocumentV2,
  SchemaFieldBlock,
  SchemaPopulateFromApiConfig,
  SchemaSection,
  SchemaTableBlock,
  SchemaCommitFieldMapping,
  SchemaFieldValueTransform,
} from "../types";
import type { SchemaFormValues } from "../state/formState";
import { buildTableRows, getBlockValue, setBlockValue } from "../state/formState";
import { applyFormulaColumns } from "./formulaEval";
import { applyRowComputations } from "./tableRowComputations";
import {
  fetchSchemaApiResolvedValue,
  fetchSchemaDataSourceOptions,
  type SchemaApiContext,
} from "./apiDependency";
import { flattenTableColumns } from "../utils/schemaUtils";
import {
  appendTrailingTablePresetRows,
  isWrappedTableValue,
  resolveTableRows,
} from "../utils/tableRowUtils";

const applyFieldTransform = (value: unknown, transform?: SchemaFieldValueTransform): unknown => {
  if (transform === "referenceRange") {
    if (value == null) return "";
    if (typeof value === "object") {
      const range = value as Record<string, unknown>;
      const min = range.min ?? range.from;
      const max = range.max ?? range.to;
      if (min != null && max != null) return `${min} - ${max}`;
    }
    return String(value);
  }
  if (transform === "string") return value == null ? "" : String(value);
  return value ?? "";
};

const mapApiItemToRow = (
  item: Record<string, unknown>,
  mappings: SchemaCommitFieldMapping[],
  flatColumns: ReturnType<typeof flattenTableColumns>,
  autoKey: string,
  rowIndex: number,
  readonlyColumns: string[],
  columnTemplates?: Array<{ targetColumn: string; template: string }>,
  contextColumnMappings?: Record<string, string>,
  apiContext?: SchemaApiContext,
): Record<string, unknown> => {
  const row: Record<string, unknown> = { [autoKey]: rowIndex + 1 };

  flatColumns.forEach((col) => {
    if (col.fieldType === "serial") return;
    if (col.defaultValue != null) row[col.id] = col.defaultValue;
    else row[col.id] = "";
  });

  mappings.forEach((mapping) => {
    row[mapping.targetColumn] = applyFieldTransform(item[mapping.sourceField], mapping.transform);
  });

  columnTemplates?.forEach(({ targetColumn, template }) => {
    const rendered = String(template ?? "").replace(/\{(\w+)\}/g, (_, key: string) =>
      String(item[key] ?? "").trim(),
    );
    row[targetColumn] = rendered.replace(/\s*\/\s*$/, "").trim();
  });

  if (contextColumnMappings && apiContext) {
    Object.entries(contextColumnMappings).forEach(([targetColumn, contextKey]) => {
      const value = apiContext[contextKey];
      if (value == null || value === "") return;
      row[targetColumn] = String(value).trim();
    });
  }

  if (readonlyColumns.length) {
    row._readonly = true;
    row._readonlyColumns = readonlyColumns;
  }

  return applyFormulaColumns(row, flatColumns);
};

const isEmptyFieldValue = (value: unknown): boolean =>
  value == null || (typeof value === "string" && value.trim() === "");

const isTableUnpopulated = (table: SchemaTableBlock, rows: Record<string, unknown>[]): boolean => {
  if (!rows.length) return true;

  const flatColumns = flattenTableColumns(table.columns);
  const dataColumns = flatColumns.filter(
    (col) => col.fieldType !== "serial" && col.fieldType !== "formula",
  );
  if (!dataColumns.length) return false;

  return rows.every((row) => {
    if (row._rowType === "header") return true;
    return dataColumns.every((col) => isEmptyFieldValue(row[col.id]));
  });
};

type PopulateTarget =
  | { kind: "field"; block: SchemaFieldBlock; scope?: string }
  | { kind: "table"; block: SchemaTableBlock; scope?: string };

const walkPopulateTargets = (
  blocks: SchemaBlock[] | undefined,
  scope: string | undefined,
  targets: PopulateTarget[],
) => {
  (blocks ?? []).forEach((block) => {
    if (block.type === "field" && block.populateFromApi) {
      targets.push({ kind: "field", block, scope });
    }
    if (block.type === "table" && block.rows?.populateFromApi) {
      targets.push({ kind: "table", block, scope });
    }
    if (block.type === "group") {
      if (block.repeat) return;
      walkPopulateTargets(block.children, scope, targets);
    }
    if (block.type === "section") {
      if (block.repeat) return;
      walkPopulateTargets(block.children, block.id, targets);
    }
  });
};

export const collectPopulateFromApiTargets = (sections: SchemaSection[]): PopulateTarget[] => {
  const targets: PopulateTarget[] = [];
  sections.forEach((section) => {
    walkPopulateTargets(section.children, section.id, targets);
  });
  return targets;
};

export const schemaHasPopulateFromApi = (schema: SchemaDocumentV2 | null | undefined): boolean =>
  collectPopulateFromApiTargets(schema?.data?.sections ?? []).length > 0;

const populateTableFromConfig = async (
  table: SchemaTableBlock,
  config: SchemaPopulateFromApiConfig,
  apiContext?: SchemaApiContext,
): Promise<Record<string, unknown>[] | null> => {
  const { options } = await fetchSchemaDataSourceOptions(config.dataSource, apiContext);
  if (!options.length) return null;

  const flatColumns = flattenTableColumns(table.columns);
  const autoKey = table.rows?.autoIncrementKey ?? "srNo";
  const mappings = config.fieldMappings ?? [];
  const readonlyColumns = config.readonlyColumns ?? [];

  const rows = options.map((item, index) =>
    mapApiItemToRow(
      item,
      mappings,
      flatColumns,
      autoKey,
      index,
      readonlyColumns,
      config.columnTemplates,
      config.contextColumnMappings,
      apiContext,
    ),
  );

  return applyRowComputations(appendTrailingTablePresetRows(rows, table), table);
};

export const populateSchemaValuesFromApi = async (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
  apiContext?: SchemaApiContext,
): Promise<SchemaFormValues> => {
  if (!apiContext?.batchId) return values;

  const targets = collectPopulateFromApiTargets(schema.data.sections ?? []);
  if (!targets.length) return values;

  let nextValues = values;
  let changed = false;

  for (const target of targets) {
    if (target.kind === "field") {
      const current = getBlockValue(nextValues, target.block.id, target.scope);
      if (!isEmptyFieldValue(current)) continue;

      const resolved = await fetchSchemaApiResolvedValue(
        target.block.populateFromApi!.dataSource,
        apiContext,
        target.block.populateFromApi!.sourceField,
      );
      if (resolved == null || resolved === "") continue;

      nextValues = setBlockValue(nextValues, target.block.id, resolved, target.scope);
      changed = true;
      continue;
    }

    const table = target.block;
    const config = table.rows!.populateFromApi!;
    const stored = getBlockValue(nextValues, table.id, target.scope);
    const currentRows = isWrappedTableValue(stored)
      ? stored.rows
      : resolveTableRows(stored, table, buildTableRows);
    if (!isTableUnpopulated(table, currentRows)) continue;

    const populatedRows = await populateTableFromConfig(table, config, apiContext);
    if (!populatedRows?.length) continue;

    nextValues = setBlockValue(nextValues, table.id, populatedRows, target.scope);
    changed = true;
  }

  return changed ? nextValues : values;
};
