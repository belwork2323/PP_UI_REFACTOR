import { useState, useCallback, useEffect } from "react";
import { userManagementController } from "../../../controllers/admin/user_management/userManagementController";
import { STRINGS } from "../../../app/config/strings";

export const useUserList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and Pagination
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage] = useState(0); // MUI Table is 0-indexed, Backend is 1-indexed
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const [paginationData, setPaginationData] = useState({
    totalRecords: 0,
    totalPages: 0,
  });

  const loadUsersList = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        search: search.trim(),
        role: filterRole,
        department: filterDept,
        status: filterStatus,
        page: page + 1, // sending 1-based index to API
        pageSize: rowsPerPage,
      };
      
      const resp = await userManagementController.getAllUsers(payload);
      if (resp?.success) {
        setUsers(resp.data?.users || []);
        setPaginationData({
          totalRecords: resp.data?.pagination?.totalRecords || 0,
          totalPages: resp.data?.pagination?.totalPages || 0,
        });
      } else {
        setUsers([]);
        setPaginationData({ totalRecords: 0, totalPages: 0 });
      }
    } catch (err) {
      console.error(STRINGS.USER_MANAGEMENT.ERRORS.LOAD_LIST_FAILED, err);
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterDept, filterStatus, page, rowsPerPage]);

  useEffect(() => {
    loadUsersList();
  }, [loadUsersList]);

  const activeFilters = [filterRole, filterDept, filterStatus].filter(v => v !== "All").length;

  const handleClearFilters = () => {
    setFilterRole("All");
    setFilterDept("All");
    setFilterStatus("All");
    setPage(0);
  };

  return {
    users,
    loading,
    search, setSearch,
    filterRole, setFilterRole,
    filterDept, setFilterDept,
    filterStatus, setFilterStatus,
    page, setPage,
    rowsPerPage, setRowsPerPage,
    filterOpen, setFilterOpen,
    activeFilters,
    handleClearFilters,
    paginationData,
    loadUsersList,
  };
};
