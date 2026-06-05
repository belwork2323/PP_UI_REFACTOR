// src/controllers/system_manager/systemManagerController.ts
// Controller for the System Manager dashboard.
// Matches batchManagementController / dashboardController patterns.
// All methods return raw response (not ApiResponseModel) — hooks handle state.

import {
  fetchSMStats,
  fetchSMChartData,
  fetchSMActiveBatches,
  fetchSMAlerts,
  fetchSMBatchStatusList,
  fetchSMBlockchainEvents,
  fetchSMBatchStages,
  fetchSMBatchSubDeptDetails,
} from "../../data/api/system_manager/systemManagerAPI";

import {
  SMStatsModel,
  SMChartDataModel,
  SMActiveBatchModel,
  SMAlertModel,
  SMAlertSummaryModel,
  SMBatchStatusModel,
  SMBlockchainEventModel,
  BatchStagesModel,
  BatchSubDeptDetailsModel,
} from "../../data/models/SystemManagerModel";

import { useAlertStore } from "../../app/store/alertStore";
import { STRINGS }      from "../../app/config/strings";

const S = STRINGS.SYSTEM_MANAGER_DASHBOARD;

export const systemManagerController = {

  /* ──────────────────────────────────────────────────────────────────────────
     API 1: Dashboard Stats
  ─────────────────────────────────────────────────────────────────────────── */
  getStats: async (filterType: string, startDate: string, endDate: string) => {
    try {
      const resp = await fetchSMStats({ filterType, startDate, endDate });
      if (resp?.success && resp.data) {
        return {
          success: true,
          stats:   SMStatsModel.fromApi(resp.data),
          message: resp.message,
        };
      }
      useAlertStore.getState().showAlert(
        resp?.message || S.ERRORS.LOAD_STATS_FAILED, "error", { autoCloseMs: 4000 }
      );
      return { success: false, stats: SMStatsModel.fromApi({}), message: resp?.message };
    } catch (err: any) {
      useAlertStore.getState().showAlert(S.ERRORS.LOAD_STATS_FAILED, "error", { autoCloseMs: 4000 });
      return { success: false, stats: SMStatsModel.fromApi({}), message: "" };
    }
  },

  /* ──────────────────────────────────────────────────────────────────────────
     API 2: Chart Data
  ─────────────────────────────────────────────────────────────────────────── */
  getChartData: async (filterType: string, startDate: string, endDate: string) => {
    try {
      const resp = await fetchSMChartData({ filterType, startDate, endDate });
      if (resp?.success && resp.data) {
        return {
          success:        true,
          chartData:      SMChartDataModel.fromApi(resp.data),
          timestamp:      resp.timestamp,
        };
      }
      useAlertStore.getState().showAlert(
        resp?.message || S.ERRORS.LOAD_CHART_FAILED, "error", { autoCloseMs: 4000 }
      );
      return { success: false, chartData: SMChartDataModel.empty() };
    } catch {
      useAlertStore.getState().showAlert(S.ERRORS.LOAD_CHART_FAILED, "error", { autoCloseMs: 4000 });
      return { success: false, chartData: SMChartDataModel.empty() };
    }
  },

  /* ──────────────────────────────────────────────────────────────────────────
     API 3: Active Batches
  ─────────────────────────────────────────────────────────────────────────── */
  getActiveBatches: async (payload: {
    page: number; limit: number; search?: string;
    departmentId?: number; subDepartmentId?: number;
    priority?: string; status?: string;
  }) => {
    try {
      const resp = await fetchSMActiveBatches(payload);
      if (resp?.success && resp.data) {
        return {
          success:    true,
          batches:    (resp.data.batches ?? []).map(SMActiveBatchModel.fromApi),
          pagination: resp.data,
        };
      }
      useAlertStore.getState().showAlert(
        resp?.message || S.ERRORS.LOAD_BATCHES_FAILED, "error", { autoCloseMs: 4000 }
      );
      return { success: false, batches: [], pagination: null };
    } catch {
      useAlertStore.getState().showAlert(S.ERRORS.LOAD_BATCHES_FAILED, "error", { autoCloseMs: 4000 });
      return { success: false, batches: [], pagination: null };
    }
  },

  /* ──────────────────────────────────────────────────────────────────────────
     API 4: Alerts
  ─────────────────────────────────────────────────────────────────────────── */
  getAlerts: async (payload: {
    systemManagerId: string; type?: string[]; page: number; limit: number;
    search?: string; dateRange?: { from?: string; to?: string };
  }) => {
    try {
      const resp = await fetchSMAlerts(payload);
      // Alerts API returns without top-level success flag per spec — handle both shapes
      const data = resp?.data ?? resp;
      if (data?.alerts || resp?.success !== false) {
        const alerts = (data?.alerts ?? []).map((a: any) => SMAlertModel.fromApi(a));
        const summary = data?.summary ? new SMAlertSummaryModel(data.summary) : new SMAlertSummaryModel({});
        return { success: true, alerts, summary, page: data?.page, limit: data?.limit };
      }
      useAlertStore.getState().showAlert(
        resp?.message || S.ERRORS.LOAD_ALERTS_FAILED, "error", { autoCloseMs: 4000 }
      );
      return { success: false, alerts: [], summary: new SMAlertSummaryModel({}) };
    } catch {
      useAlertStore.getState().showAlert(S.ERRORS.LOAD_ALERTS_FAILED, "error", { autoCloseMs: 4000 });
      return { success: false, alerts: [], summary: new SMAlertSummaryModel({}) };
    }
  },

  /* ──────────────────────────────────────────────────────────────────────────
     API 5: Batch Status List
  ─────────────────────────────────────────────────────────────────────────── */
  getBatchStatusList: async (payload: { page: number; limit: number; search?: string }) => {
    try {
      const resp = await fetchSMBatchStatusList(payload);
      if (resp?.success && resp.data) {
        return {
          success: true,
          batches: (resp.data.batches ?? []).map(SMBatchStatusModel.fromApi),
        };
      }
      useAlertStore.getState().showAlert(
        resp?.message || S.ERRORS.LOAD_STATUS_FAILED, "error", { autoCloseMs: 4000 }
      );
      return { success: false, batches: [] };
    } catch {
      useAlertStore.getState().showAlert(S.ERRORS.LOAD_STATUS_FAILED, "error", { autoCloseMs: 4000 });
      return { success: false, batches: [] };
    }
  },

  /* ──────────────────────────────────────────────────────────────────────────
     API 6: Blockchain Events
  ─────────────────────────────────────────────────────────────────────────── */
  getBlockchainEvents: async (payload: {
    systemManagerId: string; search?: string; eventType?: string;
    department?: string; subDepartment?: string;
    startDate?: string | null; endDate?: string | null;
    page: number; pageSize: number;
  }) => {
    try {
      const resp = await fetchSMBlockchainEvents(payload);
      if (resp?.success && resp.data) {
        return {
          success:    true,
          events:     (resp.data.events ?? []).map(SMBlockchainEventModel.fromApi),
          pagination: resp.data.pagination ?? null,
        };
      }
      useAlertStore.getState().showAlert(
        resp?.message || S.ERRORS.LOAD_EVENTS_FAILED, "error", { autoCloseMs: 4000 }
      );
      return { success: false, events: [], pagination: null };
    } catch {
      useAlertStore.getState().showAlert(S.ERRORS.LOAD_EVENTS_FAILED, "error", { autoCloseMs: 4000 });
      return { success: false, events: [], pagination: null };
    }
  },

  /* ──────────────────────────────────────────────────────────────────────────
     API 7: Batch Stages
  ─────────────────────────────────────────────────────────────────────────── */
  getBatchStages: async (payload: { batchId: string }) => {
    try {
      const resp = await fetchSMBatchStages(payload);
      if (resp?.success && resp.data) {
        return {
          success: true,
          batchStages: BatchStagesModel.fromApi(resp.data),
        };
      }
      useAlertStore.getState().showAlert(
        resp?.message || S.ERRORS.LOAD_BATCHES_FAILED, "error", { autoCloseMs: 4000 }
      );
      return { success: false, batchStages: null };
    } catch {
      useAlertStore.getState().showAlert(S.ERRORS.LOAD_BATCHES_FAILED, "error", { autoCloseMs: 4000 });
      return { success: false, batchStages: null };
    }
  },

  /* ───────────────────────────────────────────────────────────────────────────
     API 8: Sub-Department Batch Details
  ─────────────────────────────────────────────────────────────────────────── */
  getBatchSubDeptDetails: async (payload: { batchId: string; subDepartmentId: number }) => {
    try {
      const resp = await fetchSMBatchSubDeptDetails(payload);
      if (resp?.success && resp.data) {
        return {
          success: true,
          details: BatchSubDeptDetailsModel.fromApi(resp.data),
          message: resp.message,
          statusCode: resp.statusCode,
          errorCode: null,
        };
      }
      useAlertStore.getState().showAlert(
        resp?.message || S.ERRORS.LOAD_BATCH_DETAILS_FAILED, "error", { autoCloseMs: 4000 }
      );
      return {
        success: false,
        details: null,
        message: resp?.message || S.ERRORS.LOAD_BATCH_DETAILS_FAILED,
        statusCode: resp?.statusCode ?? 0,
        errorCode: resp?.error?.code ?? null,
      };
    } catch (err: any) {
      useAlertStore.getState().showAlert(err?.message || S.ERRORS.LOAD_BATCH_DETAILS_FAILED, "error", { autoCloseMs: 4000 });
      return {
        success: false,
        details: null,
        message: err?.message || S.ERRORS.LOAD_BATCH_DETAILS_FAILED,
        statusCode: err?.status ?? 0,
        errorCode: err?.details?.code ?? null,
      };
    }
  },
};