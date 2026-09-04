import { post } from "@data/api/httpClient";
import { ADMIN_ENDPOINTS } from "@data/api/endPoints";

export const fetchInsulationSpecMasterList = (payload: Record<string, unknown> = {}) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.INSULATION.LIST, payload);

export const createInsulationSpecMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.INSULATION.CREATE, payload);

export const updateInsulationSpecMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.INSULATION.UPDATE, payload);

export const deleteInsulationSpecMaster = (payload: { id: string }) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.INSULATION.DELETE, payload);
