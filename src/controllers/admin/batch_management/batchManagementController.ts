import {
  fetchBatchStatsApi,
  fetchAllBatches,
  fetchBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../../../data/api/admin/batchManagementAPI";
import type { BatchFilters, BatchSort, UpdateBatchPayloadAPI } from "../../../data/api/admin/batchManagementAPI";
import {
  BatchListItemModel,
  BatchStatsModel,
  CreateBatchPayload,
  UpdateBatchPayload,
} from "../../../data/models/admin/BatchManagementModel";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore }  from "../../../app/store/authStore";
import { parseApiError } from "../common/generalController";

export const batchManagementController = {

  /* ─────────────────────────────────────────────────────────────────────────
     BATCH STATS
  ───────────────────────────────────────────────────────────────────────── */
  getBatchStats: async (
    filterType: string = "month",
    startDate?: string,
    endDate?  : string
  ) => {
    try {
      const response = await fetchBatchStatsApi(filterType, startDate, endDate);
      if (response?.success === false) throw response;
      return BatchStatsModel.fromStatsApi(response);
    } catch (error) {
      useAlertStore
        .getState()
        .showAlert(parseApiError(error, "Failed to load batch statistics."), "error");
      return null;
    }
  },

  /* ─────────────────────────────────────────────────────────────────────────
     FETCH ALL BATCHES  (paginated + filtered)
  ───────────────────────────────────────────────────────────────────────── */
  getAllBatches: async (
    page   : number       = 1,
    limit  : number       = 10,
    filters: BatchFilters = {},
    sort   : BatchSort    = { field: "createdOn", order: "desc" }
  ) => {
    try {
      const response = await fetchAllBatches(page, limit, filters, sort);
      if (response?.success === false) throw response;

      const rawBatches = response?.data?.batches || [];
      const pagination = response?.data?.pagination || {
        page, limit, totalRecords: 0, totalPages: 0,
      };

      return {
        batches   : rawBatches.map((b: any) => BatchListItemModel.fromApi(b)),
        pagination,
      };
    } catch (error) {
      useAlertStore
        .getState()
        .showAlert(parseApiError(error, "Failed to load batches. Please try again."), "error");
      return null;
    }
  },

  /* ─────────────────────────────────────────────────────────────────────────
     FETCH BATCH BY ID
  ───────────────────────────────────────────────────────────────────────── */
  getBatchById: async (batchId: string) => {
    try {
      const response = await fetchBatchById(batchId);
      if (response?.success === false) throw response;
      return BatchListItemModel.fromApi(response?.data?.batch);
    } catch (error) {
      useAlertStore
        .getState()
        .showAlert(parseApiError(error, "Failed to load batch details."), "error");
      return null;
    }
  },

  /* ─────────────────────────────────────────────────────────────────────────
     CREATE BATCH
  ───────────────────────────────────────────────────────────────────────── */
  createBatch: async (form: any) => {
    const showAlert = useAlertStore.getState().showAlert;
    const authUser  = useAuthStore.getState().user;

    if (!authUser?.username) {
      showAlert("Authentication error. Please login again.", "error");
      return false;
    }

    try {
      // Model constructor accepts only (form) — createdBy is derived server-side
      const payload  = new CreateBatchPayload(form);
      const response = await createBatch(payload);
      if (response?.success === false) throw response;

      showAlert(
        response?.message || "Batch created successfully.",
        "success",
        { autoCloseMs: 2000 }
      );
      return true;
    } catch (error) {
      showAlert(
        parseApiError(error, "Failed to create batch. Please try again."),
        "error",
        { autoCloseMs: 3000 }
      );
      return false;
    }
  },

  /* ─────────────────────────────────────────────────────────────────────────
     UPDATE BATCH
  ───────────────────────────────────────────────────────────────────────── */
  updateBatch: async (batchId: string, form: any) => {
    const showAlert = useAlertStore.getState().showAlert;
    const authUser  = useAuthStore.getState().user;

    if (!authUser?.username) {
      showAlert("Authentication error. Please login again.", "error");
      return false;
    }

    try {
      // Model constructor accepts only (form) — updatedBy is derived server-side
      const payload  = new UpdateBatchPayload(batchId, form);
      const response = await updateBatch(payload as unknown as UpdateBatchPayloadAPI);
      if (response?.success === false) throw response;

      showAlert(
        response?.message || "Batch updated successfully.",
        "success",
        { autoCloseMs: 2000 }
      );
      return true;
    } catch (error) {
      showAlert(
        parseApiError(error, "Failed to update batch. Please try again."),
        "error",
        { autoCloseMs: 3000 }
      );
      return false;
    }
  },

  /* ─────────────────────────────────────────────────────────────────────────
     DELETE BATCH
  ───────────────────────────────────────────────────────────────────────── */
  deleteBatch: async (batchId: string, reason: string) => {
    const showAlert = useAlertStore.getState().showAlert;

    try {
      const response = await deleteBatch(batchId, reason);
      if (response?.success === false) throw response;

      showAlert(
        response?.message || "Batch deleted successfully.",
        "success",
        { autoCloseMs: 2000 }
      );
      return true;
    } catch (error) {
      showAlert(
        parseApiError(error, "Failed to delete batch. Please try again."),
        "error",
        { autoCloseMs: 3000 }
      );
      return false;
    }
  },
};