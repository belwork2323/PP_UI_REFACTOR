import { useState, useCallback, useEffect } from "react";
import { projectManagementController } from "@controllers/admin/ProjectManagement/projectManagementController";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";

const S = STRINGS.PROJECT_MANAGEMENT;
const EMPTY_FORM = { projectName: "", projectDescription: "" };

const getErrorMessage = (response: any): string => {
  if (response?.error?.details) return response.error.details;
  if (response?.message) return response.message;
  return S.ERRORS.OPERATION_FAILED;
};

export default function useProjectManagementHook() {
  const [projects, setProjects] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("createdOn");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  const [stats, setStats] = useState({
    totalProjects: 0,
    projectsCreatedToday: 0,
    projectsCreatedThisMonth: 0,
    activeProjects: 0,
    idleProjects: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const resp = await projectManagementController.getProjectStats();
      if (resp?.success && resp.data) {
        setStats({
          totalProjects: resp.data.totalProjects || 0,
          projectsCreatedToday: resp.data.projectsCreatedToday || 0,
          projectsCreatedThisMonth: resp.data.projectsCreatedThisMonth || 0,
          activeProjects: resp.data.activeProjects || 0,
          idleProjects: resp.data.idleProjects || 0,
        });
      }
    } catch (err) {
      console.error(S.ERRORS.LOAD_STATS_FAILED, err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadProjectsList = useCallback(async () => {
    setListLoading(true);
    try {
      const payload = {
        search: search.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        sortOrder,
        page: page + 1,
        limit: rowsPerPage,
      };
      const resp = await projectManagementController.getAllProjects(payload);
      if (resp?.success) {
        setProjects(resp.data?.projects || []);
        setPaginationData({
          totalRecords: resp.data?.pagination?.totalRecords || 0,
          totalPages: resp.data?.pagination?.totalPages || 0,
        });
      } else {
        setProjects([]);
        setPaginationData({ totalRecords: 0, totalPages: 0 });
        useAlertStore.getState().showAlert(getErrorMessage(resp), "error");
      }
    } catch (err: any) {
      setProjects([]);
      setPaginationData({ totalRecords: 0, totalPages: 0 });
      useAlertStore.getState().showAlert(getErrorMessage(err?.response?.data), "error");
    } finally {
      setListLoading(false);
    }
  }, [search, fromDate, toDate, sortBy, sortOrder, page, rowsPerPage]);

  const refresh = useCallback(() => {
    void loadProjectsList();
    void loadStats();
  }, [loadProjectsList, loadStats]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadProjectsList();
  }, [loadProjectsList]);

  const activeFilters = [search, fromDate, toDate].filter((v) => v && v.trim()).length;

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortBy("createdOn");
    setSortOrder("desc");
    setPage(0);
  }, []);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((project: any) => {
    setEditTarget(project);
    setForm({
      projectName: project.projectName || "",
      projectDescription: project.projectDescription || "",
    });
    setModalOpen(true);
  }, []);

  const openDelete = useCallback((project: any) => {
    setDeleteTarget(project);
    setDeleteOpen(true);
  }, []);

  const handleFormChange = useCallback((field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.projectName.trim()) {
      useAlertStore.getState().showAlert(S.MESSAGES.NAME_REQUIRED, "error");
      return;
    }

    setSaving(true);
    useAlertStore.getState().showAlert(
      editTarget ? S.MESSAGES.UPDATING : S.MESSAGES.CREATING,
      "info",
      { loading: true }
    );

    try {
      const resp = editTarget
        ? await projectManagementController.updateProject({ projectId: editTarget.projectId, ...form })
        : await projectManagementController.createProject(form);

      if (resp?.success) {
        useAlertStore.getState().showAlert(
          resp.message || (editTarget ? S.MESSAGES.UPDATE_SUCCESS : S.MESSAGES.CREATE_SUCCESS),
          "success",
          { autoCloseMs: 2000 }
        );
        setModalOpen(false);
        resetForm();
        refresh();
      } else {
        useAlertStore.getState().showAlert(getErrorMessage(resp), "error", { autoCloseMs: 3000 });
      }
    } catch (error: any) {
      useAlertStore.getState().showAlert(getErrorMessage(error?.response?.data), "error", { autoCloseMs: 3000 });
    } finally {
      setSaving(false);
    }
  }, [editTarget, form, refresh, resetForm]);

  const handleDelete = useCallback(async () => {
    const projectId = String(deleteTarget?.projectId ?? "").trim();
    if (!projectId) {
      useAlertStore.getState().showAlert(S.MESSAGES.DELETE_ID_MISSING, "error");
      return;
    }

    setDeleting(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DELETING, "info", { loading: true });

    try {
      const resp = await projectManagementController.deleteProject(projectId);
      if (resp?.success) {
        useAlertStore.getState().showAlert(resp.message || S.MESSAGES.DELETE_SUCCESS, "success", { autoCloseMs: 2000 });
        setDeleteOpen(false);
        setDeleteTarget(null);
        refresh();
      } else {
        useAlertStore.getState().showAlert(getErrorMessage(resp), "error", { autoCloseMs: 3000 });
      }
    } catch (error: any) {
      useAlertStore.getState().showAlert(getErrorMessage(error?.response?.data), "error", { autoCloseMs: 3000 });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refresh]);

  return {
    list: {
      projects,
      loading: listLoading,
      search,
      setSearch,
      fromDate,
      setFromDate,
      toDate,
      setToDate,
      sortBy,
      setSortBy,
      sortOrder,
      setSortOrder,
      page,
      setPage,
      rowsPerPage,
      setRowsPerPage,
      filterOpen,
      setFilterOpen,
      activeFilters,
      handleClearFilters,
      paginationData,
      loadProjectsList,
    },
    stats: { stats, loading: statsLoading, loadStats },
    form: {
      modalOpen,
      setModalOpen,
      editTarget,
      form,
      saving,
      openCreate,
      openEdit,
      handleFormChange,
      handleSave,
      resetForm,
    },
    delete: {
      deleteOpen,
      setDeleteOpen,
      deleteTarget,
      deleting,
      openDelete,
      handleDelete,
    },
    refresh,
  };
}
