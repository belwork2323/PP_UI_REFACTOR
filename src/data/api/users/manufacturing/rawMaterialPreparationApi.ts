import { post, put } from "../../httpClient";
import { USER_RAW_MATERIAL_PREPARATION_ENDPOINTS } from "../../endPoints";

export const createRawMaterialPreparationFormApi = async (payload: any) => {
  return await post(USER_RAW_MATERIAL_PREPARATION_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchRawMaterialPreparationFormDetailsApi = async (payload: { formId: string }) => {
  return await post(USER_RAW_MATERIAL_PREPARATION_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateRawMaterialPreparationFormApi = async (payload: any) => {
  return await put(USER_RAW_MATERIAL_PREPARATION_ENDPOINTS.UPDATE_FORM, payload);
};
