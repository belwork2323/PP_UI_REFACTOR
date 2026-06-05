import { useMemo, useState } from "react";

type BatchStatusRow = {
  batchId?: string;
  motorId?: string;
  projectName?: string;
  progressPercentage?: number;
  createdDate?: string;
  lastUpdatedOn?: string;
  lastUpdatedStage?: any;
  currentStage?: any[];
  stageHistory?: any[];
};

export function useSMBatchStatusDetails(rows: BatchStatusRow[]) {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  const toggleExpanded = (batchId: string) => {
    setExpandedBatchId((prev) => (prev === batchId ? null : batchId));
  };

  const totalPending = useMemo(() => {
    return rows.reduce((sum, row) => {
      const current = Array.isArray(row.currentStage) ? row.currentStage : [];
      const pendingInRow = current.filter((s: any) => {
        const status = String(s?.status || "").toLowerCase();
        return status !== "approved" && status !== "completed";
      }).length;
      return sum + pendingInRow;
    }, 0);
  }, [rows]);

  return {
    expandedBatchId,
    toggleExpanded,
    totalPending,
  };
}

export default useSMBatchStatusDetails;