import { post, put } from "../../httpClient";
import { USER_SUBSCALE_FORM_ENDPOINTS } from "../../endPoints";

export const createSubscaleFormApi = async (payload: any) => {
  return await post(USER_SUBSCALE_FORM_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchSubscaleFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_SUBSCALE_FORM_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateSubscaleFormApi = async (payload: any) => {
  return await put(USER_SUBSCALE_FORM_ENDPOINTS.UPDATE_FORM, payload);
};
