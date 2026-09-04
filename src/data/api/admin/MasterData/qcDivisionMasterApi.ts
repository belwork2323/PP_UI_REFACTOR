import { post } from "@data/api/httpClient";
import { ADMIN_ENDPOINTS } from "@data/api/endPoints";

export const fetchQcDivisionMasterList = (payload: Record<string, unknown> = {}) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QC_DIVISIONS.LIST, payload);

export const createQcDivisionMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QC_DIVISIONS.CREATE, payload);

export const updateQcDivisionMaster = (payload: Record<string, unknown>) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QC_DIVISIONS.UPDATE, payload);

export const deleteQcDivisionMaster = (payload: { id: string }) =>
  post(ADMIN_ENDPOINTS.MASTER_DATA.QC_DIVISIONS.DELETE, payload);
