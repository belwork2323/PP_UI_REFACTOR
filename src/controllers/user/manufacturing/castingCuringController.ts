import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  CastingCuringDetailsModel,
  CastingCuringSubmitResponseModel,
  type CastingCuringFormBody,
} from "../../../data/models/user/CastingCuringFormModel";
import {
  createCastingCuringFormApi,
  fetchCastingCuringFormDetailsApi,
  fetchCuringCyclesApi,
  updateCastingCuringFormApi,
} from "../../../data/api/users/manufacturing/castingCuringFormApi";
import {
  CuringCycleConfigModel,
  type CuringCycleConfig,
} from "../../../data/models/user/CuringCycleConfigModel";

export type CastingCuringCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: CastingCuringFormBody["motors"];
};

export type CastingCuringUpdatePayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: CastingCuringFormBody["motors"];
};

export type CastingCuringDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const castingCuringController = {
  createForm: async (payload: CastingCuringCreatePayload) => {
    try {
      const response = await createCastingCuringFormApi(payload);
      return new ApiResponseModel<CastingCuringSubmitResponseModel>(response, (res) =>
        CastingCuringSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create casting and curing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: CastingCuringDetailsPayload) => {
    try {
      const response = await fetchCastingCuringFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) => CastingCuringDetailsModel.fromApi(res));
    } catch (error) {
      console.error("Failed to fetch casting and curing form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: CastingCuringUpdatePayload) => {
    try {
      const response = await updateCastingCuringFormApi(payload);
      return new ApiResponseModel<CastingCuringSubmitResponseModel>(response, (res) =>
        CastingCuringSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update casting and curing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchCuringCycles: async (payload: { motorStage: number }) => {
    try {
      const response = await fetchCuringCyclesApi(payload);
      const normalizedResponse = {
        ...response,
        success:
          response?.success ??
          response?.statusCode === 200 ??
          response?.code === 200,
      };
      return new ApiResponseModel<CuringCycleConfig>(normalizedResponse, (res) =>
        CuringCycleConfigModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch curing cycles:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default castingCuringController;
