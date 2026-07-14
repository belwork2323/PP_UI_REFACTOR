import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { dashboardController } from "@controllers/admin/Dashboard/dashboardController";
import { generalController } from "@controllers/admin/common/generalController";
import { getDashboardFilterBounds, formatDateToApiDate } from "@utils/dateUtils";
import {
  enrichDashboardKpis,
  buildActiveBatchesFilterPayload,
} from "@data/models/admin/Dashboard/DashboardModel";
import { ToggleTabOption } from "@/ui/components/common/ToggleTabs";
export type BatchTab = "IN_PROGRESS" | "COMPLETED";

export const batchTabOptions: ToggleTabOption[] = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];
function useDashboardGlobalFilterSection(mode: string) {
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [chartUpdatedAt, setChartUpdatedAt] = useState<Date | null>(null);

  const [filterType, setFilterTypeState] = useState("month");
  /** Draft custom dates (pickers) — applied only on Apply Filter */
  const [customStartDate, setCustomStartDateState] = useState("");
  const [customEndDate, setCustomEndDateState] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  const [customApplyToken, setCustomApplyToken] = useState(0);
  const lastValidBoundsRef = useRef({
    filterType: "month",
    ...getDashboardFilterBounds("month"),
  });

  const clearTableFiltersRef = useRef<(() => void) | null>(null);

  const clearFilters = useCallback(() => {
    clearTableFiltersRef.current?.();
  }, []);

  const setFilterType = useCallback(
    (val: string) => {
      setFilterTypeState(val);
      clearFilters();
    },
    [clearFilters],
  );

  const setCustomStartDate = useCallback((val: string) => {
    setCustomStartDateState(val);
  }, []);

  const setCustomEndDate = useCallback((val: string) => {
    setCustomEndDateState(val);
  }, []);

  const applyCustomDateFilter = useCallback(() => {
    if (customStartDate.length !== 10 || customEndDate.length !== 10) return;
    setAppliedCustomStart(customStartDate);
    setAppliedCustomEnd(customEndDate);
    setCustomApplyToken((token) => token + 1);
    clearFilters();
  }, [customStartDate, customEndDate, clearFilters]);

  const globalDateBounds = useMemo(() => {
    if (filterType === "custom") {
      if (appliedCustomStart.length === 10 && appliedCustomEnd.length === 10) {
        const next = {
          filterType: "custom",
          startDate: appliedCustomStart,
          endDate: appliedCustomEnd,
        };
        lastValidBoundsRef.current = next;
        return next;
      }
      return lastValidBoundsRef.current;
    }
    const next = { filterType, ...getDashboardFilterBounds(filterType) };
    lastValidBoundsRef.current = next;
    return next;
  }, [filterType, appliedCustomStart, appliedCustomEnd]);

  const fetchDashboardData = useCallback(async () => {
    if (filterType === "custom" && (appliedCustomStart.length !== 10 || appliedCustomEnd.length !== 10))
      return;
    setStatsLoading(true);
    try {
      const [fetchedStats, fetchedCharts] = await Promise.all([
        dashboardController.getStats(
          filterType,
          globalDateBounds.startDate,
          globalDateBounds.endDate,
          modeRef.current,
        ),
        dashboardController.getChartData(
          filterType,
          globalDateBounds.startDate,
          globalDateBounds.endDate,
        ),
      ]);

      setStats({ kpis: enrichDashboardKpis(fetchedStats?.data?.kpis ?? []) });
      setChartData(
        fetchedCharts?.data?.charts ??
          fetchedCharts?.data ?? {
            weeklyActivity: [],
            motorsProcessed: [],
            qcPassRate: [],
          },
      );
      setChartUpdatedAt(fetchedCharts?.timestamp ? new Date(fetchedCharts.timestamp) : new Date());
    } finally {
      setStatsLoading(false);
      setLoading(false);
    }
  }, [filterType, appliedCustomStart, appliedCustomEnd, globalDateBounds, customApplyToken]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const kpis = stats?.kpis ?? [];
  const weeklyActivity = chartData?.weeklyActivity ?? [];
  const motorsProcessed = chartData?.motorsProcessed ?? [];
  const qcPassRate = chartData?.qcPassRate ?? [];

  return {
    loading,
    statsLoading,
    kpis,
    weeklyActivity,
    motorsProcessed,
    qcPassRate,
    chartUpdatedAt,
    filterType,
    setFilterType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    applyCustomDateFilter,
    globalDateBounds,
    clearFilters,
    registerTableFilterClear: (fn: () => void) => {
      clearTableFiltersRef.current = fn;
    },
  };
}

function useDashboardActiveBatchesSection(globalDateBounds: {
  filterType: string;
  startDate: string;
  endDate: string;
}) {
  const DEFAULT_PANEL_FILTERS = {
    stage: "All",
    batchType: "All",
    status: "All",
    dateFrom: "",
    dateTo: "",
    currentMonthOnly: false,
  };

  const [activeBatchesLoading, setActiveBatchesLoading] = useState(false);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_PANEL_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_PANEL_FILTERS);
  const [activeTab, setActiveTab] = useState<BatchTab>("IN_PROGRESS");
  const setDraftFilter = <K extends keyof typeof DEFAULT_PANEL_FILTERS>(
    field: K,
    value: (typeof DEFAULT_PANEL_FILTERS)[K],
  ) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFilterOpen = () => {
    setFilterOpen((prev) => {
      if (!prev) setDraftFilters({ ...appliedFilters });
      return !prev;
    });
  };

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setFilterOpen(false);
  };

  const clearBatchesFilters = useCallback(() => {
    setSearchQuery("");
    setDraftFilters(DEFAULT_PANEL_FILTERS);
    setAppliedFilters(DEFAULT_PANEL_FILTERS);
  }, []);

  const toggleCurrentMonth = useCallback(() => {
    setDraftFilters((prev) => {
      const next = !prev.currentMonthOnly;
      if (next) {
        const now = new Date();
        return {
          ...prev,
          currentMonthOnly: true,
          dateFrom: formatDateToApiDate(new Date(now.getFullYear(), now.getMonth(), 1)),
          dateTo: formatDateToApiDate(now),
        };
      }
      return { ...prev, currentMonthOnly: false, dateFrom: "", dateTo: "" };
    });
  }, []);

  const fetchBatches = useCallback(async () => {
    if (!globalDateBounds.startDate || !globalDateBounds.endDate) return;

    setActiveBatchesLoading(true);
    try {
      const payload = buildActiveBatchesFilterPayload({
        searchQuery,
        filterStage: appliedFilters.stage,
        filterBatchType: appliedFilters.batchType,
        filterStatus: appliedFilters.status,
        filterType: globalDateBounds.filterType,
        dateFrom: appliedFilters.dateFrom || globalDateBounds.startDate,
        dateTo: appliedFilters.dateTo || globalDateBounds.endDate,
        currentMonthOnly: appliedFilters.currentMonthOnly,
        status: activeTab,
      });
      const batchesResponse = await dashboardController.getActiveBatches(payload);
      setActiveBatches(batchesResponse?.data?.activeBatches ?? []);
      setPagination(batchesResponse?.data?.pagination ?? null);
    } finally {
      setActiveBatchesLoading(false);
    }
  }, [searchQuery, appliedFilters, activeTab, globalDateBounds]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  const activeFilterCount = [
    searchQuery.trim(),
    appliedFilters.stage !== "All",
    appliedFilters.batchType !== "All",
    appliedFilters.status !== "All",
    appliedFilters.dateFrom,
    appliedFilters.dateTo,
    appliedFilters.currentMonthOnly,
  ].filter(Boolean).length;

  return {
    activeBatchesLoading,
    activeBatches,
    filteredBatches: activeBatches,
    pagination,
    filterOpen,
    setFilterOpen,
    toggleFilterOpen,
    searchQuery,
    setSearchQuery,
    draftFilters,
    setDraftFilter,
    applyFilters,
    activeFilterCount,
    clearBatchesFilters,
    toggleCurrentMonth,
    batchStatusTab: activeTab,
    setBatchStatusTab: setActiveTab,
  };
}

