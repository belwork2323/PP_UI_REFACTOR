import {
  fetchAllBatches,
  fetchAllBatchesSolid,
  fetchAllBatchesLiquid,
  SubmitLiquidBatch,
  SubmitSolidBatch,
} from "../../data/api/user_manufacturing/RawMaterial";

import { post } from "../../data/api/httpClient";
import { USER_MANUFACTURING } from "../../data/api/endPoints";

import { useAlertStore } from "../../app/store/alertStore";
import { useAuthStore } from "../../app/store/authStore";
import { STRINGS } from "../../app/config/strings";
import { SolidPrepModel } from "../../data/models/SolidPreparationModel";

export const rawMaterialManufacturingController = {
  /* =========================
     Fetch All Batches
  ========================= */
  getAllBatches: async () => {
    try {
      const data = await fetchAllBatches();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      useAlertStore
        .getState()
        .showAlert(STRINGS.SYSTEM.SERVER_NOT_REACHABLE, "error");
      return [];
    }
  },

  /* =========================
     Fetch Solid List
  ========================= */
  getSolidBatches: async () => {
    try {
      const data = await fetchAllBatchesSolid();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      useAlertStore
        .getState()
        .showAlert(STRINGS.SYSTEM.SERVER_NOT_REACHABLE, "error");
      return [];
    }
  },

  /* =========================
     Fetch Liquid List
  ========================= */
  getLiquidBatches: async () => {
    try {
      const data = await fetchAllBatchesLiquid();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      useAlertStore
        .getState()
        .showAlert(STRINGS.SYSTEM.SERVER_NOT_REACHABLE, "error");
      return [];
    }
  },

  /* =========================
     Submit Solid Preparation
  ========================= */
 submitSolid: async (form, batchId) => {
  const showAlert = useAlertStore.getState().showAlert;
  const username = useAuthStore.getState().user?.username;

  if (!username) {
    showAlert("Authentication error. Please login again.", "error");
    return false;
  }

  try {
    const payload = new SolidPrepModel(form, batchId, username);

    const response = await SubmitSolidBatch(payload);

    if (response) {
      showAlert("Solid preparation submitted successfully.", "success", {
        autoCloseMs: 2000,
      });
      return true;
    }

    return false;
  } catch (error) {
    showAlert("Solid preparation submission failed.", "error", {
      autoCloseMs: 3000,
    });
    return false;
  }
},

  /* =========================
     Submit Liquid Preparation
  ========================= */
  submitLiquid: async (payload) => {
    const showAlert = useAlertStore.getState().showAlert;
    const currentUser = useAuthStore.getState().user?.username;

    if (!currentUser) {
      showAlert("Authentication error. Please login again.", "error");
      return false;
    }

    try {
      const response = await SubmitLiquidBatch({
        ...payload,
        username: currentUser,
      });

      if (response != null) {
        showAlert("Liquid preparation submitted successfully.", "success", {
          autoCloseMs: 2000,
        });
        return true;
      }

      return false;
    } catch (error) {
      showAlert("Liquid preparation submission failed.", "error", {
        autoCloseMs: 3000,
      });
      return false;
    }
  },
};