import {
  parseFileRefs,
  type FileRef,
} from "../../../data/models/common/FileUploadModel";

/** True when value is (or will be) a form FileRef list — including empty `[]`. */
export const isQcDivisionFileRefList = (value: unknown): value is FileRef[] => {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      ("fileName" in item || "fileId" in item || "localId" in item),
  );
};

/** Prefer live FileRef[] from form state; fall back to parseFileRefs for API payloads. */
export const asLiveQcDivisionFileRefs = (value: unknown): FileRef[] => {
  if (Array.isArray(value) && value.every((item) => item && typeof item === "object")) {
    return value as FileRef[];
  }
  return parseFileRefs(value);
};

/**
 * Hardware-aligned merge for seed/hydration only.
 * - Empty server list never wipes user uploads.
 * - onlyIfEmpty + user already has files → keep user list (incl. after UI delete on save).
 * - QCDivisionFileField onChange must assign `next` directly — do not use this helper.
 */
export const mergeQcDivisionFileRefsForSeed = (
  current: unknown,
  incoming: unknown,
  onlyIfEmpty: boolean,
): FileRef[] => {
  const currentRefs = asLiveQcDivisionFileRefs(current);
  const incomingRefs = asLiveQcDivisionFileRefs(incoming);
  if (!incomingRefs.length) return currentRefs;
  if (onlyIfEmpty && currentRefs.length) return currentRefs;
  if (onlyIfEmpty) return incomingRefs;

  const seen = new Set(
    currentRefs
      .map((ref) => String(ref.fileId ?? ref.localId ?? ref.fileName ?? "").trim())
      .filter(Boolean),
  );
  const merged = [...currentRefs];
  for (const ref of incomingRefs) {
    const key = String(ref.fileId ?? ref.localId ?? ref.fileName ?? "").trim();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    merged.push(ref);
  }
  return merged;
};

/**
 * During onlyIfEmpty seed, skip overwriting file fields the user has already populated.
 * Matches Hardware: `onlyIfEmpty && currentRefs.length → keep current`.
 */
export const shouldPreserveQcDivisionFileRefsOnSeed = (
  current: unknown,
  onlyIfEmpty: boolean | undefined,
): boolean => {
  if (!onlyIfEmpty) return false;
  if (!isQcDivisionFileRefList(current)) return false;
  return current.length > 0;
};
