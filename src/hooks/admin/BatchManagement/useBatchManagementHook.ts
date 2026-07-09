import { useState, useCallback, useEffect } from "react";
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
  mapBatchToFormState,
  mapBatchToImplementationFormState,
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
import { getDateRange } from "@utils/dateUtils";
import { OPERATION_STATUS } from "@hooks/operationStatus";

const S = STRINGS.BATCH_MANAGEMENT;

const DEFAULT_BATCH_FILTERS = {
  search: "",
  motorIds: [] as string[],
  stage: "All",
  status: "All",
  priority: "All",
  subDept: "All",
};
type BatchFilters = {
  search?: string;
  motorIds?: string[];
  motorStage?: string;
  status?: string;
  priority?: string;
  subDepartment?: string;
};

function useBatchListSection() {
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
      const filters: BatchFilters = {};
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
      if (appliedFilters.priority !== "All") filters.priority = appliedFilters.priority;
      if (appliedFilters.subDept !== "All") filters.subDepartment = appliedFilters.subDept;

      const resp = await batchManagementController.getAllBatches(page + 1, rowsPerPage, filters);
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
  }, [search, appliedFilters, page, rowsPerPage]);

  useEffect(() => {
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
  };
}

function useBatchStatsSection() {
  const [stats, setStats] = useState(null);
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
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const payload = getStatsPayload();
      const data = await batchManagementController.getBatchStats(payload);

      if (data) {
        setStats(data);
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
  const toggleDateFilter = () => {
    setDateFilterOpen((prev) => !prev);
  };
  const refreshDashboard = useCallback(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (filterType !== "custom") {
      refreshDashboard();
      return;
    }

    if (customStartDate && customEndDate) {
      refreshDashboard();
    }
  }, [filterType, customStartDate, customEndDate, refreshDashboard]);

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
  };
}

