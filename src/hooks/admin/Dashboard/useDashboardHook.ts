import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { dashboardController } from "@controllers/admin/Dashboard/dashboardController";
import { generalController } from "@controllers/admin/common/generalController";
import {
  getDashboardFilterBounds,
  formatDateToApiDate,
  toDashboardApiFilterType,
} from "@utils/dateUtils";
import {
  enrichDashboardKpis,
  buildActiveBatchesFilterPayload,
} from "@data/models/admin/Dashboard/DashboardModel";
import { toOperationStatusApiValue } from "@/hooks/operationStatus";
import { ToggleTabOption } from "@/ui/components/common/ToggleTabs";
import { DEFAULT_DATE_FILTER_TYPE } from "@/ui/components/custom/dashboard/DashboardDateFilter";

export type BatchTab = "IN_PROGRESS" | "COMPLETED";

export const batchTabOptions: ToggleTabOption[] = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

type DashboardDateBounds = {
  filterType: string;
  apiFilter: string;
  startDate: string;
  endDate: string;
};

function useDashboardGlobalFilterSection(mode: string) {
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [chartUpdatedAt, setChartUpdatedAt] = useState<String | Date | null>(null);

  const [filterType, setFilterTypeState] = useState(DEFAULT_DATE_FILTER_TYPE);
  const [customStartDate, setCustomStartDateState] = useState("");
  const [customEndDate, setCustomEndDateState] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  const [customApplyToken, setCustomApplyToken] = useState(0);
  const lastValidBoundsRef = useRef<DashboardDateBounds>({
    filterType: DEFAULT_DATE_FILTER_TYPE,
    apiFilter: "custom",
    ...getDashboardFilterBounds(DEFAULT_DATE_FILTER_TYPE),
  });

  const clearTableFiltersRef = useRef<(() => void) | null>(null);

  const clearFilters = useCallback(() => {
    clearTableFiltersRef.current?.();
  }, []);

  const resolveApiFilterType = useCallback((value: string) => toDashboardApiFilterType(value), []);

  const setFilterType = useCallback(
    (val: string) => {
      setFilterTypeState(val);
      if (val !== "custom") {
        setCustomStartDateState("");
        setCustomEndDateState("");
        setAppliedCustomStart("");
        setAppliedCustomEnd("");
      }
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

  const clearDateFilter = useCallback(() => {
    setFilterTypeState(DEFAULT_DATE_FILTER_TYPE);
    setCustomStartDateState("");
    setCustomEndDateState("");
    setAppliedCustomStart("");
    setAppliedCustomEnd("");
    clearFilters();
  }, [clearFilters]);

  const globalDateBounds = useMemo(() => {
    if (filterType === "custom") {
      if (appliedCustomStart.length === 10 && appliedCustomEnd.length === 10) {
        const next = {
          filterType: "custom",
          apiFilter: "custom",
          startDate: appliedCustomStart,
          endDate: appliedCustomEnd,
        };
        lastValidBoundsRef.current = next;
        return next;
      }
      return lastValidBoundsRef.current;
    }
    const next = {
      filterType,
      apiFilter: resolveApiFilterType(filterType),
      ...getDashboardFilterBounds(filterType),
    };
    lastValidBoundsRef.current = next;
    return next;
  }, [filterType, appliedCustomStart, appliedCustomEnd, resolveApiFilterType]);

  const fetchDashboardData = useCallback(async () => {
    if (
      filterType === "custom" &&
      (appliedCustomStart.length !== 10 || appliedCustomEnd.length !== 10)
    )
      return;
    setStatsLoading(true);
    try {
      const [fetchedStats, fetchedCharts] = await Promise.all([
        dashboardController.getStats(
          globalDateBounds.apiFilter,
          globalDateBounds.startDate,
          globalDateBounds.endDate,
          modeRef.current,
        ),
        dashboardController.getChartData(
          globalDateBounds.apiFilter,
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
      setChartUpdatedAt(fetchedCharts?.timestamp ? fetchedCharts?.timestamp : new Date());
    } finally {
      setStatsLoading(false);
      setLoading(false);
    }
  }, [filterType, appliedCustomStart, appliedCustomEnd, globalDateBounds, customApplyToken]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    statsLoading,
    kpis: stats?.kpis ?? [],
    weeklyActivity: chartData?.weeklyActivity ?? [],
    motorsProcessed: chartData?.motorsProcessed ?? [],
    qcPassRate: chartData?.qcPassRate ?? [],
    chartUpdatedAt,
    filterType,
    setFilterType,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    applyCustomDateFilter,
    clearDateFilter,
    globalDateBounds,
    clearFilters,
    registerTableFilterClear: (fn: () => void) => {
      clearTableFiltersRef.current = fn;
    },
  };
}

function useDashboardActiveBatchesSection(
  globalDateBounds: DashboardDateBounds,
  clientSearchFields = false,
) {
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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    setPage(0);
    setFilterOpen(false);
  };

  const clearBatchesFilters = useCallback(() => {
    setSearchQuery("");
    setDraftFilters(DEFAULT_PANEL_FILTERS);
    setAppliedFilters(DEFAULT_PANEL_FILTERS);
    setPage(0);
  }, []);

  const handleTabChange = (newTab: BatchTab) => {
    setActiveTab(newTab);
    setPage(0);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
      const statusFilter = toOperationStatusApiValue(appliedFilters.status, "All") || "";
      const shouldFilterBatchRows =
        clientSearchFields && (Boolean(searchQuery.trim()) || Boolean(statusFilter));
      const payload = buildActiveBatchesFilterPayload({
        searchQuery,
        filterStage: appliedFilters.stage,
        filterBatchType: appliedFilters.batchType,
        // Stage-level statuses can differ from the batch's current status.
        // Fetch the unfiltered set and match statuses across all stages below.
        filterStatus: shouldFilterBatchRows ? "" : statusFilter,
        filterType: globalDateBounds.apiFilter,
        dateFrom: appliedFilters.dateFrom || globalDateBounds.startDate,
        dateTo: appliedFilters.dateTo || globalDateBounds.endDate,
        currentMonthOnly: appliedFilters.currentMonthOnly,
        status: activeTab,
        // The dashboard API search does not match project/motor names. Load its
        // pages without `search` and match those fields below when requested.
        page: shouldFilterBatchRows ? 1 : page + 1,
        pageSize: shouldFilterBatchRows ? 100 : rowsPerPage,
      });
      if (shouldFilterBatchRows) payload.search = "";
      const batchesResponse = await dashboardController.getActiveBatches(payload);
      let rows = batchesResponse?.data?.activeBatches ?? [];
      let apiPagination = batchesResponse?.data?.pagination ?? null;

      if (shouldFilterBatchRows) {
        const totalPages = Number(apiPagination?.totalPages ?? 1);
        for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
          const nextResponse = await dashboardController.getActiveBatches({ ...payload, page: nextPage });
          rows = rows.concat(nextResponse?.data?.activeBatches ?? []);
        }
        const query = searchQuery.trim().toLocaleLowerCase();
        rows = rows.filter((batch: any) => {
          const matchesSearch =
            !query ||
            [batch.batchId, batch.motorId, batch.motorType, batch.projectName].some((value) =>
              String(value ?? "").toLocaleLowerCase().includes(query),
            );
          const matchesStatus =
            !statusFilter ||
            [batch.status, ...(Array.isArray(batch.stageStatuses) ? batch.stageStatuses : [])].some(
              (value) => toOperationStatusApiValue(String(value ?? "")) === statusFilter,
            );
          return matchesSearch && matchesStatus;
        });
        apiPagination = { ...apiPagination, totalRecords: rows.length, totalPages: 1 };
      }

      setActiveBatches(rows);
      setPagination(apiPagination);
    } finally {
      setActiveBatchesLoading(false);
    }
  }, [searchQuery, appliedFilters, activeTab, globalDateBounds, page, rowsPerPage, clientSearchFields]);

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
    page,
    rowsPerPage,
    onPageChange: handlePageChange,
    onRowsPerPageChange: handleRowsPerPageChange,
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
    setBatchStatusTab: handleTabChange,
  };
}

