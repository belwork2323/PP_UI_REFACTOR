import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  NDTDetailsModel,
  NDTSubmitResponseModel,
} from "../../../data/models/user/NDTApiModel";
import {
  createNDTFormApi,
  fetchNDTFormDetailsApi,
  updateNDTFormApi,
} from "../../../data/api/users/quality_control/ndtApi";
export type NDTCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: Record<string, any>[];
};

export type NDTUpdatePayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: Record<string, any>[];
};

export type NDTDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const ndtController = {
  createForm: async (payload: NDTCreatePayload) => {
    try {
      const response = await createNDTFormApi(payload);
      return new ApiResponseModel<NDTSubmitResponseModel>(response, (res) =>
        NDTSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create NDT form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: NDTDetailsPayload) => {
    try {
      const response = await fetchNDTFormDetailsApi(payload);
      return new ApiResponseModel<NDTDetailsModel>(response, (res) =>
        NDTDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch NDT form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: NDTUpdatePayload) => {
    try {
      const response = await updateNDTFormApi(payload);
      return new ApiResponseModel<NDTSubmitResponseModel>(response, (res) =>
        NDTSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update NDT form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default ndtController;