function useBatchLookupsSection() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [motorStages, setMotorStages] = useState<any[]>([]);
  const [availableMotors, setAvailableMotors] = useState<any[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [availableMotorsLoading, setAvailableMotorsLoading] = useState(false);

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);
    try {
      const [deptResp, subDeptResp, userResp, projectResp, motorStageResp] = await Promise.all([
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
    } catch (err) {
      console.error(S.ERRORS.LOAD_LOOKUPS_FAILED, err);
      setProjects([]);
      setMotorStages([]);
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

  const openCreate = () => {
    setEditTarget(null);
    setBatchForm(createEmptyBatchFormState());
    setModalOpen(true);
  };

  const openEdit = async (batch: any) => {
    setSaving(true);
    setModalOpen(true);
    setEditTarget(batch);
    setBatchForm(mapBatchToFormState(batch));

    try {
      const resp = await batchManagementController.getBatchById(batch.batchId);
      if (resp) {
        setEditTarget(resp);
        setBatchForm(mapBatchToFormState(resp));
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
    setImplSaving(true);
    setImplModalOpen(true);
    setEditImplTarget(batch);
    setImplForm(mapBatchToImplementationFormState(batch));

    try {
      const resp = await batchManagementController.getBatchById(batch.batchId);
      if (resp) {
        setEditImplTarget(resp);
        setImplForm(mapBatchToImplementationFormState(resp));
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

  const openViewImplementation = async (batch: any) => {
    await loadImplementationForm(batch, true);
  };

  const openImplementationFromCreate = () => {
    setImplViewOnly(false);
    setEditImplTarget(null);
    setImplForm({
      identificationSheet:
        batchForm.identificationSheet ?? createEmptyImplementationFormState().identificationSheet,
      objective: batchForm.objective ?? "",
      articles: Array.isArray(batchForm.articles) ? batchForm.articles : [],
    });
    setImplModalOpen(true);
  };

  const handleSaveBatch = async () => {
    const motorIdsValid =
      Array.isArray(batchForm.motorIds) &&
      batchForm.motorIds.length === batchForm.numberOfMotors &&
      batchForm.motorIds.every((id: string) => id && id.trim());

    if (
      !batchForm.batchType ||
      !batchForm.numberOfMotors ||
      !motorIdsValid ||
      !batchForm.priority ||
      !batchForm.systemManagerId
    ) {
      useAlertStore.getState().showAlert(S.VALIDATION.REQUIRED_FIELDS, "warning");
      return;
    }

    const isMainOrQualification =
      batchForm.batchType === "MAIN" ||
      (batchForm.batchType === "SUBSCALE" && batchForm.subBatchType === "QUALIFICATION");

    if (isMainOrQualification && !batchForm.projectId) {
      useAlertStore.getState().showAlert(S.VALIDATION.PROJECT_REQUIRED, "warning");
      return;
    }

    if (batchForm.batchType === "SUBSCALE" && batchForm.subBatchType === "EXPERIMENTAL") {
      if (!batchForm.objective?.trim()) {
        useAlertStore.getState().showAlert(S.VALIDATION.OBJECTIVE_REQUIRED, "warning");
        return;
      }
      if (!Array.isArray(batchForm.articles) || batchForm.articles.length === 0) {
        useAlertStore.getState().showAlert(S.VALIDATION.ARTICLES_REQUIRED, "warning");
        return;
      }
    }

    setSaving(true);
    useAlertStore.getState().showAlert(S.MESSAGES.SAVING_BATCH, "info", { loading: true });

    const ok = editTarget
      ? await batchManagementController.updateBatch(editTarget.batchId, batchForm)
      : await batchManagementController.createBatch(batchForm);

    if (ok) {
      setTimeout(() => {
        onRefresh();
        setModalOpen(false);
        setSaving(false);
      }, 1000);
    } else {
      setSaving(false);
    }
  };

  const handleSaveImplementation = async () => {
    setImplSaving(true);
    useAlertStore.getState().showAlert(S.MESSAGES.SAVING_IMPLEMENTATION, "info", { loading: true });

    if (!editImplTarget) {
      setBatchForm((prev) => ({
        ...prev,
        identificationSheet: implForm.identificationSheet,
        objective: implForm.objective,
        articles: implForm.articles,
      }));
      setImplModalOpen(false);
      setEditImplTarget(null);
      setImplForm(createEmptyImplementationFormState());
      setImplSaving(false);
      useAlertStore.getState().showAlert(S.MESSAGES.IMPLEMENTATION_SAVED_FOR_CREATE, "success");
      return;
    }

    const fullForm = { ...mapBatchToFormState(editImplTarget), ...implForm };
    const ok = await batchManagementController.updateBatch(editImplTarget.batchId, fullForm);

    if (ok) {
      setTimeout(() => {
        onRefresh();
        setImplModalOpen(false);
        setEditImplTarget(null);
        setImplForm(createEmptyImplementationFormState());
        setImplSaving(false);
      }, 1000);
    } else {
      setImplSaving(false);
    }
  };

  const handleBatchFormChange = (field: string) => (e: any) => {
    if (field === "numberOfMotors") {
      const numberOfMotors = Number(e.target.value) || 1;
      const motorIds = Array.from(
        { length: numberOfMotors },
        (_, idx) => batchForm.motorIds[idx] || "",
      );
      setBatchForm((prev) => ({ ...prev, numberOfMotors, motorIds }));
      return;
    }

    if (field === "batchType") {
      const nextValue = e.target.value;
      setBatchForm((prev) => ({
        ...prev,
        batchType: nextValue,
        subBatchType: nextValue === "SUBSCALE" ? prev.subBatchType : "",
      }));
      return;
    }

    if (field === "subBatchType") {
      const nextValue = e.target.value;
      setBatchForm((prev) => ({
        ...prev,
        subBatchType: nextValue,
        objective: nextValue === "EXPERIMENTAL" ? prev.objective : "",
        articles: nextValue === "EXPERIMENTAL" ? prev.articles : [],
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

  return {
    modalOpen,
    setModalOpen,
    editTarget,
    batchForm,
    saving,
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
    openCompleteImplementation,
    openViewImplementation,
    openImplementationFromCreate,
    handleSaveImplementation,
    handleImplFormChange,
    handleMaterialsChange,
  };
}

function useBatchImplementationSection(implModalOpen: boolean) {
  const [materialOptions, setMaterialOptions] = useState<BatchMaterialOption[]>([]);
  const [lotsByMaterialCode, setLotsByMaterialCode] = useState<
    Record<string, RawMaterialLotListRow[]>
  >({});
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);

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

  useEffect(() => {
    if (!implModalOpen) return;
    void loadMaterials();
    void loadApprovedLots();
  }, [implModalOpen, loadMaterials, loadApprovedLots]);

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
  ): RawMaterialLotListRow[] => {
    const base = getLotsForMaterial(materialCode);
    const filtered = base.filter((lot) => {
      if (lot.lotId === currentLotId) return true;
      return !selectedElsewhere.has(lot.lotId);
    });

    const trimmed = String(currentLotId ?? "").trim();
    if (trimmed && !filtered.some((lot) => lot.lotId === trimmed)) {
      return [
        {
          id: trimmed,
          lotId: trimmed,
          procurementId: "",
          materialCode,
          materialName: "",
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
    loadingMaterials,
    loadingLots,
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
  const list = useBatchListSection();
  const stats = useBatchStatsSection();
  const lookups = useBatchLookupsSection();

  const refreshAll = useCallback(() => {
    void list.loadBatchList();
    stats.refreshDashboard();
  }, [list.loadBatchList, stats.refreshDashboard]);

  const deleteSection = useBatchDeleteSection(refreshAll);
  const form = useBatchFormSection(refreshAll);
  const implementation = useBatchImplementationSection(form.implModalOpen);

  return {
    list,
    stats,
    lookups,
    form,
    implementation,
    delete: deleteSection,
    refresh: refreshAll,
  };
}
