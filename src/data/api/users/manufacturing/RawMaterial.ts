import { USER_MANUFACTURING } from "../endPoints";
import { get, post } from "../httpClient";

export const fetchAllBatches = () =>
  get(USER_MANUFACTURING.RAW_MATERIAL.BATCH_LIST);
export const fetchAllBatchesSolid = () =>
  get(USER_MANUFACTURING.RAW_MATERIAL.SOLID_LIST);
export const fetchAllBatchesLiquid = () =>
  get(USER_MANUFACTURING.RAW_MATERIAL.LIQUID_LIST);

export const SubmitLiquidBatch = (payload) =>
  post(USER_MANUFACTURING.RAW_MATERIAL.SUBMIT_LIQUID, payload);

export const SubmitSolidBatch = (payload) =>
  post(USER_MANUFACTURING.RAW_MATERIAL.SUBMIT_SOLID, payload);
