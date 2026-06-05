import { useState, useCallback, useEffect } from "react";
import { projectManagementController } from "../../../controllers/admin/project_management/projectManagementController";

const getErrorMessage = (error: any): string => {
  // Show API error message if available
  if (error?.error?.details) return error.error.details;
  if (error?.message) return error.message;
  // Fallback to generic error
  return "An error occurred on server";
};

export const useProjectList = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Pagination
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("createdOn");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(0); // MUI Table is 0-indexed, Backend is 1-indexed
  const [limit, setLimit] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const [paginationData, setPaginationData] = useState({
    totalRecords: 0,
    totalPages: 0,
  });

  const loadProjectsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        search: search.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        sortOrder,
        page: page + 1, // sending 1-based index to API
        limit,
      };
      
      const resp = await projectManagementController.getAllProjects(payload);
      
      if (resp?.success) {
        setProjects(resp.data?.projects || []);
        setPaginationData({
          totalRecords: resp.data?.pagination?.totalRecords || 0,
          totalPages: resp.data?.pagination?.totalPages || 0,
        });
        setError(null);
      } else {
        const errorMsg = getErrorMessage(resp);
        setError(errorMsg);
        setProjects([]);
        setPaginationData({ totalRecords: 0, totalPages: 0 });
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err?.response?.data);
      setError(errorMsg);
      setProjects([]);
      setPaginationData({ totalRecords: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    loadProjectsList();
  }, [loadProjectsList]);

  const activeFilters = [search, fromDate, toDate].filter(v => v && v.trim()).length;

  const handleClearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortBy("createdOn");
    setSortOrder("desc");
    setPage(0);
  };

  return {
    projects,
    loading,
    error,
    search, setSearch,
    fromDate, setFromDate,
    toDate, setToDate,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    page, setPage,
    limit, setLimit,
    filterOpen, setFilterOpen,
    activeFilters,
    handleClearFilters,
    paginationData,
    loadProjectsList,
  };
};
