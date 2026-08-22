import { formatToIsoDateInput, formatToUiDate } from "../../../utils/dateUtils";

export const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const str = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

export const pickField = (row: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  // Details API may return flattened lowercase keys (e.g. amock instead of aMock).
  const entries = Object.entries(row);
  for (const key of keys) {
    const lower = key.toLowerCase();
    const match = entries.find(([candidate]) => candidate.toLowerCase() === lower);
    if (match && match[1] !== undefined && match[1] !== null) return match[1];
  }
  return undefined;
};

export const toApiNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = str(value).trim().replace(/,/g, "");
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

export const compactRecord = (row: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    if (value === undefined) return;
    out[key] = value;
  });
  return out;
};

const pad2 = (value: string | number) => String(value).padStart(2, "0");

/** UI `HH:mm` / `HH:mm:ss` → API `HH:mm:ss`. Empty → omitted. */
export const toApiTime = (value: unknown): string | undefined => {
  const raw = str(value).trim();
  if (!raw) return undefined;
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return raw;
  return `${pad2(match[1])}:${pad2(match[2])}:${pad2(match[3] ?? "00")}`;
};

/** API/UI time → UI `HH:mm` for TimeField. */
export const toUiTime = (value: unknown): string => {
  const raw = str(value).trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return raw;
  return `${pad2(match[1])}:${pad2(match[2])}`;
};

/** UI `DD-MM-YYYY` → API `YYYY-MM-DD`. Empty → omitted. */
export const toApiDate = (value: unknown): string | undefined => {
  const raw = str(value).trim();
  if (!raw) return undefined;
  return formatToIsoDateInput(raw) || undefined;
};

/** API `YYYY-MM-DD` / datetime → UI `DD-MM-YYYY`. */
export const toUiDate = (value: unknown): string => formatToUiDate(str(value));

/**
 * UI `DD-MM-YYYY HH:mm` → API local ISO `YYYY-MM-DDTHH:mm:ss` (no Z).
 * Empty → omitted.
 */
export const toApiDateTime = (value: unknown): string | undefined => {
  const raw = str(value).trim();
  if (!raw) return undefined;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/.test(raw)) {
    const core = raw.slice(0, 19);
    return core.length === 16 ? `${core}:00` : core;
  }

  const dmy = raw.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (dmy) {
    const [, day, month, year, hour = "00", minute = "00", second = "00"] = dmy;
    const date = `${year}-${pad2(month)}-${pad2(day)}`;
    if (!hour && raw.length <= 10) return date;
    return `${date}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
  }

  const isoDate = formatToIsoDateInput(raw);
  return isoDate || undefined;
};

/** API local/UTC ISO datetime → UI `DD-MM-YYYY HH:mm`. */
export const toUiDateTime = (value: unknown): string => {
  const raw = str(value).trim();
  if (!raw) return "";

  const dmy = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (dmy) {
    const [, day, month, year, hour, minute] = dmy;
    const date = `${pad2(day)}-${pad2(month)}-${year}`;
    if (hour == null) return date;
    return `${date} ${pad2(hour)}:${pad2(minute)}`;
  }

  const isoLocal = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (isoLocal) {
    return `${isoLocal[3]}-${isoLocal[2]}-${isoLocal[1]} ${pad2(isoLocal[4])}:${pad2(isoLocal[5])}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${pad2(parsed.getDate())}-${pad2(parsed.getMonth() + 1)}-${parsed.getFullYear()} ${pad2(
      parsed.getHours(),
    )}:${pad2(parsed.getMinutes())}`;
  }

  return formatToUiDate(raw);
};

export const emptyToNull = (value: unknown): string | null => {
  const raw = str(value).trim();
  return raw ? raw : null;
};

export const emptyToNullNumber = (value: unknown): number | null => {
  const n = toApiNumber(value);
  return n === undefined ? null : n;
};

export const isLegacySectionArray = (
  value: unknown,
): value is Array<{ sectionId?: string; sectionData?: unknown[] }> =>
  Array.isArray(value) &&
  value.some(
    (item) =>
      Boolean(asRecord(item)?.sectionId) || Array.isArray(asRecord(item)?.sectionData),
  );

/** Unwrap nested API payloads like `castingSections` / `curingSections` onto the root object. */
export const unwrapMotorSectionPayload = (
  source: unknown,
  sectionKey: string,
): Record<string, unknown> => {
  const nested = asRecord(source);
  if (!nested) return {};
  const sections = asRecord(nested[sectionKey]);
  if (sections && Object.keys(sections).length > 0) {
    return { ...nested, ...sections };
  }
  return nested;
};
