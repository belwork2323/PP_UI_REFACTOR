import { get, post } from "@data/api/httpClient";
import { ADMIN_ENDPOINTS } from "@data/api/endPoints";

export const fetchMasterDataTypes = () => get(ADMIN_ENDPOINTS.MASTER_DATA.TYPES);

export const fetchMasterDataList = (type: string, payload: Record<string, unknown> = {}) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.LIST(type), payload);

export const createMasterData = (type: string, payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.CREATE(type), payload);

export const updateMasterData = (type: string, payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.UPDATE(type), payload);

export const deleteMasterData = (type: string, payload: { id: number }) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.DELETE(type), payload);
