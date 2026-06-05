import { useState, useCallback, useEffect } from "react";
import { batchManagementController } from "../../../controllers/admin/batch_management/batchManagementController";
import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.BATCH_MANAGEMENT;

export const useBatchList = () => {
  const [batches, setBatches]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterStage, setFilterStage]       = useState("All");
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterDept, setFilterDept]         = useState("All");
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  const loadBatchList = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (search.trim())           filters.search   = search.trim();
      if (filterStatus  !== "All") filters.status   = filterStatus;
      if (filterPriority !== "All") filters.priority = filterPriority;
      if (filterDept    !== "All") filters.department = filterDept;

      const resp = await batchManagementController.getAllBatches(page + 1, rowsPerPage, filters);
      if (resp) {
        setBatches(resp.batches || []);
        setPaginationData({
          totalRecords: resp.pagination?.totalRecords || 0,
          totalPages  : resp.pagination?.totalPages   || 0,
        });
      }
    } catch (err) {
      console.error(S.ERRORS.LOAD_LIST_FAILED, err);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPriority, filterDept, page, rowsPerPage]);

  useEffect(() => { loadBatchList(); }, [loadBatchList]);

  const activeFilters = [filterStage, filterStatus, filterPriority, filterDept]
    .filter(v => v !== "All").length;

  const handleClearFilters = () => {
    setFilterStage("All");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterDept("All");
    setPage(0);
  };

  return {
    batches,
    loading,
    search,
    setSearch: (val: string) => { setSearch(val); setPage(0); },
    filterStage,   setFilterStage,
    filterStatus,  setFilterStatus,
    filterPriority, setFilterPriority,
    filterDept,    setFilterDept,
    page, setPage,
    rowsPerPage, setRowsPerPage,
    filterOpen, setFilterOpen,
    paginationData,
    activeFilters,
    handleClearFilters,
    loadBatchList,
  };
};
