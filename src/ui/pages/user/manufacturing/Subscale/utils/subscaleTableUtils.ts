const SKIP_DATA_KEYS = new Set(["SR_NO", "ARTICLE_TYPE", "_articleKey", "_articleIndex"]);

export const scheduleIdleWork = (work: () => void): void => {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(work, { timeout: 500 });
  } else {
    setTimeout(work, 0);
  }
};

export const hasProcessTableData = (rows: unknown[] | undefined): boolean => {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) =>
    Object.entries(row as Record<string, unknown>).some(
      ([key, value]) => !SKIP_DATA_KEYS.has(key) && String(value ?? "").trim() !== "",
    ),
  );
};

/** True when any error key matches a section prefix (or equals an exact key). */
export const hasValidationErrorsForPrefixes = (
  errors: Record<string, string> | null | undefined,
  prefixes: string[],
  focusPath?: string | null,
): boolean => {
  if (focusPath && prefixes.some((p) => focusPath === p || focusPath.startsWith(p))) {
    return true;
  }
  if (!errors) return false;
  return Object.keys(errors).some((key) =>
    prefixes.some((prefix) => key === prefix || key.startsWith(prefix)),
  );
};
