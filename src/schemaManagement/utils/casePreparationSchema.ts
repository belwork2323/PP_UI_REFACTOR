import type { SchemaField, SchemaSection } from "../models/schema.types";

const normalizeFields = (fields?: SchemaField[]) => fields;

export const normalizeCasePrepSection = (section: SchemaSection): SchemaSection => {
  const table = section.table;

  return {
    ...section,
    fields: normalizeFields(section.fields),
    columns: table?.columns ?? section.columns,
    defaultRows: table?.defaultRows ?? section.defaultRows,
    addRowAllowed: table?.addRowAllowed ?? section.addRowAllowed,
    sections: section.sections?.map(normalizeCasePrepSection),
  };
};

const toTableLeaf = (section: SchemaSection): SchemaSection => ({
  ...section,
  type: "table",
  fields: undefined,
  sections: undefined,
  table: undefined,
});

const toFormLeaf = (section: SchemaSection, sectionId?: string): SchemaSection => ({
  ...section,
  sectionId: sectionId ?? section.sectionId,
  type: "form",
  columns: undefined,
  defaultRows: undefined,
  sections: undefined,
  table: undefined,
});

export const flattenCasePrepSections = (sections: SchemaSection[]): SchemaSection[] => {
  const leaves: SchemaSection[] = [];

  sections.forEach((raw) => {
    const section = normalizeCasePrepSection(raw);

    if (section.type === "group" && section.sections?.length) {
      if (section.fields?.length) {
        leaves.push(toFormLeaf(section, `${section.sectionId}__config`));
      }
      section.sections.forEach((child) => {
        leaves.push(...flattenCasePrepSections([child]));
      });
      return;
    }

    if (section.fields?.length && (section.table || section.columns?.length)) {
      leaves.push(toFormLeaf(section, `${section.sectionId}__form`));
      leaves.push(toTableLeaf({ ...section, sectionId: section.sectionId }));
      return;
    }

    if (section.type === "form" || (section.fields?.length && !section.columns?.length)) {
      leaves.push(toFormLeaf(section));
      return;
    }

    if (
      section.type === "table" ||
      section.type === "complex-table" ||
      section.groupType === "table" ||
      section.columns?.length
    ) {
      leaves.push(toTableLeaf(section));
    }
  });

  return leaves;
};
