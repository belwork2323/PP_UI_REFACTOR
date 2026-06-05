import { get, put } from "../httpClient";
import { SOURCING_APPROVER_ENDPOINTS } from "../endPoints";

export const fetchPendingTasksApi = () => get(SOURCING_APPROVER_ENDPOINTS.PENDING_TASKS);

export const submitApprovalActionApi = (type, id, params) =>
  put(SOURCING_APPROVER_ENDPOINTS.ACTION(type, id), null, { params });
