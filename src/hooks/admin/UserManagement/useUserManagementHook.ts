import { useState, useCallback, useEffect } from "react";
import { userManagementController } from "@controllers/admin/UserManagement/userManagementController";
import { generalController } from "@controllers/admin/common/generalController";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";

const EMPTY_FORM = { username: "", userId: "", role: "", subDepts: [] };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asUuid = (value: any) => {
  const v = String(value ?? "").trim();
  return UUID_REGEX.test(v) ? v : "";
};

const getUserUUID = (user: any) =>
  asUuid(user?.userUUID) ||
  asUuid(user?.user_uuid) ||
  asUuid(user?.uuid) ||
  asUuid(user?.id) ||
  "";

const normalizeIds = (values: any[]) =>
  Array.from(
    new Set(
      (values || [])
        .map((value: any) => Number(value))
        .filter((id: number) => Number.isFinite(id))
    )
  ).sort((a, b) => a - b);

export default function useUserManagementHook() {
  /* ── Lookups ──────────────────────────────────────────────────────────── */
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
      console.error(STRINGS.USER_MANAGEMENT.ERRORS.LOAD_LOOKUPS_FAILED, err);
    }
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  const deptNames = departments.map((d: any) => d.departmentName);
  const roleNames = roles.map((r: any) => r.roleName);

  /* ── List ─────────────────────────────────────────────────────────────── */
  const [users, setUsers] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  const loadUsersList = useCallback(async () => {
    setListLoading(true);
    try {
      const payload = {
        search: search.trim(),
        role: filterRole,
        department: filterDept,
        status: filterStatus,
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
      console.error(STRINGS.USER_MANAGEMENT.ERRORS.LOAD_LIST_FAILED, err);
    } finally {
      setListLoading(false);
    }
  }, [search, filterRole, filterDept, filterStatus, page, rowsPerPage]);

  useEffect(() => {
    void loadUsersList();
  }, [loadUsersList]);

  const activeFilters = [filterRole, filterDept, filterStatus].filter((v) => v !== "All").length;

  const handleClearFilters = () => {
    setFilterRole("All");
    setFilterDept("All");
    setFilterStatus("All");
    setPage(0);
  };

  /* ── Stats ────────────────────────────────────────────────────────────── */
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingResetRequests: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const resp = await userManagementController.getUserStats();
      if (resp?.success && resp.data) {
        setStats({
          totalUsers: resp.data.totalUsers || 0,
          activeUsers: resp.data.activeUsers || 0,
          inactiveUsers: resp.data.inactiveUsers || 0,
          pendingResetRequests: resp.data.pendingResetRequests || 0,
        });
      }
    } catch (err) {
      console.error(STRINGS.USER_MANAGEMENT.ERRORS.LOAD_STATS_FAILED, err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const refreshAll = useCallback(() => {
    void loadUsersList();
    void loadStats();
  }, [loadUsersList, loadStats]);

  /* ── Form / delete actions ────────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = async (user: any) => {
    const userUUID = getUserUUID(user);

    setSaving(true);
    setModalOpen(true);
    setForm({
      username: user.username || "",
      userId: user.userId || "",
      role: user.role?.roleName || user.role || "",
      subDepts: Array.isArray(user.subDepartments) ? user.subDepartments : [],
    });

    try {
      const resp = await userManagementController.getUserById(userUUID);
      if (resp?.success && resp.data) {
        const resolvedUUID = getUserUUID(resp.data) || userUUID;
        setEditTarget({
          ...resp.data,
          userUUID: resolvedUUID,
          user_uuid: resolvedUUID,
        });
        setForm({
          username: resp.data.username || "",
          userId: (resp.data.userId || user.userId || "") as string,
          role: resp.data.role || "",
          subDepts: Array.isArray(resp.data.subDepartments) ? resp.data.subDepartments : [],
        });
      } else {
        useAlertStore.getState().showAlert(
          resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.LOAD_USER_FAILED,
          "error"
        );
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (user: any) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    const trimmedUsername = form.username?.trim() || "";
    if (!editTarget && (!trimmedUsername || !form.role || !form.userId?.trim())) return;

    setSaving(true);
    useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.SAVING_USER, "info", { loading: true });

    const selectedRoleObj = roles.find((r) => r.roleName === form.role);
    if (!editTarget && !selectedRoleObj?.roleId) {
      useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.OPERATION_FAILED, "error", {
        autoCloseMs: 3000,
      });
      setSaving(false);
      return;
    }

    const subDepartmentIds = normalizeIds(form.subDepts.map((sd: any) => sd?.subDepartmentId));
    let resp;

    if (editTarget) {
      const updatePayload: any = { user_uuid: getUserUUID(editTarget) };
      if (!updatePayload.user_uuid) {
        useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.UUID_RESOLVE_FAILED, "error", {
          autoCloseMs: 3000,
        });
        setSaving(false);
        return;
      }

      const originalUsername = String(editTarget?.username || "").trim();
      const originalSubDepartmentIds = normalizeIds(
        Array.isArray(editTarget?.subDepartments)
          ? editTarget.subDepartments.map((sd: any) => sd?.subDepartmentId)
          : []
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
        useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.NO_CHANGES, "info", { autoCloseMs: 2000 });
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
      useAlertStore.getState().showAlert(
        resp.message || STRINGS.USER_MANAGEMENT.MESSAGES.SAVE_SUCCESS,
        "success",
        { autoCloseMs: 2000 }
      );
      setTimeout(() => {
        refreshAll();
        setModalOpen(false);
        setSaving(false);
      }, 1000);
    } else {
      useAlertStore.getState().showAlert(
        resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.OPERATION_FAILED,
        "error",
        { autoCloseMs: 3000 }
      );
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    useAlertStore.getState().showAlert(STRINGS.USER_MANAGEMENT.MESSAGES.DELETING_USER, "info", { loading: true });

    const resp = await userManagementController.deleteUser(getUserUUID(deleteTarget));
    if (resp?.success) {
      useAlertStore.getState().showAlert(
        resp.message || STRINGS.USER_MANAGEMENT.MESSAGES.DELETE_SUCCESS,
        "success",
        { autoCloseMs: 2000 }
      );
      setTimeout(() => {
        refreshAll();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleting(false);
      }, 1000);
    } else {
      useAlertStore.getState().showAlert(
        resp?.message || STRINGS.USER_MANAGEMENT.MESSAGES.DELETE_FAILED,
        "error",
        { autoCloseMs: 3000 }
      );
      setDeleting(false);
    }
  };

  const handleFormChange = (field: string) => (e: any) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubDeptsChange = (val: any) => {
    setForm((prev) => ({ ...prev, subDepts: val }));
  };

  return {
    list: {
      users,
      loading: listLoading,
      search,
      setSearch,
      filterRole,
      setFilterRole,
      filterDept,
      setFilterDept,
      filterStatus,
      setFilterStatus,
      page,
      setPage,
      rowsPerPage,
      setRowsPerPage,
      filterOpen,
      setFilterOpen,
      activeFilters,
      handleClearFilters,
      paginationData,
      loadUsersList,
    },
    stats: {
      stats,
      loading: statsLoading,
      loadStats,
    },
    lookups: {
      departments,
      allSubDepts,
      roles,
      deptNames,
      roleNames,
    },
    form: {
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
    },
    delete: {
      deleteOpen,
      setDeleteOpen,
      deleteTarget,
      deleting,
      openDelete,
      handleDelete,
    },
    refresh: refreshAll,
  };
}
