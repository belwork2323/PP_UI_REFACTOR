const toApiDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/** Format a Date as DD-MM-YYYY for API payloads. */
export const formatDateToApiDate = (date: Date): string => toApiDate(date);

const toIsoDate = (date: Date): string => date.toISOString().split("T")[0];

/** Convert YYYY-MM-DD to DD-MM-YYYY for API payloads. */
export const formatIsoToApiDate = (iso: string): string => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}-${month}-${year}`;
};

const pad2 = (value: string | number) => String(value).padStart(2, "0");

/** Canonical UI date format — independent of OS locale. */
export const UI_DATE_FORMAT = "DD-MM-YYYY";
export const UI_DATE_PLACEHOLDER = "DD-MM-YYYY";
export const UI_DATETIME_FORMAT = "DD-MM-YYYY HH:mm";
export const UI_DATETIME_SECONDS_FORMAT = "DD-MM-YYYY HH:mm:ss";
export const UI_DATE_PARSE_FORMATS = [
  "DD-MM-YYYY",
  "DD-MM-YYYY HH:mm",
  "YYYY-MM-DD",
  "YYYY-MM-DDTHH:mm",
  "MM/DD/YYYY",
  "MM/DD/YYYY HH:mm",
  "DD/MM/YYYY",
] as const;

/**
 * Normalize any supported date string to DD-MM-YYYY for UI inputs and display.
 * Accepts YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY, and datetime values.
 */
export const formatToUiDate = (value: string | null | undefined): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const datePart = raw.split("T")[0].split(" ")[0];

  const dmyDash = datePart.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) {
    return `${pad2(dmyDash[1])}-${pad2(dmyDash[2])}-${dmyDash[3]}`;
  }

  const iso = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${iso[3]}-${iso[2]}-${iso[1]}`;
  }

  // Legacy US slash MM/DD/YYYY → DD-MM-YYYY
  const usSlash = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usSlash) {
    return `${pad2(usSlash[2])}-${pad2(usSlash[1])}-${usSlash[3]}`;
  }

  return datePart;
};

/**
 * Normalize a date string to MM/DD/YYYY for rare APIs that still expect US slash format.
 */
export const formatToUsSlashDate = (value: string | null | undefined): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const datePart = raw.split("T")[0].split(" ")[0];

  const slash = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${pad2(slash[1])}/${pad2(slash[2])}/${slash[3]}`;
  }

  const iso = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${iso[2]}/${iso[3]}/${iso[1]}`;
  }

  const dmy = datePart.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    return `${pad2(dmy[2])}/${pad2(dmy[1])}/${dmy[3]}`;
  }

  return datePart;
};

/** Read-only date display — always DD-MM-YYYY regardless of OS locale. */
export const formatDisplayDate = (value: string | null | undefined, fallback = "—"): string => {
  const normalized = formatToUiDate(value);
  return normalized || fallback;
};

