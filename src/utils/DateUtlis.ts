/**
 * Utility to format Date objects to DD-MM-YYYY
 */
const formatDate = (date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

/**
 * Logic to calculate start/end dates based on filter type
 */
export const getDateRange = (type) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (type) {
    case "day":
      // Today 00:00 to Today 23:59 (represented by same day string)
      start = now;
      end = now;
      break;

    case "week":
      // Sunday of the current week to Today
      const dayOfWeek = now.getDay(); 
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      end = new Date();
      break;

    case "month":
    default:
      // 1st of current month to Last day of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
};