import { post, put } from "../../httpClient";
import { USER_DISPATCH_ENDPOINTS } from "../../endPoints";

export const createDispatchFormApi = async (payload: any) => {
  return await post(USER_DISPATCH_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchDispatchFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_DISPATCH_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateDispatchFormApi = async (payload: any) => {
  return await put(USER_DISPATCH_ENDPOINTS.UPDATE_FORM, payload);
};
