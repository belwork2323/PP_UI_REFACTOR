import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { batchManagementController } from "@controllers/admin/BatchManagement/batchManagementController";
import { generalController } from "@controllers/admin/common/generalController";
import { userManagementController } from "@controllers/admin/UserManagement/userManagementController";
import { projectManagementController } from "@controllers/admin/ProjectManagement/projectManagementController";
import { operationsController } from "@controllers/user/operationsController";
import rawMaterialProcurementController from "@controllers/user/sourcing/rawMaterialProcurementController";
import {
  ADMIN_RAW_MATERIAL_SUB_DEPARTMENT_ID,
  createEmptyBatchFormState,
  createEmptyImplementationFormState,
  IDENTIFICATION_SHEET_STATUS,
  mapBatchToFormState,
  mapBatchToImplementationFormState,
  buildAdditionalBatchDetailsUpdatePayload,
  buildIdentificationUpdatePayload,
  hasAdditionalBatchDetailsChanges,
  normalizeMaterialCodeKey,
  groupLotsByMaterialCode,
  toBatchMaterialOptions,
  type BatchMaterialOption,
} from "@data/models/admin/BatchManagement/BatchManagementModel";
import {
  mapLotListApiRow,
  toRawMaterialLotListApiStatus,
  type RawMaterialLotListRow,
} from "@data/models/user/RawMaterialProcurementModel";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";
import { canDeleteAdminBatch } from "@utils/batchManagementUtils";
import { getDashboardFilterBounds, toDashboardApiFilterType } from "@utils/dateUtils";
import { DEFAULT_DATE_FILTER_TYPE } from "@/ui/components/custom/dashboard/DashboardDateFilter";
import { OPERATION_STATUS } from "@hooks/operationStatus";
import type {
  MixingCycleMasterItem,
  SubscaleArticleOption,
  SystemMasterOption,
} from "@data/api/common/generalAPI";

const S = STRINGS.BATCH_MANAGEMENT;

const DEFAULT_BATCH_FILTERS = {
  search: "",
  motorIds: [] as string[],
  stage: "All",
  status: "All",
  subDept: "All",
};
type BatchFilters = {
  search?: string;
  motorIds?: string[];
  motorStage?: string;
  status?: string;
  priority?: string;
  subDepartment?: string;
  filterType?: string;
  endDate?: string;
  startDate?: string;
};

function useBatchListSection(dateFilter: {
  filterType: string;
  startDate: string;
  endDate: string;
}) {
  const [batches, setBatches] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_BATCH_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_BATCH_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [filterOpen, setFilterOpen] = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  const loadBatchList = useCallback(async () => {
    setListLoading(true);
    try {
      const filters: BatchFilters = {
        filterType: dateFilter.filterType,
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
      };
      if (search.trim()) filters.search = search.trim();
      if (appliedFilters.stage !== "All") filters.motorStage = appliedFilters.stage;
      if (appliedFilters.motorIds?.length) {
        filters.motorIds = Array.isArray(appliedFilters.motorIds)
          ? appliedFilters.motorIds
          : [appliedFilters.motorIds];
      }
      if (appliedFilters.status !== "All") {
        filters.status = appliedFilters.status.toUpperCase().replace(/\s+/g, "_");
      }
      if (appliedFilters.subDept !== "All") filters.subDepartment = appliedFilters.subDept;

      const resp = await batchManagementController.getAllBatches(
        page + 1,
        rowsPerPage,
        filters,
        dateFilter,
      );
      if (resp) {
        setBatches(resp.batches || []);
        setPaginationData({
          totalRecords: resp.pagination?.totalRecords || 0,
          totalPages: resp.pagination?.totalPages || 0,
        });
      }
    } catch (err) {
      console.error(S.ERRORS.LOAD_LIST_FAILED, err);
    } finally {
      setListLoading(false);
    }
  }, [search, appliedFilters, page, rowsPerPage, dateFilter]);

  const refreshList = useCallback(() => {
    void loadBatchList();
  }, [loadBatchList]);
  const activeFilterCount = Object.entries(appliedFilters).filter(([_, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "string") {
      return value !== "" && value !== "All";
    }

    return false;
  }).length;
  const setDraftFilter = (field: keyof typeof DEFAULT_BATCH_FILTERS, value: string | string[]) => {
    setDraftFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    setDraftFilters(DEFAULT_BATCH_FILTERS);
    setAppliedFilters(DEFAULT_BATCH_FILTERS);
    setPage(0);
  };

  return {
    batches,
    loading: listLoading,
    search,
    setSearch: (val: string) => {
      setSearch(val);
      setPage(0);
    },
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
    paginationData,
    activeFilterCount,
    clearFilters,
    loadBatchList,
    refreshList,
  };
}

