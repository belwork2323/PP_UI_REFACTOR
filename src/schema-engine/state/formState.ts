import type { SchemaBlock, SchemaDocumentV2, SchemaFieldBlock, SchemaRepeatConfig, SchemaSection, SchemaTableBlock } from "../types";
import { applyFormulaColumns } from "../rules/formulaEval";
import { applyRowComputations, getTableRowComputations } from "../rules/tableRowComputations";
import {
  buildFlatVisibilityContext,
  isBlockVisible,
  isSectionVisible,
} from "../rules/visibility";
import { resolveSchemaCountToken, type SchemaSetupContext } from "../utils/setupContext";
import { flattenTableColumns } from "../utils/schemaUtils";
import {
  applyExtraColumnCellsToRows,
  buildInitialExtraColumns,
  hasTableCommitGroup,
  isWrappedTableValue,
  PRESET_ROW_META_KEYS,
  rehydrateDynamicTableColumnState,
  TABLE_ROW_RUNTIME_KEYS,
  TABLE_VALUE_META_KEYS,
  getTableColumnStateKey,
  type SchemaTableColumnState,
  shouldWrapTableValue,
  wrapTableValue,
  isFieldTypeHintKey,
  isPickerRow,
} from "../utils/tableRowUtils";
import { buildEmptyPickerRow, rehydrateCommitGroupTableRows } from "../rules/tableCommitGroup";

export type SchemaFormValues = Record<string, unknown>;

export type SchemaChangeMeta = {
  changedBlockId?: string;
  changedScope?: string;
};

const SCOPED_FORM_KEY_SEP = "::";

/** Form-state key for a block within a section (avoids duplicate field ids across sections). */
export const scopedFormKey = (scope: string | undefined, blockId: string): string =>
  scope ? `${scope}${SCOPED_FORM_KEY_SEP}${blockId}` : blockId;

export type SchemaSectionSubmission = {
  sectionId: string;
  sectionData: unknown[];
  premixNo?: number;
  subType?: string;
};

export const cloneValue = <T>(value: T): T => {
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
};

const columnDefault = (col: { defaultValue?: unknown; defaultValues?: unknown[] }, rowIndex: number) => {
  if (Array.isArray(col.defaultValues) && col.defaultValues[rowIndex] !== undefined) {
    return col.defaultValues[rowIndex];
  }
  return col.defaultValue ?? "";
};


export const buildTableRows = (table: SchemaTableBlock): Record<string, unknown>[] => {
  const columns = flattenTableColumns(table.columns);
  const autoKey = table.rows?.autoIncrementKey ?? "srNo";
  const presetRows = table.rows?.presetRows ?? [];

  if (hasTableCommitGroup(table)) {
    const pickerCount = Math.max(table.rows?.defaultCount ?? 1, 1);
    return Array.from({ length: pickerCount }, (_, rowIndex) =>
      buildEmptyPickerRow(columns, autoKey),
    ).map((row, rowIndex) => ({ ...row, [autoKey]: rowIndex + 1 }));
  }

  if (table.rows?.populateFromApi) {
    return [];
  }

  // Count-driven tables start empty; syncRowGenerationTables fills them from fields.
  if (table.rows?.rowGenerationCount && !(table.rows?.presetRows?.length)) {
    return [];
  }

  const count = Math.max(table.rows?.defaultCount ?? 1, presetRows.length);

  const built = Array.from({ length: count }, (_, rowIndex) => {
    const preset = presetRows[rowIndex] ?? {};
    const row: Record<string, unknown> = {};

    if (preset.type === "header") {
      row._rowType = "header";
      row._headerLabel = preset.label ?? "";
    }
    if (preset.readonly === true) {
      row._readonly = true;
      row._readonlyColumns = Object.keys(preset).filter(
        (key) => !PRESET_ROW_META_KEYS.has(key) && key !== autoKey && !isFieldTypeHintKey(key),
      );
    }

    row[autoKey] = preset[autoKey] ?? rowIndex + 1;

    columns.forEach((col) => {
      if (col.fieldType === "serial") return;
      if (col.id in preset && preset[col.id] !== undefined) {
        row[col.id] = preset[col.id];
      } else {
        row[col.id] = columnDefault(col, rowIndex);
      }
    });

    Object.entries(preset).forEach(([key, val]) => {
      if (isFieldTypeHintKey(key)) {
        row[key] = val;
      }
    });

    return applyFormulaColumns(row, columns);
  });

  return applyRowComputations(built, table);
};