function useDashboardLookupsSection() {
  const [subDepartments, setSubDepartments] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([generalController.getDepartments(), generalController.getSubDepartments()]).then(
      ([departmentsResp, subDepartmentsResp]) => {
        const departments = Array.isArray(departmentsResp?.data) ? departmentsResp.data : [];
        const subDepartments = Array.isArray(subDepartmentsResp?.data)
          ? subDepartmentsResp.data
          : [];
        const sourcingDepartmentIds = new Set(
          departments
            .filter((department: any) =>
              String(department.departmentName ?? "").trim().toLocaleLowerCase() === "sourcing",
            )
            .map((department: any) => Number(department.departmentId))
            .filter((id: number) => Number.isFinite(id)),
        );

        setSubDepartments(
          subDepartments
            .filter((subDepartment: any) =>
              !sourcingDepartmentIds.has(Number(subDepartment.departmentId)),
            )
            .map((subDepartment: any) => subDepartment.subDepartmentName)
            .filter(Boolean),
        );
      },
    );
  }, []);

  return { subDepartments };
}

export default function useDashboardHook(mode: string, clientSearchFields = false) {
  const global = useDashboardGlobalFilterSection(mode);
  const batches = useDashboardActiveBatchesSection(global.globalDateBounds, clientSearchFields);
  const lookups = useDashboardLookupsSection();

  global.registerTableFilterClear(() => {
    batches.clearBatchesFilters();
  });
  console.log(global);

  return {
    loading: global.loading,
    statsLoading: global.statsLoading,
    activeBatchesLoading: batches.activeBatchesLoading,
    kpis: global.kpis,
    weeklyActivity: global.weeklyActivity,
    motorsProcessed: global.motorsProcessed,
    qcPassRate: global.qcPassRate,
    chartUpdatedAt: global.chartUpdatedAt,

    activeBatches: batches.activeBatches,
    filteredBatches: batches.filteredBatches,
    pagination: batches.pagination,
    batchPage: batches.page,
    batchRowsPerPage: batches.rowsPerPage,
    onBatchPageChange: batches.onPageChange,
    onBatchRowsPerPageChange: batches.onRowsPerPageChange,

    filterType: global.filterType,
    setFilterType: global.setFilterType,
    customStartDate: global.customStartDate,
    setCustomStartDate: global.setCustomStartDate,
    customEndDate: global.customEndDate,
    setCustomEndDate: global.setCustomEndDate,
    applyCustomDateFilter: global.applyCustomDateFilter,
    clearDateFilter: global.clearDateFilter,
    filterOpen: batches.filterOpen,
    setFilterOpen: batches.setFilterOpen,
    toggleFilterOpen: batches.toggleFilterOpen,
    searchQuery: batches.searchQuery,
    setSearchQuery: batches.setSearchQuery,
    batchDraftFilters: batches.draftFilters,
    setBatchDraftFilter: batches.setDraftFilter,
    applyBatchFilters: batches.applyFilters,
    activeFilterCount: batches.activeFilterCount,
    clearFilters: global.clearFilters,
    clearBatchesFilters: batches.clearBatchesFilters,
    subDepartments: lookups.subDepartments,
    toggleCurrentMonth: batches.toggleCurrentMonth,
    batchStatusTab: batches.batchStatusTab,
    setBatchStatusTab: batches.setBatchStatusTab,
    batchTabOptions,
    globalDateBounds: global.globalDateBounds,
  };
}
