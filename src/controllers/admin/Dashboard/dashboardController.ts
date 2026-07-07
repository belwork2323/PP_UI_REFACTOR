import {
  fetchDashboardStatsApi,
  fetchDashboardChartDataApi,
  fetchDashboardActiveBatchesApi,
  fetchDashboardBlockchainEventsApi,
} from "@data/api/admin/Dashboard/dashboardApi";
import { DashboardModel } from "@data/models/admin/Dashboard/DashboardModel";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";

export const dashboardController = {
  getStats: async (
    filterType = "week",
    startDate?: string,
    endDate?: string,
    mode: "light" | "dark" = "light",
  ) => {
    try {
      const response = await fetchDashboardStatsApi(filterType, startDate, endDate);
      return new ApiResponseModel(response, (data) => DashboardModel.fromStatsApi(data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  getChartData: async (filterType = "week", startDate?: string, endDate?: string) => {
    try {
      const response = await fetchDashboardChartDataApi(filterType, startDate, endDate);
      return new ApiResponseModel(response, (data) => DashboardModel.fromChartDataApi(data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  getActiveBatches: async (payload: Record<string, unknown>) => {
    try {
      const response = await fetchDashboardActiveBatchesApi(payload);
      return new ApiResponseModel(response, (data) => DashboardModel.fromActiveBatchesApi(data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  getBlockchainEvents: async (payload: Record<string, unknown>) => {
    try {
      const response = await fetchDashboardBlockchainEventsApi(payload);
      return new ApiResponseModel(response, (data) => DashboardModel.fromBlockchainEventsApi(data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};
