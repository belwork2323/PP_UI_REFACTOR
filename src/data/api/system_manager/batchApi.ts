import { ADMIN_ENDPOINTS } from "../endPoints";
import { post, get } from "../httpClient";

export const fetchAllBatches = (payload) => get(ADMIN_ENDPOINTS.BATCH_LIST, payload);

export const createBatch = (username, payload) => post(ADMIN_ENDPOINTS.CREATE_BATCH(username), payload);