const findStaticDataColumnId = (table: SchemaTableBlock): string | null => {
  const autoKey = table.rows?.autoIncrementKey ?? "srNo";
  const columns = flattenTableColumns(table.columns);

  const staticCol = columns.find(
    (column) => column.fieldType === "static" && column.id !== autoKey,
  );
  if (staticCol) return staticCol.id;

  const presetRows = table.rows?.presetRows ?? [];
  if (!presetRows.length) return null;

  const presetIdentityCol = columns.find((column) => {
    if (column.id === autoKey || column.fieldType === "serial") return false;
    return presetRows.some(
      (preset) => preset[column.id] !== undefined && String(preset[column.id]).trim() !== "",
    );
  });
  return presetIdentityCol?.id ?? null;
};

const isHeaderTableRow = (row: Record<string, unknown>) => row._rowType === "header";

const mergeSavedRowValuesIntoPreset = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
) => {
  Object.entries(source).forEach(([key, value]) => {
    if (TABLE_ROW_RUNTIME_KEYS.has(key) || key.endsWith("__fieldType")) return;
    if (/^(sr[_-]?no|serial)$/i.test(key)) return;
    target[key] = value;
  });
};

/** Merge API/submission row data into the server schema preset table structure. */
export const mergeSavedRowsIntoPresetTable = (
  table: SchemaTableBlock,
  savedRows: unknown,
): Record<string, unknown>[] => {
  const saved = (Array.isArray(savedRows) ? savedRows : []) as Record<string, unknown>[];
  const presetBuilt = buildTableRows(table);
  if (!table.rows?.presetRows?.length || !saved.length) {
    return presetBuilt;
  }

  const staticCol = findStaticDataColumnId(table);
  const autoKey = table.rows?.autoIncrementKey ?? "srNo";
  const byStatic = new Map<string, Record<string, unknown>>();
  const bySrNo = new Map<string, Record<string, unknown>>();

  saved.forEach((row) => {
    if (isHeaderTableRow(row)) return;
    if (staticCol) {
      const key = String(row[staticCol] ?? "").trim();
      if (key) byStatic.set(key, row);
    }
    const srNo = row[autoKey];
    if (srNo != null && String(srNo).trim() !== "") {
      bySrNo.set(String(srNo), row);
    }
  });

  return presetBuilt.map((presetRow, rowIndex) => {
    if (isHeaderTableRow(presetRow)) return presetRow;

    let savedRow: Record<string, unknown> | undefined;
    if (staticCol) {
      const key = String(presetRow[staticCol] ?? "").trim();
      if (key) savedRow = byStatic.get(key);
    }
    if (!savedRow) {
      savedRow = bySrNo.get(String(presetRow[autoKey] ?? ""));
    }
    if (!savedRow && saved[rowIndex]) {
      savedRow = saved[rowIndex];
    }
    if (!savedRow) return presetRow;

    const next = { ...presetRow };
    mergeSavedRowValuesIntoPreset(next, savedRow);
    return next;
  });
};

const initRepeatChildValues = (
  children: SchemaBlock[],
  setupContext?: SchemaSetupContext,
): Record<string, unknown> => {
  const instance: Record<string, unknown> = {};
  children.forEach((child) => {
    instance[child.id] = initBlockValue(child, setupContext);
  });
  return instance;
};

export const buildRepeatInstanceChildValues = initRepeatChildValues;

const buildRepeatInstances = (
  blockId: string,
  repeat: SchemaRepeatConfig | undefined,
  childInit: () => Record<string, unknown>,
  setupContext?: SchemaSetupContext,
) => {
  const count = resolveSchemaCountToken(repeat?.defaultCount ?? 1, setupContext);
  return Array.from({ length: count }, (_, index) => ({
    _key: `${blockId}-${index + 1}`,
    ...childInit(),
  }));
};

const initBlockValue = (
  block: SchemaBlock,
  setupContext?: SchemaSetupContext,
): unknown => {
  switch (block.type) {
    case "field":
      return block.defaultValue ?? "";
    case "table": {
      const extraColumns = buildInitialExtraColumns(block);
      const rows = applyExtraColumnCellsToRows(buildTableRows(block), extraColumns);
      if (shouldWrapTableValue(block, extraColumns)) {
        return wrapTableValue(rows, extraColumns);
      }
      return rows;
    }
    case "matrix":
      return { columns: [], rows: [] };
    case "group":
      if (block.repeat) {
        return buildRepeatInstances(
          block.id,
          block.repeat,
          () => initRepeatChildValues(block.children, setupContext),
          setupContext,
        );
      }
      return undefined;
    case "section":
      if (block.repeat) {
        return buildRepeatInstances(
          block.id,
          block.repeat,
          () => initRepeatChildValues(block.children, setupContext),
          setupContext,
        );
      }
      return undefined;
    default:
      return undefined;
  }
};

