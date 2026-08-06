import {
  fetchDepartments,
  fetchSubDepartments,
  fetchRoles,
  fetchMixers,
  fetchBuildings,
  fetchOvens,
  fetchEquipmentList,
  fetchBeamEnergyList,
  fetchMixingCycles,
  fetchSubscaleArticles,
  type MixingCycleMotorStage,
  type FetchSubscaleArticlesParams,
} from "@data/api/common/generalAPI";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";

/**
 * Utility to parse standard backend error responses into readable messages
 */
export const parseApiError = (error: any, defaultMessage: string): string => {
  if (error?.error?.details) {
    return error.error.details;
  }
  if (error?.message && typeof error.message === "string") {
    return error.message;
  }
  return defaultMessage;
};

export const generalController = {
  /* ─────────────────────────────
     Fetch all departments
  ───────────────────────────── */
  getDepartments: async () => {
    try {
      const data = await fetchDepartments();
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Fetch subdepartments
     Pass departmentId to filter,
     or omit to get all.
  ───────────────────────────── */
  getSubDepartments: async (departmentId = null) => {
    try {
      const data = await fetchSubDepartments(departmentId);
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Fetch all roles
  ───────────────────────────── */
  getRoles: async () => {
    try {
      const data = await fetchRoles();
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Mixer master (batch identification sheet)
  ───────────────────────────── */
  getMixers: async () => {
    try {
      const data = await fetchMixers();
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Building master (batch identification sheet)
  ───────────────────────────── */
  getBuildings: async () => {
    try {
      const data = await fetchBuildings();
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Oven master (casting & curing)
  ───────────────────────────── */
  getOvens: async () => {
    try {
      const data = await fetchOvens();
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Equipment master (NDT radiography setup)
  ───────────────────────────── */
  getEquipmentList: async () => {
    try {
      const data = await fetchEquipmentList();
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Beam energy master (NDT radiography setup)
  ───────────────────────────── */
  getBeamEnergyList: async () => {
    try {
      const data = await fetchBeamEnergyList();
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Mixing cycle master (create batch — filter by motorStage)
     motorStage: 0 | 1 | 2 | 3 | "ALL"
  ───────────────────────────── */
  getMixingCycles: async (motorStage: MixingCycleMotorStage = "ALL") => {
    try {
      const data = await fetchMixingCycles(motorStage);
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  /* ─────────────────────────────
     Subscale article master (experimental batch articles multi-select)
  ───────────────────────────── */
  getSubscaleArticles: async (params: FetchSubscaleArticlesParams = {}) => {
    try {
      const data = await fetchSubscaleArticles(params);
      return new ApiResponseModel({
        success: true,
        statusCode: 200,
        message: "Success",
        data: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};
