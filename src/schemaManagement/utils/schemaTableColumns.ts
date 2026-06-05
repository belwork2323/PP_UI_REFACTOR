import type { SchemaColumn, SchemaSection } from "../models/schema.types";

/** All table columns in render order: base columns then grouped sub-columns. */
export const getAllTableColumns = (section: SchemaSection): SchemaColumn[] => {
  const base = section.columns ?? [];
  const grouped =
    section.groupedColumns?.flatMap((group) => group.columns ?? []) ?? [];
  if (grouped.length === 0) return base;
  return [...base, ...grouped];
};

export const sectionHasGroupedColumns = (section: SchemaSection) =>
  Boolean(section.groupedColumns?.some((g) => (g.columns?.length ?? 0) > 0));
