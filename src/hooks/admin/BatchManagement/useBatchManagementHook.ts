import { useState, useCallback, useEffect } from "react";
import { batchManagementController } from "@controllers/admin/BatchManagement/batchManagementController";
import { generalController } from "@controllers/admin/common/generalController";
import { userManagementController } from "@controllers/admin/UserManagement/userManagementController";
import { projectManagementController } from "@controllers/admin/ProjectManagement/projectManagementController";
import { operationsController } from "@controllers/user/operationsController";
import rawMaterialProcurementController from "@controllers/user/sourcing/rawMaterialProcurementController";
import { parseIdentificationSheetFromApi } from "@data/models/admin/BatchManagement/BatchManagementModel";
import {
  toMaterialCodeNameOptions,
  type MaterialsListItem,
} from "@data/models/user/MaterialsListModel";
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

export const ADMIN_RAW_MATERIAL_SUB_DEPARTMENT_ID = 1;

export type BatchMaterialOption = {
  materialCode: string;
  materialName: string;
};

const EMPTY_IDENTIFICATION_SHEET = {
  date: "",
  batchSize: 0,
  bondingSheetNo: "",
  mixerType: "",
  BldgNo: "",
  numberOfPremix: 1,
  remarks: "",
  materials: [] as any[],
};

const EMPTY_BATCH_FORM = {
  batchType: "",
  subBatchType: "",
  projectId: "",
  motorStage: "",
  numberOfMotors: 1,
  motorIds: [""],
  priority: "Medium",
  systemManagerId: "",
  objective: "",
  articles: [],
  identificationSheet: { ...EMPTY_IDENTIFICATION_SHEET },
};

const EMPTY_IMPL_FORM = {
  identificationSheet: { ...EMPTY_IDENTIFICATION_SHEET },
  objective: "",
  articles: [],
};

const normalizeMaterialsList = (items: MaterialsListItem[]): BatchMaterialOption[] =>
  toMaterialCodeNameOptions(items);

export const normalizeMaterialCodeKey = (code: string | undefined | null): string =>
  String(code ?? "").trim().toUpperCase();

const groupLotsByMaterialCode = (lots: RawMaterialLotListRow[]) => {
  const grouped: Record<string, RawMaterialLotListRow[]> = {};
  for (const lot of lots) {
    const code = normalizeMaterialCodeKey(lot.materialCode);
    if (!code) continue;
    if (!grouped[code]) grouped[code] = [];
    grouped[code].push(lot);
  }
  return grouped;
};