function useBatchStatsSection(dateFilter: {
  filterType: string;
  startDate: string;
  endDate: string;
}) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [dateFilterOpen, setDateFilterOpen] = useState(true);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const data = await batchManagementController.getBatchStats(dateFilter);

      if (data) {
        setStats(data);
      }
    } finally {
      setStatsLoading(false);
    }
  }, [dateFilter]);

  const refreshDashboard = useCallback(() => {
    void fetchStats();
  }, [fetchStats]);

  const toggleDateFilter = () => {
    setDateFilterOpen((prev) => !prev);
  };

  return {
    stats,
    loading: statsLoading,

    dateFilterOpen,

    setDateFilterOpen,

    refreshDashboard,
    toggleDateFilter,
  };
}

function useBatchLookupsSection() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [motorStages, setMotorStages] = useState<any[]>([]);
  const [availableMotors, setAvailableMotors] = useState<any[]>([]);
  const [mixingCycles, setMixingCycles] = useState<MixingCycleMasterItem[]>([]);
  const [subscaleArticles, setSubscaleArticles] = useState<SubscaleArticleOption[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [availableMotorsLoading, setAvailableMotorsLoading] = useState(false);
  const [mixingCyclesLoading, setMixingCyclesLoading] = useState(false);

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);
    try {
      const [deptResp, subDeptResp, userResp, projectResp, motorStageResp, articlesResp] =
        await Promise.all([
          generalController.getDepartments(),
          generalController.getSubDepartments(),
          userManagementController.getAllUsers({
            search: "",
            role: "System Manager",
            department: "All",
            status: "Active",
            page: 1,
            pageSize: 1000,
          }),
          projectManagementController.getAllProjects({
            page: 1,
            limit: 1000,
            sortBy: "createdOn",
            sortOrder: "desc",
          }),
          operationsController.fetchMotorsStageList(),
          generalController.getSubscaleArticles(),
        ]);

      setDepartments(deptResp?.data || []);
      setSubDepts(subDeptResp?.data || []);

      if (userResp?.success && userResp.data) {
        const rawUsers = Array.isArray(userResp.data)
          ? userResp.data
          : (userResp.data as any).users || [];
        setUsers(rawUsers);
      } else {
        setUsers([]);
      }

      if (projectResp?.success && projectResp.data) {
        setProjects(projectResp.data.projects ?? []);
      } else {
        setProjects([]);
      }

      if (motorStageResp?.success && motorStageResp.data) {
        setMotorStages(motorStageResp.data.stages ?? []);
      } else {
        setMotorStages([]);
      }

      setSubscaleArticles(
        articlesResp?.success && Array.isArray(articlesResp.data) ? articlesResp.data : [],
      );
    } catch (err) {
      console.error(S.ERRORS.LOAD_LOOKUPS_FAILED, err);
      setProjects([]);
      setMotorStages([]);
      setSubscaleArticles([]);
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  const fetchApprovedMotors = useCallback(async (projectId: string, motorStage: string) => {
    const pid = String(projectId ?? "").trim();
    const stage = String(motorStage ?? "").trim();
    if (!pid || !stage) {
      setAvailableMotors([]);
      return;
    }

    setAvailableMotorsLoading(true);
    try {
      const resp = await operationsController.fetchApprovedMotorsList({
        projectId: pid,
        motorStage: stage,
      });
      if (resp?.success && resp.data) {
        setAvailableMotors(resp.data.motors ?? []);
      } else {
        setAvailableMotors([]);
      }
    } catch (err) {
      console.error("Failed to fetch approved motors:", err);
      setAvailableMotors([]);
    } finally {
      setAvailableMotorsLoading(false);
    }
  }, []);

  const clearApprovedMotors = useCallback(() => {
    setAvailableMotors([]);
  }, []);

  const fetchMixingCycles = useCallback(async (motorStage?: string | number | null) => {
    const stage = String(motorStage ?? "").trim();
    if (!stage) {
      setMixingCycles([]);
      return;
    }

    setMixingCyclesLoading(true);
    try {
      const resp = await generalController.getMixingCycles(stage);
      setMixingCycles(resp?.success && Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error("Failed to fetch mixing cycles:", err);
      setMixingCycles([]);
    } finally {
      setMixingCyclesLoading(false);
    }
  }, []);

  const clearMixingCycles = useCallback(() => {
    setMixingCycles([]);
  }, []);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  const deptNames = departments.map((d: any) => d.departmentName || d.name).filter(Boolean);
  const subDeptNames = subDepts.map((d: any) => d.subDepartmentName || d.name).filter(Boolean);

  const userOptions = users.map((u: any) => ({
    id: u.userId || u.userUUID || u.id,
    userUUID: u.userUUID || u.id || "",
    fullName: u.username || u.fullName || u.name,
    name: u.username || u.fullName || u.name || "",
    username: u.username,
  }));
  const projectOptions = projects.map((p: any) => ({
    projectId: p.projectId ?? "",
    projectName: p.projectName ?? p.projectId ?? "",
  }));
  const motorStageOptions = motorStages.map((stage: any) => ({
    motorStage: stage.motorStage ?? "",
    noOfmotors: stage.noOfmotors ?? 0,
    motorTypeId: stage.motorTypeId ?? 0,
  }));
  const availableMotorOptions = availableMotors.map((motor: any) => ({
    motorCasingId: motor.motorCasingId ?? "",
    motorId: motor.motorId ?? motor.motorNo ?? "",
    motorStage: motor.motorStage ?? "",
    motorNo: motor.motorNo ?? motor.motorId ?? "",
    projectId: motor.projectId ?? "",
    status: motor.status ?? "",
  }));

  const mixingCycleOptions = mixingCycles.map((cycle) => ({
    mixingCycleId: cycle.mixingCycleId,
    mixingCycleCode: cycle.mixingCycleCode,
    mixingCycleName: cycle.mixingCycleName,
    motorStage: cycle.motorStage,
    value: String(cycle.mixingCycleId),
    label: cycle.mixingCycleName || cycle.mixingCycleCode,
  }));

  // Prefer article code as selected value (API write shape).
  const articleOptions = subscaleArticles.map((article) => ({
    value: article.subscaleArticleCode,
    label: article.subscaleArticleName,
    id: article.subscaleArticleId,
    code: article.subscaleArticleCode,
  }));

  return {
    departments,
    subDepts,
    users,
    projects,
    motorStages,
    userOptions,
    projectOptions,
    motorStageOptions,
    availableMotorOptions,
    availableMotorsLoading,
    fetchApprovedMotors,
    clearApprovedMotors,
    mixingCycleOptions,
    mixingCyclesLoading,
    fetchMixingCycles,
    clearMixingCycles,
    articleOptions,
    subscaleArticlesLoading: lookupsLoading,
    deptNames,
    subDeptNames,
    loading: lookupsLoading,
    loadLookups,
  };
}

function useBatchFormSection(onRefresh: () => void) {
  const [modalOpen, setModalOpen] = useState(false);
  const [implModalOpen, setImplModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editImplTarget, setEditImplTarget] = useState<any>(null);
  const [batchForm, setBatchForm] = useState(createEmptyBatchFormState());
  const [implForm, setImplForm] = useState(createEmptyImplementationFormState());
  const [saving, setSaving] = useState(false);
  const [implSaving, setImplSaving] = useState(false);
  const [implViewOnly, setImplViewOnly] = useState(false);
  const [implFromBatchEdit, setImplFromBatchEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closeBatchConfirmOpen, setCloseBatchConfirmOpen] = useState(false);
  const [closeImplConfirmOpen, setCloseImplConfirmOpen] = useState(false);
  const [compositionTotal, setCompositionTotal] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsBatch, setDetailsBatch] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const batchFormBaselineRef = useRef("");
  const implFormBaselineRef = useRef("");
  const batchModalCloseCallbackRef = useRef<(() => void) | undefined>();

  const serializeFormSnapshot = (value: unknown) => JSON.stringify(value);

  const setBatchFormBaseline = (form: ReturnType<typeof createEmptyBatchFormState>) => {
    batchFormBaselineRef.current = serializeFormSnapshot(form);
  };

  const setImplFormBaseline = (form: ReturnType<typeof createEmptyImplementationFormState>) => {
    implFormBaselineRef.current = serializeFormSnapshot(form);
  };

  const isBatchFormDirty = () =>
    serializeFormSnapshot(batchForm) !== batchFormBaselineRef.current;

  const isImplFormDirty = () =>
    serializeFormSnapshot(implForm) !== implFormBaselineRef.current;

  const closeBatchModal = (afterClose?: () => void) => {
    setCloseBatchConfirmOpen(false);
    setModalOpen(false);
    setEditTarget(null);
    setBatchForm(createEmptyBatchFormState());
    setBatchFormBaseline(createEmptyBatchFormState());
    afterClose?.();
  };

  const closeImplModal = () => {
    setCloseImplConfirmOpen(false);
    setImplModalOpen(false);
    setEditImplTarget(null);
    setImplFromBatchEdit(false);
    setImplForm(createEmptyImplementationFormState());
    setImplFormBaseline(createEmptyImplementationFormState());
    setImplViewOnly(false);
  };

  const requestCloseBatchModal = (afterClose?: () => void) => {
    if (saving) return;
    if (isBatchFormDirty()) {
      batchModalCloseCallbackRef.current = afterClose;
      setCloseBatchConfirmOpen(true);
      return;
    }
    closeBatchModal(afterClose);
  };

  const confirmDiscardBatchModal = () => {
    const callback = batchModalCloseCallbackRef.current;
    batchModalCloseCallbackRef.current = undefined;
    closeBatchModal(callback);
  };

  const cancelDiscardBatchModal = () => {
    batchModalCloseCallbackRef.current = undefined;
    setCloseBatchConfirmOpen(false);
  };

  const requestCloseImplModal = () => {
    if (implSaving) return;
    if (!implViewOnly && isImplFormDirty()) {
      setCloseImplConfirmOpen(true);
      return;
    }
    closeImplModal();
  };

  const confirmDiscardImplModal = () => {
    closeImplModal();
  };

  const openCreate = () => {
    setEditTarget(null);
    const empty = createEmptyBatchFormState();
    setBatchForm(empty);
    setBatchFormBaseline(empty);
    setModalOpen(true);
  };

  const openEdit = async (batch: any) => {
    setSaving(true);
    setModalOpen(true);
    setEditTarget(batch);
    const initialMapped = mapBatchToFormState(batch);
    setBatchForm(initialMapped);
    setBatchFormBaseline(initialMapped);

    try {
      const resp = await batchManagementController.getBatchById(batch.batchId);
      if (resp) {
        setEditTarget(resp);
        const mapped = mapBatchToFormState(resp);
        setBatchForm(mapped);
        setBatchFormBaseline(mapped);
      } else {
        useAlertStore.getState().showAlert(S.MESSAGES.LOAD_BATCH_FAILED, "error");
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const loadImplementationForm = async (batch: any, viewOnly: boolean) => {
    setImplViewOnly(viewOnly);
    setImplFromBatchEdit(false);
    setImplSaving(true);
    setImplModalOpen(true);
    setEditImplTarget(batch);
    const initialMapped = mapBatchToImplementationFormState(batch);
    setImplForm(initialMapped);
    setImplFormBaseline(initialMapped);

    try {
      const resp = await batchManagementController.getBatchById(batch.batchId);

      if (resp) {
        setEditImplTarget(resp);
        const mapped = mapBatchToImplementationFormState(resp);
        setImplForm(mapped);
        setImplFormBaseline(mapped);
      } else {
        useAlertStore.getState().showAlert(S.MESSAGES.LOAD_BATCH_FAILED, "error");
        setImplModalOpen(false);
        setImplViewOnly(false);
      }
    } finally {
      setImplSaving(false);
    }
  };

  const openCompleteImplementation = async (batch: any) => {
    await loadImplementationForm(batch, false);
  };

  const openViewDetails = async (batch: any) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsBatch(batch);

    try {
      const resp = await batchManagementController.getBatchById(batch.batchId);
      if (resp) {
        setDetailsBatch(resp);
      } else {
        useAlertStore.getState().showAlert(S.MESSAGES.LOAD_BATCH_FAILED, "error");
        setDetailsOpen(false);
        setDetailsBatch(null);
      }
    } catch {
      useAlertStore.getState().showAlert(S.MESSAGES.LOAD_BATCH_FAILED, "error");
      setDetailsOpen(false);
      setDetailsBatch(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeViewDetails = () => {
    setDetailsOpen(false);
    setDetailsBatch(null);
    setDetailsLoading(false);
  };

  const openImplementationFromCreate = (options?: { viewOnly?: boolean }) => {
    const fromBatchEdit = Boolean(editTarget);
    setImplFromBatchEdit(fromBatchEdit);
    setImplViewOnly(Boolean(options?.viewOnly));
    setEditImplTarget(fromBatchEdit ? editTarget : null);
    const nextImpl = fromBatchEdit
      ? mapBatchToImplementationFormState(batchForm)
      : {
          identificationSheet:
            batchForm.identificationSheet ??
            createEmptyImplementationFormState().identificationSheet,
          objective: batchForm.objective ?? "",
          articles: Array.isArray(batchForm.articles) ? batchForm.articles : [],
        };
    setImplForm(nextImpl);
    setImplFormBaseline(nextImpl);
    setImplModalOpen(true);
  };

  const handleSaveBatch = async () => {
    const motorIds = Array.isArray(batchForm.motorIds) ? batchForm.motorIds : [];
    const isExperimental =
      batchForm.batchType === "SUBSCALE" && batchForm.subBatchType === "EXPERIMENTAL";
    const isMainOrQualification =
      batchForm.batchType === "MAIN" ||
      (batchForm.batchType === "SUBSCALE" && batchForm.subBatchType === "QUALIFICATION");

    const motorIdsValid = isExperimental
      ? true
      : motorIds.length > 0 && motorIds.every((id: string) => id && id.trim());

    if (!batchForm.batchType || !batchForm.systemManagerId) {
      useAlertStore.getState().showAlert(S.VALIDATION.REQUIRED_FIELDS, "warning");
      return;
    }

    if (batchForm.batchType === "SUBSCALE" && !batchForm.subBatchType) {
      useAlertStore.getState().showAlert(S.VALIDATION.REQUIRED_FIELDS, "warning");
      return;
    }

    if (!motorIdsValid) {
      useAlertStore.getState().showAlert(S.VALIDATION.REQUIRED_FIELDS, "warning");
      return;
    }

    if ((isMainOrQualification || isExperimental) && !batchForm.projectId) {
      useAlertStore.getState().showAlert(S.VALIDATION.PROJECT_REQUIRED, "warning");
      return;
    }

    if (isExperimental) {
      if (!batchForm.objective?.trim()) {
        useAlertStore.getState().showAlert(S.VALIDATION.OBJECTIVE_REQUIRED, "warning");
        return;
      }
      if (!Array.isArray(batchForm.articles) || batchForm.articles.length === 0) {
        useAlertStore.getState().showAlert(S.VALIDATION.ARTICLES_REQUIRED, "warning");
        return;
      }
    }

    const payload = isExperimental
      ? { ...batchForm, motorIds: [], numberOfMotors: 0 }
      : { ...batchForm, numberOfMotors: motorIds.length };

    if (editTarget) {
      const baseline = JSON.parse(batchFormBaselineRef.current) as ReturnType<
        typeof createEmptyBatchFormState
      >;
      if (!hasAdditionalBatchDetailsChanges(baseline, batchForm)) {
        return;
      }
    }

    setSaving(true);
    useAlertStore.getState().showAlert(S.MESSAGES.SAVING_BATCH, "info", { loading: true });

    const ok = editTarget
      ? await batchManagementController.updateBatch(
          editTarget.batchId,
          buildAdditionalBatchDetailsUpdatePayload(editTarget, batchForm),
        )
      : await batchManagementController.createBatch(payload);

    if (ok) {
      setTimeout(() => {
        onRefresh();
        closeBatchModal();
        setSaving(false);
      }, 1000);
    } else {
      setSaving(false);
    }
  };

  const handleSaveImplementation = async () => {
    setImplSaving(true);
    useAlertStore.getState().showAlert(S.MESSAGES.SAVING_IDENTIFICATION, "info", { loading: true });

    if (implFromBatchEdit && editTarget) {
      const payload = buildIdentificationUpdatePayload(editTarget, implForm);
      const ok = await batchManagementController.updateBatch(editTarget.batchId, payload);

      if (ok) {
        const refreshed = await batchManagementController.getBatchById(editTarget.batchId);
        if (refreshed) {
          const mapped = mapBatchToFormState(refreshed);
          setEditTarget(refreshed);
          setBatchForm(mapped);
          setBatchFormBaseline(mapped);
        } else {
          const nextBatchForm = {
            ...batchForm,
            identificationSheet: implForm.identificationSheet,
            identificationSheetStatus: IDENTIFICATION_SHEET_STATUS.COMPLETED,
            objective: implForm.objective ?? batchForm.objective,
            articles: Array.isArray(implForm.articles) ? implForm.articles : batchForm.articles,
          };
          setBatchForm(nextBatchForm);
          setBatchFormBaseline(nextBatchForm);
          setEditTarget((prev: any) =>
            prev
              ? {
                  ...prev,
                  identificationSheet: implForm.identificationSheet,
                  identificationSheetStatus: IDENTIFICATION_SHEET_STATUS.COMPLETED,
                  objective: implForm.objective ?? prev.objective,
                  articles: Array.isArray(implForm.articles) ? implForm.articles : prev.articles,
                }
              : prev,
          );
        }
        onRefresh();
        closeImplModal();
        setImplSaving(false);
      } else {
        setImplSaving(false);
      }
      return;
    }

    if (!editImplTarget) {
      const nextBatchForm = {
        ...batchForm,
        identificationSheet: implForm.identificationSheet,
        identificationSheetStatus: IDENTIFICATION_SHEET_STATUS.COMPLETED,
        objective: implForm.objective,
        articles: implForm.articles,
      };
      setBatchForm(nextBatchForm);
      setBatchFormBaseline(nextBatchForm);
      closeImplModal();
      setImplSaving(false);
      useAlertStore.getState().showAlert(S.MESSAGES.IMPLEMENTATION_SAVED_FOR_CREATE, "success");
      return;
    }

    const fullForm = {
      ...mapBatchToFormState(editImplTarget),
      ...implForm,
      identificationSheetStatus: IDENTIFICATION_SHEET_STATUS.COMPLETED,
    };
    const ok = await batchManagementController.updateBatch(editImplTarget.batchId, fullForm);

    if (ok) {
      setTimeout(() => {
        onRefresh();
        closeImplModal();
        setImplSaving(false);
      }, 1000);
    } else {
      setImplSaving(false);
    }
  };

  const handleBatchFormChange = (field: string) => (e: any) => {
    if (field === "numberOfMotors") {
      const raw = e.target.value;
      if (raw === "" || raw === null || raw === undefined) {
        // Count only — motor ID slots change only via Add / Delete.
        setBatchForm((prev) => ({ ...prev, numberOfMotors: 0 }));
        return;
      }
      const numberOfMotors = Math.floor(Number(raw));
      if (!Number.isFinite(numberOfMotors) || numberOfMotors < 0) return;
      setBatchForm((prev) => ({
        ...prev,
        numberOfMotors: Math.min(numberOfMotors, 10),
      }));
      return;
    }

    if (field === "batchType") {
      const nextValue = e.target.value;
      if (batchForm.batchType !== nextValue) {
        setBatchForm({
          ...createEmptyBatchFormState(),
          batchType: nextValue,
        });
        setImplForm(createEmptyImplementationFormState());
      }
      return;
    }

    if (field === "subBatchType") {
      const nextValue = e.target.value;
      setBatchForm((prev) => ({
        ...prev,
        subBatchType: nextValue,
        objective: nextValue === "EXPERIMENTAL" ? prev.objective : "",
        articles: [],
      }));
      return;
    }

    if (field.startsWith("identificationSheet.")) {
      const key = field.split(".")[1];
      setBatchForm((prev) => ({
        ...prev,
        identificationSheet: { ...prev.identificationSheet, [key]: e.target.value },
      }));
      return;
    }

    setBatchForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleMotorIdsChange = (motorIds: string[]) =>
    setBatchForm((prev) => ({ ...prev, motorIds }));

  const handleBatchMaterialsChange = (materials: any[]) =>
    setBatchForm((prev) => ({
      ...prev,
      identificationSheet: { ...prev.identificationSheet, materials },
    }));

  const handleImplFormChange = (field: string, value: any) => {
    if (field === "identificationSheet") {
      setImplForm((prev) => ({ ...prev, identificationSheet: value }));
      return;
    }
    setImplForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMaterialsChange = (materials: any[]) =>
    setImplForm((prev) => ({
      ...prev,
      identificationSheet: { ...prev.identificationSheet, materials },
    }));

  const canSaveBatchChanges =
    !editTarget ||
    hasAdditionalBatchDetailsChanges(
      JSON.parse(batchFormBaselineRef.current) as ReturnType<typeof createEmptyBatchFormState>,
      batchForm,
    );

  return {
    modalOpen,
    setModalOpen,
    editTarget,
    batchForm,
    saving,
    canSaveBatchChanges,
    openCreate,
    openEdit,
    handleSaveBatch,
    handleBatchFormChange,
    handleMotorIdsChange,
    handleBatchMaterialsChange,
    implModalOpen,
    setImplModalOpen,
    editImplTarget,
    implForm,
    implSaving,
    implViewOnly,
    setImplViewOnly,
    implFromBatchEdit,
    openCompleteImplementation,
    openViewDetails,
    detailsOpen,
    detailsBatch,
    detailsLoading,
    closeViewDetails,
    openImplementationFromCreate,
    handleSaveImplementation,
    handleImplFormChange,
    handleMaterialsChange,
    confirmOpen,
    setConfirmOpen,
    compositionTotal,
    setCompositionTotal,
    closeBatchConfirmOpen,
    closeImplConfirmOpen,
    requestCloseBatchModal,
    confirmDiscardBatchModal,
    cancelDiscardBatchModal,
    requestCloseImplModal,
    confirmDiscardImplModal,
    setCloseImplConfirmOpen,
  };
}

function useBatchImplementationSection(implModalOpen: boolean) {
  const [materialOptions, setMaterialOptions] = useState<BatchMaterialOption[]>([]);
  const [lotsByMaterialCode, setLotsByMaterialCode] = useState<
    Record<string, RawMaterialLotListRow[]>
  >({});
  const [mixerOptions, setMixerOptions] = useState<SystemMasterOption[]>([]);
  const [buildingOptions, setBuildingOptions] = useState<SystemMasterOption[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);
  const [loadingMasterLookups, setLoadingMasterLookups] = useState(false);

  const loadMaterials = useCallback(async () => {
    setLoadingMaterials(true);
    try {
      const res = await operationsController.fetchAllMaterialsList();
      if (res?.success && res.data != null) {
        setMaterialOptions(toBatchMaterialOptions(res.data));
      } else {
        setMaterialOptions([]);
      }
    } catch {
      setMaterialOptions([]);
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  const loadApprovedLots = useCallback(async () => {
    setLoadingLots(true);
    try {
      const res = await rawMaterialProcurementController.fetchLotList({
        subDepartmentId: ADMIN_RAW_MATERIAL_SUB_DEPARTMENT_ID,
        page: 1,
        limit: 500,
        status: [toRawMaterialLotListApiStatus(OPERATION_STATUS.APPROVED)],
      });

      if (res?.success && res.data) {
        const data = res.data as { lots?: unknown[] };
        const lots = (data.lots ?? []).map((lot, idx) => mapLotListApiRow(lot, idx));
        setLotsByMaterialCode(groupLotsByMaterialCode(lots));
      } else {
        setLotsByMaterialCode({});
      }
    } catch {
      setLotsByMaterialCode({});
    } finally {
      setLoadingLots(false);
    }
  }, []);

  const loadMixerAndBuildingOptions = useCallback(async () => {
    setLoadingMasterLookups(true);
    try {
      const [mixersRes, buildingsRes] = await Promise.all([
        generalController.getMixers(),
        generalController.getBuildings(),
      ]);
      setMixerOptions(
        mixersRes?.success && Array.isArray(mixersRes.data) ? mixersRes.data : [],
      );
      setBuildingOptions(
        buildingsRes?.success && Array.isArray(buildingsRes.data) ? buildingsRes.data : [],
      );
    } catch {
      setMixerOptions([]);
      setBuildingOptions([]);
    } finally {
      setLoadingMasterLookups(false);
    }
  }, []);

  useEffect(() => {
    if (!implModalOpen) return;
    void loadMaterials();
    void loadApprovedLots();
    void loadMixerAndBuildingOptions();
  }, [implModalOpen, loadMaterials, loadApprovedLots, loadMixerAndBuildingOptions]);

  const getLotsForMaterial = useCallback(
    (materialCode: string): RawMaterialLotListRow[] => {
      const key = normalizeMaterialCodeKey(materialCode);
      return key ? (lotsByMaterialCode[key] ?? []) : [];
    },
    [lotsByMaterialCode],
  );

  const getLotByMaterialAndId = useCallback(
    (materialCode: string, lotId: string): RawMaterialLotListRow | undefined => {
      const trimmed = String(lotId ?? "").trim();
      if (!trimmed) return undefined;
      return getLotsForMaterial(materialCode).find((lot) => lot.lotId === trimmed);
    },
    [getLotsForMaterial],
  );

  const getLotOptionsForRow = (
    materialCode: string,
    currentLotId: string,
    selectedElsewhere: Set<string>,
    gradeCode?: string | null,
  ): RawMaterialLotListRow[] => {
    const base = getLotsForMaterial(materialCode);
    const gradeKey = String(gradeCode ?? "").trim();
    const filtered = base.filter((lot) => {
      if (gradeKey) {
        const lotGrade = String(lot.grade?.gradeCode ?? "").trim();
        if (lotGrade && lotGrade !== gradeKey) return false;
      }
      if (lot.lotId === currentLotId) return true;
      return !selectedElsewhere.has(lot.lotId);
    });

    const trimmed = String(currentLotId ?? "").trim();
    if (trimmed && !filtered.some((lot) => lot.lotId === trimmed)) {
      return [
        {
          id: trimmed,
          lotId: trimmed,
          sourcingId: "",
          materialCode,
          materialName: "",
          grade: gradeKey
            ? { gradeId: 0, gradeCode: gradeKey, gradeName: gradeKey }
            : null,
          supplyOrderNo: "",
          receiptDate: "",
          manufacturerName: "",
          status: OPERATION_STATUS.APPROVED,
          rmStatus: OPERATION_STATUS.APPROVED,
          createdOn: "",
        },
        ...filtered,
      ];
    }

    return filtered;
  };

  return {
    materialOptions,
    lotsByMaterialCode,
    mixerOptions,
    buildingOptions,
    loadingMaterials,
    loadingLots,
    loadingMasterLookups,
    getLotsForMaterial,
    getLotByMaterialAndId,
    getLotOptionsForRow,
  };
}

function useBatchDeleteSection(onRefresh: () => void) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const openDelete = (batch: any) => {
    if (!canDeleteAdminBatch(batch)) {
      useAlertStore.getState().showAlert(S.VALIDATION.DELETE_BATCH_NOT_ALLOWED, "warning");
      return;
    }
    setDeleteTarget(batch);
    setDeleteReason("");
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteReason.trim()) return;

    setDeleting(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DELETING_BATCH, "info", { loading: true });

    const ok = await batchManagementController.deleteBatch(
      deleteTarget.batchId,
      deleteReason.trim(),
    );

    if (ok) {
      setTimeout(() => {
        onRefresh();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteReason("");
        setDeleting(false);
      }, 1000);
    } else {
      setDeleting(false);
    }
  };

  return {
    deleteOpen,
    setDeleteOpen,
    deleteTarget,
    deleteReason,
    setDeleteReason,
    deleting,
    openDelete,
    handleDelete,
  };
}

export default function useBatchManagementHook() {
  const [filterType, setFilterType] = useState(DEFAULT_DATE_FILTER_TYPE);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");

  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);

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
    setFilterType(DEFAULT_DATE_FILTER_TYPE);
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedCustomStart("");
    setAppliedCustomEnd("");
  }, []);

  const dateFilterPayload = useMemo(() => {
    if (filterType === "custom") {
      return {
        filterType: "custom",
        startDate: appliedCustomStart,
        endDate: appliedCustomEnd,
      };
    }

    const { startDate, endDate } = getDashboardFilterBounds(filterType);

    return {
      filterType: toDashboardApiFilterType(filterType),
      startDate,
      endDate,
    };
  }, [filterType, appliedCustomStart, appliedCustomEnd]);
  const list = useBatchListSection(dateFilterPayload);
  const stats = useBatchStatsSection(dateFilterPayload);
  const lookups = useBatchLookupsSection();

  const refreshAll = useCallback(() => {
    void list.loadBatchList();
    stats.refreshDashboard();
  }, [list.loadBatchList, stats.refreshDashboard]);

  const deleteSection = useBatchDeleteSection(refreshAll);
  const form = useBatchFormSection(refreshAll);
  const implementation = useBatchImplementationSection(form.implModalOpen);
  useEffect(() => {
    if (filterType === "custom" && (!appliedCustomStart || !appliedCustomEnd)) {
      return;
    }

    refreshAll();
  }, [filterType, appliedCustomStart, appliedCustomEnd, refreshAll]);

  return {
    list,
    stats,
    lookups,
    form,
    implementation,
    delete: deleteSection,
    refresh: refreshAll,
    filter: {
      handleFilterTypeChange,
      applyCustomDateFilter,
      clearDateFilter,
      setFilterType,
      setCustomStartDate,
      setCustomEndDate,
      filterType,
      customStartDate,
      customEndDate,
    },
  };
}
