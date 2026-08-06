import type { SchemaRowComputation, SchemaRowsConfig, SchemaTableBlock } from "../types";

const QC_WEIGHTMENT_ROW_H_COMPUTATION: SchemaRowComputation = {
  rowKey: "H",
  targetColumn: "WEIGHT_KG",
  expression: "G - (A - B + C + D - E + F)",
};

const BUILTIN_TABLE_ROW_COMPUTATIONS: Record<string, SchemaRowComputation[]> = {
  MOTOR_WEIGHT_DETAILS: [QC_WEIGHTMENT_ROW_H_COMPUTATION],
};

export const getTableRowComputations = (
  table: Pick<SchemaTableBlock, "id" | "rows">,
): SchemaRowComputation[] => {
  if (table.rows?.rowComputations?.length) return table.rows.rowComputations;
  return BUILTIN_TABLE_ROW_COMPUTATIONS[table.id] ?? [];
};

const resolveRowsConfig = (table: Pick<SchemaTableBlock, "id" | "rows">): SchemaRowsConfig | undefined => {
  const rowComputations = getTableRowComputations(table);
  if (!rowComputations.length) return table.rows;
  return { ...table.rows, rowComputations };
};

const parseNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractExpressionVariables = (expression: string, rowKeys: string[]): string[] => {
  const keys = [...rowKeys].sort((a, b) => b.length - a.length);
  return keys.filter((key) => new RegExp(`\\b${escapeRegExp(key)}\\b`).test(expression));
};

const evaluateNumericExpression = (expression: string): string => {
  const expr = String(expression ?? "").trim();
  if (!expr) return "";

  try {
    if (!/^[\d.\s+\-*/()]+$/.test(expr)) return "";
    const result = Function(`"use strict"; return (${expr})`)() as number;
    return Number.isFinite(result) ? String(result) : "";
  } catch {
    return "";
  }
};

export const isRowComputationTarget = (
  table: Pick<SchemaTableBlock, "id" | "rows">,
  row: Record<string, unknown>,
  columnId: string,
  autoKey: string,
): boolean => {
  const rowComputations = getTableRowComputations(table);
  if (!rowComputations.length) return false;
  return rowComputations.some((computation) => {
    if (computation.editable === true) return false;
    const keyColumn = computation.rowKeyColumn ?? autoKey;
    const rowKey = String(row[keyColumn] ?? "").trim();
    return computation.rowKey === rowKey && computation.targetColumn === columnId;
  });
};

/** Editable auto-computed cells (e.g. Total Quantity) — stay as inputs, not FormulaCell. */
export const isEditableRowComputationTarget = (
  table: Pick<SchemaTableBlock, "id" | "rows">,
  row: Record<string, unknown>,
  columnId: string,
  autoKey: string,
): boolean => {
  const rowComputations = getTableRowComputations(table);
  if (!rowComputations.length) return false;
  return rowComputations.some((computation) => {
    if (computation.editable !== true) return false;
    const keyColumn = computation.rowKeyColumn ?? autoKey;
    const rowKey = String(row[keyColumn] ?? "").trim();
    return computation.rowKey === rowKey && computation.targetColumn === columnId;
  });
};

export type ApplyRowComputationsOptions = {
  /** Row index that triggered this recompute (e.g. from a cell edit). */
  changedRowIndex?: number;
  /** Column id that triggered this recompute. */
  changedColumnId?: string;
};

export const applyRowComputations = (
  rows: Record<string, unknown>[],
  table: Pick<SchemaTableBlock, "id" | "rows">,
  options?: ApplyRowComputationsOptions,
): Record<string, unknown>[] => {
  const rowsConfig = resolveRowsConfig(table);
  const computations = rowsConfig?.rowComputations;
  if (!computations?.length || !rows.length) return rows;

  const autoKey = rowsConfig?.autoIncrementKey ?? "SR_NO";
  let nextRows = rows.map((row) => ({ ...row }));

  computations.forEach((computation) => {
    if (computation.expression === "__SUM__") {
      nextRows = applySumRowComputation(nextRows, computation, autoKey, options);
      return;
    }
    nextRows = applySingleRowComputation(nextRows, computation, rowsConfig, autoKey);
  });

  return nextRows;
};

const applySumRowComputation = (
  rows: Record<string, unknown>[],
  computation: SchemaRowComputation,
  autoKey: string,
  options?: ApplyRowComputationsOptions,
): Record<string, unknown>[] => {
  const keyColumn = computation.rowKeyColumn ?? autoKey;
  const sourceColumn = computation.sourceColumn ?? computation.targetColumn;
  const targetIndex = rows.findIndex(
    (row) => String(row[keyColumn] ?? "").trim() === computation.rowKey,
  );
  if (targetIndex < 0) return rows;

  // Editable totals: keep the user's typed value when they are editing that cell.
  // Still recompute when any other (source) cell changes.
  if (
    computation.editable === true &&
    options?.changedRowIndex === targetIndex &&
    options?.changedColumnId === computation.targetColumn
  ) {
    return rows;
  }

  let sum = 0;
  let hasValue = false;
  rows.forEach((row, index) => {
    if (index === targetIndex) return;
    const key = String(row[keyColumn] ?? "").trim();
    if (!/^\d+$/.test(key)) return;
    const val = parseNum(row[sourceColumn]);
    if (val === null) return;
    sum += val;
    hasValue = true;
  });

  const nextRows = [...rows];
  nextRows[targetIndex] = {
    ...nextRows[targetIndex],
    [computation.targetColumn]: hasValue ? String(sum) : "",
  };
  return nextRows;
};

const applySingleRowComputation = (
  rows: Record<string, unknown>[],
  computation: SchemaRowComputation,
  rowsConfig: SchemaRowsConfig | undefined,
  autoKey: string,
): Record<string, unknown>[] => {
  const keyColumn = computation.rowKeyColumn ?? autoKey;
  const targetColumn = computation.targetColumn;
  const sourceColumn = computation.sourceColumn ?? targetColumn;

  const valueByRowKey: Record<string, number | null> = {};
  rows.forEach((row) => {
    const key = String(row[keyColumn] ?? "").trim();
    if (!key) return;
    valueByRowKey[key] = parseNum(row[sourceColumn]);
  });

  const targetIndex = rows.findIndex((row) => String(row[keyColumn] ?? "").trim() === computation.rowKey);
  if (targetIndex < 0) return rows;

  const referencedKeys = extractExpressionVariables(computation.expression, Object.keys(valueByRowKey));
  if (!referencedKeys.length) return rows;

  if (referencedKeys.some((key) => valueByRowKey[key] === null)) {
    const nextRows = [...rows];
    nextRows[targetIndex] = { ...nextRows[targetIndex], [targetColumn]: "" };
    return nextRows;
  }

  let resolved = computation.expression;
  referencedKeys.forEach((key) => {
    resolved = resolved.replace(
      new RegExp(`\\b${escapeRegExp(key)}\\b`, "g"),
      String(valueByRowKey[key] ?? 0),
    );
  });

  const nextRows = [...rows];
  nextRows[targetIndex] = {
    ...nextRows[targetIndex],
    [targetColumn]: evaluateNumericExpression(resolved),
  };
  return nextRows;
};
