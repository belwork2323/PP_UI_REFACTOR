import type {
  SchemaColumn,
  SchemaField,
  SchemaFormValues,
  SchemaSection,
  SchemaSectionSubmission,
} from "./schema.types";
import { applyFormulaColumns } from "../utils/formulaEval";
import { getAllTableColumns } from "../utils/schemaTableColumns";
import { isSchemaTableRowReadonly } from "../utils/tableCellTypes";
import {
  resolveSchemaCountToken,
  type SchemaSetupContext,
} from "../utils/schemaSetupContext";

export type { SchemaSetupContext };

export const cloneSchemaRow = (row: Record<string, unknown>) => {
  try {
    return structuredClone(row);
  } catch {
    return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
  }
};

const resolveColumnDefault = (column: SchemaColumn, rowIndex: number): unknown => {
  if (Array.isArray(column.defaultValues) && column.defaultValues[rowIndex] !== undefined) {
    return column.defaultValues[rowIndex];
  }
  if (column.defaultValue !== undefined && column.defaultValue !== null) {
    return column.defaultValue;
  }
  return undefined;
};

export const applyColumnDefaultsToRows = (
  rows: Record<string, unknown>[],
  columns: SchemaColumn[],
): Record<string, unknown>[] =>
  rows.map((row, rowIndex) => {
    const next = cloneSchemaRow(row);
    columns.forEach((column) => {
      if (column.key === "srNo") return;
      const existing = next[column.key];
      if (existing !== undefined && existing !== null && String(existing).trim() !== "") return;
      const fallback = resolveColumnDefault(column, rowIndex);
      if (fallback !== undefined) {
        next[column.key] = fallback;
      }
    });
    return applyFormulaColumns(next, columns);
  });

const buildTableRowsFromSection = (section: SchemaSection): Record<string, unknown>[] => {
  const columns = getAllTableColumns(section);

  if (section.defaultRows?.length) {
    return applyColumnDefaultsToRows(
      section.defaultRows.map((row) => cloneSchemaRow(row as Record<string, unknown>)),
      columns,
    );
  }

  if (section.addRowAllowed === false) {
    return [];
  }

  const row = applyFormulaColumns({ srNo: 1 }, columns);
  return [applyColumnDefaultsToRows([row], columns)[0]];
};

const buildRepeatableTableRows = (section: SchemaSection): Record<string, unknown>[] => {
  const count = Number(section.defaultRowCount ?? 1) || 1;
  const columns = section.columns ?? [];
  const rows = Array.from({ length: count }, (_, rowIndex) => {
    const row: Record<string, unknown> = { srNo: rowIndex + 1 };
    columns.forEach((column) => {
      if (column.key === "srNo") return;
      const fallback = resolveColumnDefault(column, rowIndex);
      row[column.key] = fallback !== undefined ? fallback : "";
    });
    return row;
  });
  return applyColumnDefaultsToRows(rows, columns);
};

export const buildRepeatableCyclesFromSection = (
  section: SchemaSection,
  setupContext?: SchemaSetupContext,
): Array<{ _cycleKey: string; rows: Record<string, unknown>[] }> => {
  const cycleCount = resolveSchemaCountToken(
    section.repeatConfig?.defaultCount ?? 1,
    setupContext,
  );
  const tableRows = buildRepeatableTableRows(section);
  return Array.from({ length: cycleCount }, (_, index) => ({
    _cycleKey: `cycle-${index + 1}`,
    rows: tableRows.map((row) => cloneSchemaRow(row)),
  }));
};

const getNestedGroupFields = (section: SchemaSection): SchemaField[] | null => {
  if (section.lots?.fields?.length) return section.lots.fields;
  if (section.drums?.fields?.length) return section.drums.fields;
  return null;
};

export const buildNestedFieldDefaults = (fields: SchemaField[]): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (field.type === "table" && field.defaultRows?.length) {
      row[field.key] = field.defaultRows.map((r) => cloneSchemaRow(r as Record<string, unknown>));
    } else {
      row[field.key] = field.defaultValue !== undefined ? field.defaultValue : "";
    }
  });
  return row;
};

