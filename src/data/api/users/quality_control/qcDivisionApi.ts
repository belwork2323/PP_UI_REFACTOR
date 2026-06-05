import { post, put } from "../../httpClient";
import { USER_QC_DIVISION_ENDPOINTS } from "../../endPoints";

export const createQCDivisionFormApi = async (payload: any) => {
  return await post(USER_QC_DIVISION_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchQCDivisionFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_QC_DIVISION_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateQCDivisionFormApi = async (payload: any) => {
  return await put(USER_QC_DIVISION_ENDPOINTS.UPDATE_FORM, payload);
};