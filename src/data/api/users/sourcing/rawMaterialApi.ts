import { get, post } from "../httpClient";
import { USER_SOURCING_ENDPOINTS, ADMIN_ENDPOINTS } from "../endPoints";

export const fetchRawMaterialLogsApi = () => get(USER_SOURCING_ENDPOINTS.RAW_MATERIAL_LIST);

export const submitRawMaterialApi = (payload, username) =>
  post(USER_SOURCING_ENDPOINTS.RAW_MATERIAL_SUBMIT(username), payload);

export const fetchBatchListApi = () => get(ADMIN_ENDPOINTS.BATCH_LIST);
