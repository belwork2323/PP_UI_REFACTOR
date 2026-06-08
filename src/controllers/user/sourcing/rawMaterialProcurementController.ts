import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RawMaterialCreateFormPayload,
  RawMaterialLotDetailsModel,
  RawMaterialLotListRequest,
  normalizeRawMaterialLotListRequest,
  RawMaterialLotDeletePayload,
  RawMaterialLotDeleteResponse,
  RawMaterialLotUpdatePayload,
  RawMaterialProcurementDetailsModel,
  RawMaterialProcurementSubmitResponseModel,
} from "../../../data/models/user/RawMaterialProcurementModel";
import {
  createRawMaterialProcurementFormApi,
  deleteRawMaterialProcurementFormApi,
  fetchRawMaterialLotListApi,
  fetchRawMaterialProcurementFormDetailsApi,
  updateRawMaterialProcurementFormApi,
  fetchRawMaterialProcurementStatsApi,
} from "../../../data/api/users/sourcing/rawMaterialProcurementApi";
import {
  RawMaterialProcurementStatsModel,
} from "../../../data/models/user/RawMaterialProcurementStatsModel";

export type RawMaterialDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export type RawMaterialLotDetailsPayload = {
  lotId: string;
};

export const rawMaterialProcurementController = {
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
      const response = await createRawMaterialProcurementFormApi(payload as unknown as Record<string, unknown>);
      return new ApiResponseModel<RawMaterialProcurementSubmitResponseModel>(response, (res) =>
        RawMaterialProcurementSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create raw material procurement form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchLotDetails: async (payload: RawMaterialLotDetailsPayload) => {
    try {
      const response = await fetchRawMaterialProcurementFormDetailsApi({ lotId: payload.lotId });
      return new ApiResponseModel<RawMaterialLotDetailsModel>(response, (res) =>
        RawMaterialLotDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch raw material lot details:", error);
      return new ApiResponseModel(error);
    }
  },

  /** Legacy: formId + subDepartmentId (e.g. approver) */
  fetchFormDetails: async (payload: RawMaterialDetailsPayload) => {
    try {
      const response = await fetchRawMaterialProcurementFormDetailsApi(payload);
      return new ApiResponseModel<RawMaterialProcurementDetailsModel>(response, (res) =>
        RawMaterialProcurementDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch raw material procurement form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: RawMaterialLotUpdatePayload) => {
    try {
      const response = await updateRawMaterialProcurementFormApi(payload as unknown as Record<string, unknown>);
      return new ApiResponseModel<RawMaterialProcurementSubmitResponseModel>(response, (res) =>
        RawMaterialProcurementSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update raw material procurement form:", error);
      return new ApiResponseModel(error);
    }
  },

  deleteLot: async (payload: RawMaterialLotDeletePayload) => {
    try {
      const response = await deleteRawMaterialProcurementFormApi(payload);
      return new ApiResponseModel<RawMaterialLotDeleteResponse>(response);
    } catch (error) {
      console.error("Failed to delete raw material lot:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchStats: async (subDepartmentId: number) => {
    try {
      const response = await fetchRawMaterialProcurementStatsApi({ subDepartmentId });
      return new ApiResponseModel(response, (res) =>
        RawMaterialProcurementStatsModel.fromApi(res?.data)
      );
    } catch (error) {
      console.error("Failed to fetch raw material procurement stats:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default rawMaterialProcurementController;
