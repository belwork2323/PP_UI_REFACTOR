import type {
  SchemaField,
  SchemaFormValues,
  SchemaSection,
  SchemaSectionSubmission,
} from "./schema.types";
import { applyFormulaColumns } from "../utils/formulaEval";
import { getAllTableColumns } from "../utils/schemaTableColumns";

export const cloneSchemaRow = (row: Record<string, unknown>) => {
  try {
    return structuredClone(row);
  } catch {
    return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
  }
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
      row[field.key] = "";
    }
  });
  return row;
};

export const buildInitialSectionValues = (sections: SchemaSection[]): SchemaFormValues => {
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
        row[field.key] = "";
      });
      values[section.sectionId] = [row];
      return;
    }

    if (section.defaultRows?.length) {
      values[section.sectionId] = section.defaultRows.map((row) => cloneSchemaRow(row as Record<string, unknown>));
      return;
    }

    if (section.type === "table" || section.type === "complex-table") {
      const columns = getAllTableColumns(section);
      const emptyRow = applyFormulaColumns({ srNo: 1 }, columns);
      values[section.sectionId] = section.addRowAllowed === false ? [] : [emptyRow];
      return;
    }

    values[section.sectionId] = section.addRowAllowed === false ? [] : [{}];
  });

  return values;
};

export const isPresetTableCell = (
  sectionId: string,
  colKey: string,
  row: Record<string, unknown>
) => {
  if (colKey === "setParameter" && (row.displayValue || typeof row.setParameter === "object")) {
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
  savedSections: SchemaSectionSubmission[]
): SchemaFormValues => {
  const initial = buildInitialSectionValues(sections);
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

export const valuesMatchSections = (sections: SchemaSection[], values: SchemaFormValues) => {
  const next = { ...values };
  sections.forEach((section) => {
    if (!Array.isArray(next[section.sectionId])) {
      next[section.sectionId] = buildInitialSectionValues([section])[section.sectionId];
    }
  });
  return next;
};