export default function useBatchManagementHook() {
  /* ── List ─────────────────────────────────────────────────────────────── */
  const [batches, setBatches] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [filterOpen, setFilterOpen] = useState(false);
  const [paginationData, setPaginationData] = useState({ totalRecords: 0, totalPages: 0 });

  const loadBatchList = useCallback(async () => {
    setListLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (search.trim()) filters.search = search.trim();
      if (filterStatus !== "All") filters.status = filterStatus;
      if (filterPriority !== "All") filters.priority = filterPriority;
      if (filterDept !== "All") filters.department = filterDept;

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
  }, [search, filterStatus, filterPriority, filterDept, page, rowsPerPage]);

  useEffect(() => {
    void loadBatchList();
  }, [loadBatchList]);

  const activeFilters = [filterStage, filterStatus, filterPriority, filterDept]
    .filter((v) => v !== "All").length;

  const handleClearFilters = () => {
    setFilterStage("All");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterDept("All");
    setPage(0);
  };

  /* ── Stats ────────────────────────────────────────────────────────────── */
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filterType, setFilterType] = useState("month");

  const fetchStats = useCallback(async (type: string, start?: string, end?: string) => {
    setStatsLoading(true);
    const data = await batchManagementController.getBatchStats(type, start, end);
    if (data) setStats(data);
    setStatsLoading(false);
  }, []);

  const handleStatsFilterChange = async (e: any) => {
    const newType = e.target.value;
    setFilterType(newType);
    const { startDate, endDate } = getDateRange(newType);
    await fetchStats(newType, startDate, endDate);
  };

  useEffect(() => {
    const { startDate, endDate } = getDateRange("month");
    void fetchStats("month", startDate, endDate);
  }, [fetchStats]);

  const refreshStats = () => {
    const { startDate, endDate } = getDateRange(filterType);
    void fetchStats(filterType, startDate, endDate);
  };

  /* ── Lookups ──────────────────────────────────────────────────────────── */
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
      const resp = await operationsController.fetchApprovedMotorsList({ projectId: pid, motorStage: stage });
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

  /* ── Form / implementation / delete actions ───────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [implModalOpen, setImplModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editImplTarget, setEditImplTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [batchForm, setBatchForm] = useState({ ...EMPTY_BATCH_FORM });
  const [implForm, setImplForm] = useState({ ...EMPTY_IMPL_FORM });
  const [saving, setSaving] = useState(false);
  const [implSaving, setImplSaving] = useState(false);
  const [implViewOnly, setImplViewOnly] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refreshAll = useCallback(() => {
    void loadBatchList();
    const { startDate, endDate } = getDateRange(filterType);
    void fetchStats(filterType, startDate, endDate);
  }, [loadBatchList, filterType, fetchStats]);

  const batchModelToForm = (b: any) => {
    const motorStageRaw = b.motorStage ?? b.motorType;
    const motorStage =
      motorStageRaw != null && motorStageRaw !== ""
        ? String(
            typeof motorStageRaw === "object"
              ? motorStageRaw.motorTypeName ?? motorStageRaw.motorStage ?? ""
              : motorStageRaw
          )
        : "";

    return {
      batchType: b.batchType ?? "MAIN",
      subBatchType: b.subBatchType ?? "",
      projectId: b.projectId ?? "",
      motorStage,
      numberOfMotors: b.numberOfMotors ?? 1,
      motorIds: Array.isArray(b.motorIds) && b.motorIds.length > 0 ? b.motorIds : [""],
      priority: b.priority ?? "Medium",
      systemManagerId: b.systemManager?.id ?? b.systemManagerId ?? "",
      objective: b.objective ?? "",
      articles: Array.isArray(b.articles) ? b.articles : [],
      identificationSheet: b.identificationSheet
        ? parseIdentificationSheetFromApi(b.identificationSheet)
        : { ...EMPTY_IDENTIFICATION_SHEET },
    };
  };

  const implModelToForm = (b: any) => ({
    identificationSheet: b.identificationSheet
      ? parseIdentificationSheetFromApi(b.identificationSheet)
      : { ...EMPTY_IDENTIFICATION_SHEET },
    objective: b.objective ?? "",
    articles: Array.isArray(b.articles) ? b.articles : [],
  });

  const openCreate = () => {
    setEditTarget(null);
    setBatchForm({ ...EMPTY_BATCH_FORM });
    setModalOpen(true);
  };

  const openEdit = async (batch: any) => {
    setSaving(true);
    setModalOpen(true);
    setEditTarget(batch);
    setBatchForm(batchModelToForm(batch));

    try {
      const resp = await batchManagementController.getBatchById(batch.batchId);
      if (resp) {
        setEditTarget(resp);
        setBatchForm(batchModelToForm(resp));
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
    setImplForm(implModelToForm(batch));

    try {
      const resp = await batchManagementController.getBatchById(batch.batchId);
      if (resp) {
        setEditImplTarget(resp);
        setImplForm(implModelToForm(resp));
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
      identificationSheet: batchForm.identificationSheet ?? { ...EMPTY_IMPL_FORM.identificationSheet },
      objective: batchForm.objective ?? "",
      articles: Array.isArray(batchForm.articles) ? batchForm.articles : [],
    });
    setImplModalOpen(true);
  };

  const openDelete = (batch: any) => {
    setDeleteTarget(batch);
    setDeleteReason("");
    setDeleteOpen(true);
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
        refreshAll();
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
      setImplForm({ ...EMPTY_IMPL_FORM });
      setImplSaving(false);
      useAlertStore.getState().showAlert(S.MESSAGES.IMPLEMENTATION_SAVED_FOR_CREATE, "success");
      return;
    }

    const fullForm = { ...batchModelToForm(editImplTarget), ...implForm };
    const ok = await batchManagementController.updateBatch(editImplTarget.batchId, fullForm);

    if (ok) {
      setTimeout(() => {
        refreshAll();
        setImplModalOpen(false);
        setEditImplTarget(null);
        setImplForm({ ...EMPTY_IMPL_FORM });
        setImplSaving(false);
      }, 1000);
    } else {
      setImplSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteReason.trim()) return;

    setDeleting(true);
    useAlertStore.getState().showAlert(S.MESSAGES.DELETING_BATCH, "info", { loading: true });

    const ok = await batchManagementController.deleteBatch(deleteTarget.batchId, deleteReason.trim());

    if (ok) {
      setTimeout(() => {
        refreshAll();
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteReason("");
        setDeleting(false);
      }, 1000);
    } else {
      setDeleting(false);
    }
  };

  const handleBatchFormChange = (field: string) => (e: any) => {
    if (field === "numberOfMotors") {
      const numberOfMotors = Number(e.target.value) || 1;
      const motorIds = Array.from({ length: numberOfMotors }, (_, idx) => batchForm.motorIds[idx] || "");
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

  /* ── Implementation lots ──────────────────────────────────────────────── */
  const [materialOptions, setMaterialOptions] = useState<BatchMaterialOption[]>([]);
  const [lotsByMaterialCode, setLotsByMaterialCode] = useState<Record<string, RawMaterialLotListRow[]>>({});
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);

  const loadMaterials = useCallback(async () => {
    setLoadingMaterials(true);
    try {
      const res = await operationsController.fetchAllMaterialsList();
      if (res?.success && res.data != null) {
        setMaterialOptions(normalizeMaterialsList(res.data));
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
    [lotsByMaterialCode]
  );

  const getLotByMaterialAndId = useCallback(
    (materialCode: string, lotId: string): RawMaterialLotListRow | undefined => {
      const trimmed = String(lotId ?? "").trim();
      if (!trimmed) return undefined;
      return getLotsForMaterial(materialCode).find((lot) => lot.lotId === trimmed);
    },
    [getLotsForMaterial]
  );

  const getLotOptionsForRow = (
    materialCode: string,
    currentLotId: string,
    selectedElsewhere: Set<string>
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
    list: {
      batches,
      loading: listLoading,
      search,
      setSearch: (val: string) => {
        setSearch(val);
        setPage(0);
      },
      filterStage,
      setFilterStage,
      filterStatus,
      setFilterStatus,
      filterPriority,
      setFilterPriority,
      filterDept,
      setFilterDept,
      page,
      setPage,
      rowsPerPage,
      setRowsPerPage,
      filterOpen,
      setFilterOpen,
      paginationData,
      activeFilters,
      handleClearFilters,
      loadBatchList,
    },
    stats: {
      stats,
      loading: statsLoading,
      filterType,
      handleStatsFilterChange,
      refreshStats,
    },
    lookups: {
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
      loading: lookupsLoading,
      loadLookups,
    },
    form: {
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
    },
    implementation: {
      materialOptions,
      lotsByMaterialCode,
      loadingMaterials,
      loadingLots,
      getLotsForMaterial,
      getLotByMaterialAndId,
      getLotOptionsForRow,
    },
    delete: {
      deleteOpen,
      setDeleteOpen,
      deleteTarget,
      deleteReason,
      setDeleteReason,
      deleting,
      openDelete,
      handleDelete,
    },
    refresh: refreshAll,
  };
}
