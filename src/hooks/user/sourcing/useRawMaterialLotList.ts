import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { operationsController } from "../../../controllers/user/operationsController";
import {
  toMaterialCodeNameOptions,
  type MaterialsListItem,
} from "../../../data/models/user/MaterialsListModel";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import { OPERATION_STATUS, toOperationStatusApiValue } from "../../operationStatus";
import {
  mapLotListApiRow,
  type RawMaterialLotListRow,
  RawMaterialLotListRequest,
} from "../../../data/models/user/RawMaterialProcurementModel";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

export type SubdeptMaterialOption = {
  materialCode: string;
  materialName: string;
};

export type RawMaterialLotListAdvancedFilters = {
  materialCodes: string[];
  manufacturer: string;
  fromDate: string;
  toDate: string;
};

const emptyAdvanced: RawMaterialLotListAdvancedFilters = {
  materialCodes: [],
  manufacturer: "",
  fromDate: "",
  toDate: "",
};

const normalizeMaterialsList = (items: MaterialsListItem[]): SubdeptMaterialOption[] =>
  toMaterialCodeNameOptions(items);

const mapLotListStatusCountsForUi = (
  server: Record<string, number> | undefined,
  totalRecords: number
): Record<string, number> => {
  const S = OPERATION_STATUS;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = server?.[k];
      if (typeof v === "number") return v;
    }
    return 0;
  };

  const byLabel: Record<string, number> = {
    [S.TO_BE_INITIATED]: pick(
      "toBeInitiated",
      "TO_BE_INITIATED",
      "To Be Initiated",
      "initiated",
      "Initiated",
      "INITIATED",
    ),
    [S.IN_PROGRESS]: pick("inProgress", "inProgress", "In Progress", "IN_PROGRESS"),
    [S.WAITING_FOR_APPROVAL]: pick("waitingForApproval", "waitingforApproval", "Waiting for Approval", "WAITING_FOR_APPROVAL"),
    [S.APPROVED]: pick("approved", "Approved", "APPROVED"),
    [S.REJECTED]: pick("rejected", "Rejected", "REJECTED"),
  };

  const sum = Object.values(byLabel).reduce((a, b) => a + b, 0);
  const allKey = STRINGS.USER_BATCH_LIST.FILTER_ALL;
  return {
    ...byLabel,
    [allKey]: sum > 0 ? sum : totalRecords,
  };
};

export const useRawMaterialLotList = () => {
  const user = useAuthStore((s) => s.user);
  const refreshVersion = useUserBatchRefreshStore((state) => state.version);
  const bumpBatchRefresh = useUserBatchRefreshStore((state) => state.bumpVersion);
  const suppressVersionFetchRef = useRef(false);

  const subDepartmentId = user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId;

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
  const [advancedFilters, setAdvancedFilters] = useState<RawMaterialLotListAdvancedFilters>(emptyAdvanced);
  const [materialOptions, setMaterialOptions] = useState<SubdeptMaterialOption[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

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

  useEffect(() => {
    let active = true;
    const loadMaterials = async () => {
      if (!subDepartmentId) {
        setMaterialOptions([]);
        return;
      }
      setMaterialsLoading(true);
      try {
        const res = await operationsController.fetchAllMaterialsList();
        if (!active) return;
        if (res?.success && res.data != null) {
          setMaterialOptions(normalizeMaterialsList(res.data));
        } else {
          setMaterialOptions([]);
        }
      } catch {
        if (active) setMaterialOptions([]);
      } finally {
        if (active) setMaterialsLoading(false);
      }
    };
    void loadMaterials();
    return () => {
      active = false;
    };
  }, [subDepartmentId]);

  const applyAdvancedFilters = useCallback((next: RawMaterialLotListAdvancedFilters & { status: string }) => {
    setAdvancedFilters({
      materialCodes: [...next.materialCodes],
      manufacturer: next.manufacturer,
      fromDate: next.fromDate,
      toDate: next.toDate,
    });
    setStatusFilterState(next.status);
    setPage(0);
  }, []);

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(emptyAdvanced);
    setStatusFilterState(FILTER_ALL);
    setPage(0);
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (advancedFilters.materialCodes.length) n += 1;
    if (advancedFilters.manufacturer.trim()) n += 1;
    if (advancedFilters.fromDate) n += 1;
    if (advancedFilters.toDate) n += 1;
    if (statusFilter !== FILTER_ALL) n += 1;
    return n;
  }, [advancedFilters, statusFilter]);

  const fetchLots = useCallback(async () => {
    if (!subDepartmentId) {
      setLoading(false);
      setIsRefreshing(false);
      return;
    }
    const isInitialLoad = !hasLoadedOnceRef.current;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const payload: RawMaterialLotListRequest = {
        subDepartmentId,
        page: page + 1,
        limit: rowsPerPage,
      };
      if (statusFilter !== FILTER_ALL) {
        const apiStatus = toOperationStatusApiValue(statusFilter, FILTER_ALL);
        if (apiStatus) {
          payload.status = [apiStatus];
        }
      }

      if (advancedFilters.materialCodes.length) {
        payload.materialCode = advancedFilters.materialCodes;
      }
      if (advancedFilters.manufacturer.trim()) {
        payload.manufacturerName = advancedFilters.manufacturer.trim();
      }
      if (debouncedSearch.trim()) {
        payload.search = debouncedSearch.trim();
      }
      let from = advancedFilters.fromDate;
      let to = advancedFilters.toDate;
      if (from && to && from > to) {
        const swap = from;
        from = to;
        to = swap;
      }
      if (from) payload.fromDate = from;
      if (to) payload.toDate = to;

      const res = await rawMaterialProcurementController.fetchLotList(payload);

      if (res?.success && res.data) {
        const data = res.data as {
          lots?: unknown[];
          statusCounts?: Record<string, number>;
          pagination?: { totalRecords?: number };
        };
        const lots = (data.lots ?? []).map((lot, idx) => mapLotListApiRow(lot, idx));

        setBatches(lots);
        setStatusCounts(mapLotListStatusCountsForUi(data.statusCounts, data.pagination?.totalRecords ?? 0));
        setTotalRecords(data.pagination?.totalRecords ?? 0);
      } else {
        setBatches([]);
        setTotalRecords(0);
        setStatusCounts({});
      }
    } catch (error) {
      console.error("Error fetching raw material lots:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      hasLoadedOnceRef.current = true;
    }
  }, [
    subDepartmentId,
    page,
    rowsPerPage,
    debouncedSearch,
    statusFilter,
    advancedFilters,
  ]);

  useEffect(() => {
    void fetchLots();
  }, [fetchLots]);

  useEffect(() => {
    if (suppressVersionFetchRef.current) {
      suppressVersionFetchRef.current = false;
      return;
    }
    if (refreshVersion === 0) return;
    void fetchLots();
  }, [refreshVersion, fetchLots]);

  const refreshUserBatches = useCallback(async () => {
    suppressVersionFetchRef.current = true;
    await fetchLots();
    bumpBatchRefresh();
  }, [fetchLots, bumpBatchRefresh]);

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
    materialOptions,
    materialsLoading,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
  };
};

export default useRawMaterialLotList;
