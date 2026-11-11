import { useState, useEffect, useCallback } from "react";
import { dashboardController } from "@controllers/admin/Dashboard/dashboardController";
import { blockchainEventContrller } from "@/controllers/admin/BlockchainEvents/BlockchainEventController";

export type BlockchainTab = "IN_PROGRESS" | "COMPLETED";

export const blockchainTabOptions = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

export function useBlockchainEventsHook(globalDateBounds: { startDate: string; endDate: string }) {
  const DEFAULT_PANEL_FILTERS = {
    subDepartment: "All",
    dateFrom: "",
    dateTo: "",
    currentMonthOnly: false,
  };

  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);

  // Pagination & Tab State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [blockchainActiveTab, setBlockchainActiveTab] = useState<BlockchainTab>("IN_PROGRESS");

  const [eventsFilterOpen, setEventsFilterOpen] = useState(false);
  const [eventsSearchQuery, setEventsSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_PANEL_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_PANEL_FILTERS);

  // Cache for expanded batch child events: batchId -> { loading, events, error }
  const [batchEventsCache, setBatchEventsCache] = useState<
    Record<string, { loading: boolean; events: any[]; error?: string }>
  >({});

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
    setPage(0);
    setEventsFilterOpen(false);
  };

  const clearEventsFilters = useCallback(() => {
    setEventsSearchQuery("");
    setDraftFilters(DEFAULT_PANEL_FILTERS);
    setAppliedFilters(DEFAULT_PANEL_FILTERS);
    setPage(0);
  }, []);

  const handleTabChange = (newTab: BlockchainTab) => {
    setBlockchainActiveTab(newTab);
    setPage(0);
    setBatchEventsCache({});
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 1. Fetch Main Batch List API
  const fetchBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const payload = {
        search: eventsSearchQuery.trim() || undefined,
        status: blockchainActiveTab,
        subDepartment:
          appliedFilters.subDepartment !== "All" ? appliedFilters.subDepartment : undefined,
        startDate: appliedFilters.dateFrom || globalDateBounds.startDate,
        endDate: appliedFilters.dateTo || globalDateBounds.endDate,
        currentMonth: appliedFilters.currentMonthOnly,
        page: page + 1,
        pageSize: rowsPerPage,
      };
      console.log("getting called ");

      const response = await blockchainEventContrller.getBlockchainEvents(payload);
      setBatchesList(response?.data?.batches ?? response?.data ?? []);
      setPagination(response?.data?.pagination ?? null);
    } finally {
      setBatchesLoading(false);
    }
  }, [eventsSearchQuery, appliedFilters, blockchainActiveTab, globalDateBounds, page, rowsPerPage]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  // 2. Fetch Events for a Specific Batch (Accordion Expand API)
  const fetchEventsForBatch = useCallback(
    async (batchId: string) => {
      if (!batchId || batchEventsCache[batchId]?.events) return;

      setBatchEventsCache((prev) => ({
        ...prev,
        [batchId]: { loading: true, events: [] },
      }));

      try {
        const response = await blockchainEventContrller.getBlockchainEventsByBatchId(batchId);
        const events = response?.data?.events ?? response?.data ?? [];
        setBatchEventsCache((prev) => ({
          ...prev,
          [batchId]: { loading: false, events },
        }));
      } catch (err: any) {
        setBatchEventsCache((prev) => ({
          ...prev,
          [batchId]: {
            loading: false,
            events: [],
            error: err?.message || "Failed to load batch events",
          },
        }));
      }
    },
    [batchEventsCache],
  );

  const eventsActiveFilterCount = [
    eventsSearchQuery.trim(),
    appliedFilters.subDepartment !== "All",
    appliedFilters.dateFrom,
    appliedFilters.dateTo,
    appliedFilters.currentMonthOnly,
  ].filter(Boolean).length;

  return {
    batchesLoading,
    batchesList,
    pagination,
    batchEventsCache,
    fetchEventsForBatch,
    blockchainActiveTab,
    setBlockchainActiveTab: handleTabChange,
    blockchainPage: page,
    blockchainRowsPerPage: rowsPerPage,
    onBlockchainPageChange: handlePageChange,
    onBlockchainRowsPerPageChange: handleRowsPerPageChange,
    eventsFilterOpen,
    setEventsFilterOpen,
    toggleEventsFilterOpen,
    eventsSearchQuery,
    setEventsSearchQuery,
    eventsDraftFilters: draftFilters,
    setEventsDraftFilter: setDraftFilter,
    applyEventsFilters,
    eventsActiveFilterCount,
    clearEventsFilters,
    blockchainTabOptions,
  };
}
