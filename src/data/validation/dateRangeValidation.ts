import { isValidUiDate, isValidUiDateTime, str } from "./fieldValidators";
import type { ValidationErrors } from "./submissionIntent";

export const DATE_RANGE_MESSAGES = {
  fromAfterTo: "From Date cannot be greater than To Date",
  toBeforeFrom: "To Date cannot be earlier than From Date",
  fromDateTimeAfterTo: "From Date-Time cannot be greater than To Date-Time",
  toDateTimeBeforeFrom: "To Date-Time cannot be earlier than From Date-Time",
} as const;

/** Normalize UI / ISO date (or datetime) to a comparable epoch ms, or null if empty/invalid. */
export const toComparableTimestamp = (value: unknown): number | null => {
  const text = str(value);
  if (!text) return null;

  const dmyTime = text.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (dmyTime) {
    const day = Number(dmyTime[1]);
    const month = Number(dmyTime[2]);
    const year = Number(dmyTime[3]);
    const hour = dmyTime[4] != null ? Number(dmyTime[4]) : 0;
    const minute = dmyTime[5] != null ? Number(dmyTime[5]) : 0;
    const second = dmyTime[6] != null ? Number(dmyTime[6]) : 0;
    const d = new Date(year, month - 1, day, hour, minute, second);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      return null;
    }
    return d.getTime();
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const ms = Date.parse(text.length === 10 ? `${text}T00:00:00` : text);
    return Number.isNaN(ms) ? null : ms;
  }

  if (isValidUiDateTime(text) || isValidUiDate(text)) {
    const ms = Date.parse(text);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
};

export const isStartAfterEnd = (start: unknown, end: unknown): boolean => {
  const startTimestamp = toComparableTimestamp(start);
  const endTimestamp = toComparableTimestamp(end);
  if (startTimestamp != null && endTimestamp != null) {
    return startTimestamp > endTimestamp;
  }

  const startTime = str(start).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  const endTime = str(end).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!startTime || !endTime) return false;
  const startHour = Number(startTime[1]);
  const startMinute = Number(startTime[2]);
  const endHour = Number(endTime[1]);
  const endMinute = Number(endTime[2]);
  if (startHour > 23 || startMinute > 59 || endHour > 23 || endMinute > 59) {
    return false;
  }
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  return startMinutes > endMinutes;
};

const combineDateAndTime = (dateValue: unknown, timeValue: unknown): string => {
  const date = str(dateValue);
  const time = str(timeValue);
  if (!date) return "";
  if (!time) return date;
  const timePart = time.includes("T") ? (time.split(/[T ]/).pop() ?? time) : time;
  return `${date} ${timePart}`.trim();
};

export type AssertFromToOrderArgs = {
  from: unknown;
  to: unknown;
  fromPath: string;
  toPath: string;
  errors: ValidationErrors;
  /** date = calendar day order; datetime = full date-time order when times present */
  mode?: "date" | "datetime";
};

/**
 * When both From and To are present and parseable, enforce From ≤ To.
 * Same calendar day (and equal datetime) is allowed. Sets visible messages on both paths.
 */
export const assertFromToOrder = ({
  from,
  to,
  fromPath,
  toPath,
  errors,
  mode = "date",
}: AssertFromToOrderArgs): boolean => {
  const fromText = str(from);
  const toText = str(to);
  if (!fromText || !toText) return true;

  const fromMs = toComparableTimestamp(fromText);
  const toMs = toComparableTimestamp(toText);
  if (fromMs == null || toMs == null) return true;

  if (fromMs <= toMs) return true;

  if (mode === "datetime") {
    errors[fromPath] = errors[fromPath] || DATE_RANGE_MESSAGES.fromDateTimeAfterTo;
    errors[toPath] = errors[toPath] || DATE_RANGE_MESSAGES.toDateTimeBeforeFrom;
  } else {
    errors[fromPath] = errors[fromPath] || DATE_RANGE_MESSAGES.fromAfterTo;
    errors[toPath] = errors[toPath] || DATE_RANGE_MESSAGES.toBeforeFrom;
  }
  return false;
};

export type AssertFromToDateTimePartsArgs = {
  fromDate: unknown;
  fromTime?: unknown;
  toDate: unknown;
  toTime?: unknown;
  fromDatePath: string;
  toDatePath: string;
  /** Optional: also stamp time field paths when present */
  fromTimePath?: string;
  toTimePath?: string;
  errors: ValidationErrors;
};

/** Combine separate date + time columns and enforce From Date-Time ≤ To Date-Time. */
export const assertFromToDateTimeParts = ({
  fromDate,
  fromTime,
  toDate,
  toTime,
  fromDatePath,
  toDatePath,
  fromTimePath,
  toTimePath,
  errors,
}: AssertFromToDateTimePartsArgs): boolean => {
  const fromCombined = combineDateAndTime(fromDate, fromTime);
  const toCombined = combineDateAndTime(toDate, toTime);
  if (!str(fromDate) || !str(toDate)) return true;

  const fromTimeText = str(fromTime);
  const toTimeText = str(toTime);
  const hasTime = Boolean(fromTimeText || toTimeText);
  const fromDateTimestamp = toComparableTimestamp(fromDate);
  const toDateTimestamp = toComparableTimestamp(toDate);
  // Let the user finish entering a same-day time pair before validating its order.
  if (
    hasTime &&
    fromDateTimestamp != null &&
    fromDateTimestamp === toDateTimestamp &&
    (!fromTimeText || !toTimeText)
  ) {
    return true;
  }

  const ok = assertFromToOrder({
    from: fromCombined,
    to: toCombined,
    fromPath: fromDatePath,
    toPath: toDatePath,
    errors,
    mode: hasTime ? "datetime" : "date",
  });
  if (!ok && hasTime) {
    if (fromTimePath) {
      errors[fromTimePath] = errors[fromTimePath] || DATE_RANGE_MESSAGES.fromDateTimeAfterTo;
    }
    if (toTimePath) {
      errors[toTimePath] = errors[toTimePath] || DATE_RANGE_MESSAGES.toDateTimeBeforeFrom;
    }
  }
  return ok;
};

