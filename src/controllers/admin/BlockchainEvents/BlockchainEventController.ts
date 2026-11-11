import {
  fetchDashboardBlockchainBatchesApi,
  fetchDashboardBlockchainEventsApi,
} from "@/data/api/admin/blockchainEvent/bacthApi";
import { DashboardModel } from "@/data/models/admin/Dashboard/DashboardModel";
import { ApiResponseModel } from "@/data/models/common/ApiResponseModel";

export const blockchainEventContrller = {
  /**
   * 1. Fetches the main list of blockchain batches (Table view from image)
   */
  getBlockchainEvents: async (payload: Record<string, unknown>) => {
    try {
      const response = await fetchDashboardBlockchainBatchesApi(payload);
      return new ApiResponseModel(response, (data) =>
        DashboardModel.fromBlockchainBatchesApi(data),
      );
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /**
   * 2. Fetches child events/transactions for a specific batch when accordion opens
   */
  getBlockchainEventsByBatchId: async (batchId: string) => {
    try {
      const response = await fetchDashboardBlockchainEventsApi({ batchId });
      return new ApiResponseModel(response, (data) => DashboardModel.fromBlockchainEventsApi(data));
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};
