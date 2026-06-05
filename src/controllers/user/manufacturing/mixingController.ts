import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  MixingDetailsModel,
  MixingSubmitResponseModel,
} from "../../../data/models/user/MixingFormModel";
import {
  createMixingFormApi,
  fetchMixingFormDetailsApi,
  updateMixingFormApi,
} from "../../../data/api/users/manufacturing/mixingFormApi";

type MixingPayloadRow = {
  operationLabel: string;
  rpm: string;
  time: string;
  temp: string;
  vacuum: string;
};

export type MixingCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  preMixing: {
    operations: MixingPayloadRow[];
    sampling: MixingPayloadRow;
  };
  finalMixing: {
    tdiAddition: MixingPayloadRow;
    viscositySampling: MixingPayloadRow;
  };
};

export type MixingUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  preMixing: {
    operations: MixingPayloadRow[];
    sampling: MixingPayloadRow;
  };
  finalMixing: {
    tdiAddition: MixingPayloadRow;
    viscositySampling: MixingPayloadRow;
  };
};

export type MixingDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const mixingController = {
  createForm: async (payload: MixingCreatePayload) => {
    try {
      const response = await createMixingFormApi(payload);
      return new ApiResponseModel<MixingSubmitResponseModel>(response, (res) =>
        MixingSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create mixing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: MixingDetailsPayload) => {
    try {
      const response = await fetchMixingFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) => MixingDetailsModel.fromApi(res));
    } catch (error) {
      console.error("Failed to fetch mixing form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: MixingUpdatePayload) => {
    try {
      const response = await updateMixingFormApi(payload);
      return new ApiResponseModel<MixingSubmitResponseModel>(response, (res) =>
        MixingSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update mixing form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default mixingController;
