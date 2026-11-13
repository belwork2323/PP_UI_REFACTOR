import { del, post, put } from "@data/api/httpClient";
import { USER_OPERATIONS_ENDPOINTS, USER_RAW_MATERIAL_SOURCING_ENDPOINTS } from "@data/api/endPoints";

export const fetchRawMaterialLotListApi = async (payload: Record<string, unknown>) => {
  return await post(USER_OPERATIONS_ENDPOINTS.LOT_LIST, payload);
};

export const createRawMaterialSourcingFormApi = async (payload: Record<string, unknown>) => {
  return await post(USER_RAW_MATERIAL_SOURCING_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchRawMaterialSourcingFormDetailsApi = async (
  payload: { lotId: string } | { formId: string; subDepartmentId: number }
) => {
  return await post(USER_RAW_MATERIAL_SOURCING_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateRawMaterialSourcingFormApi = async (payload: Record<string, unknown>) => {
  return await put(USER_RAW_MATERIAL_SOURCING_ENDPOINTS.UPDATE_FORM, payload);
};

export const deleteRawMaterialSourcingFormApi = async (payload: { lotId: string }) => {
  return await del(USER_RAW_MATERIAL_SOURCING_ENDPOINTS.DELETE_FORM, { data: payload });
};

export const fetchRawMaterialSourcingStatsApi = async (payload: { subDepartmentId: number }) => {
  return await post(USER_RAW_MATERIAL_SOURCING_ENDPOINTS.STATS, payload);
};