export const buildInitialFormValues = (
  schema: SchemaDocumentV2,
  setupContext?: SchemaSetupContext,
): SchemaFormValues => {
  const values: SchemaFormValues = {};

  const assignBlock = (block: SchemaBlock, scope: string) => {
    if (block.type === "section" && block.repeat) {
      values[block.id] = initBlockValue(block, setupContext);
      return;
    }
    if (block.type === "section") {
      (block.children ?? []).forEach((child) => assignBlock(child, block.id));
      return;
    }
    if (block.type === "group") {
      if (block.repeat) {
        values[block.id] = initBlockValue(block, setupContext);
        return;
      }
      (block.children ?? []).forEach((child) => assignBlock(child, scope));
      return;
    }
    if (block.type === "field" || block.type === "table" || block.type === "matrix") {
      values[scopedFormKey(scope, block.id)] = initBlockValue(block, setupContext);
    }
  };

  schema.data.sections.forEach((section) => {
    (section.children ?? []).forEach((block) => assignBlock(block, section.id));
  });
  return values;
};

const hydrateTableValue = (
  table: SchemaTableBlock,
  value: unknown,
  columnState?: SchemaTableColumnState,
): unknown => {
  let input = value;
  if (table.rows?.presetRows?.length && Array.isArray(value) && !isWrappedTableValue(value)) {
    input = mergeSavedRowsIntoPresetTable(table, value);
  }

  let hydrated = rehydrateDynamicTableColumnState(table, input, columnState);

  if (hasTableCommitGroup(table)) {
    if (isWrappedTableValue(hydrated)) {
      const rows = hydrated.rows as Record<string, unknown>[];
      if (rows.length && !rows.some(isPickerRow)) {
        hydrated = { ...hydrated, rows: rehydrateCommitGroupTableRows(table, rows) };
      }
    } else if (
      Array.isArray(hydrated) &&
      hydrated.length &&
      !(hydrated as Record<string, unknown>[]).some(isPickerRow)
    ) {
      hydrated = rehydrateCommitGroupTableRows(table, hydrated as Record<string, unknown>[]);
    }
  }

  return applyTableRowComputationsToValue(table, hydrated);
};

const applyTableRowComputationsToValue = (table: SchemaTableBlock, value: unknown): unknown => {
  if (!getTableRowComputations(table).length) return value;

  if (isWrappedTableValue(value)) {
    return { ...value, rows: applyRowComputations(value.rows, table) };
  }

  if (Array.isArray(value)) {
    return applyRowComputations(value as Record<string, unknown>[], table);
  }

  return value;
};

const isEmptySubmissionRow = (row: unknown): boolean => {
  if (!row || typeof row !== "object" || Array.isArray(row)) return false;

  return Object.entries(row as Record<string, unknown>).every(([key, value]) => {
    if (TABLE_ROW_RUNTIME_KEYS.has(key) || key.endsWith("__fieldType")) return true;
    if (/^(sr[_-]?no|serial)$/i.test(key)) return true;
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (typeof value === "number") return false;
    if (typeof value === "boolean") return false;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
    return false;
  });
};

const sanitizeSubmissionValue = (value: unknown): unknown => {
  if (isWrappedTableValue(value)) {
    return sanitizeSubmissionValue(value.rows);
  }
  if (Array.isArray(value)) {
    return value
      .map(sanitizeSubmissionValue)
      .filter((item) => !isEmptySubmissionRow(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      if (TABLE_ROW_RUNTIME_KEYS.has(key) || TABLE_VALUE_META_KEYS.has(key) || key.endsWith("__fieldType")) {
        return;
      }
      out[key] = sanitizeSubmissionValue(val);
    });
    return out;
  }
  return value;
};

const collectSectionRow = (
  blocks: SchemaBlock[],
  values: SchemaFormValues,
  scope: string,
  visibilityContext: Record<string, unknown>,
): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  blocks.forEach((block) => {
    if (!isBlockVisible(block, visibilityContext)) return;

    if (block.type === "group") {
      if (block.repeat) {
        if (values[block.id] !== undefined) {
          row[block.id] = sanitizeSubmissionValue(cloneValue(values[block.id]));
        }
      } else {
        Object.assign(row, collectSectionRow(block.children ?? [], values, scope, visibilityContext));
      }
      return;
    }
    if (block.type === "field" || block.type === "table" || block.type === "matrix") {
      const key = scopedFormKey(scope, block.id);
      if (values[key] !== undefined) {
        const rawValue = cloneValue(values[key]);
        row[block.id] = sanitizeSubmissionValue(rawValue);
        if (
          block.type === "table" &&
          isWrappedTableValue(rawValue) &&
          shouldWrapTableValue(
            block,
            rawValue.extraColumns ?? [],
            rawValue.deletedColumnIds ?? [],
          )
        ) {
          row[getTableColumnStateKey(block.id)] = {
            extraColumns: rawValue.extraColumns ?? [],
            deletedColumnIds: rawValue.deletedColumnIds ?? [],
          };
        }
      }
    }
    if (block.type === "section" && block.repeat) {
      row[block.id] = sanitizeSubmissionValue(cloneValue(values[block.id] ?? []));
    } else if (block.type === "section") {
      Object.assign(
        row,
        collectSectionRow(block.children ?? [], values, block.id, visibilityContext),
      );
    }
  });
  return row;
};

