import { useMemo, useState } from "react";

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

export function useSMInProgressBatches(activeBatches: ActiveBatchLike[]) {
  const [batchFilterOpen, setBatchFilterOpen] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchStage, setBatchStage] = useState("All");
  const [batchType, setBatchType] = useState("All");
  const [batchStatus, setBatchStatus] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const inProgressRows = useMemo<InProgressBatchUIRow[]>(() => (
    activeBatches.map((b: any) => ({
      id: b.id || b.batchId,
      batchId: b.batchId || "NA",
      batchType: b.priority || "NA",
      motorId: b.motorId || "NA",
      motorType: b.motorTypeName || "NA",
      projectName: b.projectName || "NA",
      currentStage: b.substage || b.firstSubDept || "NA",
      stageDept: b.stage || b.department || "",
      managerName: "NA",
      managerId: "NA",
      status: b.status || "NA",
      createdOn: b.createdDate || "",
      completion: typeof b.pct === "number" ? b.pct : (b.progressPercentage || 0),
      color: b.color || "#1976d2",
    }))
  ), [activeBatches]);

  const stageOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(inProgressRows.map((r) => (r.stageDept || r.currentStage || "").trim()).filter(Boolean))),
    ],
    [inProgressRows]
  );

  const typeOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(inProgressRows.map((r) => (r.batchType || "").trim()).filter(Boolean))),
    ],
    [inProgressRows]
  );

  const statusOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(inProgressRows.map((r) => (r.status || "").trim()).filter(Boolean))),
    ],
    [inProgressRows]
  );

  const filteredInProgressRows = useMemo(() => {
    const q = batchSearch.trim().toLowerCase();

    return inProgressRows.filter((row) => {
      const matchesSearch = !q || [
        row.batchId,
        row.motorId,
        row.projectName,
        row.currentStage,
        row.stageDept,
        row.status,
      ].some((v) => String(v || "").toLowerCase().includes(q));

      const rowStage = String(row.stageDept || row.currentStage || "").toLowerCase();
      const matchesStage = batchStage === "All" || rowStage === batchStage.toLowerCase();

      const rowType = String(row.batchType || "").toLowerCase();
      const matchesType = batchType === "All" || rowType === batchType.toLowerCase();

      const rowStatus = String(row.status || "").toLowerCase();
      const matchesStatus = batchStatus === "All" || rowStatus === batchStatus.toLowerCase();

      return matchesSearch && matchesStage && matchesType && matchesStatus;
    });
  }, [inProgressRows, batchSearch, batchStage, batchType, batchStatus]);

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

  const handleViewDetails = (row: InProgressBatchUIRow) => {
    setSelectedBatch({
      id:       row.batchId,
      motorId:  row.motorId  ?? "—",
      stage:    row.stageDept ?? "—",
      substage: row.currentStage ?? "—",
      status:   row.status   ?? "Active",
      pct:      row.completion ?? 0,
      color:    row.color    ?? "#1976d2",
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
  };
}

export default useSMInProgressBatches;