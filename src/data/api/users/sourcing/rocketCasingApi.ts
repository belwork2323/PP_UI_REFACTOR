import { USER_SOURCING_ENDPOINTS } from "../endPoints";
import { get, post } from "../httpClient";

/**
 * Fetches all casing logs from the sourcing department
 */
export const fetchCasingLogsApi = () => get(USER_SOURCING_ENDPOINTS.ROCKET_CASING_LIST);

/**
 * Submits a new rocket casing record
 * @param {string} username - Required for the query parameter
 * @param {Object} payload - The casing data object
 */
export const submitCasingApi = (username, payload) =>
  post(USER_SOURCING_ENDPOINTS.ROCKET_CASING_SUBMIT(username), payload);
