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
