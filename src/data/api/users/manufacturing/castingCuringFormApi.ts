import { post, put } from "../../httpClient";
import { USER_CASTING_CURING_FORM_ENDPOINTS } from "../../endPoints";

export const createCastingCuringFormApi = async (payload: any) => {
  return await post(USER_CASTING_CURING_FORM_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchCastingCuringFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_CASTING_CURING_FORM_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateCastingCuringFormApi = async (payload: any) => {
  return await put(USER_CASTING_CURING_FORM_ENDPOINTS.UPDATE_FORM, payload);
};
