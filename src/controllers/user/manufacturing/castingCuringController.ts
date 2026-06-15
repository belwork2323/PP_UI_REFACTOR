import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  CastingCuringDetailsModel,
  CastingCuringSubmitResponseModel,
  type CastingCuringFormBody,
} from "../../../data/models/user/CastingCuringFormModel";
import {
  createCastingCuringFormApi,
  fetchCastingCuringFormDetailsApi,
  updateCastingCuringFormApi,
} from "../../../data/api/users/manufacturing/castingCuringFormApi";

export type CastingCuringCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  castingCuringDetails: CastingCuringFormBody;
};

export type CastingCuringUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  castingCuringDetails: CastingCuringFormBody;
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
};

export default castingCuringController;
