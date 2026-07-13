import { useState, useCallback, useEffect } from "react";
import { userManagementController } from "@controllers/admin/UserManagement/userManagementController";
import { generalController } from "@controllers/admin/common/generalController";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import {
  createEmptyUserFormState,
  mapUserToFormState,
  mapUserDetailsToFormState,
  normalizeSubDepartmentIds,
  resolveUserUuid,
} from "@data/models/admin/UserManagement/UserManagementModel";
import { getDateRange } from "@/utils/dateUtils";

const S = STRINGS.USER_MANAGEMENT;

function useUserLookupsSection() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [allSubDepts, setAllSubDepts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const loadLookups = useCallback(async () => {
    try {
      const [d, s, r] = await Promise.all([
        generalController.getDepartments(),
        generalController.getSubDepartments(),
        generalController.getRoles(),
      ]);
      setDepartments(d?.data || []);
      setAllSubDepts(s?.data || []);
      setRoles(r?.data || []);
    } catch (err) {
      console.error(S.ERRORS.LOAD_LOOKUPS_FAILED, err);
    }
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  const deptNames = departments.map((d: any) => d.departmentName);
  const roleNames = roles.map((r: any) => r.roleName);

  return { departments, allSubDepts, roles, deptNames, roleNames };
}

const DEFAULT_USER_FILTERS = {
  role: "All",
  dept: "All",
  status: "All",
};

function useUserListSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_USER_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_USER_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  const loadUsersList = useCallback(async () => {
    setListLoading(true);
    try {
      const payload = {
        search: search.trim(),
        role: appliedFilters.role,
        department: appliedFilters.dept,
        status: appliedFilters.status,
        page: page + 1,
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
      console.error(S.ERRORS.LOAD_LIST_FAILED, err);
    } finally {
      setListLoading(false);
    }
  }, [search, appliedFilters, page, rowsPerPage]);

  useEffect(() => {
    void loadUsersList();
  }, [loadUsersList]);

  const activeFilterCount = Object.values(appliedFilters).filter((v) => v !== "All").length;

  const setDraftFilter = (field: keyof typeof DEFAULT_USER_FILTERS, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFilterOpen = () => {
    setFilterOpen((prev) => {
      if (!prev) setDraftFilters({ ...appliedFilters });
      return !prev;
    });
  };

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setFilterOpen(false);
    setPage(0);
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_USER_FILTERS);
    setAppliedFilters(DEFAULT_USER_FILTERS);
    setPage(0);
  };

  return {
    users,
    loading: listLoading,
    search,
    setSearch,
    appliedFilters,
    draftFilters,
    setDraftFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    filterOpen,
    setFilterOpen,
    toggleFilterOpen,
    applyFilters,
    activeFilterCount,
    clearFilters,
    paginationData,
    loadUsersList,
  };
}

function useUserStatsSection(loadUsersList) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingResetRequests: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [filterType, setFilterType] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(true);
  const getStatsPayload = useCallback(() => {
    if (filterType === "custom") {
      return {
        filterType,
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }

    const { startDate, endDate } = getDateRange(filterType);

    return {
      filterType,
      startDate,
      endDate,
    };
  }, [filterType, customStartDate, customEndDate]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const payload = getStatsPayload();

      const resp = await userManagementController.getUserStats(payload);

      if (resp?.success && resp.data) {
        setStats({
          totalUsers: resp.data.totalUsers || 0,
          activeUsers: resp.data.activeUsers || 0,
          inactiveUsers: resp.data.inactiveUsers || 0,
          pendingResetRequests: resp.data.pendingResetRequests || 0,
        });
      }
    } finally {
      setStatsLoading(false);
    }
  }, [getStatsPayload]);

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);

    if (value !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };
  const refreshDashboard = useCallback(() => {
    void loadStats();
    void loadUsersList();
  }, [loadStats]);
  useEffect(() => {
    if (filterType !== "custom") {
      refreshDashboard();
      return;
    }

    if (customStartDate && customEndDate) {
      refreshDashboard();
    }
  }, [filterType, customStartDate, customEndDate, refreshDashboard]);

  const toggleDateFilter = () => {
    setDateFilterOpen((prev) => !prev);
  };

  return {
    stats,
    loading: statsLoading,

    filterType,
    customStartDate,
    customEndDate,
    dateFilterOpen,

    setFilterType,
    setCustomStartDate,
    setCustomEndDate,
    setDateFilterOpen,

    handleFilterTypeChange,
    refreshDashboard,
    toggleDateFilter,
    loadStats,
  };
}