export const buildInitialSectionValues = (
  sections: SchemaSection[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues => {
  const values: SchemaFormValues = {};

  sections.forEach((section) => {
    const nestedFields = getNestedGroupFields(section);
    if (nestedFields) {
      values[section.sectionId] = [buildNestedFieldDefaults(nestedFields)];
      return;
    }

    if (section.type === "form") {
      const row: Record<string, unknown> = {};
      section.fields?.forEach((field) => {
        row[field.key] = field.defaultValue !== undefined ? field.defaultValue : "";
      });
      values[section.sectionId] = [row];
      return;
    }

    if (section.defaultRows?.length) {
      values[section.sectionId] = buildTableRowsFromSection(section);
      return;
    }

    if (section.type === "repeatable-table") {
      values[section.sectionId] = buildRepeatableCyclesFromSection(section, setupContext);
      return;
    }

    if (section.type === "table" || section.type === "complex-table") {
      values[section.sectionId] = buildTableRowsFromSection(section);
      return;
    }

    values[section.sectionId] = section.addRowAllowed === false ? [] : [{}];
  });

  return values;
};

export const isPresetTableCell = (
  sectionId: string,
  colKey: string,
  row: Record<string, unknown>,
  col?: SchemaColumn,
) => {
  if (col?.type === "static") return true;
  if (colKey === "setParameter" && (row.displayValue || typeof row.setParameter === "object")) {
    return true;
  }
  if (isSchemaTableRowReadonly(row) && col?.readonly) {
    return true;
  }
  if (
    (sectionId === "blendingCumDryingParameters" || sectionId === "blendingCumDrying") &&
    (colKey === "operation" || colKey === "setParameter")
  ) {
    return true;
  }
  if (
    (sectionId === "dryingOperationRvd" || sectionId === "dryingOperationInRvd") &&
    colKey === "operation"
  ) {
    return true;
  }
  return false;
};

export const schemaValuesHaveUserData = (values: SchemaFormValues) =>
  Object.values(values).some((rows) =>
    (rows ?? []).some((row) => {
      if (!row || typeof row !== "object") return false;
      return Object.entries(row as Record<string, unknown>).some(([key, value]) => {
        if (key === "displayValue" || key === "srNo") return false;
        if (Array.isArray(value)) {
          return value.some(
            (nested) =>
              nested &&
              typeof nested === "object" &&
              Object.values(nested as Record<string, unknown>).some((v) => String(v ?? "").trim().length > 0)
          );
        }
        if (value && typeof value === "object") return true;
        return String(value ?? "").trim().length > 0;
      });
    })
  );

export const mergeSectionDataIntoValues = (
  sections: SchemaSection[],
  savedSections: SchemaSectionSubmission[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues => {
  const initial = buildInitialSectionValues(sections, setupContext);
  const savedById = Object.fromEntries(savedSections.map((s) => [s.sectionId, s.sectionData]));

  sections.forEach((section) => {
    const saved = savedById[section.sectionId];
    if (!Array.isArray(saved) || saved.length === 0) return;
    initial[section.sectionId] = saved.map((row) => cloneSchemaRow(row as Record<string, unknown>));
  });

  return initial;
};

export const toSectionSubmissions = (
  sections: SchemaSection[],
  values: SchemaFormValues
): SchemaSectionSubmission[] =>
  sections.map((section) => ({
    sectionId: section.sectionId,
    sectionData: (values[section.sectionId] ?? []).map((row) => cloneSchemaRow(row as Record<string, unknown>)),
  }));

export const valuesMatchSections = (
  sections: SchemaSection[],
  values: SchemaFormValues,
  setupContext?: SchemaSetupContext,
) => {
  const next = { ...values };
  sections.forEach((section) => {
    if (!Array.isArray(next[section.sectionId])) {
      next[section.sectionId] = buildInitialSectionValues([section], setupContext)[section.sectionId];
    }
  });
  return next;
};