function useDashboardEventsSection(globalDateBounds: { startDate: string; endDate: string }) {
  const DEFAULT_PANEL_FILTERS = {
    type: "All",
    department: "All",
    subDepartment: "All",
    dateFrom: "",
    dateTo: "",
    currentMonthOnly: false,
  };

  const [eventsLoading, setEventsLoading] = useState(false);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [eventsPagination, setEventsPagination] = useState<any>(null);
  const [eventsFilterOpen, setEventsFilterOpen] = useState(false);
  const [eventsSearchQuery, setEventsSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_PANEL_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_PANEL_FILTERS);

  const setDraftFilter = <K extends keyof typeof DEFAULT_PANEL_FILTERS>(
    field: K,
    value: (typeof DEFAULT_PANEL_FILTERS)[K],
  ) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEventsFilterOpen = () => {
    setEventsFilterOpen((prev) => {
      if (!prev) setDraftFilters({ ...appliedFilters });
      return !prev;
    });
  };

  const applyEventsFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setEventsFilterOpen(false);
  };

  const clearEventsFilters = useCallback(() => {
    setEventsSearchQuery("");
    setDraftFilters(DEFAULT_PANEL_FILTERS);
    setAppliedFilters(DEFAULT_PANEL_FILTERS);
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const payload = {
        search: eventsSearchQuery.trim() || undefined,
        eventType: appliedFilters.type !== "All" ? appliedFilters.type : undefined,
        department: appliedFilters.department !== "All" ? appliedFilters.department : undefined,
        subDepartment:
          appliedFilters.subDepartment !== "All" ? appliedFilters.subDepartment : undefined,
        startDate: appliedFilters.dateFrom || globalDateBounds.startDate,
        endDate: appliedFilters.dateTo || globalDateBounds.endDate,
        currentMonth: appliedFilters.currentMonthOnly,
        page: 1,
        pageSize: 10,
      };
      const eventsResponse = await dashboardController.getBlockchainEvents(payload);
      setRecentEvents(eventsResponse?.data?.events ?? []);
      setEventsPagination(eventsResponse?.data?.pagination ?? null);
    } finally {
      setEventsLoading(false);
    }
  }, [eventsSearchQuery, appliedFilters, globalDateBounds]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const eventsActiveFilterCount = [
    eventsSearchQuery.trim(),
    appliedFilters.type !== "All",
    appliedFilters.department !== "All",
    appliedFilters.subDepartment !== "All",
    appliedFilters.dateFrom,
    appliedFilters.dateTo,
    appliedFilters.currentMonthOnly,
  ].filter(Boolean).length;

  return {
    eventsLoading,
    recentEvents,
    eventsPagination,
    eventsFilterOpen,
    setEventsFilterOpen,
    toggleEventsFilterOpen,
    eventsSearchQuery,
    setEventsSearchQuery,
    draftFilters,
    setDraftFilter,
    applyEventsFilters,
    eventsActiveFilterCount,
    clearEventsFilters,
  };
}

