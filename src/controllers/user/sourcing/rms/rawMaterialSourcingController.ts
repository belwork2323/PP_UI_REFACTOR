import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import {
  RawMaterialCreateFormPayload,
  RawMaterialLotDetailsModel,
  RawMaterialLotListRequest,
  normalizeRawMaterialLotListRequest,
  RawMaterialLotDeletePayload,
  RawMaterialLotDeleteResponse,
  RawMaterialLotUpdatePayload,
  RawMaterialSourcingDetailsModel,
  RawMaterialSourcingSubmitResponseModel,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import {
  createRawMaterialSourcingFormApi,
  deleteRawMaterialSourcingFormApi,
  fetchRawMaterialLotListApi,
  fetchRawMaterialSourcingFormDetailsApi,
  updateRawMaterialSourcingFormApi,
  fetchRawMaterialSourcingStatsApi,
} from "@data/api/users/sourcing/rms/rawMaterialSourcingApi";
import { RawMaterialSourcingStatsModel } from "@data/models/user/sourcing/rms/RawMaterialSourcingStatsModel";

export type RawMaterialDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export type RawMaterialLotDetailsPayload = {
  lotId: string;
};

export const rawMaterialSourcingController = {
  fetchLotList: async (payload: RawMaterialLotListRequest) => {
    try {
      const response = await fetchRawMaterialLotListApi(
        normalizeRawMaterialLotListRequest(payload) as unknown as Record<string, unknown>,
      );
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to fetch raw material lot list:", error);
      return new ApiResponseModel(error);
    }
  },

  createForm: async (payload: RawMaterialCreateFormPayload) => {
    try {
      const response = await createRawMaterialSourcingFormApi(
        payload as unknown as Record<string, unknown>,
      );
      return new ApiResponseModel<RawMaterialSourcingSubmitResponseModel>(response, (res) =>
        RawMaterialSourcingSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create raw material sourcing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchLotDetails: async (payload: RawMaterialLotDetailsPayload) => {
    try {
      const response = await fetchRawMaterialSourcingFormDetailsApi({ lotId: payload.lotId });
      return new ApiResponseModel<RawMaterialLotDetailsModel>(response, (res) =>
        RawMaterialLotDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch raw material lot details:", error);
      return new ApiResponseModel(error);
    }
  },

  /** Legacy: formId + subDepartmentId (e.g. approver) */
  fetchFormDetails: async (payload: RawMaterialDetailsPayload) => {
    try {
      const response = await fetchRawMaterialSourcingFormDetailsApi(payload);
      return new ApiResponseModel<RawMaterialSourcingDetailsModel>(response, (res) =>
        RawMaterialSourcingDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch raw material sourcing form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: RawMaterialLotUpdatePayload) => {
    try {
      const response = await updateRawMaterialSourcingFormApi(
        payload as unknown as Record<string, unknown>,
      );
      return new ApiResponseModel<RawMaterialSourcingSubmitResponseModel>(response, (res) =>
        RawMaterialSourcingSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update raw material sourcing form:", error);
      return new ApiResponseModel(error);
    }
  },

  deleteLot: async (payload: RawMaterialLotDeletePayload) => {
    try {
      const response = await deleteRawMaterialSourcingFormApi(payload);
      return new ApiResponseModel<RawMaterialLotDeleteResponse>(response);
    } catch (error) {
      console.error("Failed to delete raw material lot:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchStats: async (subDepartmentId: number) => {
    try {
      const response = await fetchRawMaterialSourcingStatsApi({ subDepartmentId });
      return new ApiResponseModel(response, (res) =>
        RawMaterialSourcingStatsModel.fromApi(res?.data),
      );
    } catch (error) {
      console.error("Failed to fetch raw material sourcing stats:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default rawMaterialSourcingController;
