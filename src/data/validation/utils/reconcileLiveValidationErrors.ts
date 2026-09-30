/**
 * Live-edit validation merge used across subdepartments:
 * - Always surface current format/type errors (`liveFormat`)
 * - Keep previously highlighted submit/required errors until that path is valid again
 * - Do not introduce new required-only errors until the next explicit submit
 */

export function reconcileLiveValidationErrors(
  previous: Record<string, string> | null | undefined,
  liveFormat: Record<string, string>,
  liveFull: Record<string, string>,
): Record<string, string> {
  const next: Record<string, string> = { ...liveFormat };
  for (const path of Object.keys(previous ?? {})) {
    const stillInvalid = liveFull[path];
    if (stillInvalid) next[path] = stillInvalid;
  }
  return next;
}
