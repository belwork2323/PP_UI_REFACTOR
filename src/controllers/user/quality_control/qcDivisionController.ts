import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  QCDivisionDetailsModel,
  QCDivisionSubmitResponseModel,
} from "../../../data/models/user/QCDivisionApiModel";
import {
  createQCDivisionFormApi,
  fetchQcDivisionDetailsApi,
  fetchQcDivisionsApi,
  fetchQCDivisionFormDetailsApi,
  updateQCDivisionFormApi,
} from "../../../data/api/users/quality_control/qcDivisionApi";

export type DivisionDetailEntry = {
  division: string;
  subType: string | null;
  divisionSubmissionType?: "DRAFT" | "SUBMIT";
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

export type QCDivisionAutoPopulatePayload = {
  batchId: string;
  divisionId: number;
};

export const qcDivisionController = {
  fetchDivisions: async () => {
    try {
      const response = await fetchQcDivisionsApi();
      return new ApiResponseModel<unknown>(response, (res) => res?.data ?? res ?? []);
    } catch (error) {
      console.error("Failed to fetch QC divisions:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchDivisionDetails: async (payload: QCDivisionAutoPopulatePayload) => {
    try {
      const response = await fetchQcDivisionDetailsApi(payload);
      return new ApiResponseModel<Record<string, unknown>>(response, (res) => {
        const data = res?.data ?? res ?? {};
        return data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : { value: data };
      });
    } catch (error) {
      console.error("Failed to fetch QC division details for auto-populate:", error);
      return new ApiResponseModel(error);
    }
  },

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