function useUserFormSection(roles: any[], onRefresh: () => void) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(createEmptyUserFormState());
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setForm(createEmptyUserFormState());
    setModalOpen(true);
  };

  const openEdit = async (user: any) => {
    const userUUID = resolveUserUuid(user);

    setSaving(true);
    setModalOpen(true);
    setForm(mapUserToFormState(user));

    try {
      const resp = await userManagementController.getUserById(userUUID);
      if (resp?.success && resp.data) {
        const resolvedUUID = resolveUserUuid(resp.data) || userUUID;
        setEditTarget({
          ...resp.data,
          userUUID: resolvedUUID,
          user_uuid: resolvedUUID,
        });
        setForm(mapUserDetailsToFormState(resp.data, user));
      } else {
        useAlertStore.getState().showAlert(resp?.message || S.MESSAGES.LOAD_USER_FAILED, "error");
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const trimmedUsername = form.username?.trim() || "";
    if (!editTarget && (!trimmedUsername || !form.role || !form.userId?.trim())) return;

    setSaving(true);
    useAlertStore.getState().showAlert(S.MESSAGES.SAVING_USER, "info", { loading: true });

    const selectedRoleObj = roles.find((r) => r.roleName === form.role);
    if (!editTarget && !selectedRoleObj?.roleId) {
      useAlertStore
        .getState()
        .showAlert(S.MESSAGES.OPERATION_FAILED, "error", { autoCloseMs: 3000 });
      setSaving(false);
      return;
    }

    const subDepartmentIds = normalizeSubDepartmentIds(
      form.subDepts.map((sd: any) => sd?.subDepartmentId),
    );
    let resp;

    if (editTarget) {
      const updatePayload: any = { user_uuid: resolveUserUuid(editTarget) };
      if (!updatePayload.user_uuid) {
        useAlertStore
          .getState()
          .showAlert(S.MESSAGES.UUID_RESOLVE_FAILED, "error", { autoCloseMs: 3000 });
        setSaving(false);
        return;
      }

      const originalUsername = String(editTarget?.username || "").trim();
      const originalSubDepartmentIds = normalizeSubDepartmentIds(
        Array.isArray(editTarget?.subDepartments)
          ? editTarget.subDepartments.map((sd: any) => sd?.subDepartmentId)
          : [],
      );
      const subDepartmentsChanged =
        subDepartmentIds.length !== originalSubDepartmentIds.length ||
        subDepartmentIds.some((id, idx) => id !== originalSubDepartmentIds[idx]);

      if (trimmedUsername && trimmedUsername !== originalUsername) {
        updatePayload.username = trimmedUsername;
      }
      if (subDepartmentsChanged) {
        updatePayload.subDepartmentIds = subDepartmentIds;
      }
      if (!updatePayload.username && !updatePayload.subDepartmentIds) {
        useAlertStore.getState().showAlert(S.MESSAGES.NO_CHANGES, "info", { autoCloseMs: 2000 });
        setSaving(false);
        return;
      }
      resp = await userManagementController.updateUser(updatePayload);
    } else {
      resp = await userManagementController.createUser({
        userId: form.userId.trim(),
        username: trimmedUsername,
        roleId: selectedRoleObj?.roleId,
        subDepartmentIds,
      });
    }

    if (resp?.success) {
      useAlertStore
        .getState()
        .showAlert(resp.message || S.MESSAGES.SAVE_SUCCESS, "success", { autoCloseMs: 2000 });
      setTimeout(() => {
        onRefresh();
        setModalOpen(false);
        setSaving(false);
      }, 1000);
    } else {
      useAlertStore
        .getState()
        .showAlert(resp?.message || S.MESSAGES.OPERATION_FAILED, "error", { autoCloseMs: 3000 });
      setSaving(false);
    }
  };

  const handleFormChange = (field: string) => (e: any) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubDeptsChange = (val: any) => {
    setForm((prev) => ({ ...prev, subDepts: val }));
  };

  return {
    modalOpen,
    setModalOpen,
    editTarget,
    form,
    saving,
    openCreate,
    openEdit,
    handleSave,
    handleFormChange,
    handleSubDeptsChange,
  };
}

function useUserDeleteSection(onRefresh: () => void) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const openDelete = (user: any) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DELETING_USER, "info", { loading: true });

    const resp = await userManagementController.deleteUser(resolveUserUuid(deleteTarget));
    if (resp?.success) {
      useAlertStore
        .getState()
        .showAlert(resp.message || S.MESSAGES.DELETE_SUCCESS, "success", { autoCloseMs: 2000 });
      setTimeout(() => {
        onRefresh();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleting(false);
      }, 1000);
    } else {
      useAlertStore
        .getState()
        .showAlert(resp?.message || S.MESSAGES.DELETE_FAILED, "error", { autoCloseMs: 3000 });
      setDeleting(false);
    }
  };

  return {
    deleteOpen,
    setDeleteOpen,
    deleteTarget,
    deleting,
    openDelete,
    handleDelete,
  };
}

export default function useUserManagementHook() {
  const lookups = useUserLookupsSection();
  const list = useUserListSection();
  const stats = useUserStatsSection(list.loadUsersList);

  const refreshAll = useCallback(() => {
    void list.loadUsersList();
    void stats.refreshDashboard();
  }, [list.loadUsersList, stats.refreshDashboard]);

  const form = useUserFormSection(lookups.roles, refreshAll);
  const deleteSection = useUserDeleteSection(refreshAll);

  return {
    list,
    stats,
    lookups,
    form,
    delete: deleteSection,
    refresh: refreshAll,
  };
}
