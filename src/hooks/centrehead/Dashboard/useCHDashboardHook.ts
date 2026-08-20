import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../../app/store/authStore";
import { systemManagerController } from "../../../controllers/system_manager/systemManagerController";
import { SMChartDataModel } from "@/data/models/centrehead/Dashboard/CHDashboardModel";
import { DEFAULT_DATE_FILTER_TYPE } from "@/ui/components/custom/dashboard/DashboardDateFilter";

const createEmptyDashboard = (stageConfig: any[]) => ({
  kpiData: [],
  stageMetrics: [],
  stageData: { totalBatches: 0, filterType: DEFAULT_DATE_FILTER_TYPE, stages: [] as any[] },
  activeBatches: [],
  blockEvents: [],
  chartData: { areaData: [], barData: [] },
  stageConfig,
  chartUpdatedAt: null,
});

const toStageKey = (stageName: string = "") => {
  const normalized = stageName.toLowerCase();
  if (normalized.includes("source")) return "sourcing";
  if (normalized.includes("manufact")) return "manufacturing";
  if (normalized.includes("quality") || normalized.includes("qc")) return "quality";
  if (normalized.includes("dispatch")) return "dispatch";
  return normalized || "sourcing";
};

const toApiDate = (date: Date) => {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getSMDateRange = (
  filterType: string,
  customStartDate: string,
  customEndDate: string,
) => {
  const now = new Date();
  if (filterType === "six_months") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 6);
    return { apiFilter: "custom", startDate: toApiDate(start), endDate: toApiDate(now) };
  }
  if (filterType === "one_year") {
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return { apiFilter: "custom", startDate: toApiDate(start), endDate: toApiDate(now) };
  }
  if (filterType === "day") {
    const today = toApiDate(now);
    return { apiFilter: "day", startDate: today, endDate: today };
  }
  if (filterType === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { apiFilter: "week", startDate: toApiDate(start), endDate: toApiDate(end) };
  }
  if (filterType === "custom") {
    if (customStartDate.length === 10 && customEndDate.length === 10) {
      return { apiFilter: "custom", startDate: customStartDate, endDate: customEndDate };
    }
    return { apiFilter: "custom", startDate: "", endDate: "" };
  }
  return {
    apiFilter: "month",
    startDate: toApiDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toApiDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const resolveSystemManagerId = () => {
  const user = useAuthStore.getState()?.user;
  if (user?.userId !== undefined && user?.userId !== null) {
    return String(user.userId);
  }
  return user?.username ?? "SM-001";
};

export const useCHDashboard = (config: {
  stageConfig: any[];
  stageColors: Record<string, string>;
  kpiVariants: Record<string, { color: string; iconKey: string }>;
}) => {
  const [dashboard, setDashboard] = useState(createEmptyDashboard(config.stageConfig));
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [filterType, setFilterTypeState] = useState(DEFAULT_DATE_FILTER_TYPE);
  /** Draft custom dates (picker) — applied only on Apply Filter */
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  /** Applied custom dates used for API calls */
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  const hasLoadedOnceRef = useRef(false);
  const lastValidBoundsRef = useRef(getSMDateRange(DEFAULT_DATE_FILTER_TYPE, "", ""));
  const [customApplyToken, setCustomApplyToken] = useState(0);

  const { stageConfig, stageColors, kpiVariants } = config;

  /** Keep last valid range while Custom is selected but not yet applied. */
  const dateBounds = useMemo(() => {
    const next = getSMDateRange(filterType, appliedCustomStart, appliedCustomEnd);
    if (next.startDate && next.endDate) {
      lastValidBoundsRef.current = next;
      return next;
    }
    return lastValidBoundsRef.current;
  }, [filterType, appliedCustomStart, appliedCustomEnd]);

  const loadDashboard = useCallback(
    async (ft: string, csd: string, ced: string) => {
      const { apiFilter, startDate, endDate } = getSMDateRange(ft, csd, ced);
      if (apiFilter === "custom" && (!startDate || !endDate)) return;

      const systemManagerId = resolveSystemManagerId();

      if (!hasLoadedOnceRef.current) {
        setLoading(true);
      }
      setStatsLoading(true);

      const [statsResult, chartResult, blockchainResult] = await Promise.all([
        systemManagerController.getStats(apiFilter, startDate, endDate),
        systemManagerController.getChartData(apiFilter, startDate, endDate),
        systemManagerController.getBlockchainEvents({
          systemManagerId,
          search: "",
          eventType: "All",
          department: "All",
          subDepartment: "All",
          startDate,
          endDate,
          page: 1,
          pageSize: 5,
        }),
      ]);

      const stats = statsResult.success ? statsResult.stats : [];
      const chartData = chartResult.success ? chartResult.chartData : SMChartDataModel.empty();
      const chartUpdatedAt =
        chartResult.success && chartResult.timestamp ? new Date(chartResult.timestamp) : new Date();
      const blockchainEvents = blockchainResult.success ? blockchainResult.events : [];
      const fallbackStageColor = stageColors.fallback;
      const fallbackKpiVariant = kpiVariants.fallback;

      setDashboard({
        kpiData: stats.map((item: any) => {
          const variantConfig = kpiVariants[item.variant] ?? fallbackKpiVariant;

          return {
            label: item.label,
            value: item.value,
            sub: item.subText,
            trend: item.subValue >= 0 ? "up" : "down",
            color: variantConfig.color,
            iconKey: variantConfig.iconKey,
          };
        }),
        stageData: {
          totalBatches: chartData.totalActiveBatches ?? chartData.stageTotalBatches ?? 0,
          filterType: ft,
          stages: (chartData.stageProcessed ?? []).map((item: any) => {
            const key = toStageKey(item.stage);
            const stageCfg = stageConfig.find((sc: any) => sc.key === key);
            return {
              stage: item.stage,
              batchCount: item.batchCount,
              percentage: item.percentage ?? 0,
              color: stageColors[key] ?? fallbackStageColor,
              iconKey: stageCfg?.iconKey ?? "Inventory2",
            };
          }),
        },
        stageMetrics: (chartData.stageProcessed ?? []).map((item: any) => ({
          stage: item.stage,
          completed: item.batchCount,
          color: stageColors[toStageKey(item.stage)] ?? fallbackStageColor,
          pct: item.percentage ?? 0,
        })),
        activeBatches: [],
        blockEvents: blockchainEvents.map((event: any) => ({
          motorId: event.batchId || event.transactionId,
          label: event.eventStatusMessage,
          time: event.timestamp,
          color: event.color,
          icon: event.icon,
        })),
        chartData: {
          areaData: chartData.lineChartData,
          barData: chartData.barChartData,
        },
        chartUpdatedAt,
        stageConfig,
      });

      hasLoadedOnceRef.current = true;
      setLoading(false);
      setStatsLoading(false);
    },
    [stageConfig, stageColors, kpiVariants],
  );

  const loadAlerts = useCallback(async () => {
    const systemManagerId = resolveSystemManagerId();
    const { startDate, endDate } = getSMDateRange(filterType, appliedCustomStart, appliedCustomEnd);
    if (!startDate || !endDate) return;

    setAlertsLoading(true);
    const alertsResult = await systemManagerController.getAlerts({
      systemManagerId,
      page: 1,
      limit: 5,
      dateRange: { from: startDate, to: endDate },
    });
    setAlerts(
      alertsResult.success
        ? alertsResult.alerts.map((alert: any) => ({
            type: alert.type,
            msg: alert.msg,
            time: alert.time,
            batchId: alert.batchId,
            motorId: alert.motorId,
            stage: alert.stage,
          }))
        : [],
    );
    setAlertsLoading(false);
  }, [filterType, appliedCustomStart, appliedCustomEnd]);

  const setFilterType = useCallback((next: string) => {
    setFilterTypeState(next);
    if (next !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
      setAppliedCustomStart("");
      setAppliedCustomEnd("");
    }
  }, []);

  const applyCustomDateFilter = useCallback(() => {
    if (customStartDate.length !== 10 || customEndDate.length !== 10) return;
    setAppliedCustomStart(customStartDate);
    setAppliedCustomEnd(customEndDate);
    setCustomApplyToken((token) => token + 1);
  }, [customStartDate, customEndDate]);

  const clearDateFilter = useCallback(() => {
    setFilterTypeState(DEFAULT_DATE_FILTER_TYPE);
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedCustomStart("");
    setAppliedCustomEnd("");
  }, []);

  useEffect(() => {
    if (filterType === "custom") {
      if (appliedCustomStart.length !== 10 || appliedCustomEnd.length !== 10) return;
      void loadDashboard(filterType, appliedCustomStart, appliedCustomEnd);
      return;
    }
    void loadDashboard(filterType, "", "");
  }, [loadDashboard, filterType, appliedCustomStart, appliedCustomEnd, customApplyToken]);

  return {
    dashboard,
    alerts,
    alertsLoading,
    loading,
    statsLoading,
    filterType,
    setFilterType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    applyCustomDateFilter,
    clearDateFilter,
    dateBounds,
    loadAlerts,
    loadDashboard,
  };
};

export default useCHDashboard;
