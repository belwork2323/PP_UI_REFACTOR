import { fetchBatchListApi, fetchQCLogsApi, submitQCApi } from "../../data/api/user_quality_control/qualityControlApi";
import { useAlertStore } from "../../app/store/alertStore";
import { useAuthStore } from "../../app/store/authStore";
import { STRINGS } from "../../app/config/strings";

export const SPECIFICATIONS = {
  rawMatPurity: { min: 99.5, max: 100, unit: "%" },
  homogeneityIndex: { min: 0.95, max: 1.0, unit: "" },
  tensileStrength: { min: 2.5, max: 4.0, unit: "MPa" },
  elongation: { min: 100, max: 150, unit: "%" },
  burnRate: { min: 8.0, max: 10.0, unit: "mm/s" },
  nValue: { min: 0.45, max: 0.60, unit: "" },
};

export const qcController = {
  getBatches: async () => {
    try {
      const data = await fetchBatchListApi();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Batch fetch error:", error);
      return [];
    }
  },

  getLogs: async () => {
    try {
      const data = await fetchQCLogsApi();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      useAlertStore.getState().showAlert(STRINGS.SYSTEM.SERVER_NOT_REACHABLE, "error");
      return [];
    }
  },

  /**
   * Calculates deviations based on specifications
   */
  calculateDeviations: (qcData) => {
    const newDeviations = {};
    for (const key in SPECIFICATIONS) {
      const value = parseFloat(qcData[key]);
      const spec = SPECIFICATIONS[key];
      if (!isNaN(value) && (value < spec.min || value > spec.max)) {
        newDeviations[key] = `Value ${value} is outside specification (${spec.min} - ${spec.max} ${spec.unit || ""})`;
      }
    }
    return newDeviations;
  },

  submit: async (qcData, deviations) => {
    const showAlert = useAlertStore.getState().showAlert;
    const currentUser = useAuthStore.getState().user?.username;

    if (!currentUser) {
      showAlert("Authentication Error: No active user session found.", "error");
      return false;
    }

    try {
      // Replicating the legacy payload structure
      const payload = {
        ...qcData,
        status: Object.keys(deviations).length > 0 ? "Deviation" : "Approved",
        nduMedia: qcData.nduMediaFile ? qcData.nduMediaFile.name : "N/A",
        processMedia: qcData.processMediaFile ? qcData.processMediaFile.name : "N/A",
        deviationLogs: JSON.stringify(deviations),
      };

      const response = await submitQCApi(payload, currentUser);
      
      // Based on legacy logic: status 200/201 is success
      if (response) {
        showAlert("Final QC data approved and blockchain record created!", "success");
        return true;
      }
    } catch (error) {
      const msg = error.response?.status === 403 ? "Unauthorized to approve QC records." : "Submission failed.";
      showAlert(msg, "error");
      return false;
    }
  },
};