import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { STRINGS } from "../../app/config/strings";
import { operationsController } from "../../controllers/user/operationsController";
import { useAuthStore } from "../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../app/store/userBatchRefreshStore";
import { useCuringMotorStages } from "./manufacturing/useCuringMotorStages";
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
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const suppressVersionFetchRef = useRef(false);

  const selectedSubDepartment = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === targetSlug) ?? null,
    [targetSlug, user?.allSubDepartments],
  );

  const [batches, setBatches] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const hasLoadedOnceRef = useRef(false);
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
        batchId: next.batchId,
        batchTypes: [...next.batchTypes],
        motorStages: [...next.motorStages],
        motorIds: [...next.motorIds],
        priorities: [...next.priorities],
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
    if (advancedFilters.batchId.trim()) count += 1;
    if (advancedFilters.batchTypes.length) count += 1;
    if (advancedFilters.motorStages.length) count += 1;
    if (advancedFilters.motorIds.length) count += 1;
    if (advancedFilters.priorities.length) count += 1;
    if (statusFilter !== FILTER_ALL) count += 1;
    return count;
  }, [advancedFilters, statusFilter]);

  const { stages: motorStages, loading: motorStagesLoading } = useCuringMotorStages();
  const motorStageOptions = useMemo(
    () => motorStages.map((stage) => ({ motorStage: String(stage.motorStage) })),
    [motorStages],
  );

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
      setIsRefreshing(false);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
      return;
    }

    const isInitialLoad = !hasLoadedOnceRef.current;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
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
      setIsRefreshing(false);
      hasLoadedOnceRef.current = true;
    }
  }, [
    selectedSubDepartment,
    user?.userId,
    page,
    rowsPerPage,
    debouncedSearch,
    statusFilter,
    advancedFilters,
    targetSlug,
    resolveStatusCounts,
  ]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (suppressVersionFetchRef.current) {
      suppressVersionFetchRef.current = false;
      return;
    }
    if (refreshVersion === 0) return;
    void fetchBatches();
  }, [refreshVersion, fetchBatches]);

  const refreshUserBatches = useCallback(async () => {
    suppressVersionFetchRef.current = true;
    await fetchBatches();
    bumpBatchRefresh();
  }, [fetchBatches, bumpBatchRefresh]);

  return {
    batches,
    statusCounts,
    loading,
    isRefreshing,
    page,
    rowsPerPage,
    search,
    statusFilter,
    totalRecords,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    refreshUserBatches,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
    motorStageOptions,
    motorStagesLoading,
  };
};
