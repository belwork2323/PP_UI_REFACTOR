import type { SchemaColumn, SchemaSection, SchemaTableColumnSlot } from "../models/schema.types";

const synthesizeColumnLayout = (section: SchemaSection): SchemaTableColumnSlot[] => {
  const layout: SchemaTableColumnSlot[] = [];
  const base = section.columns ?? [];
  const grouped = section.groupedColumns ?? [];

  if (grouped.length === 0) {
    return base.map((column) => ({ kind: "column", column }));
  }

  base.forEach((column) => {
    layout.push({ kind: "column", column });
  });
  grouped.forEach((group) => {
    layout.push({ kind: "group", group });
  });

  return layout;
};

export const getTableColumnLayout = (section: SchemaSection): SchemaTableColumnSlot[] => {
  if (section.columnLayout?.length) return section.columnLayout;
  return synthesizeColumnLayout(section);
};

/** All table columns in schema child order. */
export const getAllTableColumns = (section: SchemaSection): SchemaColumn[] =>
  getTableColumnLayout(section).flatMap((slot) =>
    slot.kind === "column" ? [slot.column] : slot.group.columns ?? [],
  );

export const sectionHasGroupedColumns = (section: SchemaSection) =>
  getTableColumnLayout(section).some(
    (slot) => slot.kind === "group" && (slot.group.columns?.length ?? 0) > 0,
  );
