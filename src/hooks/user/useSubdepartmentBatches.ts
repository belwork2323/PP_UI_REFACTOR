import { useState, useCallback, useEffect, useMemo } from "react";
import { STRINGS } from "../../app/config/strings";
import { operationsController } from "../../controllers/user/operationsController";
import { useAuthStore } from "../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../app/store/userBatchRefreshStore";
import {
  buildSubdepartmentBatchListPayload,
  emptySubdepartmentBatchAdvancedFilters,
  mapSubdepartmentBatchListRow,
  mapSubdepartmentBatchStatusCounts,
  type SubdepartmentBatchListAdvancedFilters,
} from "../../data/models/user/SubdepartmentBatchModel";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
/** Fetch up to this many rows when filtering search client-side across all columns */
const CLIENT_SEARCH_FETCH_LIMIT = 5000;

export type { SubdepartmentBatchListAdvancedFilters };

export const useSubdepartmentBatches = (targetSlug?: string) => {
  const user = useAuthStore((s) => s.user);
  const refreshVersion = useUserBatchRefreshStore((state) => state.version);

  const selectedSubDepartment = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === targetSlug) ?? null,
    [targetSlug, user?.allSubDepartments],
  );

  const [batches, setBatches] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilterState] = useState<string>(FILTER_ALL);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [advancedFilters, setAdvancedFilters] = useState<SubdepartmentBatchListAdvancedFilters>(
    emptySubdepartmentBatchAdvancedFilters(),
  );

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
    setPage(0);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const applyAdvancedFilters = useCallback(
    (next: SubdepartmentBatchListAdvancedFilters & { status: string }) => {
      setAdvancedFilters({
        priority: next.priority,
        motorIds: [...next.motorIds],
        lotIds: [...next.lotIds],
      });
      setStatusFilterState(next.status);
      setPage(0);
    },
    [],
  );

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(emptySubdepartmentBatchAdvancedFilters());
    setStatusFilterState(FILTER_ALL);
    setPage(0);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.priority) count += 1;
    if (advancedFilters.motorIds.length) count += 1;
    if (advancedFilters.lotIds.length) count += 1;
    if (statusFilter !== FILTER_ALL) count += 1;
    return count;
  }, [advancedFilters, statusFilter]);

  const fetchGlobalStatusCounts = useCallback(
    async (subDepartmentId: number, userId: string) => {
      const countPayload = buildSubdepartmentBatchListPayload({
        subDepartmentId,
        userId,
        page: 1,
        limit: CLIENT_SEARCH_FETCH_LIMIT,
        advancedFilters,
      });
      const countRes = await operationsController.fetchSubdepartmentBatches(countPayload);

      if (!countRes?.success || !countRes.data) {
        return null;
      }

      const allRows = (countRes.data.batches || []).map((batch: Record<string, unknown>) =>
        mapSubdepartmentBatchListRow(batch, targetSlug),
      );
      const countPagination = countRes.data.pagination ?? {};
      const allTotal = Number(
        countPagination.totalRecords ?? countPagination.total ?? allRows.length,
      );

      return mapSubdepartmentBatchStatusCounts(countRes.data.statusCounts, allTotal, allRows);
    },
    [advancedFilters, targetSlug],
  );

  const resolveStatusCounts = useCallback(
    async (
      rows: Record<string, unknown>[],
      serverCounts: Record<string, number> | undefined,
      total: number,
      subDepartmentId: number,
      userId: string,
    ) => {
      const mapped = mapSubdepartmentBatchStatusCounts(serverCounts, total, rows);

      // Status-tab counts must reflect the full list, not the active status slice.
      if (statusFilter !== FILTER_ALL) {
        const globalCounts = await fetchGlobalStatusCounts(subDepartmentId, userId);
        return globalCounts ?? mapped;
      }

      const hasNonZeroStatusCounts = Object.entries(mapped).some(
        ([key, value]) => key !== FILTER_ALL && value > 0,
      );

      if (hasNonZeroStatusCounts) {
        return mapped;
      }

      const globalCounts = await fetchGlobalStatusCounts(subDepartmentId, userId);
      return globalCounts ?? mapped;
    },
    [fetchGlobalStatusCounts, statusFilter],
  );

  const fetchBatches = useCallback(async () => {
    const subDepartmentId = selectedSubDepartment?.subDepartmentId;
    const userId = user?.userId != null ? String(user.userId) : "";

    if (!subDepartmentId || !userId) {
      setLoading(false);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
      return;
    }

    setLoading(true);
    try {
      const payload = buildSubdepartmentBatchListPayload({
        subDepartmentId,
        userId,
        page: page + 1,
        limit: rowsPerPage,
        statusFilter,
        search: debouncedSearch,
        advancedFilters,
      });

      const res = await operationsController.fetchSubdepartmentBatches(payload);

      if (res?.success && res.data) {
        const rows = (res.data.batches || []).map((batch: Record<string, unknown>) =>
          mapSubdepartmentBatchListRow(batch, targetSlug),
        );
        const pagination = res.data.pagination ?? {};
        const total = Number(
          pagination.totalRecords ?? pagination.total ?? rows.length,
        );

        setBatches(rows);
        setTotalRecords(total);
        setStatusCounts(
          await resolveStatusCounts(rows, res.data.statusCounts, total, subDepartmentId, userId),
        );
      } else {
        setBatches([]);
        setTotalRecords(0);
        setStatusCounts({});
      }
    } catch (error) {
      console.error("Error fetching subdepartment batches:", error);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
    } finally {
      setLoading(false);
    }
  }, [
    selectedSubDepartment,
    user?.userId,
    page,
    rowsPerPage,
    debouncedSearch,
    statusFilter,
    advancedFilters,
    refreshVersion,
    targetSlug,
    resolveStatusCounts,
  ]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    statusCounts,
    loading,
    page,
    rowsPerPage,
    search,
    statusFilter,
    totalRecords,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    refreshUserBatches: fetchBatches,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
  };
};
