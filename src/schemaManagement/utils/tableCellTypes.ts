import type { SchemaColumn } from "../models/schema.types";

/** Row `type` values that describe row layout, not input control type. */
const RESERVED_ROW_TYPES = new Set(["header"]);

export const isSchemaTableHeaderRow = (row: Record<string, unknown>) =>
  String(row.type ?? "").toLowerCase() === "header";

export const isSchemaTableRowReadonly = (row: Record<string, unknown>) => Boolean(row.readonly);

const resolveRowInputType = (row: Record<string, unknown>): string => {
  const fieldType = String(row.fieldType ?? "").trim().toLowerCase();
  if (fieldType) return fieldType;

  const rowType = String(row.type ?? "").trim().toLowerCase();
  if (rowType && !RESERVED_ROW_TYPES.has(rowType)) {
    return rowType;
  }

  return "";
};

export const resolveSchemaTableCellType = (
  col: SchemaColumn,
  row: Record<string, unknown>
): string => {
  const colType = String(col.type ?? "text").toLowerCase();

  if (colType === "dynamic") {
    const rowInputType = resolveRowInputType(row);
    return rowInputType || "text";
  }

  return colType;
};

export const getSchemaTableHeaderLabel = (row: Record<string, unknown>) =>
  String(row.operation ?? row.parameter ?? row.label ?? "").trim();
