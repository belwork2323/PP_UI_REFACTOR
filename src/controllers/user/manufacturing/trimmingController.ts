import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  TrimmingDetailsModel,
  TrimmingSubmitResponseModel,
  type TrimmingFormBody,
} from "../../../data/models/user/TrimmingFormModel";
import {
  createTrimmingFormApi,
  fetchTrimmingFormDetailsApi,
  updateTrimmingFormApi,
} from "../../../data/api/users/manufacturing/trimmingFormApi";

export type TrimmingCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
} & TrimmingFormBody;

export type TrimmingUpdatePayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
} & TrimmingFormBody;

export type TrimmingDetailsPayload = {
  formId: string;
  // subDepartmentId: number;
};

export const trimmingController = {
  createForm: async (payload: TrimmingCreatePayload) => {
    try {
      const response = await createTrimmingFormApi(payload);
      return new ApiResponseModel<TrimmingSubmitResponseModel>(response, (res) =>
        TrimmingSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create trimming form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: TrimmingDetailsPayload) => {
    try {
      const response = await fetchTrimmingFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) => TrimmingDetailsModel.fromApi(res));
    } catch (error) {
      console.error("Failed to fetch trimming form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: TrimmingUpdatePayload) => {
    try {
      const response = await updateTrimmingFormApi(payload);
      return new ApiResponseModel<TrimmingSubmitResponseModel>(response, (res) =>
        TrimmingSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update trimming form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default trimmingController;
