import { post, put } from "../../httpClient";
import { USER_TRIMMING_FORM_ENDPOINTS } from "../../endPoints";

export const createTrimmingFormApi = async (payload: any) => {
  return await post(USER_TRIMMING_FORM_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchTrimmingFormDetailsApi = async (payload: {
  formId: string;
  // subDepartmentId: number;
}) => {
  return await post(USER_TRIMMING_FORM_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateTrimmingFormApi = async (payload: any) => {
  return await put(USER_TRIMMING_FORM_ENDPOINTS.UPDATE_FORM, payload);
};
