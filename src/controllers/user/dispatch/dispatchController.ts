import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  DispatchDetailsModel,
  DispatchSubmitResponseModel,
} from "../../../data/models/user/DispatchApiModel";
import {
  createDispatchFormApi,
  fetchDispatchFormDetailsApi,
  updateDispatchFormApi,
} from "../../../data/api/users/dispatch/dispatchAPI";

export type DispatchSupportingFilePayload = {
  name: string;
  filePath: string;
  fileType: string;
};

export type DispatchCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  castingDate: string;
  finalWeight: string;
  waiversIfAny: string;
  ndtCommitteeMomNumber: string;
  finalAcceptanceMomNumber: string;
  deviationDetails: string;
  dispatchDate: string;
  dispatchLocation: string;
  supportingFiles: DispatchSupportingFilePayload[];
};

export type DispatchUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  castingDate: string;
  finalWeight: string;
  waiversIfAny: string;
  ndtCommitteeMomNumber: string;
  finalAcceptanceMomNumber: string;
  deviationDetails: string;
  dispatchDate: string;
  dispatchLocation: string;
  supportingFiles: DispatchSupportingFilePayload[];
};

export type DispatchDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const dispatchController = {
  createForm: async (payload: DispatchCreatePayload) => {
    try {
      const response = await createDispatchFormApi(payload);
      return new ApiResponseModel<DispatchSubmitResponseModel>(response, (res) =>
        DispatchSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create Dispatch form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: DispatchDetailsPayload) => {
    try {
      const response = await fetchDispatchFormDetailsApi(payload);
      return new ApiResponseModel<DispatchDetailsModel>(response, (res) =>
        DispatchDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch Dispatch form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: DispatchUpdatePayload) => {
    try {
      const response = await updateDispatchFormApi(payload);
      return new ApiResponseModel<DispatchSubmitResponseModel>(response, (res) =>
        DispatchSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update Dispatch form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default dispatchController;
