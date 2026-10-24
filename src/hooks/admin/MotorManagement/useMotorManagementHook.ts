import { useState, useCallback, useEffect, useMemo } from "react";
import { motorManagementController } from "@controllers/admin/MotorManagement/motorManagementController";
import { projectManagementController } from "@controllers/admin/ProjectManagement/projectManagementController";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import { getMotorManagementErrorMessage } from "@data/models/admin/MotorManagement/MotorManagementModel";
import { getDateRange } from "@/utils/dateUtils";
import { DEFAULT_DATE_FILTER_TYPE } from "@/ui/components/custom/dashboard/DashboardDateFilter";

const S = STRINGS.MOTOR_MANAGEMENT;

const DEFAULT_MOTOR_FILTERS = {
  batchId: "",
  projectId: "All",
  motorStage: "All",
  workflowStatus: "All",
};

type MotorDateBounds = {
  filterType: string;
  startDate: string;
  endDate: string;
};

function useMotorLookupsSection() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const projectResp = await projectManagementController.getAllProjects({
        page: 1,
        limit: 1000,
        sortBy: "createdOn",
        sortOrder: "desc",
      });
      const fetched =
        projectResp?.success && projectResp.data ? (projectResp.data.projects ?? []) : [];
      setProjects(fetched);
    } catch (err) {
      console.error(S.ERRORS.LOAD_LOOKUPS_FAILED, err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  const projectOptions = projects.map((p: any) => ({
    value: String(p.projectId ?? ""),
    label: String(p.projectName ?? p.projectId ?? "").trim() || String(p.projectId ?? ""),
  }));

  return { projects, projectOptions, loading };
}

function useMotorListSection(dateBounds: MotorDateBounds) {
  const [motors, setMotors] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_MOTOR_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_MOTOR_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  const loadMotorsList = useCallback(async () => {
    if (
      dateBounds.filterType === "custom" &&
      (dateBounds.startDate.length !== 10 || dateBounds.endDate.length !== 10)
    ) {
      return;
    }

    setListLoading(true);
    try {
      const filters: Record<string, unknown> = {
        filterType: dateBounds.filterType,
        startDate: dateBounds.startDate,
        endDate: dateBounds.endDate,
      };
      if (appliedFilters.batchId.trim()) filters.batchId = appliedFilters.batchId.trim();
      if (appliedFilters.projectId !== "All") filters.projectId = appliedFilters.projectId;
      if (appliedFilters.motorStage !== "All") {
        filters.motorStage = Number(appliedFilters.motorStage);
      }
      if (appliedFilters.workflowStatus !== "All") {
        filters.workflowStatus = appliedFilters.workflowStatus;
      }

      const payload = {
        search: search.trim() || undefined,
        page: page + 1,
        limit: rowsPerPage,
        filters,
      };

      const resp = await motorManagementController.getAllMotors(payload);
      if (resp?.success) {
        setMotors(resp.data?.motors || []);
        setPaginationData({
          totalRecords: resp.data?.pagination?.totalRecords || 0,
          totalPages: resp.data?.pagination?.totalPages || 0,
        });
      } else {
        setMotors([]);
        setPaginationData({ totalRecords: 0, totalPages: 0 });
        useAlertStore
          .getState()
          .showAlert(getMotorManagementErrorMessage(resp, S.ERRORS.OPERATION_FAILED), "error");
      }
    } catch (err: any) {
      setMotors([]);
      setPaginationData({ totalRecords: 0, totalPages: 0 });
      useAlertStore
        .getState()
        .showAlert(
          getMotorManagementErrorMessage(err?.response?.data, S.ERRORS.OPERATION_FAILED),
          "error",
        );
    } finally {
      setListLoading(false);
    }
  }, [search, appliedFilters, page, rowsPerPage, dateBounds]);

  useEffect(() => {
    void loadMotorsList();
  }, [loadMotorsList]);

  useEffect(() => {
    setPage(0);
  }, [dateBounds.filterType, dateBounds.startDate, dateBounds.endDate]);

  const activeFilterCount = [
    appliedFilters.batchId.trim() ? 1 : 0,
    appliedFilters.projectId !== "All" ? 1 : 0,
    appliedFilters.motorStage !== "All" ? 1 : 0,
    appliedFilters.workflowStatus !== "All" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const setDraftFilter = (field: keyof typeof DEFAULT_MOTOR_FILTERS, value: string) => {
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
    setDraftFilters(DEFAULT_MOTOR_FILTERS);
    setAppliedFilters(DEFAULT_MOTOR_FILTERS);
    setPage(0);
  };

  return {
    motors,
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
    loadMotorsList,
  };
}

function useMotorStatsSection() {
  const [stats, setStats] = useState({
    totalMotors: 0,
    inProgress: 0,
    dispatched: 0,
    discarded: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [filterType, setFilterTypeState] = useState(DEFAULT_DATE_FILTER_TYPE);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(true);

  const dateBounds = useMemo((): MotorDateBounds => {
    if (filterType === "custom") {
      if (appliedCustomStart.length === 10 && appliedCustomEnd.length === 10) {
        return {
          filterType: "custom",
          startDate: appliedCustomStart,
          endDate: appliedCustomEnd,
        };
      }
      return { filterType: "custom", startDate: "", endDate: "" };
    }
    const { startDate, endDate } = getDateRange(filterType);
    return { filterType: "custom", startDate, endDate };
  }, [filterType, appliedCustomStart, appliedCustomEnd]);

  const loadStats = useCallback(async () => {
    if (
      dateBounds.filterType === "custom" &&
      (dateBounds.startDate.length !== 10 || dateBounds.endDate.length !== 10)
    ) {
      return;
    }

    setStatsLoading(true);
    try {
      const resp = await motorManagementController.getMotorStats({
        filterType: dateBounds.filterType,
        startDate: dateBounds.startDate,
        endDate: dateBounds.endDate,
      });
      if (resp?.success && resp.data) {
        setStats({
          totalMotors: resp.data.totalMotors || 0,
          inProgress: resp.data.inProgress || 0,
          dispatched: resp.data.dispatched || 0,
          discarded: resp.data.discarded || 0,
        });
      }
    } catch (err) {
      console.error(S.ERRORS.LOAD_STATS_FAILED, err);
    } finally {
      setStatsLoading(false);
    }
  }, [dateBounds]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleFilterTypeChange = (value: string) => {
    setFilterTypeState(value);
    if (value !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
      setAppliedCustomStart("");
      setAppliedCustomEnd("");
    }
  };

  const applyCustomDateFilter = useCallback(() => {
    if (customStartDate.length !== 10 || customEndDate.length !== 10) return;
    setAppliedCustomStart(customStartDate);
    setAppliedCustomEnd(customEndDate);
  }, [customStartDate, customEndDate]);

  const clearDateFilter = useCallback(() => {
    setFilterTypeState(DEFAULT_DATE_FILTER_TYPE);
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedCustomStart("");
    setAppliedCustomEnd("");
  }, []);

  const toggleDateFilter = () => setDateFilterOpen((prev) => !prev);

  return {
    stats,
    loading: statsLoading,
    loadStats,
    filterType,
    customStartDate,
    customEndDate,
    dateFilterOpen,
    setCustomStartDate,
    setCustomEndDate,
    handleFilterTypeChange,
    applyCustomDateFilter,
    clearDateFilter,
    toggleDateFilter,
    dateBounds,
  };
}

function useMotorDetailsSection() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  const openDetails = useCallback(async (motorId: string) => {
    const id = String(motorId ?? "").trim();
    if (!id) return;
    setOpen(true);
    setLoading(true);
    setDetails(null);
    try {
      const resp = await motorManagementController.getMotorDetails(id);
      if (resp?.success && resp.data) {
        setDetails(resp.data);
      } else {
        useAlertStore
          .getState()
          .showAlert(getMotorManagementErrorMessage(resp, S.ERRORS.LOAD_DETAILS_FAILED), "error");
        setOpen(false);
      }
    } catch (err: any) {
      useAlertStore
        .getState()
        .showAlert(
          getMotorManagementErrorMessage(err?.response?.data, S.ERRORS.LOAD_DETAILS_FAILED),
          "error",
        );
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeDetails = useCallback(() => {
    setOpen(false);
    setDetails(null);
  }, []);

  const setDetailsData = useCallback((next: any) => {
    setDetails(next);
  }, []);

  return { open, loading, details, openDetails, closeDetails, setDetailsData };
}

function useMotorDiscardSection(opts: {
  refresh: () => void;
  reloadDetails: (motorId: string) => Promise<void>;
}) {
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardTarget, setDiscardTarget] = useState<{ motorId: string } | null>(null);
  const [discardReason, setDiscardReason] = useState("");
  const [discarding, setDiscarding] = useState(false);

  const openDiscard = useCallback((motorId: string) => {
    const id = String(motorId ?? "").trim();
    if (!id) return;
    setDiscardTarget({ motorId: id });
    setDiscardReason("");
    setDiscardOpen(true);
  }, []);

  const closeDiscard = useCallback(() => {
    if (discarding) return;
    setDiscardOpen(false);
    setDiscardTarget(null);
    setDiscardReason("");
  }, [discarding]);

  const handleDiscard = useCallback(async () => {
    const motorId = discardTarget?.motorId;
    const reason = discardReason.trim();
    if (!motorId || !reason) return false;

    setDiscarding(true);
    try {
      const resp = await motorManagementController.discardMotor({ motorId, reason });
      if (resp?.success) {
        useAlertStore.getState().showAlert(S.DISCARD_DIALOG.SUCCESS, "success");
        setDiscardOpen(false);
        setDiscardTarget(null);
        setDiscardReason("");
        opts.refresh();
        await opts.reloadDetails(motorId);
        return true;
      }
      useAlertStore
        .getState()
        .showAlert(getMotorManagementErrorMessage(resp, S.ERRORS.DISCARD_FAILED), "error");
      return false;
    } catch (err: any) {
      useAlertStore
        .getState()
        .showAlert(
          getMotorManagementErrorMessage(err?.response?.data, S.ERRORS.DISCARD_FAILED),
          "error",
        );
      return false;
    } finally {
      setDiscarding(false);
    }
  }, [discardTarget, discardReason, opts]);

  return {
    discardOpen,
    discardTarget,
    discardReason,
    setDiscardReason,
    discarding,
    openDiscard,
    closeDiscard,
    handleDiscard,
  };
}

export default function useMotorManagementHook() {
  const lookups = useMotorLookupsSection();
  const stats = useMotorStatsSection();
  const list = useMotorListSection(stats.dateBounds);
  const details = useMotorDetailsSection();

  const refresh = useCallback(() => {
    void stats.loadStats();
    void list.loadMotorsList();
  }, [stats.loadStats, list.loadMotorsList]);

  const discard = useMotorDiscardSection({
    refresh,
    reloadDetails: async (motorId: string) => {
      if (details.open) {
        await details.openDetails(motorId);
      }
    },
  });

  return { list, stats, lookups, details, discard, refresh };
}
