import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  STFDetailsModel,
  STFMotorPayload,
  STFSubmitResponseModel,
} from "../../../data/models/user/StaticTestFacilityApiModel";
import {
  createBemMotors,
  createSTFFormApi,
  fetchBemMotors,
  fetchSTFFormDetailsApi,
  updateBemMotors,
  updateSTFFormApi,
  FetchDetails,
} from "../../../data/api/users/quality_control/stfApi";
import {
  CreateBemMotorPayload,
  UpdateBemMotorPayload,
} from "@/data/models/user/StaticTestFacilityFormModel";

export type STFCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: STFMotorPayload[];
};

export type STFUpdatePayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
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
      return new ApiResponseModel<STFDetailsModel>(response, (res) => STFDetailsModel.fromApi(res));
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
  listBemMotors: async (payload: {
    page: number;
    limit: number;
    status?: string[];
    search?: string;
  }) => {
    try {
      const response = await fetchBemMotors(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to list BEM motors:", error);
      return new ApiResponseModel(error);
    }
  },

  createBemMotor: async (payload: CreateBemMotorPayload) => {
    try {
      const response = await createBemMotors(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to create BEM motor:", error);
      return new ApiResponseModel(error);
    }
  },

  updateBemMotor: async (payload: UpdateBemMotorPayload) => {
    try {
      const response = await updateBemMotors(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      console.error("Failed to update BEM motor:", error);
      return new ApiResponseModel(error);
    }
  },

  getBemMotorDetails: async (payload: { motorId: string }) => {
    try {
      const response = await FetchDetails(payload);
      const apiResponse = new ApiResponseModel(response);
      return apiResponse;
    } catch (error) {
      console.error("Failed to fetch BEM motor details:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default stfController;
