import { useState, useCallback, useEffect } from "react";
import { projectManagementController } from "@controllers/admin/ProjectManagement/projectManagementController";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import {
  createEmptyProjectFormState,
  mapProjectToFormState,
  getProjectManagementErrorMessage,
} from "@data/models/admin/ProjectManagement/ProjectManagementModel";
import { getDateRange } from "@/utils/dateUtils";

const S = STRINGS.PROJECT_MANAGEMENT;

const DEFAULT_PROJECT_FILTERS = {
  fromDate: "",
  toDate: "",
};

function useProjectListSection() {
  const [projects, setProjects] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_PROJECT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_PROJECT_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  const loadProjectsList = useCallback(async () => {
    setListLoading(true);
    try {
      const payload = {
        search: search.trim() || undefined,
        fromDate: appliedFilters.fromDate || undefined,
        toDate: appliedFilters.toDate || undefined,
        sortBy: "createdOn",
        sortOrder: "desc",
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
        useAlertStore
          .getState()
          .showAlert(getProjectManagementErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
      }
    } catch (err: any) {
      setProjects([]);
      setPaginationData({ totalRecords: 0, totalPages: 0 });
      useAlertStore
        .getState()
        .showAlert(
          getProjectManagementErrorMessage(err?.response?.data, S.ERRORS.OPERATION_FAILED),
          "error",
        );
    } finally {
      setListLoading(false);
    }
  }, [search, appliedFilters, page, rowsPerPage]);

  useEffect(() => {
    void loadProjectsList();
  }, [loadProjectsList]);

  const activeFilterCount = [appliedFilters.fromDate, appliedFilters.toDate].filter(
    (v) => v && v.trim(),
  ).length;

  const setDraftFilter = (field: keyof typeof DEFAULT_PROJECT_FILTERS, value: string) => {
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
    setDraftFilters(DEFAULT_PROJECT_FILTERS);
    setAppliedFilters(DEFAULT_PROJECT_FILTERS);
    setPage(0);
  };

  return {
    projects,
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
    loadProjectsList,
  };
}

function useProjectStatsSection() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    projectsCreatedToday: 0,
    projectsCreatedThisMonth: 0,
    activeProjects: 0,
    idleProjects: 0,
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

      const resp = await projectManagementController.getProjectStats(payload);
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
  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return {
    stats,
    loading: statsLoading,
    loadStats,
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
  };
}

function useProjectFormSection(onRefresh: () => void) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createEmptyProjectFormState());

  const resetForm = useCallback(() => {
    setForm(createEmptyProjectFormState());
    setEditTarget(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((project: any) => {
    setEditTarget(project);
    setForm(mapProjectToFormState(project));
    setModalOpen(true);
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
    useAlertStore
      .getState()
      .showAlert(editTarget ? S.MESSAGES.UPDATING : S.MESSAGES.CREATING, "info", { loading: true });

    try {
      const resp = editTarget
        ? await projectManagementController.updateProject({
            projectId: editTarget.projectId,
            ...form,
          })
        : await projectManagementController.createProject(form);

      if (resp?.success) {
        useAlertStore
          .getState()
          .showAlert(
            resp.message || (editTarget ? S.MESSAGES.UPDATE_SUCCESS : S.MESSAGES.CREATE_SUCCESS),
            "success",
            { autoCloseMs: 2000 },
          );
        setModalOpen(false);
        resetForm();
        onRefresh();
      } else {
        useAlertStore
          .getState()
          .showAlert(getProjectManagementErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error", {
            autoCloseMs: 3000,
          });
      }
    } catch (error: any) {
      useAlertStore
        .getState()
        .showAlert(
          getProjectManagementErrorMessage(error?.response?.data, S.ERRORS.OPERATION_FAILED),
          "error",
          { autoCloseMs: 3000 },
        );
    } finally {
      setSaving(false);
    }
  }, [editTarget, form, onRefresh, resetForm]);

  return {
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
  };
}

function useProjectDeleteSection(onRefresh: () => void) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const openDelete = useCallback((project: any) => {
    setDeleteTarget(project);
    setDeleteOpen(true);
  }, []);

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
        useAlertStore
          .getState()
          .showAlert(resp.message || S.MESSAGES.DELETE_SUCCESS, "success", { autoCloseMs: 2000 });
        setDeleteOpen(false);
        setDeleteTarget(null);
        onRefresh();
      } else {
        useAlertStore
          .getState()
          .showAlert(getProjectManagementErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error", {
            autoCloseMs: 3000,
          });
      }
    } catch (error: any) {
      useAlertStore
        .getState()
        .showAlert(
          getProjectManagementErrorMessage(error?.response?.data, S.ERRORS.OPERATION_FAILED),
          "error",
          { autoCloseMs: 3000 },
        );
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, onRefresh]);

  return {
    deleteOpen,
    setDeleteOpen,
    deleteTarget,
    deleting,
    openDelete,
    handleDelete,
  };
}

export default function useProjectManagementHook() {
  const list = useProjectListSection();
  const stats = useProjectStatsSection();

  const refresh = useCallback(() => {
    void list.loadProjectsList();
    void stats.loadStats();
  }, [list.loadProjectsList, stats.loadStats]);

  const form = useProjectFormSection(refresh);
  const deleteSection = useProjectDeleteSection(refresh);

  return {
    list,
    stats,
    form,
    delete: deleteSection,
    refresh,
  };
}
