import { post, put } from "../../httpClient";
import { USER_STF_ENDPOINTS } from "../../endPoints";

export const createSTFFormApi = async (payload: any) => {
  return await post(USER_STF_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchSTFFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_STF_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateSTFFormApi = async (payload: any) => {
  return await put(USER_STF_ENDPOINTS.UPDATE_FORM, payload);
};
