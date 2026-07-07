import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  QCDivisionDetailsModel,
  QCDivisionSubmitResponseModel,
} from "../../../data/models/user/QCDivisionApiModel";
import {
  createQCDivisionFormApi,
  fetchQCDivisionFormDetailsApi,
  updateQCDivisionFormApi,
} from "../../../data/api/users/quality_control/qcDivisionApi";

export type DivisionDetailEntry = {
  division: string;
  subType: string | null;
  data: Record<string, unknown>;
};

export type QCDivisionCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  divisionDetails: DivisionDetailEntry[];
};

export type QCDivisionUpdatePayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  divisionDetails: DivisionDetailEntry[];
};

export type QCDivisionDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const qcDivisionController = {
  createForm: async (payload: QCDivisionCreatePayload) => {
    try {
      const response = await createQCDivisionFormApi(payload);
      return new ApiResponseModel<QCDivisionSubmitResponseModel>(response, (res) =>
        QCDivisionSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create QC division form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: QCDivisionDetailsPayload) => {
    try {
      const response = await fetchQCDivisionFormDetailsApi(payload);
      return new ApiResponseModel<QCDivisionDetailsModel>(response, (res) =>
        QCDivisionDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch QC division form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: QCDivisionUpdatePayload) => {
    try {
      const response = await updateQCDivisionFormApi(payload);
      return new ApiResponseModel<QCDivisionSubmitResponseModel>(response, (res) =>
        QCDivisionSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update QC division form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default qcDivisionController;