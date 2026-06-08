import { useState, useCallback, useEffect, useMemo } from "react";
import { STRINGS } from "../../../app/config/strings";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { operationsController } from "../../../controllers/user/operationsController";
import {
  toMaterialCodeNameOptions,
  type MaterialsListItem,
} from "../../../data/models/user/MaterialsListModel";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import { OPERATION_STATUS } from "../../operationStatus";
import {
  mapLotListApiRow,
  rawMaterialLotMatchesSearch,
  type RawMaterialLotListRow,
  RawMaterialLotListRequest,
  RAW_MATERIAL_UI_STATUS_TO_API,
} from "../../../data/models/user/RawMaterialProcurementModel";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
/** Fetch up to this many rows when filtering search client-side across all columns */
const CLIENT_SEARCH_FETCH_LIMIT = 5000;

const buildStatusCountsFromLots = (lots: RawMaterialLotListRow[], totalRecords: number) => {
  const S = OPERATION_STATUS;
  const counts: Record<string, number> = {
    [S.INITIATED]: 0,
    [S.IN_PROGRESS]: 0,
    [S.WAITING_FOR_APPROVAL]: 0,
    [S.APPROVED]: 0,
    [S.REJECTED]: 0,
  };
  lots.forEach((lot) => {
    const status = lot.rmStatus;
    if (status in counts) counts[status] += 1;
  });
  return {
    ...counts,
    [FILTER_ALL]: totalRecords,
  };
};

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
    [S.INITIATED]: pick("initiated", "Initiated", "INITIATED"),
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

  const subDepartmentId = user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId;

  const [batches, setBatches] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
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
      return;
    }
    setLoading(true);
    try {
      const isClientSearch = Boolean(debouncedSearch.trim());
      const payload: RawMaterialLotListRequest = {
        subDepartmentId,
        page: isClientSearch ? 1 : page + 1,
        limit: isClientSearch ? CLIENT_SEARCH_FETCH_LIMIT : rowsPerPage,
      };

      if (statusFilter !== FILTER_ALL) {
        payload.status = [RAW_MATERIAL_UI_STATUS_TO_API[statusFilter] ?? statusFilter];
      }

      if (advancedFilters.materialCodes.length) {
        payload.materialCode = advancedFilters.materialCodes;
      }
      if (advancedFilters.manufacturer.trim()) {
        payload.manufacturerName = advancedFilters.manufacturer.trim();
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

        if (isClientSearch) {
          const matched = lots.filter((lot) => rawMaterialLotMatchesSearch(lot, debouncedSearch));
          const paged = matched.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
          setBatches(paged);
          setTotalRecords(matched.length);
          setStatusCounts(buildStatusCountsFromLots(matched, matched.length));
        } else {
          setBatches(lots);
          setStatusCounts(mapLotListStatusCountsForUi(data.statusCounts, data.pagination?.totalRecords ?? 0));
          setTotalRecords(data.pagination?.totalRecords ?? 0);
        }
      } else {
        setBatches([]);
        setTotalRecords(0);
        setStatusCounts({});
      }
    } catch (error) {
      console.error("Error fetching raw material lots:", error);
    } finally {
      setLoading(false);
    }
  }, [
    subDepartmentId,
    page,
    rowsPerPage,
    debouncedSearch,
    statusFilter,
    advancedFilters,
    refreshVersion,
  ]);

  useEffect(() => {
    void fetchLots();
  }, [fetchLots]);

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
    refreshUserBatches: fetchLots,
    materialOptions,
    materialsLoading,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
  };
};

export default useRawMaterialLotList;
