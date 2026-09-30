import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  CasePreparationDetailsModel,
  CasePreparationSubmitResponseModel,
} from "../../../data/models/user/CasePreparationFormModel";
import {
  createCasePreparationFormApi,
  fetchCasePreparationFormDetailsApi,
  fetchCasePrepLinerIngredientsApi,
  updateCasePreparationFormApi,
} from "../../../data/api/users/manufacturing/casePreparationFormApi";
import type { CasePrepLinerIngredientsApiResponse } from "../../../data/models/user/casePrepLinerRecipes";

export type CasePreparationCreatePayload = {
  batchId: string;
  batchType: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  casePreparationDetails: any;
};

export type CasePreparationUpdatePayload = {
  batchId: string;
  formId: string;
  batchType: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  casePreparationDetails: any;
};

export type CasePreparationDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const casePreparationController = {
  createForm: async (payload: CasePreparationCreatePayload) => {
    try {
      const response = await createCasePreparationFormApi(payload);
      return new ApiResponseModel<CasePreparationSubmitResponseModel>(response, (res) =>
        CasePreparationSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create case preparation form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: CasePreparationDetailsPayload) => {
    try {
      const response = await fetchCasePreparationFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) =>
        CasePreparationDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch case preparation form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: CasePreparationUpdatePayload) => {
    try {
      const response = await updateCasePreparationFormApi(payload);
      return new ApiResponseModel<CasePreparationSubmitResponseModel>(response, (res) =>
        CasePreparationSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update case preparation form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchLinerIngredients: async (linerType: string) => {
    try {
      const response = await fetchCasePrepLinerIngredientsApi({ linerType });
      return new ApiResponseModel<CasePrepLinerIngredientsApiResponse>(response, (res) => {
        const data = (res as { data?: CasePrepLinerIngredientsApiResponse })?.data ?? res;
        return data as CasePrepLinerIngredientsApiResponse;
      });
    } catch (error) {
      console.error("Failed to fetch case preparation liner ingredients:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default casePreparationController;
