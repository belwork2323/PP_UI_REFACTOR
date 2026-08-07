const parseNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Column ids referenced by a formula expression, longest-first for safe replacement. */
const getExpressionRowKeys = (expression: string, row: Record<string, unknown>): string[] =>
  Object.keys(row)
    .filter((key) => new RegExp(`\\b${escapeRegExp(key)}\\b`).test(expression))
    .sort((a, b) => b.length - a.length);

export const evaluateRowFormula = (
  expression: string,
  row: Record<string, unknown>,
): string => {
  const expr = String(expression ?? "").trim();
  if (!expr) return "";

  try {
    let resolved = expr;
    getExpressionRowKeys(expr, row).forEach((key) => {
      const val = parseNum(row[key]) ?? 0;
      resolved = resolved.replace(new RegExp(`\\b${escapeRegExp(key)}\\b`, "g"), String(val));
    });
    if (!/^[\d.\s+\-*/()]+$/.test(resolved)) return "";
    const result = Function(`"use strict"; return (${resolved})`)() as number;
    return Number.isFinite(result) ? String(result) : "";
  } catch {
    return "";
  }
};

export const applyFormulaColumns = (
  row: Record<string, unknown>,
  columns: { id: string; formula?: { expression?: string } }[],
  // Kept for call-site compatibility; all formula columns are re-evaluated so cascades stay correct.
  _changedColumnId?: string,
): Record<string, unknown> => {
  const formulaCols = columns.filter((col) => col.formula?.expression);
  if (!formulaCols.length) return row;

  const next = { ...row };
  // Multi-pass: E depends on C, C depends on A/B — one pass alone leaves E stale.
  const maxPasses = Math.max(formulaCols.length, 1);
  for (let pass = 0; pass < maxPasses; pass++) {
    let anyChanged = false;
    for (const col of formulaCols) {
      const value = evaluateRowFormula(col.formula!.expression!, next);
      if (next[col.id] !== value) {
        next[col.id] = value;
        anyChanged = true;
      }
    }
    if (!anyChanged) break;
  }
  return next;
};
