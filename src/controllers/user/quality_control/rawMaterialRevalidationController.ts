import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RawMaterialRevalidationDetailsModel,
  RawMaterialRevalidationSubmitResponseModel,
} from "../../../data/models/user/QCRawMaterialRevalidationApiModel";
import {
  createRawMaterialRevalidationFormApi,
  fetchRawMaterialRevalidationFormDetailsApi,
  updateRawMaterialRevalidationFormApi,
} from "../../../data/api/users/quality_control/rawMaterialRevalidationApi";

export type RawMaterialRevalidationCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  blocks: Array<{
    ingredientCode: string;
    lotNo: string;
    rows: Array<{
      specificationCode: string;
      result: string;
      validity: string;
    }>;
  }>;
};

export type RawMaterialRevalidationUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  blocks: Array<{
    ingredientCode: string;
    lotNo: string;
    rows: Array<{
      specificationCode: string;
      result: string;
      validity: string;
    }>;
  }>;
};

export type RawMaterialRevalidationDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const rawMaterialRevalidationController = {
  createForm: async (payload: RawMaterialRevalidationCreatePayload) => {
    try {
      const response = await createRawMaterialRevalidationFormApi(payload);
      return new ApiResponseModel<RawMaterialRevalidationSubmitResponseModel>(response, (res) =>
        RawMaterialRevalidationSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create raw material revalidation form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: RawMaterialRevalidationDetailsPayload) => {
    try {
      const response = await fetchRawMaterialRevalidationFormDetailsApi(payload);
      return new ApiResponseModel<RawMaterialRevalidationDetailsModel>(response, (res) =>
        RawMaterialRevalidationDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch raw material revalidation form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: RawMaterialRevalidationUpdatePayload) => {
    try {
      const response = await updateRawMaterialRevalidationFormApi(payload);
      return new ApiResponseModel<RawMaterialRevalidationSubmitResponseModel>(response, (res) =>
        RawMaterialRevalidationSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update raw material revalidation form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default rawMaterialRevalidationController;