import { BLOCKCHAIN } from "../../endPoints";
import { post } from "../../httpClient";

export const fetchBlockchainBatchById = (payload: { batchId: string; assetId?: string }) =>
  post(BLOCKCHAIN.GET_BATCH_BY_ID, payload);
export const fetchDashboardBlockchainEventsApi = (payload: any) => {
  return post(BLOCKCHAIN.GET_BLOCKCHAIN_EVENTS_BY_BATCHID, payload);
};

export const fetchDashboardBlockchainBatchesApi = (payload: any) => {
  return post(BLOCKCHAIN.GET_BLOCKCHAIN_EVENTS, payload);
};
