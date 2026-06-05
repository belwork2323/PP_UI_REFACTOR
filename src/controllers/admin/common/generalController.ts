import { fetchDepartments, fetchSubDepartments, fetchRoles } from "../../../data/api/common/generalAPI";
import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";

/**
 * Utility to parse standard backend error responses into readable messages
 */
export const parseApiError = (error: any, defaultMessage: string): string => {
  if (error?.error?.details) {
    return error.error.details;
  }
  if (error?.message && typeof error.message === 'string') {
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
      return new ApiResponseModel({ success: true, statusCode: 200, message: "Success", data: Array.isArray(data) ? data : [] });
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
      return new ApiResponseModel({ success: true, statusCode: 200, message: "Success", data: Array.isArray(data) ? data : [] });
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
      return new ApiResponseModel({ success: true, statusCode: 200, message: "Success", data: Array.isArray(data) ? data : [] });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};