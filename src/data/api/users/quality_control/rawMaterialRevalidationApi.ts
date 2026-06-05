import { post, put } from "../../httpClient";
import { USER_RAW_MATERIAL_REVALIDATION_ENDPOINTS } from "../../endPoints";

export const createRawMaterialRevalidationFormApi = async (payload: any) => {
  return await post(USER_RAW_MATERIAL_REVALIDATION_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchRawMaterialRevalidationFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_RAW_MATERIAL_REVALIDATION_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateRawMaterialRevalidationFormApi = async (payload: any) => {
  return await put(USER_RAW_MATERIAL_REVALIDATION_ENDPOINTS.UPDATE_FORM, payload);
};