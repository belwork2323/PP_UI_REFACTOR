import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import type { SubscaleApiPayloadBody } from "../../../data/models/user/subscaleApiPayloadMapper";
import {
  SubscaleDetailsModel,
  SubscaleSubmitResponseModel,
} from "../../../data/models/user/SubscaleFormModel";
import {
  createSubscaleFormApi,
  fetchSubscaleFormDetailsApi,
  updateSubscaleFormApi,
} from "../../../data/api/users/manufacturing/subscaleFormApi";

type SubscaleFormRequestBase = SubscaleApiPayloadBody & {
  batchId: string;
  batchType: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
};

export type SubscaleCreatePayload = SubscaleFormRequestBase;

export type SubscaleUpdatePayload = SubscaleFormRequestBase & {
  formId: string;
};

export type SubscaleDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const subscaleController = {
  createForm: async (payload: SubscaleCreatePayload) => {
    try {
      const response = await createSubscaleFormApi(payload);
      return new ApiResponseModel<SubscaleSubmitResponseModel>(response, (res) =>
        SubscaleSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create subscale form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: SubscaleDetailsPayload) => {
    try {
      const response = await fetchSubscaleFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) => SubscaleDetailsModel.fromApi(res));
    } catch (error) {
      console.error("Failed to fetch subscale form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: SubscaleUpdatePayload) => {
    try {
      const response = await updateSubscaleFormApi(payload);
      return new ApiResponseModel<SubscaleSubmitResponseModel>(response, (res) =>
        SubscaleSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update subscale form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default subscaleController;