/** Read-only date/time display — always DD-MM-YYYY HH:mm:ss for date/time values. */
export const formatDisplayDateTime = (value: string | null | undefined, fallback = "—"): string => {
  const raw = String(value ?? "").trim();
  const iso = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/i,
  );
  const numericDateTime = raw.match(
    /^(\d{1,2})([-/])(\d{1,2})\2(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  const namedMonthDateTime = raw.match(
    /^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  let year: number;
  let month: number;
  let day: number;
  let hour: number;
  let minute: number;
  let second: number;
  let date: Date;

  if (iso) {
    const [, yearText, monthText, dayText, hourText, minuteText, secondText, timeZone] = iso;
    year = Number(yearText);
    month = Number(monthText);
    day = Number(dayText);
    hour = Number(hourText ?? 0);
    minute = Number(minuteText ?? 0);
    second = Number(secondText ?? 0);
    if (timeZone && timeZone.toUpperCase() !== "Z") {
      const offset = timeZone.slice(1).replace(":", "");
      if (Number(offset.slice(0, 2)) > 23 || Number(offset.slice(2)) > 59) return fallback;
    }

    date = hourText === undefined ? createLocalDate(year, month, day) : new Date(raw);
  } else if (numericDateTime) {
    const [, first, separator, secondPart, yearText, hourText, minuteText, secondText] =
      numericDateTime;
    year = Number(yearText);
    month = separator === "/" ? Number(first) : Number(secondPart);
    day = separator === "/" ? Number(secondPart) : Number(first);
    hour = Number(hourText ?? 0);
    minute = Number(minuteText ?? 0);
    second = Number(secondText ?? 0);
    date = createLocalDate(year, month, day, hour, minute, second);
  } else if (namedMonthDateTime) {
    const [, dayText, monthName, yearText, hourText, minuteText, secondText] = namedMonthDateTime;
    year = Number(yearText);
    month =
      ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(
        monthName.slice(0, 3).toLowerCase(),
      ) + 1;
    day = Number(dayText);
    hour = Number(hourText ?? 0);
    minute = Number(minuteText ?? 0);
    second = Number(secondText ?? 0);
    date = createLocalDate(year, month, day, hour, minute, second);
  } else {
    return fallback;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1] ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return fallback;
  }

  if (Number.isNaN(date.getTime())) return fallback;

  const displayYear = String(date.getFullYear()).padStart(4, "0");
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${displayYear} ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
};

/** Format date-only values as DD-MM-YYYY and timestamps as DD-MM-YYYY HH:mm:ss. */
export const formatDisplayDateOrDateTime = (
  value: string | null | undefined,
  fallback = "—",
): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw) || /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(raw)) {
    return formatDisplayDate(raw, fallback);
  }
  if (
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(raw) ||
    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}[ T]\d{1,2}:\d{2}/.test(raw) ||
    /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}[ T]\d{1,2}:\d{2}/.test(raw)
  ) {
    return formatDisplayDateTime(raw, fallback);
  }
  return raw;
};

const createLocalDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date => {
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, 0);
  return date;
};

/**
 * Convert API/date strings to YYYY-MM-DD for HTML `type="date"` inputs / ISO APIs.
 * Accepts DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD, and datetime values.
 */
export const formatToIsoDateInput = (value: string | null | undefined): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const datePart = raw.split("T")[0].split(" ")[0];

  const iso = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = datePart.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${pad2(dmy[2])}-${pad2(dmy[1])}`;
  }

  // Legacy US slash MM/DD/YYYY
  const slash = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${slash[3]}-${pad2(slash[1])}-${pad2(slash[2])}`;
  }

  return "";
};

/**
 * Preset dashboard ranges (one year / six months) are sent as `custom`
 * with computed start/end dates — same contract as Admin Dashboard.
 */
export const toDashboardApiFilterType = (filterType: string) =>
  filterType === "one_year" || filterType === "six_months" ? "custom" : filterType;

/** Dashboard global date filter bounds (DD-MM-YYYY). */
export const getDashboardFilterBounds = (filterType: string) => {
  const now = new Date();
  const endIso = toIsoDate(now);

  if (filterType === "six_months") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 6);
    return { startDate: toApiDate(start), endDate: toApiDate(now) };
  }

  if (filterType === "one_year") {
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return { startDate: toApiDate(start), endDate: toApiDate(now) };
  }

  if (filterType === "day") {
    return { startDate: toApiDate(now), endDate: toApiDate(now) };
  }

  if (filterType === "week") {
    const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { startDate: toApiDate(start), endDate: toApiDate(now) };
  }

  if (filterType === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: toApiDate(monthStart), endDate: toApiDate(monthEnd) };
  }

  return { startDate: formatIsoToApiDate(endIso), endDate: formatIsoToApiDate(endIso) };
};

/** Returns DD-MM-YYYY bounds for batch/dashboard stats filters. */
export const getDateRange = (filterType: string) => {
  const now = new Date();

  if (filterType === "six_months") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 6);
    return { startDate: toApiDate(start), endDate: toApiDate(now) };
  }

  if (filterType === "one_year") {
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return { startDate: toApiDate(start), endDate: toApiDate(now) };
  }

  if (filterType === "day") {
    const today = toApiDate(now);
    return { startDate: today, endDate: today };
  }

  if (filterType === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: toApiDate(start), endDate: toApiDate(end) };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toApiDate(monthStart), endDate: toApiDate(monthEnd) };
};
