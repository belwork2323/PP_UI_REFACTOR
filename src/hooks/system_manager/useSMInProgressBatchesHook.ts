import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toOperationStatusApiValue } from "@/hooks/operationStatus";
import { systemManagerController } from "../../controllers/system_manager/systemManagerController";
import { generalController } from "../../controllers/admin/common/generalController";
import {
  APPROVER_BATCH_STATUS,
  APPROVER_BATCH_STATUS_LABEL,
} from "../../data/models/approver/ApproverBatchListModel";
import { STRINGS } from "../../app/config/strings";
import { BatchTab } from "../admin/Dashboard/useDashboardHook";

type ActiveBatchLike = Record<string, any>;

export type InProgressBatchUIRow = {
  id?: string;
  batchId: string;
  batchType?: string;
  motorId?: string;
  motorType?: string;
  projectName?: string;
  /** Department name — used for stage chip color/icon */
  currentStage?: string;
  /** Sub-department name — shown as Current Stage chip label */
  stageDept?: string;
  managerName?: string;
  managerId?: string;
  status?: string;
  createdOn?: string;
  completion?: number;
  color?: string;
  priority?: string;
};

type BatchPanelFilters = {
  stage: string;
  batchType: string;
  status: string;
};

const DEFAULT_PANEL_FILTERS: BatchPanelFilters = {
  stage: "All",
  batchType: "All",
  status: "All",
};

const TYPE_OPTIONS = STRINGS.DASHBOARD_PAGE.BATCH_FILTERS.TYPES;
const STATUS_OPTIONS = ["All", ...Object.values(APPROVER_BATCH_STATUS_LABEL)];

const toStageKey = (stageName: string = "") => {
  const normalized = stageName.toLowerCase();
  if (normalized.includes("source")) return "sourcing";
  if (normalized.includes("manufact")) return "manufacturing";
  if (normalized.includes("quality") || normalized.includes("qc")) return "quality";
  if (normalized.includes("dispatch")) return "dispatch";
  return normalized || "sourcing";
};

const mapActiveBatchToRow = (
  batch: ActiveBatchLike,
  stageColors: Record<string, string>,
): InProgressBatchUIRow => {
  const department = String(batch.department ?? "").trim();
  const stageKey = toStageKey(department);
  const subDeptName = String(
    batch.firstSubDept ||
      (Array.isArray(batch.subDepartments) && batch.subDepartments[0]?.subDepartmentName) ||
      "",
  ).trim();

  return {
    id: batch.id || batch.batchId,
    batchId: batch.batchId || "NA",
    batchType: batch.batchType || batch.type || batch.priority || "NA",
    motorId: batch.motorId || "NA",
    motorType: batch.motorTypeName || "NA",
    projectName: batch.projectName || "NA",
    // Department drives chip color/icon; sub-department is the Current Stage label.
    currentStage: department || "NA",
    stageDept: subDeptName || department || "NA",
    managerName: batch.systemManager?.name || "NA",
    managerId: batch.systemManager?.id || "NA",
    status: batch.status || "NA",
    createdOn: batch.createdDate || batch.createdOn || "",
    completion: typeof batch.pct === "number" ? batch.pct : batch.progressPercentage || 0,
    color: batch.color || stageColors[stageKey] || stageColors.fallback || "#1976d2",
    priority: batch.priority || "Medium",
  };
};

const resolveTotalRecords = (
  pagination: Record<string, unknown> | null | undefined,
  fallback: number,
) => {
  const nested = pagination?.pagination as Record<string, unknown> | undefined;
  const total = Number(
    pagination?.totalRecords ?? pagination?.total ?? nested?.totalRecords ?? nested?.total ?? 0,
  );
  return total > 0 ? total : fallback;
};

