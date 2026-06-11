import { USER_MANUFACTURING_APPROVER } from "../endPoints";
import { get, post } from "../httpClient";

export const fetchAllBatches = () =>
  get(USER_MANUFACTURING_APPROVER.ALL_BATCH.BATCH_LIST);

export const fetchSolidBatch = (batchId) => {
  return get(USER_MANUFACTURING_APPROVER.RAW_MATERIAL.SOLID_BATCH(batchId));
};
export const UpdateBatch = (batchId, payload) =>
  post(USER_MANUFACTURING_APPROVER.RAW_MATERIAL.UPDATE_SOLID_BATCH(batchId),payload,);

export const Generatepdf = (batchId) =>
  get(
    USER_MANUFACTURING_APPROVER.RAW_MATERIAL.DOWNLOAD_SOLID_BATCH(batchId),
    {},
    { responseType: "blob" }
  );

export const fetchLiquidBatch = (batchId) => {
  return get(USER_MANUFACTURING_APPROVER.RAW_MATERIAL.LIQUID_BATCH(batchId));
};

export const UpdateLiquidBatch = (batchId, payload) =>
  post(USER_MANUFACTURING_APPROVER.RAW_MATERIAL.UPDATE_LIQUID_BATCH(batchId), {
    payload,
  });

export const GenerateLiquidpdf = (batchId) =>
  get(
    USER_MANUFACTURING_APPROVER.RAW_MATERIAL.DOWNLOAD_LIQUID_BATCH(batchId),
    {},
    { responseType: "blob" }
  );