export const toSectionSubmissions = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => {
  const visibilityContext = buildFlatVisibilityContext(values);
  return schema.data.sections
    .filter((section) => isSectionVisible(section, visibilityContext))
    .map((section) => ({
      sectionId: section.id,
      sectionData: [collectSectionRow(section.children ?? [], values, section.id, visibilityContext)],
    }));
};

const normalizeRepeatInstances = (blockId: string, value: unknown): unknown => {
  if (!Array.isArray(value)) return value;
  return value.map((instance, index) => {
    if (!instance || typeof instance !== "object" || Array.isArray(instance)) return instance;
    const row = instance as Record<string, unknown>;
    return {
      ...row,
      _key: row._key ?? `${blockId}-${index + 1}`,
    };
  });
};

export const mergeSectionDataIntoValues = (
  schema: SchemaDocumentV2,
  savedSections: SchemaSectionSubmission[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues => {
  const initial = buildInitialFormValues(schema, setupContext);
  const savedById = Object.fromEntries(savedSections.map((s) => [s.sectionId, s.sectionData]));

  schema.data.sections.forEach((section) => {
    const saved = savedById[section.id];
    if (!Array.isArray(saved) || saved.length === 0) return;
    const savedRow = saved[0];
    if (!savedRow || typeof savedRow !== "object") return;

    const applySavedBlock = (block: SchemaBlock, scope: string) => {
      if (block.type === "section" && block.repeat) {
        if (block.id in (savedRow as Record<string, unknown>)) {
          initial[block.id] = normalizeRepeatInstances(
            block.id,
            cloneValue((savedRow as Record<string, unknown>)[block.id]),
          );
        }
        return;
      }
      if (block.type === "section") {
        (block.children ?? []).forEach((child) => applySavedBlock(child, block.id));
        return;
      }
      if (block.type === "group") {
        if (block.repeat) {
          if (block.id in (savedRow as Record<string, unknown>)) {
            initial[block.id] = normalizeRepeatInstances(
              block.id,
              cloneValue((savedRow as Record<string, unknown>)[block.id]),
            );
          }
          return;
        }
        (block.children ?? []).forEach((child) => applySavedBlock(child, scope));
        return;
      }
      if (block.type === "field" || block.type === "table" || block.type === "matrix") {
        if (block.id in (savedRow as Record<string, unknown>)) {
          const savedValue = cloneValue((savedRow as Record<string, unknown>)[block.id]);
          const columnState = (savedRow as Record<string, unknown>)[getTableColumnStateKey(block.id)];
          initial[scopedFormKey(scope, block.id)] =
            block.type === "table"
              ? hydrateTableValue(
                  block,
                  savedValue,
                  columnState && typeof columnState === "object"
                    ? (columnState as SchemaTableColumnState)
                    : undefined,
                )
              : savedValue;
        }
      }
    };

    (section.children ?? []).forEach((block) => applySavedBlock(block, section.id));
  });

  return initial;
};

export const schemaValuesHaveUserData = (values: SchemaFormValues): boolean => {
  const hasContent = (val: unknown): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number" || typeof val === "boolean") return true;
    if (Array.isArray(val)) return val.some(hasContent);
    if (typeof val === "object") {
      return Object.entries(val as Record<string, unknown>).some(([key, v]) => {
        if (key.startsWith("_")) return false;
        return hasContent(v);
      });
    }
    return false;
  };

  return Object.values(values).some(hasContent);
};

export const getBlockValue = (values: SchemaFormValues, blockId: string, scope?: string) =>
  values[scopedFormKey(scope, blockId)];

export const setBlockValue = (
  values: SchemaFormValues,
  blockId: string,
  value: unknown,
  scope?: string,
): SchemaFormValues => ({
  ...values,
  [scopedFormKey(scope, blockId)]: value,
});