export function useSMInProgressBatches(
  stageColors: Record<string, string>,
  globalDateBounds: { filterType: string; startDate: string; endDate: string },
) {
  const [batchFilterOpen, setBatchFilterOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState<BatchPanelFilters>(DEFAULT_PANEL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<BatchPanelFilters>(DEFAULT_PANEL_FILTERS);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [activeBatches, setActiveBatches] = useState<ActiveBatchLike[]>([]);
  const [activeTab, setActiveTab] = useState<BatchTab>("IN_PROGRESS");
  const [subDepartments, setSubDepartments] = useState<string[]>([]);

  const filterType = String(globalDateBounds?.filterType ?? "").trim();
  const startDate = String(globalDateBounds?.startDate ?? "").trim();
  const endDate = String(globalDateBounds?.endDate ?? "").trim();
  const dateBoundsReady = Boolean(filterType && startDate && endDate);

  useEffect(() => {
    generalController.getSubDepartments().then((resp) => {
      if (resp?.data) {
        setSubDepartments(
          (resp.data as any[]).map((sd: any) => sd.subDepartmentName).filter(Boolean),
        );
      }
    });
  }, []);

  const setBatchDraftFilter = useCallback(
    <K extends keyof BatchPanelFilters>(field: K, value: BatchPanelFilters[K]) => {
      setDraftFilters((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const fetchBatches = useCallback(async () => {
    if (!dateBoundsReady) return;

    setBatchesLoading(true);
    try {
      const result = await systemManagerController.getActiveBatches({
        page: page + 1,
        limit: rowsPerPage,
        filterType,
        startDate,
        endDate,
        search: batchSearch.trim() || undefined,
        stage: appliedFilters.stage !== "All" ? appliedFilters.stage : undefined,
        type: appliedFilters.batchType !== "All" ? appliedFilters.batchType : undefined,
        status: toOperationStatusApiValue(appliedFilters.status, "All") || undefined,
        listType: activeTab,
      });

      if (!result.success) {
        setActiveBatches([]);
        setTotalRecords(0);
        return;
      }

      const mappedBatches = (result.batches ?? []).map((batch: ActiveBatchLike) => {
        const stageKey = toStageKey(batch.department);
        return {
          ...batch,
          id: batch.batchId,
          stage: batch.department || "Unassigned",
          substage: batch.firstSubDept,
          pct: batch.progressPercentage,
          color: stageColors[stageKey] ?? stageColors.fallback ?? "#1976d2",
        };
      });

      setActiveBatches(mappedBatches);
      setTotalRecords(resolveTotalRecords(result.pagination, mappedBatches.length));
    } finally {
      setBatchesLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    batchSearch,
    appliedFilters,
    filterType,
    startDate,
    endDate,
    dateBoundsReady,
    stageColors,
    activeTab,
  ]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    setPage(0);
  }, [batchSearch, appliedFilters, filterType, startDate, endDate, activeTab]);

  const inProgressRows = useMemo<InProgressBatchUIRow[]>(
    () => activeBatches.map((batch) => mapActiveBatchToRow(batch, stageColors)),
    [activeBatches, stageColors],
  );

  const stageOptions = useMemo(() => ["All", ...subDepartments], [subDepartments]);

  const activeBatchFilterCount = [
    batchSearch.trim().length > 0,
    appliedFilters.stage !== "All",
    appliedFilters.batchType !== "All",
    appliedFilters.status !== "All",
  ].filter(Boolean).length;

  const clearBatchFilters = () => {
    setBatchSearch("");
    setDraftFilters(DEFAULT_PANEL_FILTERS);
    setAppliedFilters(DEFAULT_PANEL_FILTERS);
  };

  const toggleBatchFilterOpen = () => {
    setBatchFilterOpen((prev) => {
      if (!prev) setDraftFilters({ ...appliedFilters });
      return !prev;
    });
  };

  const applyBatchFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setBatchFilterOpen(false);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (row: InProgressBatchUIRow) => {
    setSelectedBatch({
      id: row.batchId,
      motorId: row.motorId ?? "—",
      stage: row.currentStage ?? "—",
      substage: row.stageDept ?? "—",
      status: row.status ?? "Active",
      pct: row.completion ?? 0,
      color: row.color ?? "#1976d2",
    });
  };

  const closeBatchDetails = () => setSelectedBatch(null);

  return {
    batchFilterOpen,
    setBatchFilterOpen,
    toggleBatchFilterOpen,

    batchSearch,
    setBatchSearch,

    batchDraftFilters: draftFilters,
    setBatchDraftFilter,

    /** Applied values kept for display compatibility */
    batchStage: appliedFilters.stage,
    batchType: appliedFilters.batchType,
    batchStatus: appliedFilters.status,

    activeBatchFilterCount,
    clearBatchFilters,
    applyBatchFilters,

    inProgressRows,
    filteredInProgressRows: inProgressRows,

    stageOptions,
    typeOptions: TYPE_OPTIONS,
    statusOptions: STATUS_OPTIONS,
    subDepartments,

    selectedBatch,
    handleViewDetails,
    closeBatchDetails,

    batchesLoading,

    page,
    rowsPerPage,
    totalRecords,

    handlePageChange,
    handleRowsPerPageChange,

    activeTab,
    setActiveTab,
  };
}

export default useSMInProgressBatches;
