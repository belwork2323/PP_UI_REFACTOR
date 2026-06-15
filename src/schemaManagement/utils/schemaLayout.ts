import type { SchemaAccordionConfigRef, SchemaDocumentLayout, SchemaSection } from "../models/schema.types";

export type SchemaAccordionPanel = {
  panelId: string;
  title: string;
  sections: SchemaSection[];
};

export const resolveSchemaLayoutType = (layout?: SchemaDocumentLayout) =>
  String(layout?.type ?? "flat").trim().toLowerCase();

export const coerceSchemaBoolean = (value: unknown, defaultValue: boolean): boolean => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return defaultValue;
};

export const resolveSchemaAccordionConfig = (
  layout?: SchemaDocumentLayout,
): Required<Pick<SchemaAccordionConfigRef, "defaultExpanded" | "allowMultipleExpanded">> &
  SchemaAccordionConfigRef => {
  const accordionConfig = layout?.accordionConfig;

  return {
    defaultExpanded: coerceSchemaBoolean(accordionConfig?.defaultExpanded, true),
    allowMultipleExpanded: coerceSchemaBoolean(accordionConfig?.allowMultipleExpanded, true),
    expandIcon: accordionConfig?.expandIcon ?? "expand_more",
    collapseIcon: accordionConfig?.collapseIcon,
  };
};

export const groupSectionsForAccordion = (sections: SchemaSection[]): SchemaAccordionPanel[] => {
  const panels: SchemaAccordionPanel[] = [];
  const panelMap = new Map<string, SchemaAccordionPanel>();

  sections.forEach((section) => {
    const panelId = section.accordionGroupId ?? section.sectionId;
    const title = section.accordionGroupLabel ?? section.title;
    let panel = panelMap.get(panelId);

    if (!panel) {
      panel = { panelId, title, sections: [] };
      panelMap.set(panelId, panel);
      panels.push(panel);
    }

    panel.sections.push(section);
  });

  return panels;
};
