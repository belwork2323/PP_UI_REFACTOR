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

/**
 * Normalize a date string to MM/DD/YYYY for APIs that expect US slash format
 * (e.g. batch identification `prcApprovalDate`).
 * Accepts YYYY-MM-DD, datetime-local, MM/DD/YYYY, and DD-MM-YYYY.
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

  const dmy = datePart.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) {
    return `${dmy[2]}/${dmy[1]}/${dmy[3]}`;
  }

  return datePart;
};

/**
 * Convert API/date strings to YYYY-MM-DD for HTML `type="date"` inputs.
 * Accepts MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, and datetime values.
 */
export const formatToIsoDateInput = (value: string | null | undefined): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const datePart = raw.split("T")[0].split(" ")[0];

  const iso = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const slash = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${slash[3]}-${pad2(slash[1])}-${pad2(slash[2])}`;
  }

  const dmy = datePart.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  return "";
};

/** Dashboard global date filter bounds (DD-MM-YYYY). */
export const getDashboardFilterBounds = (filterType: string) => {
  const now = new Date();
  const endIso = toIsoDate(now);

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
