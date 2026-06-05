import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getDashboardStats, getDashboardChartData, getDashboardActiveBatches, getDashboardBlockchainEvents } from '../../controllers/admin/dashboard/dashboardController';
import { generalController } from '../../controllers/admin/common/generalController';

const toApiDateStr = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

const getCurrentMonthBounds = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
};

const formatDateForApi = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

const getDateBounds = (filterType: string) => {
  const now = new Date();
  let startDate: string, endDate: string;

  endDate = now.toISOString().split('T')[0];

  switch (filterType) {
    case 'day':
      startDate = endDate;
      break;
    case 'week':
      startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      break;
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
};

const buildActiveBatchesPayload = ({
  searchQuery,
  filterStage,
  filterBatchType,
  filterStatus,
  dateFrom,
  dateTo,
  currentMonthOnly,
}: {
  searchQuery: string;
  filterStage: string;
  filterBatchType: string;
  filterStatus: string;
  dateFrom: string;
  dateTo: string;
  currentMonthOnly: boolean;
}) => ({
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

export const useDashboard = (mode: string) => {
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [chartUpdatedAt, setChartUpdatedAt] = useState<Date | null>(null);

  const [activeBatchesLoading, setActiveBatchesLoading] = useState(false);
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);

  const [eventsLoading, setEventsLoading] = useState(false);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [eventsPagination, setEventsPagination] = useState<any>(null);

  // Table Filters (Active Batches)
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("All");
  const [filterBatchType, setFilterBatchType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentMonthOnly, setCurrentMonthOnly] = useState(false);

  const clearBatchesFilters = useCallback(() => {
    setSearchQuery("");
    setFilterStage("All");
    setFilterBatchType("All");
    setFilterStatus("All");
    setDateFrom("");
    setDateTo("");
    setCurrentMonthOnly(false);
  }, []);
  const [eventsFilterOpen, setEventsFilterOpen] = useState(false);
  const [eventsSearchQuery, setEventsSearchQuery] = useState("");
  const [eventsType, setEventsType] = useState("All");
  const [eventsDepartment, setEventsDepartment] = useState("All");
  const [eventsSubDepartment, setEventsSubDepartment] = useState("All");
  const [eventsDateFrom, setEventsDateFrom] = useState("");
  const [eventsDateTo, setEventsDateTo] = useState("");
  const [eventsCurrentMonthOnly, setEventsCurrentMonthOnly] = useState(false);

  const clearEventsFilters = useCallback(() => {
    setEventsSearchQuery("");
    setEventsType("All");
    setEventsDepartment("All");
    setEventsSubDepartment("All");
    setEventsDateFrom("");
    setEventsDateTo("");
    setEventsCurrentMonthOnly(false);
  }, []);

  const clearFilters = useCallback(() => {
    // Batches
    setSearchQuery("");
    setFilterStage("All");
    setFilterBatchType("All");
    setFilterStatus("All");
    setDateFrom("");
    setDateTo("");
    setCurrentMonthOnly(false);
    clearEventsFilters();
  }, [clearEventsFilters]);
  const [subDepartments, setSubDepartments] = useState<string[]>([]);

  const toggleCurrentMonth = useCallback(() => {
    setCurrentMonthOnly(prev => {
      const next = !prev;
      if (next) {
        const now = new Date();
        setDateFrom(toApiDateStr(new Date(now.getFullYear(), now.getMonth(), 1)));
        setDateTo(toApiDateStr(now));
      } else {
        setDateFrom('');
        setDateTo('');
      }
      return next;
    });
  }, []);
  const [_filterType, _setFilterType] = useState('week');
  const [_customStartDate, _setCustomStartDate] = useState('');
  const [_customEndDate, _setCustomEndDate] = useState('');

  const setFilterType = useCallback((val: string) => {
    _setFilterType(val);
    clearFilters();
  }, [clearFilters]);

  const setCustomStartDate = useCallback((val: string) => {
    _setCustomStartDate(val);
    clearFilters();
  }, [clearFilters]);

  const setCustomEndDate = useCallback((val: string) => {
    _setCustomEndDate(val);
    clearFilters();
  }, [clearFilters]);

  const globalDateBounds = useMemo(() => {
    if (_filterType === 'custom') {
      // dates are DD-MM-YYYY from DashboardDateFilter — pass directly
      return { startDate: _customStartDate, endDate: _customEndDate };
    }
    const bounds = getDateBounds(_filterType);
    return {
      startDate: formatDateForApi(bounds.startDate),
      endDate:   formatDateForApi(bounds.endDate),
    };
  }, [_filterType, _customStartDate, _customEndDate]);

  const fetchDashboardData = useCallback(async () => {
    if (_filterType === 'custom' && (_customStartDate.length !== 10 || _customEndDate.length !== 10)) return;
    setStatsLoading(true);
    try {
      const [fetchedStats, fetchedCharts] = await Promise.all([
        getDashboardStats(_filterType, globalDateBounds.startDate, globalDateBounds.endDate, modeRef.current),
        getDashboardChartData(_filterType, globalDateBounds.startDate, globalDateBounds.endDate)
      ]);

      setStats(fetchedStats?.data ?? { kpis: [] });
      setChartData(fetchedCharts?.data?.charts ?? fetchedCharts?.data ?? {
        weeklyActivity: [],
        motorsProcessed: [],
        qcPassRate: [],
      });
      setChartUpdatedAt(fetchedCharts?.timestamp ? new Date(fetchedCharts.timestamp) : new Date());
    } finally {
      setStatsLoading(false);
      setLoading(false);
    }
  }, [_filterType, _customStartDate, _customEndDate, globalDateBounds]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchBatches = useCallback(async () => {
    setActiveBatchesLoading(true);
    try {
      const payload = buildActiveBatchesPayload({
        searchQuery,
        filterStage,
        filterBatchType,
        filterStatus,
        dateFrom,
        dateTo,
        currentMonthOnly,
      });
      const batchesResponse = await getDashboardActiveBatches(payload);
      setActiveBatches(batchesResponse?.data?.activeBatches ?? []);
      setPagination(batchesResponse?.data?.pagination ?? null);
    } finally {
      setActiveBatchesLoading(false);
    }
  }, [searchQuery, filterStage, filterBatchType, filterStatus, dateFrom, dateTo, currentMonthOnly]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const payload = {
        search: eventsSearchQuery.trim() || undefined,
        eventType: eventsType !== "All" ? eventsType : undefined,
        department: eventsDepartment !== "All" ? eventsDepartment : undefined,
        subDepartment: eventsSubDepartment !== "All" ? eventsSubDepartment : undefined,
        startDate: eventsDateFrom || globalDateBounds.startDate,
        endDate: eventsDateTo || globalDateBounds.endDate,
        currentMonth: eventsCurrentMonthOnly,
        page: 1,
        pageSize: 10
      };
      const eventsResponse = await getDashboardBlockchainEvents(payload);
      setRecentEvents(eventsResponse?.data?.events ?? []);
      setEventsPagination(eventsResponse?.data?.pagination ?? null);
    } finally {
      setEventsLoading(false);
    }
  }, [eventsSearchQuery, eventsType, eventsDepartment, eventsSubDepartment, eventsDateFrom, eventsDateTo, eventsCurrentMonthOnly, globalDateBounds]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    generalController.getSubDepartments().then((resp) => {
      if (resp?.data) {
        setSubDepartments(
          (resp.data as any[]).map((sd: any) => sd.subDepartmentName).filter(Boolean)
        );
      }
    });
  }, []);

  const kpis = stats?.kpis ?? [];
  const weeklyActivity = chartData?.weeklyActivity ?? [];
  const motorsProcessed = chartData?.motorsProcessed ?? [];
  const qcPassRate = chartData?.qcPassRate ?? [];

  const activeFilterCount = [
    searchQuery.trim(), filterStage !== "All", filterBatchType !== "All",
    filterStatus !== "All", dateFrom, dateTo, currentMonthOnly,
  ].filter(Boolean).length;

  const eventsActiveFilterCount = [
    eventsSearchQuery.trim(), eventsType !== "All", eventsDepartment !== "All",
    eventsSubDepartment !== "All", eventsDateFrom, eventsDateTo, eventsCurrentMonthOnly,
  ].filter(Boolean).length;

  return {
    loading,
    statsLoading,
    activeBatchesLoading,
    eventsLoading,
    kpis,
    weeklyActivity,
    motorsProcessed,
    qcPassRate,
    chartUpdatedAt,
    
    activeBatches,
    filteredBatches: activeBatches,
    pagination,

    recentEvents,
    eventsPagination,

    filterType: _filterType,
    setFilterType,
    customStartDate: _customStartDate,
    setCustomStartDate,
    customEndDate: _customEndDate,
    setCustomEndDate,

    filterOpen, setFilterOpen,
    searchQuery, setSearchQuery,
    filterStage, setFilterStage,
    filterBatchType, setFilterBatchType,
    filterStatus, setFilterStatus,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    currentMonthOnly, setCurrentMonthOnly,
    activeFilterCount,

    eventsFilterOpen, setEventsFilterOpen,
    eventsSearchQuery, setEventsSearchQuery,
    eventsType, setEventsType,
    eventsDepartment, setEventsDepartment,
    eventsSubDepartment, setEventsSubDepartment,
    eventsDateFrom, setEventsDateFrom,
    eventsDateTo, setEventsDateTo,
    eventsCurrentMonthOnly, setEventsCurrentMonthOnly,
    eventsActiveFilterCount,

    clearFilters,
    clearEventsFilters,
    clearBatchesFilters,
    subDepartments,
    toggleCurrentMonth,
  };
};

export default useDashboard;
