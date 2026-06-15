import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  CasePreparationDetailsModel,
  CasePreparationSubmitResponseModel,
  type CasePreparationFormBody,
} from "../../../data/models/user/CasePreparationFormModel";
import {
  createCasePreparationFormApi,
  fetchCasePreparationFormDetailsApi,
  updateCasePreparationFormApi,
} from "../../../data/api/users/manufacturing/casePreparationFormApi";

export type CasePreparationCreatePayload = {
  batchId: string;
  batchType: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  casePreparationDetails: any;
  // generalActivities: Record<string, { m1: string; m2: string }>;
  // linearCoatingOperation: Record<string, { m1: string; m2: string }>;
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
};

export default casePreparationController;
