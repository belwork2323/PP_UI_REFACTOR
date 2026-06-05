import { del, post, put } from "../../httpClient";
import { USER_OPERATIONS_ENDPOINTS, USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS } from "../../endPoints";

export const fetchRawMaterialLotListApi = async (payload: Record<string, unknown>) => {
  return await post(USER_OPERATIONS_ENDPOINTS.LOT_LIST, payload);
};

export const createRawMaterialProcurementFormApi = async (payload: Record<string, unknown>) => {
  return await post(USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchRawMaterialProcurementFormDetailsApi = async (
  payload: { lotId: string } | { formId: string; subDepartmentId: number }
) => {
  return await post(USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateRawMaterialProcurementFormApi = async (payload: Record<string, unknown>) => {
  return await put(USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS.UPDATE_FORM, payload);
};

export const deleteRawMaterialProcurementFormApi = async (payload: { lotId: string }) => {
  return await del(USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS.DELETE_FORM, { data: payload });
};

export const fetchRawMaterialProcurementStatsApi = async (payload: { subDepartmentId: number }) => {
  return await post(USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS.STATS, payload);
};
