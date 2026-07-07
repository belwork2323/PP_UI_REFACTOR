import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  STFDetailsModel,
  STFMotorPayload,
  STFSubmitResponseModel,
} from "../../../data/models/user/StaticTestFacilityApiModel";
import {
  createSTFFormApi,
  fetchSTFFormDetailsApi,
  updateSTFFormApi,
} from "../../../data/api/users/quality_control/stfApi";

export type STFCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  subType: string;
  motors: STFMotorPayload[];
};

export type STFUpdatePayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  subType: string;
  motors: STFMotorPayload[];
};

export type STFDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const stfController = {
  createForm: async (payload: STFCreatePayload) => {
    try {
      const response = await createSTFFormApi(payload);
      return new ApiResponseModel<STFSubmitResponseModel>(response, (res) =>
        STFSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create STF form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: STFDetailsPayload) => {
    try {
      const response = await fetchSTFFormDetailsApi(payload);
      return new ApiResponseModel<STFDetailsModel>(response, (res) =>
        STFDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch STF form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: STFUpdatePayload) => {
    try {
      const response = await updateSTFFormApi(payload);
      return new ApiResponseModel<STFSubmitResponseModel>(response, (res) =>
        STFSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update STF form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default stfController;
