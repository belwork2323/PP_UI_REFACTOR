import { post } from "@data/api/httpClient";
import { ADMIN_ENDPOINTS } from "@data/api/endPoints";

export const fetchQualityCheckMasterList = (payload: Record<string, unknown> = {}) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QUALITY_CHECKS.LIST, payload);

export const createQualityCheckMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QUALITY_CHECKS.CREATE, payload);

export const updateQualityCheckMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QUALITY_CHECKS.UPDATE, payload);

export const deleteQualityCheckMaster = (payload: { id: number }) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QUALITY_CHECKS.DELETE, payload);

export const enableQualityCheckMaster = (payload: { id: number }) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QUALITY_CHECKS.ENABLE, payload);
