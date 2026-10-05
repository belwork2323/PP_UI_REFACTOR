import { BLOCKCHAIN } from "../../endPoints";
import { post } from "../../httpClient";

export const fetchBlockchainBatchById = (batchId: string) =>
  post(BLOCKCHAIN.GET_BATCH_BY_ID, { batchId });
