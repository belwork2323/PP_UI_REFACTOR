import { post, put } from "../../httpClient";
import { USER_NDT_ENDPOINTS } from "../../endPoints";

export const createNDTFormApi = async (payload: any) => {
  return await post(USER_NDT_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchNDTFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_NDT_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateNDTFormApi = async (payload: any) => {
  return await put(USER_NDT_ENDPOINTS.UPDATE_FORM, payload);
};