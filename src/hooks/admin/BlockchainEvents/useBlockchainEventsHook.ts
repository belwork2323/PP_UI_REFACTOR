import { useState, useEffect, useCallback } from "react";
import { blockchainEventContrller } from "@/controllers/admin/BlockchainEvents/BlockchainEventController";

export type BlockchainTab = "IN_PROGRESS" | "COMPLETED";

export const blockchainTabOptions = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const getNestedValue = (row: Record<string, unknown>, path: string): unknown =>
  path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object") {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, row);

const BLOCKCHAIN_EVENT_SEARCH_FIELDS = [
  "batchId",
  "id",
  "batchType",
  "type",
  "projectName",
  "systemManager.fullName",
  "systemManager.id",
  "systemManagerName",
  "systemManagerId",
  "createdOn",
  "createdAt",
  "date",
] as const;

const DEFAULT_PANEL_FILTERS = {
  subDepartment: "All",
  dateFrom: "",
  dateTo: "",
  currentMonthOnly: false,
};

export const matchesBlockchainEventSearch = (batch: Record<string, unknown>, query: string) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return BLOCKCHAIN_EVENT_SEARCH_FIELDS.some((field) => {
    const value = getNestedValue(batch, field);
    if (String(value ?? "").toLowerCase().includes(needle)) return true;

    // Created Date is rendered with the browser's locale format in the table.
    if (["createdOn", "createdAt", "date"].includes(field) && value) {
      const date = new Date(String(value));
      return !Number.isNaN(date.getTime()) && date.toLocaleDateString().toLowerCase().includes(needle);
    }

    return false;
  });
};

export function useBlockchainEventsHook(globalDateBounds: { startDate: string; endDate: string }) {
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
    setDraftFilters({ ...DEFAULT_PANEL_FILTERS });
    setAppliedFilters({ ...DEFAULT_PANEL_FILTERS });
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

  const handleSearchQueryChange = useCallback((query: string) => {
    setEventsSearchQuery(query);
    setPage(0);
  }, []);

  // 1. Fetch Main Batch List API
  const fetchBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const searchQuery = eventsSearchQuery.trim();
      const isClientSearch = Boolean(searchQuery);
      const payload = {
        // The endpoint's search is batch-ID oriented. Search the returned batch
        // fields locally so type, project, manager, and date queries work too.
        search: undefined,
        status: blockchainActiveTab,
        subDepartment:
          appliedFilters.subDepartment !== "All" ? appliedFilters.subDepartment : undefined,
        startDate: appliedFilters.dateFrom || globalDateBounds.startDate,
        endDate: appliedFilters.dateTo || globalDateBounds.endDate,
        currentMonth: appliedFilters.currentMonthOnly,
        page: isClientSearch ? 1 : page + 1,
        pageSize: isClientSearch ? 5000 : rowsPerPage,
      };

      const response = await blockchainEventContrller.getBlockchainEvents(payload);
      const fetchedBatches: any[] = response?.data?.batches ?? response?.data ?? [];
      const apiPagination = response?.data?.pagination ?? null;

      if (isClientSearch) {
        const matchingBatches = fetchedBatches.filter((batch) =>
          matchesBlockchainEventSearch(batch, searchQuery),
        );
        const totalRecords = matchingBatches.length;
        setBatchesList(matchingBatches.slice(page * rowsPerPage, (page + 1) * rowsPerPage));
        setPagination({
          page: page + 1,
          pageSize: rowsPerPage,
          totalRecords,
          totalPages: Math.ceil(totalRecords / rowsPerPage),
        });
      } else {
        setBatchesList(fetchedBatches);
        setPagination(apiPagination);
      }
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
    setEventsSearchQuery: handleSearchQueryChange,
    eventsDraftFilters: draftFilters,
    setEventsDraftFilter: setDraftFilter,
    applyEventsFilters,
    eventsActiveFilterCount,
    clearEventsFilters,
    blockchainTabOptions,
  };
}
