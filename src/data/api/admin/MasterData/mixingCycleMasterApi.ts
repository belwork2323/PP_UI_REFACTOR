import { post } from "@data/api/httpClient";
import { ADMIN_ENDPOINTS } from "@data/api/endPoints";

export const fetchMixingCycleMasterList = (payload: Record<string, unknown> = {}) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.MIXING_CYCLES.LIST, payload);

export const createMixingCycleMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.MIXING_CYCLES.CREATE, payload);

export const updateMixingCycleMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.MIXING_CYCLES.UPDATE, payload);

export const deleteMixingCycleMaster = (payload: { id: number }) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.MIXING_CYCLES.DELETE, payload);
