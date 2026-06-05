import { post, put } from "../../httpClient";
import { USER_MIXING_FORM_ENDPOINTS } from "../../endPoints";

export const createMixingFormApi = async (payload: any) => {
  return await post(USER_MIXING_FORM_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchMixingFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_MIXING_FORM_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateMixingFormApi = async (payload: any) => {
  return await put(USER_MIXING_FORM_ENDPOINTS.UPDATE_FORM, payload);
};
