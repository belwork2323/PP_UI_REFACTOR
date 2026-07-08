/* ─────────────────────────────────────────────────────────────────────────────
   DASHBOARD MODELS — admin analytics API mapping
───────────────────────────────────────────────────────────────────────────── */

import colors from "@app/theme/colors";
import { icons } from "@app/theme/icons";

const getApiData = (apiResponse: any) => apiResponse?.data ?? apiResponse ?? {};

export type DashboardKpiStat = {
  type: string;
  label: string;
  value: string;
  rawValue: number;
  sub: string;
};

export type DashboardChartPoint = {
  label: string;
  v: number;
};

export type ActiveBatchRowModel = {
  id: string;
  batchId: string;
  batchType: string;
  motorId: string;
  motorType: string;
  projectName: string;
  stage: string;
  currentStage: string;
  stageDept: string;
  managerId: string;
  managerName: string;
  status: string;
  createdOn: string;
  completion: number;
  color: string;
};

export type BlockchainEventModel = {
  transactionId: string;
  batchId: string;
  eventType: string;
  eventStatusMessage: string;
  department: string;
  subDepartment: string;
  performedBy: string;
  timestamp: string;
  blockNumber: string;
  channelName: string;
  color: string;
  icon: string;
};

const STATS_MAP: Record<string, { type: string; label: string }> = {
  totalUsers: { type: "users", label: "Total Users" },
  activeUsers: { type: "users", label: "Active Users" },
  completedBatches: { type: "batches", label: "Completed Batches" },
  openBatches: { type: "batches", label: "Open Batches" },
  motorsDispatched: { type: "dispatch", label: "Motors Dispatched" },
};

const DEFAULT_BATCH_COLOR = "#1976d2";
const DEFAULT_EVENT_COLOR = "#2196f3";

const EVENT_STYLE: Record<string, { color: string; icon: string }> = {
  APPROVAL_COMPLETED: { color: "#4caf50", icon: "✓" },
  STAGE_UPDATED: { color: "#ff9800", icon: "↻" },
};

export class DashboardModel {
  static formatNumber(num: number): string {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  static fromStatsApi(apiResponse: any): { kpis: DashboardKpiStat[] } {
    const data = getApiData(apiResponse);

    const kpis = Object.entries(STATS_MAP).map(([key, mapping]) => {
      const statData = data[key] ?? { count: 0, subValue: 0 };
      const count = Number(statData.count ?? 0);
      const subValue = Number(statData.subValue ?? 0);
      const sub = subValue !== 0 ? (subValue > 0 ? `+${subValue}` : `${subValue}`) : "—";

      return {
        type: mapping.type,
        label: mapping.label,
        value: DashboardModel.formatNumber(count),
        rawValue: count,
        sub,
      };
    });

    return { kpis };
  }

  static fromChartDataApi(apiResponse: any) {
    const data = getApiData(apiResponse);
    const mapChart = (arr: any[], labelKey: string, valueKey = "value") =>
      (arr || []).map((item) => ({
        [labelKey]: item.label,
        v: item[valueKey],
      }));

    return {
      charts: {
        weeklyActivity: mapChart(data.weeklyActivity, "day"),
        motorsProcessed: mapChart(data.motorsProcessed, "m"),
        qcPassRate: mapChart(data.qcPassRate, "m"),
      },
    };
  }

  static fromActiveBatchesApi(apiResponse: any) {
    const data = getApiData(apiResponse);
    const batches = data?.batches || [];

    const activeBatches: ActiveBatchRowModel[] = batches.map((b: any) => ({
      id: b.id ?? "",
      batchId: b.batchId ?? "",
      batchType: b.type ?? b.batchType ?? "NA",
      motorId: b.motorId ?? "",
      motorType: b.motorType?.motorTypeName ?? b.motorType?.typeName ?? b.motorType ?? "NA",
      projectName: b.projectName ?? "",
      stage: b.stage ?? "NA",
      currentStage: b.stage?.department ?? "NA",
      stageDept: b.stage?.subDepartment ?? "NA",
      managerId: b.systemManager?.id ?? b.systemManagerId ?? "NA",
      managerName: b.systemManager?.name ?? b.systemManagerName ?? "NA",
      status: b.status ?? "NA",
      createdOn: b.createdOn ?? b.date ?? "",
      completion: typeof b.completion === "number" ? b.completion : 0,
      color: b.color ?? DEFAULT_BATCH_COLOR,
    }));

    return {
      activeBatches,
      pagination: data?.pagination || { page: 1, pageSize: 10, totalRecords: 0, totalPages: 0 },
    };
  }

  static fromBlockchainEventsApi(apiResponse: any) {
    const data = getApiData(apiResponse);
    const events = data?.events || [];

    const formattedEvents: BlockchainEventModel[] = events.map((e: any) => {
      const style = EVENT_STYLE[e.eventType] ?? { color: DEFAULT_EVENT_COLOR, icon: "Tx" };
      return {
        transactionId: e.transactionId ?? "",
        batchId: e.batchId ?? "",
        eventType: e.eventType ?? "",
        eventStatusMessage: e.eventStatusMessage ?? e.label ?? "",
        department: e.department ?? "",
        subDepartment: e.subDepartment ?? "",
        performedBy: e.performedBy ?? "",
        timestamp: e.timestamp ?? e.time ?? "",
        blockNumber: e.blockNumber ?? "",
        channelName: e.channelName ?? "",
        color: style.color,
        icon: style.icon,
      };
    });

    return {
      events: formattedEvents,
      pagination: data?.pagination || { page: 1, pageSize: 10, totalRecords: 0, totalPages: 0 },
    };
  }
}

const KPI_VISUALS: Record<string, { Icon: typeof icons.users }> = {
  users: { Icon: icons.users },
  batches: { Icon: icons.chart },
  dispatch: { Icon: icons.Store },
  approvals: { Icon: icons.approval },
};

export const enrichDashboardKpis = (raw: DashboardKpiStat[] = []) => {
  const palette = colors.admin.kpiAvatar;
  return raw.map((kpi) => {
    const vis = KPI_VISUALS[kpi.type] ?? { Icon: icons.chart };
    const bg = palette[kpi.type as keyof typeof palette] ?? palette.users;
    return { ...kpi, Icon: vis.Icon, bg };
  });
};

export type ActiveBatchesFilterInput = {
  searchQuery: string;
  filterStage: string;
  filterBatchType: string;
  filterStatus: string;
  dateFrom: string;
  dateTo: string;
  currentMonthOnly: boolean;
};

export const buildActiveBatchesFilterPayload = ({
  searchQuery,
  filterStage,
  filterBatchType,
  filterStatus,
  dateFrom,
  dateTo,
  currentMonthOnly,
}: ActiveBatchesFilterInput) => ({
  search: searchQuery.trim(),
  stage: filterStage,
  type: filterBatchType,
  status: filterStatus,
  startDate: dateFrom || null,
  endDate: dateTo || null,
  currentMonth: currentMonthOnly,
  page: 1,
  pageSize: 10,
});
