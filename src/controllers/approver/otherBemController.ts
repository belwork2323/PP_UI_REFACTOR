import { APPROVER_STF_OTHER_BEM_ENDPOINTS } from "@/data/api/endPoints";
import { get, post } from "@/data/api/httpClient";
import {
  OtherBemListApiResponse,
  OtherBemDetailsApiResponse,
  OtherBemListPayload,
  OtherBemDetailsPayload,
} from "@/data/models/approver/OtherBemApiModel";

export const otherBemController = {
  // 1. Fetch List API (POST matching spec)
  fetchOtherBemList: async (payload: OtherBemListPayload): Promise<OtherBemListApiResponse> => {
    try {
      const response = await post(APPROVER_STF_OTHER_BEM_ENDPOINTS.LIST, payload);
      return response as unknown as OtherBemListApiResponse;
    } catch (error: any) {
      return {
        success: false,
        statusCode: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to fetch list.",
        data: { page: 1, limit: 10, totalRecords: 0, totalPages: 0, motors: [] },
      };
    }
  },

  // 2. Fetch Detailed Form View API (POST passing motorId)
  fetchFormDetails: async (
    payload: OtherBemDetailsPayload,
  ): Promise<OtherBemDetailsApiResponse> => {
    try {
      const response = await post(APPROVER_STF_OTHER_BEM_ENDPOINTS.DETAILS, payload);
      return response as unknown as OtherBemDetailsApiResponse;
    } catch (error: any) {
      return {
        success: false,
        statusCode: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to fetch details.",
        data: {} as any,
      };
    }
  },

  // 3. Approve Action API
  approveForm: async (payload: { motorId: string; remarks?: string; actionType: string }) => {
    try {
      const response = await post(APPROVER_STF_OTHER_BEM_ENDPOINTS.APPROVE, payload);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "Approval action failed.",
      };
    }
  },
};

export default otherBemController;
