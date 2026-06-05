import { get, post } from "../httpClient";
import { QC_ENDPOINTS } from "../endPoints";

/**
 * Fetch all batches available for QC
 */
export const fetchBatchListApi = () => get(QC_ENDPOINTS.BATCH_LIST);

/**
 * Fetch all QC submission history logs
 */
export const fetchQCLogsApi = () => get(QC_ENDPOINTS.ALL_LOGS);

/**
 * Submit final QC data with manager authentication
 * @param {Object} payload 
 * @param {string} username 
 */
export const submitQCApi = (payload, username) => 
  post(QC_ENDPOINTS.SUBMIT(username), payload);