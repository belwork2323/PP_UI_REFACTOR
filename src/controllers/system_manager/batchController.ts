import * as batchApi from "../../data/api/system_manager/batchApi";
import { useAlertStore } from "../../app/store/alertStore";

export const getBatches = async () => {
  const showAlert = useAlertStore.getState().showAlert;
  try {
    return await batchApi.fetchAllBatches();
  } catch (err) {
    console.error(err);
    showAlert("Failed to fetch batches", "error");
    return [];
  }
};

export const createBatch = async (batchData, username, onSuccess) => {
  const showAlert = useAlertStore.getState().showAlert;
  try {
    const batch = await batchApi.createBatch(batchData, username);
    showAlert(`Batch ${batch.batchId} created successfully`, "success");
    onSuccess?.(batch);
  } catch (err) {
    console.error(err);
    showAlert(err.response?.data || "Error creating batch", "error");
  }
};
