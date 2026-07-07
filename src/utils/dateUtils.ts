const toApiDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
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
