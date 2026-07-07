import { USER_MANUFACTURING_APPROVER } from "../../endPoints";
import { get, post } from "../../httpClient";

export const fetchCasePrepBatch = (batchId) => {
  return get(USER_MANUFACTURING_APPROVER.CASE_PREP.CASE_PREP_BATCH(batchId));
};

export const UpdateBatch = (batchId, payload) => {
  return post(USER_MANUFACTURING_APPROVER.CASE_PREP.UPDATE_CASE_PREP(batchId), {
    payload,
  });
};

export const GenerateCasePreppdf = (batchId) =>
  get(
    USER_MANUFACTURING_APPROVER.CASE_PREP.DOWNLOAD_CASE_PREP_BATCH(batchId),
    {},
    { responseType: "blob" }
  );
