import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { systemManagerController } from "../../controllers/system_manager/systemManagerController";

type ActiveBatchLike = Record<string, any>;

export type InProgressBatchUIRow = {
  id?: string;
  batchId: string;
  batchType?: string;
  motorId?: string;
  motorType?: string;
  projectName?: string;
  currentStage?: string;
  stageDept?: string;
  managerName?: string;
  managerId?: string;
  status?: string;
  createdOn?: string;
  completion?: number;
  color?: string;
};

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
  const stageKey = toStageKey(batch.department ?? batch.stage);
  return {
    id: batch.id || batch.batchId,
    batchId: batch.batchId || "NA",
    batchType: batch.priority || "NA",
    motorId: batch.motorId || "NA",
    motorType: batch.motorTypeName || "NA",
    projectName: batch.projectName || "NA",
    currentStage: batch.substage || batch.firstSubDept || "NA",
    stageDept: batch.stage || batch.department || "",
    managerName: "NA",
    managerId: "NA",
    status: batch.status || "NA",
    createdOn: batch.createdDate || "",
    completion: typeof batch.pct === "number" ? batch.pct : (batch.progressPercentage || 0),
    color: batch.color || stageColors[stageKey] || stageColors.fallback || "#1976d2",
  };
};

const resolveTotalRecords = (pagination: Record<string, unknown> | null | undefined, fallback: number) => {
  const nested = pagination?.pagination as Record<string, unknown> | undefined;
  const total = Number(
    pagination?.totalRecords ??
    pagination?.total ??
    nested?.totalRecords ??
    nested?.total ??
    0,
  );
  return total > 0 ? total : fallback;
};

export function useSMInProgressBatches(stageColors: Record<string, string>) {
  const [batchFilterOpen, setBatchFilterOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchStage, setBatchStage] = useState("All");
  const [batchType, setBatchType] = useState("All");
  const [batchStatus, setBatchStatus] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [activeBatches, setActiveBatches] = useState<ActiveBatchLike[]>([]);

  const fetchBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const result = await systemManagerController.getActiveBatches({
        page: page + 1,
        limit: rowsPerPage,
        search: batchSearch.trim() || undefined,
        priority: batchType !== "All" ? batchType : undefined,
        status: batchStatus !== "All" ? batchStatus : undefined,
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
  }, [page, rowsPerPage, batchSearch, batchType, batchStatus, stageColors]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    setPage(0);
  }, [batchSearch, batchStage, batchType, batchStatus]);

  const inProgressRows = useMemo<InProgressBatchUIRow[]>(
    () => activeBatches.map((batch) => mapActiveBatchToRow(batch, stageColors)),
    [activeBatches, stageColors],
  );

  const stageOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(inProgressRows.map((r) => (r.stageDept || r.currentStage || "").trim()).filter(Boolean))),
    ],
    [inProgressRows],
  );

  const typeOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(inProgressRows.map((r) => (r.batchType || "").trim()).filter(Boolean))),
    ],
    [inProgressRows],
  );

  const statusOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(inProgressRows.map((r) => (r.status || "").trim()).filter(Boolean))),
    ],
    [inProgressRows],
  );

  const filteredInProgressRows = useMemo(() => {
    if (batchStage === "All") return inProgressRows;

    return inProgressRows.filter((row) => {
      const rowStage = String(row.stageDept || row.currentStage || "").toLowerCase();
      return rowStage === batchStage.toLowerCase();
    });
  }, [inProgressRows, batchStage]);

  const activeBatchFilterCount = [
    batchSearch.trim().length > 0,
    batchStage !== "All",
    batchType !== "All",
    batchStatus !== "All",
  ].filter(Boolean).length;

  const clearBatchFilters = () => {
    setBatchSearch("");
    setBatchStage("All");
    setBatchType("All");
    setBatchStatus("All");
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
      stage: row.stageDept ?? "—",
      substage: row.currentStage ?? "—",
      status: row.status ?? "Active",
      pct: row.completion ?? 0,
      color: row.color ?? "#1976d2",
    });
  };

  const closeBatchDetails = () => setSelectedBatch(null);

  return {
    batchFilterOpen,
    setBatchFilterOpen,
    batchSearch,
    setBatchSearch,
    batchStage,
    setBatchStage,
    batchType,
    setBatchType,
    batchStatus,
    setBatchStatus,
    activeBatchFilterCount,
    clearBatchFilters,
    inProgressRows,
    filteredInProgressRows,
    stageOptions,
    typeOptions,
    statusOptions,
    selectedBatch,
    handleViewDetails,
    closeBatchDetails,
    batchesLoading,
    page,
    rowsPerPage,
    totalRecords,
    handlePageChange,
    handleRowsPerPageChange,
  };
}

export default useSMInProgressBatches;
