import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  RawMaterialPreparationDetailsModel,
  RawMaterialPreparationSubmitResponseModel,
} from "../../../data/models/user/RawMaterialPreparationModel";
import {
  createRawMaterialPreparationFormApi,
  fetchRawMaterialPreparationFormDetailsApi,
  updateRawMaterialPreparationFormApi,
} from "../../../data/api/users/manufacturing/rawMaterialPreparationApi";

export type RawMaterialPreparationCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  preparationDetails: {
    premixes: Array<{
      premixNo: number;
      materialType: "SOLID" | "LIQUID" | "BOTH";
      solidProcess: Array<Record<string, unknown>>;
      liquidProcess: Array<Record<string, unknown>>;
    }>;
    weightmentSheet?: unknown;
  };
};

export type RawMaterialPreparationUpdatePayload = Omit<
  RawMaterialPreparationCreatePayload,
  "batchId" | "formSubmissionType"
> & {
  formId: string;
  formSubmissionType: "DRAFT" | "SUBMIT";
};

export type RawMaterialPreparationDetailsPayload = {
  formId: string;
};

export const rawMaterialPreparationController = {
  createForm: async (payload: RawMaterialPreparationCreatePayload) => {
    try {
      const response = await createRawMaterialPreparationFormApi(payload);
      return new ApiResponseModel<RawMaterialPreparationSubmitResponseModel>(response, (res) =>
        RawMaterialPreparationSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create raw material preparation form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: RawMaterialPreparationDetailsPayload) => {
    try {
      const response = await fetchRawMaterialPreparationFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) =>
        RawMaterialPreparationDetailsModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to fetch raw material preparation form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: RawMaterialPreparationUpdatePayload) => {
    try {
      const response = await updateRawMaterialPreparationFormApi(payload);
      return new ApiResponseModel<RawMaterialPreparationSubmitResponseModel>(response, (res) =>
        RawMaterialPreparationSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update raw material preparation form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default rawMaterialPreparationController;