/** Thin filter/dashboard wrapper — returns messages without mutating a map. */
export const getFromToOrderMessages = (
  from: unknown,
  to: unknown,
  mode: "date" | "datetime" = "date",
): { from?: string; to?: string } | null => {
  const errors: ValidationErrors = {};
  assertFromToOrder({
    from,
    to,
    fromPath: "from",
    toPath: "to",
    errors,
    mode,
  });
  if (!errors.from && !errors.to) return null;
  return { from: errors.from, to: errors.to };
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

type PairDef = {
  fromKey: string;
  toKey: string;
  fromTimeKey?: string;
  toTimeKey?: string;
  mode: "date" | "datetime";
};

const PAIR_DEFS: PairDef[] = [
  { fromKey: "fromDate", toKey: "toDate", mode: "date" },
  { fromKey: "FROM_DATE", toKey: "TO_DATE", mode: "date" },
  { fromKey: "CURING_START_DATE", toKey: "CURING_END_DATE", mode: "date" },
  {
    fromKey: "START_DATE",
    toKey: "END_DATE",
    fromTimeKey: "START_TIME",
    toTimeKey: "END_TIME",
    mode: "datetime",
  },
  { fromKey: "startDatetime", toKey: "endDatetime", mode: "datetime" },
  { fromKey: "START_DATETIME", toKey: "END_DATETIME", mode: "datetime" },
  { fromKey: "grindingStartDatetime", toKey: "grindingEndDatetime", mode: "datetime" },
  { fromKey: "startDate", toKey: "endDate", mode: "date" },
];

/**
 * Recursively walk form/session values and enforce From ≤ To on known date/datetime pairs.
 * Safe to use as a SubDeptValidationConfig customRule body.
 */
export const assertFromToOrderInTree = (
  root: unknown,
  errors: ValidationErrors,
  pathPrefix = "",
): void => {
  if (Array.isArray(root)) {
    root.forEach((item, index) => {
      const next = pathPrefix ? `${pathPrefix}.${index}` : String(index);
      assertFromToOrderInTree(item, errors, next);
    });
    return;
  }

  const rec = asRecord(root);
  if (!rec) return;

  for (const def of PAIR_DEFS) {
    if (!(def.fromKey in rec) && !(def.toKey in rec)) continue;
    const fromPath = pathPrefix ? `${pathPrefix}.${def.fromKey}` : def.fromKey;
    const toPath = pathPrefix ? `${pathPrefix}.${def.toKey}` : def.toKey;

    if (def.fromTimeKey || def.toTimeKey) {
      assertFromToDateTimeParts({
        fromDate: rec[def.fromKey],
        fromTime: def.fromTimeKey ? rec[def.fromTimeKey] : undefined,
        toDate: rec[def.toKey],
        toTime: def.toTimeKey ? rec[def.toTimeKey] : undefined,
        fromDatePath: fromPath,
        toDatePath: toPath,
        fromTimePath: def.fromTimeKey
          ? pathPrefix
            ? `${pathPrefix}.${def.fromTimeKey}`
            : def.fromTimeKey
          : undefined,
        toTimePath: def.toTimeKey
          ? pathPrefix
            ? `${pathPrefix}.${def.toTimeKey}`
            : def.toTimeKey
          : undefined,
        errors,
      });
    } else {
      assertFromToOrder({
        from: rec[def.fromKey],
        to: rec[def.toKey],
        fromPath,
        toPath,
        errors,
        mode: def.mode,
      });
    }
  }

  // QC subscale curing: start/complete dates with optional cycle times.
  if ("CURING_START_DATE" in rec && "CURING_COMPLETE_DATE" in rec) {
    assertFromToDateTimeParts({
      fromDate: rec.CURING_START_DATE,
      fromTime: rec.CYCLE_START_TIME,
      toDate: rec.CURING_COMPLETE_DATE,
      toTime: rec.CYCLE_END_TIME,
      fromDatePath: pathPrefix ? `${pathPrefix}.CURING_START_DATE` : "CURING_START_DATE",
      toDatePath: pathPrefix ? `${pathPrefix}.CURING_COMPLETE_DATE` : "CURING_COMPLETE_DATE",
      fromTimePath: pathPrefix ? `${pathPrefix}.CYCLE_START_TIME` : "CYCLE_START_TIME",
      toTimePath: pathPrefix ? `${pathPrefix}.CYCLE_END_TIME` : "CYCLE_END_TIME",
      errors,
    });
  }

  for (const [key, value] of Object.entries(rec)) {
    if (value && typeof value === "object") {
      const next = pathPrefix ? `${pathPrefix}.${key}` : key;
      assertFromToOrderInTree(value, errors, next);
    }
  }
};
