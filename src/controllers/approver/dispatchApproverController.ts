import { 
  fetchDraftDispatchesApi, 
  fetchDispatchDetailsApi, 
  updateDispatchStatusApi 
} from "../../data/api/approver_dispatch/dispatchApproverApi";
import { useAlertStore } from "../../app/store/alertStore";

export const dispatchApproverController = {
  getPendingList: async (setBatches, setLoading) => {
    setLoading(true);
    try {
      const data = await fetchDraftDispatchesApi();
      setBatches(Array.isArray(data) ? data : []);
    } catch (error) {
      useAlertStore.getState().showAlert("Failed to fetch pending dispatches", "error");
    } finally {
      setLoading(false);
    }
  },

  getDetails: async (batchId, setDetails, setLoading) => {
    setLoading(true);
    try {
      const data = await fetchDispatchDetailsApi(batchId);
      setDetails(data);
    } catch (error) {
      useAlertStore.getState().showAlert("Failed to load dispatch details", "error");
    } finally {
      setLoading(false);
    }
  },

  processApproval: async (batchId, status, onunda) => {
    const user = JSON.parse(localStorage.getItem("user"))?.username || "unknown_approver";
    try {
      await updateDispatchStatusApi(batchId, status, user);
      useAlertStore.getState().showAlert(`Batch ${batchId} ${status} successfully`, "success");
      onunda(); // Callback to refresh list/navigate back
    } catch (error) {
      useAlertStore.getState().showAlert(`Failed to ${status} batch`, "error");
    }
  }
};