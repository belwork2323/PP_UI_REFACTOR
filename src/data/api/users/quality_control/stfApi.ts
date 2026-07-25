import { get, post, put } from "../../httpClient";
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

export const fetchBemMotors = async (payload: any) => {
  return await post(USER_STF_ENDPOINTS.LIST_BEM_MOTORS, payload);
};

export const createBemMotors = async (payload: any) => {
  return await post(USER_STF_ENDPOINTS.CREATE_BEM_MOTORS, payload);
};

export const updateBemMotors = async (payload: any) => {
  return await put(USER_STF_ENDPOINTS.UPDATE_BEM_MOTOR, payload);
};
export const FetchDetails = async (payload: any) => {
  return await post(USER_STF_ENDPOINTS.BEM_MOTOR_DETAILS, payload);
};
