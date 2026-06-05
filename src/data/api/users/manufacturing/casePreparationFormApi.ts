import { post, put } from "../../httpClient";
import { USER_CASE_PREPARATION_ENDPOINTS } from "../../endPoints";

export const createCasePreparationFormApi = async (payload: any) => {
  return await post(USER_CASE_PREPARATION_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchCasePreparationFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_CASE_PREPARATION_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateCasePreparationFormApi = async (payload: any) => {
  return await put(USER_CASE_PREPARATION_ENDPOINTS.UPDATE_FORM, payload);
};
