// src/data/api/admin/DashBoardAPI.ts
import { post } from "../httpClient";
import { ADMIN_ENDPOINTS } from "../endPoints";

/**
 * Fetch dashboard statistics with optional date filters
 * @param filterType - "day" | "week" | "month" | "custom"
 * @param startDate - Date string "DD-MM-YYYY" (required for custom)
 * @param endDate - Date string "DD-MM-YYYY" (required for custom)
 */
export const fetchDashboardStatsApi = (filterType: string, startDate?: string, endDate?: string) => {
  const payload: any = { filterType };

  // For custom date range, include start and end dates
  if (filterType === "custom") {
    payload.startDate = startDate;
    payload.endDate = endDate;
  }

  return post(ADMIN_ENDPOINTS.DASHBOARD_ENDPOINTS.GET_STATS, payload);
};

export const fetchDashboardChartDataApi = (filterType: string, startDate?: string, endDate?: string) => {
  const payload: any = { filterType };

  if (startDate) payload.startDate = startDate;
  if (endDate) payload.endDate = endDate;

  return post(ADMIN_ENDPOINTS.DASHBOARD_ENDPOINTS.GET_CHART_DATA, payload);
};

export const fetchDashboardActiveBatchesApi = (payload: any) => {
  return post(ADMIN_ENDPOINTS.DASHBOARD_ENDPOINTS.GET_ACTIVE_BATCHES, payload);
};

export const fetchDashboardBlockchainEventsApi = (payload: any) => {
  return post(ADMIN_ENDPOINTS.DASHBOARD_ENDPOINTS.GET_BLOCKCHAIN_EVENTS, payload);
};