function useDashboardLookupsSection() {
  const [subDepartments, setSubDepartments] = useState<string[]>([]);

  useEffect(() => {
    generalController.getSubDepartments().then((resp) => {
      if (resp?.data) {
        setSubDepartments(
          (resp.data as any[]).map((sd: any) => sd.subDepartmentName).filter(Boolean),
        );
      }
    });
  }, []);

  return { subDepartments };
}

export default function useDashboardHook(mode: string) {
  const global = useDashboardGlobalFilterSection(mode);
  const batches = useDashboardActiveBatchesSection(global.globalDateBounds);
  const events = useDashboardEventsSection(global.globalDateBounds);
  const lookups = useDashboardLookupsSection();

  global.registerTableFilterClear(() => {
    batches.clearBatchesFilters();
    events.clearEventsFilters();
  });

  return {
    loading: global.loading,
    statsLoading: global.statsLoading,
    activeBatchesLoading: batches.activeBatchesLoading,
    eventsLoading: events.eventsLoading,
    kpis: global.kpis,
    weeklyActivity: global.weeklyActivity,
    motorsProcessed: global.motorsProcessed,
    qcPassRate: global.qcPassRate,
    chartUpdatedAt: global.chartUpdatedAt,
    activeBatches: batches.activeBatches,
    filteredBatches: batches.filteredBatches,
    pagination: batches.pagination,
    recentEvents: events.recentEvents,
    eventsPagination: events.eventsPagination,
    filterType: global.filterType,
    setFilterType: global.setFilterType,
    customStartDate: global.customStartDate,
    setCustomStartDate: global.setCustomStartDate,
    customEndDate: global.customEndDate,
    setCustomEndDate: global.setCustomEndDate,
    applyCustomDateFilter: global.applyCustomDateFilter,
    filterOpen: batches.filterOpen,
    setFilterOpen: batches.setFilterOpen,
    toggleFilterOpen: batches.toggleFilterOpen,
    searchQuery: batches.searchQuery,
    setSearchQuery: batches.setSearchQuery,
    batchDraftFilters: batches.draftFilters,
    setBatchDraftFilter: batches.setDraftFilter,
    applyBatchFilters: batches.applyFilters,
    activeFilterCount: batches.activeFilterCount,
    eventsFilterOpen: events.eventsFilterOpen,
    setEventsFilterOpen: events.setEventsFilterOpen,
    toggleEventsFilterOpen: events.toggleEventsFilterOpen,
    eventsSearchQuery: events.eventsSearchQuery,
    setEventsSearchQuery: events.setEventsSearchQuery,
    eventsDraftFilters: events.draftFilters,
    setEventsDraftFilter: events.setDraftFilter,
    applyEventsFilters: events.applyEventsFilters,
    eventsActiveFilterCount: events.eventsActiveFilterCount,
    clearFilters: global.clearFilters,
    clearEventsFilters: events.clearEventsFilters,
    clearBatchesFilters: batches.clearBatchesFilters,
    subDepartments: lookups.subDepartments,
    toggleCurrentMonth: batches.toggleCurrentMonth,
    batchStatusTab: batches.batchStatusTab,
    setBatchStatusTab: batches.setBatchStatusTab,
    batchTabOptions: batchTabOptions,
  };
}
