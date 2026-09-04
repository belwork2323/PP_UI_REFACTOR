import { post } from "@data/api/httpClient";
import { ADMIN_ENDPOINTS } from "@data/api/endPoints";

export const fetchMaterialsMasterList = (payload: Record<string, unknown> = {}) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.MATERIALS.LIST, payload);

export const createMaterialsMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.MATERIALS.CREATE, payload);

export const updateMaterialsMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.MATERIALS.UPDATE, payload);

export const deleteMaterialsMaster = (payload: { materialId: number }) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.MATERIALS.DELETE, payload);
