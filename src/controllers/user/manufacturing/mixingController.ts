import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  MixingDetailsModel,
  MixingSubmitResponseModel,
} from "../../../data/models/user/MixingFormModel";
import {
  createMixingFormApi,
  fetchMixingFormDetailsApi,
  fetchQualityCheck,
  updateMixingFormApi,
} from "../../../data/api/users/manufacturing/mixingFormApi";
import { fetchMixingCycleDetailsApi } from "@/data/api/common/generalAPI";

export type MixingFormBody = {
  mixingDetails: {
    stages: Array<Record<string, unknown>>;
  };
};
export type MixingCreatePayload = MixingFormBody & {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
};

export type MixingUpdatePayload = MixingFormBody & {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
};

export type MixingDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

/** Dedupe in-flight quality-check requests (Strict Mode / remounts). */
const qualityChecksInflight = new Map<string, Promise<unknown>>();

export const mixingController = {
  createForm: async (payload: MixingCreatePayload) => {
    try {
      const response = await createMixingFormApi(payload);
      return new ApiResponseModel<MixingSubmitResponseModel>(response, (res) =>
        MixingSubmitResponseModel.fromApi(res),
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
        MixingSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update mixing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchMixingCycleDetails: async (mixingCycleCode: string) => {
    try {
      const response = await fetchMixingCycleDetailsApi(mixingCycleCode);
      return response;
    } catch (error) {
      console.error("Failed to fetch mixing cycle details:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchQualityChecks: async (mixType: string, motorStage: number) => {
    const cacheKey = `${String(mixType).toUpperCase()}:${Number(motorStage) || 0}`;
    const existing = qualityChecksInflight.get(cacheKey);
    if (existing) return existing;

    const request = (async () => {
      try {
        return await fetchQualityCheck(mixType, motorStage);
      } catch (error) {
        console.error("Failed to fetch quality checks:", error);
        qualityChecksInflight.delete(cacheKey);
        return new ApiResponseModel(error);
      }
    })();

    qualityChecksInflight.set(cacheKey, request);
    return request;
  },
};

export default mixingController;
