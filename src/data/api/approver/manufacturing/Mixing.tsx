import { USER_MANUFACTURING_APPROVER } from "../endPoints";
import { get, post } from "../httpClient";

export const fetchMixingBatch = (batchId) => {
  return get(USER_MANUFACTURING_APPROVER.MIXING.MIXING_BATCH(batchId));
};

export const UpdateBatch = (batchId, payload) => {
  return post(USER_MANUFACTURING_APPROVER.MIXING.UPDATE_MIXING(batchId), {
    payload,
  });
};

export const GenerateMixingpdf = (batchId) =>
  get(
    USER_MANUFACTURING_APPROVER.MIXING.DOWNLOAD_MIXING_BATCH(batchId),
    {},
    { responseType: "blob" }
  );
