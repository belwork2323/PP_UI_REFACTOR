import { get, post } from "../httpClient";
import { DISPATCH_APPROVER_ENDPOINTS } from "../endPoints";

export const fetchDraftDispatchesApi = () => 
  get(DISPATCH_APPROVER_ENDPOINTS.PENDING_LIST);

export const fetchDispatchDetailsApi = (batchId) => 
  get(DISPATCH_APPROVER_ENDPOINTS.DETAILS(batchId));

export const updateDispatchStatusApi = (batchId, status, approver) => 
  post(DISPATCH_APPROVER_ENDPOINTS.UPDATE_STATUS(batchId), { 
    dispatchStatus: status, 
    approverName: approver 
  });