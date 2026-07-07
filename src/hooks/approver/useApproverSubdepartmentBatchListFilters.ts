import { useEffect, useMemo, useState } from "react";

import { STRINGS } from "../../app/config/strings";
import { operationsController } from "../../controllers/user/operationsController";
import {
  approverRowMatchesSubmittedByFilter,
  APPROVER_BATCH_STATUS_TABS,
} from "../../data/models/approver/ApproverBatchListModel";
import { normalizeMotorStage } from "../../data/models/admin/BatchManagement/BatchManagementModel";
import { normalizeBatchTypeCode } from "../../data/models/user/SubdepartmentBatchModel";

const FILTER_ALL = STRINGS.APPROVER.COMMON.STATUS_ALL;

export type ApproverSubdepartmentBatchListAppliedFilters = {
  batchId: string;
  batchType: string;
  motorId: string;
  motorStage: string;
  submittedBy: string;
  fromDate: string;
  toDate: string;
};

const emptyAppliedFilters = (): ApproverSubdepartmentBatchListAppliedFilters => ({
  batchId: "",
  batchType: "",
  motorId: "",
  motorStage: "",
  submittedBy: "",
  fromDate: "",
  toDate: "",
});

type MotorStageOption = {
  motorStage: string;
};

const parseRowDate = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Optional client-side refinement when list rows are merged with local mock data. */
export const applyApproverSubdepartmentBatchListClientFilters = <T extends Record<string, unknown>>(
  rows: T[],
  filters: ApproverSubdepartmentBatchListAppliedFilters,
): T[] => {
  const batchIdQuery = filters.batchId.trim().toLowerCase();
  const batchTypeFilter = filters.batchType.trim();
  const motorIdQuery = filters.motorId.trim().toLowerCase();
  const motorStageFilter = filters.motorStage.trim();
  const submittedByQuery = filters.submittedBy.trim().toLowerCase();
  let fromDate = filters.fromDate.trim();
  let toDate = filters.toDate.trim();

  if (fromDate && toDate && fromDate > toDate) {
    const swap = fromDate;
    fromDate = toDate;
    toDate = swap;
  }

  return rows.filter((row) => {
    if (batchIdQuery && !String(row.batchId ?? "").toLowerCase().includes(batchIdQuery)) {
      return false;
    }

    if (batchTypeFilter) {
      const rowCode = normalizeBatchTypeCode(String(row.batchType ?? ""));
      if (normalizeBatchTypeCode(batchTypeFilter) !== rowCode) return false;
    }

    if (motorIdQuery && !String(row.motorId ?? "").toLowerCase().includes(motorIdQuery)) {
      return false;
    }

    if (motorStageFilter) {
      const rowStage = String(normalizeMotorStage(row.motorStage ?? row.motorType));
      if (rowStage !== String(normalizeMotorStage(motorStageFilter))) return false;
    }

    if (submittedByQuery && !approverRowMatchesSubmittedByFilter(row, submittedByQuery)) {
      return false;
    }

    if (fromDate || toDate) {
      const rowDate = parseRowDate(row.createdOn);
      if (!rowDate) return false;
      const day = rowDate.toISOString().slice(0, 10);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
    }

    return true;
  });
};

export const useApproverSubdepartmentBatchListFilters = () => {
  const [appliedFilters, setAppliedFilters] =
    useState<ApproverSubdepartmentBatchListAppliedFilters>(emptyAppliedFilters);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [motorStageOptions, setMotorStageOptions] = useState<MotorStageOption[]>([]);
  const [motorStagesLoading, setMotorStagesLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMotorStages = async () => {
      setMotorStagesLoading(true);
      try {
        const response = await operationsController.fetchMotorsStageList();
        if (!active) return;

        if (response?.success && response.data) {
          const stages = response.data.stages ?? [];
          setMotorStageOptions(
            stages
              .map((stage) => ({
                motorStage: String(stage.motorStage ?? "").trim(),
              }))
              .filter((stage) => stage.motorStage),
          );
        } else {
          setMotorStageOptions([]);
        }
      } catch {
        if (active) setMotorStageOptions([]);
      } finally {
        if (active) setMotorStagesLoading(false);
      }
    };

    void loadMotorStages();

    return () => {
      active = false;
    };
  }, []);

  const listFiltersRecord = useMemo(
    () => ({
      batchId: appliedFilters.batchId,
      batchType: appliedFilters.batchType || FILTER_ALL,
      motorId: appliedFilters.motorId,
      motorStage: appliedFilters.motorStage || FILTER_ALL,
      submittedBy: appliedFilters.submittedBy,
      fromDate: appliedFilters.fromDate,
      toDate: appliedFilters.toDate,
    }),
    [appliedFilters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.batchId.trim()) count += 1;
    if (appliedFilters.batchType.trim()) count += 1;
    if (appliedFilters.motorId.trim()) count += 1;
    if (appliedFilters.motorStage.trim()) count += 1;
    if (appliedFilters.submittedBy.trim()) count += 1;
    if (appliedFilters.fromDate.trim()) count += 1;
    if (appliedFilters.toDate.trim()) count += 1;
    if (statusFilter !== FILTER_ALL) count += 1;
    return count;
  }, [appliedFilters, statusFilter]);

  const applyPanelFilters = (
    next: ApproverSubdepartmentBatchListAppliedFilters & { status: string },
  ) => {
    setAppliedFilters({
      batchId: next.batchId,
      batchType: next.batchType,
      motorId: next.motorId,
      motorStage: next.motorStage,
      submittedBy: next.submittedBy,
      fromDate: next.fromDate,
      toDate: next.toDate,
    });
    setStatusFilter(next.status || FILTER_ALL);
  };

  const clearListFilters = () => {
    setAppliedFilters(emptyAppliedFilters());
    setStatusFilter(FILTER_ALL);
  };

  const statusTabs = useMemo(() => [FILTER_ALL, ...APPROVER_BATCH_STATUS_TABS], []);

  const statusDropdownValues = useMemo(() => [FILTER_ALL, ...APPROVER_BATCH_STATUS_TABS], []);

  return {
    appliedFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel: FILTER_ALL,
    motorStageOptions,
    motorStagesLoading,
    applyClientFilters: applyApproverSubdepartmentBatchListClientFilters,
  };
};

export default useApproverSubdepartmentBatchListFilters;
