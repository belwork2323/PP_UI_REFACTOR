const TRANSIENT_SNAPSHOT_KEYS = new Set([
  "uploadProgress",
  "file",
  "localId",
]);

/** Strip upload UI state so progress bars / local blobs don't mark the form dirty. */
export function stripTransientUploadFields(value: unknown): unknown {
  if (value instanceof File) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => stripTransientUploadFields(item))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(source)) {
      if (TRANSIENT_SNAPSHOT_KEYS.has(key)) continue;
      if (key === "status" && child === "uploading") continue;
      const stripped = stripTransientUploadFields(child);
      if (stripped !== undefined) next[key] = stripped;
    }
    return next;
  }
  return value;
}

export function stableStringify(
  value: unknown,
  replacer?: (key: string, value: unknown) => unknown,
): string {
  const normalized = stripTransientUploadFields(value);
  return JSON.stringify(normalized ?? null, (_key, inner) => {
    if (inner instanceof File) return inner.name;
    if (replacer) return replacer(_key, inner);
    return inner;
  });
}

export function isWorkflowFormDirty(
  currentSnapshot: string,
  baselineSnapshot: string,
  view: string,
): boolean {
  return view === "form" && currentSnapshot !== baselineSnapshot;
}
