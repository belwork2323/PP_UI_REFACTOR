import { fetchPendingTasksApi, submitApprovalActionApi } from "../../data/api/approver_sourcing/sourcingApproverApi";
import { useAlertStore } from "../../app/store/alertStore";

export const sourcingApproverController = {
  getPendingTasks: async () => {
    try {
      const data = await fetchPendingTasksApi();
      return {
        rawMaterials: data?.rawMaterials || [],
        rocketCasings: data?.rocketCasings || [],
      };
    } catch (error) {
      useAlertStore.getState().showAlert("Failed to fetch pending tasks", "error");
      return { rawMaterials: [], rocketCasings: [] };
    }
  },

  processAction: async (type, item, action) => {
    const showAlert = useAlertStore.getState().showAlert;
    const user = JSON.parse(localStorage.getItem("user"));
    const username = user?.username || "unknown_user";

    const params = {
      status: action,
      approver: username,
      batchId: item.batchId,
    };

    try {
      await submitApprovalActionApi(type, item.id, params);
      showAlert(`${type.toUpperCase()} ${action} successfully`, "success",{ autoCloseMs: 2000 });

      // Return the history object to be added to the session state
      return {
        ...item,
        finalStatus: action,
        actionDate: new Date().toLocaleTimeString(),
      };
    } catch (error) {
      showAlert("Error processing approval", "error");
      return null;
    }
  },
};
