import { post } from "@data/api/httpClient";
import { ADMIN_ENDPOINTS } from "@data/api/endPoints";

export const fetchCuringCycleMasterList = (payload: Record<string, unknown> = {}) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.CURING_CYCLES.LIST, payload);

export const createCuringCycleMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.CURING_CYCLES.CREATE, payload);

export const updateCuringCycleMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.CURING_CYCLES.UPDATE, payload);

export const deleteCuringCycleMaster = (payload: { id: string }) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.CURING_CYCLES.DELETE, payload);
