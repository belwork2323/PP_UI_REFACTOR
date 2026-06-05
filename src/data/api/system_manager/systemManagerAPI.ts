// src/data/api/system_manager/systemManagerAPI.ts
// Real API layer for the System Manager dashboard (6 POST endpoints).

import { post } from "../httpClient";
import { SYSTEM_MANAGER } from "../endPoints";

/* ─── API 1: Dashboard Stats ─────────────────────────────────────────────── */
export const fetchSMStats = (payload: {
  filterType: string;
  startDate: string;
  endDate: string;
}) => post(SYSTEM_MANAGER.STATS, payload);

/* ─── API 2: Chart Data ──────────────────────────────────────────────────── */
export const fetchSMChartData = (payload: {
  filterType: string;
  startDate: string;
  endDate: string;
}) => post(SYSTEM_MANAGER.CHART_DATA, payload);

/* ─── API 3: Active Batches ──────────────────────────────────────────────── */
export const fetchSMActiveBatches = (payload: {
  page: number;
  limit: number;
  search?: string;
  departmentId?: number;
  subDepartmentId?: number;
  priority?: string;
  status?: string;
}) => post(SYSTEM_MANAGER.ACTIVE_BATCHES, payload);

/* ─── API 4: Alerts ──────────────────────────────────────────────────────── */
export const fetchSMAlerts = (payload: {
  systemManagerId: string;
  type?: string[];
  page: number;
  limit: number;
  search?: string;
  dateRange?: { from?: string; to?: string };
}) => post(SYSTEM_MANAGER.ALERTS, payload);

/* ─── API 5: Batch Status List ───────────────────────────────────────────── */
export const fetchSMBatchStatusList = (payload: {
  page: number;
  limit: number;
  search?: string;
}) => post(SYSTEM_MANAGER.BATCH_STATUS_LIST, payload);

/* ─── API 6: Blockchain Events ───────────────────────────────────────────── */
export const fetchSMBlockchainEvents = (payload: {
  systemManagerId: string;
  search?: string;
  eventType?: string;
  department?: string;
  subDepartment?: string;
  startDate?: string | null;
  endDate?: string | null;
  page: number;
  pageSize: number;
}) => post(SYSTEM_MANAGER.BLOCKCHAIN_EVENTS, payload);
/* ─── API 7: Batch Stages ───────────────────────────────────────────────────── */
export const fetchSMBatchStages = (payload: {
  batchId: string;
}) => post(SYSTEM_MANAGER.BATCH_STAGES, payload);

/* ─── API 8: Sub-Department Batch Details ─────────────────────────────────── */
export const fetchSMBatchSubDeptDetails = (payload: {
  batchId: string;
  subDepartmentId: number;
}) => post(SYSTEM_MANAGER.BATCH_DETAILS, payload);