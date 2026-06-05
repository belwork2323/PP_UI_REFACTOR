import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  NDTDetailsModel,
  NDTSubmitResponseModel,
} from "../../../data/models/user/NDTApiModel";
import {
  createNDTFormApi,
  fetchNDTFormDetailsApi,
  updateNDTFormApi,
} from "../../../data/api/users/quality_control/ndtApi";
import type { NDTFormState } from "../../../data/models/user/NDTFormModel";

export type NDTCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  defects: any;
  mechRows: any[];
  mechMean: any;
  mechStdDev: any;
  ifaceRows: any[];
  ifaceAvg: any;
  ifaceStdDev: any;
  burnRows: any[];
  burnAvg: any;
};

export type NDTUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  defects: any;
  mechRows: any[];
  mechMean: any;
  mechStdDev: any;
  ifaceRows: any[];
  ifaceAvg: any;
  ifaceStdDev: any;
  burnRows: any[];
  burnAvg: any;
};

export type NDTDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const ndtController = {
  createForm: async (payload: NDTCreatePayload) => {
    try {
      const response = await createNDTFormApi(payload);
      return new ApiResponseModel<NDTSubmitResponseModel>(response, (res) =>
        NDTSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create NDT form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: NDTDetailsPayload) => {
    try {
      const response = await fetchNDTFormDetailsApi(payload);
      return new ApiResponseModel<NDTDetailsModel>(response, (res) =>
        NDTDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch NDT form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: NDTUpdatePayload) => {
    try {
      const response = await updateNDTFormApi(payload);
      return new ApiResponseModel<NDTSubmitResponseModel>(response, (res) =>
        NDTSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update NDT form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default ndtController;