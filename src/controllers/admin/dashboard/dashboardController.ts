// src/controllers/dashboard/dashboardController.ts
import { 
  fetchDashboardStatsApi, 
  fetchDashboardChartDataApi, 
  fetchDashboardActiveBatchesApi,
  fetchDashboardBlockchainEventsApi
} from "../../../data/api/admin/DashBoardAPI";
import { DashboardModel } from "../../../data/models/admin/DashBoardModel";
import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";


/**
 * Fetch dashboard stats with optional date filters
 * @param filterType - "day" | "week" | "month" | "custom"
 * @param startDate - Date string "DD-MM-YYYY" (required for custom)
 * @param endDate - Date string "DD-MM-YYYY" (required for custom)
 * @param mode - 'light' | 'dark'
 */
export const getDashboardStats = async (filterType = 'week', startDate?: string, endDate?: string, mode = 'light') => {
  try {
    const response = await fetchDashboardStatsApi(filterType, startDate, endDate);
    return new ApiResponseModel(response, (data) => DashboardModel.fromStatsApi(data, mode));
  } catch (error) {
    return new ApiResponseModel<null>(error);
  }
};

export const getDashboardChartData = async (filterType = 'week', startDate?: string, endDate?: string) => {
  try {
    const response = await fetchDashboardChartDataApi(filterType, startDate, endDate);
    return new ApiResponseModel(response, (data) => DashboardModel.fromChartDataApi(data));
  } catch (error) {
    return new ApiResponseModel<null>(error);
  }
};

export const getDashboardActiveBatches = async (payload: any) => {
  try {
    const response = await fetchDashboardActiveBatchesApi(payload);
    return new ApiResponseModel(response, (data) => DashboardModel.fromActiveBatchesApi(data));
  } catch (error) {
    return new ApiResponseModel<null>(error);
  }
};

export const getDashboardBlockchainEvents = async (payload: any) => {
  try {
    const response = await fetchDashboardBlockchainEventsApi(payload);
    return new ApiResponseModel(response, (data) => DashboardModel.fromBlockchainEventsApi(data));
  } catch (error) {
    return new ApiResponseModel<null>(error);
  }
};