const parseNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const expressionKeyCache = new Map<string, string[]>();

const getExpressionRowKeys = (expression: string, row: Record<string, unknown>): string[] => {
  const cacheKey = expression.trim();
  const cached = expressionKeyCache.get(cacheKey);
  if (cached) return cached;

  const keys = Object.keys(row).sort((a, b) => b.length - a.length);
  expressionKeyCache.set(cacheKey, keys);
  return keys;
};

export const evaluateRowFormula = (
  expression: string,
  row: Record<string, unknown>,
): string => {
  const expr = String(expression ?? "").trim();
  if (!expr) return "";

  try {
    let resolved = expr;
    const keys = getExpressionRowKeys(expr, row);
    keys.forEach((key) => {
      const val = parseNum(row[key]) ?? 0;
      resolved = resolved.replace(new RegExp(`\\b${key}\\b`, "g"), String(val));
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
  changedColumnId?: string,
): Record<string, unknown> => {
  const next = { ...row };
  columns.forEach((col) => {
    if (!col.formula?.expression) return;
    if (changedColumnId && col.id !== changedColumnId && !col.formula.expression.includes(changedColumnId)) {
      return;
    }
    next[col.id] = evaluateRowFormula(col.formula.expression, next);
  });
  return next;
};
