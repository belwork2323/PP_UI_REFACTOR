import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import { operationsController } from "../../../controllers/user/operationsController";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import {
  normalizeRocketCasingListStatus,
  rocketMotorCasingMatchesSearch,
} from "../../../data/models/user/RocketMotorCasingProcurementModel";
import { OPERATION_STATUS } from "../../operationStatus";
import type { RocketMotorBatch } from "./sourcingWorkflowData";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
/** Fetch up to this many rows when filtering search client-side across all columns */
const CLIENT_SEARCH_FETCH_LIMIT = 5000;

const buildStatusCountsFromBatches = (batches: RocketMotorBatch[], totalRecords: number) => {
  const S = OPERATION_STATUS;
  const counts: Record<string, number> = {
    [S.INITIATED]: 0,
    [S.IN_PROGRESS]: 0,
    [S.WAITING_FOR_APPROVAL]: 0,
    [S.APPROVED]: 0,
    [S.REJECTED]: 0,
  };
  batches.forEach((batch) => {
    const status = batch.rmStatus;
    if (status in counts) counts[status] += 1;
  });
  return {
    ...counts,
    [FILTER_ALL]: totalRecords,
  };
};

const UI_STATUS_TO_API: Record<string, string> = {
  [OPERATION_STATUS.INITIATED]: "INITIATED",
  [OPERATION_STATUS.IN_PROGRESS]: "IN_PROGRESS",
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: "WAITING_FOR_APPROVAL",
  [OPERATION_STATUS.APPROVED]: "APPROVED",
  [OPERATION_STATUS.REJECTED]: "REJECTED",
};

export type MotorStageOption = { motorStage: string; noOfmotors: number };

export type RocketMotorCasingListAdvancedFilters = {
  motorStages: string[];
  casingTypes: string[];
  insulationTypes: string[];
  fromDate: string;
  toDate: string;
};

const emptyAdvanced: RocketMotorCasingListAdvancedFilters = {
  motorStages: [],
  casingTypes: [],
  insulationTypes: [],
  fromDate: "",
  toDate: "",
};

/** Map list API row → batch shape used by RocketMotorBatchList / form hook */
export function mapRocketMotorCasingListRow(row: Record<string, unknown>): RocketMotorBatch {
  const motorCasingId = String(row?.motorCasingId ?? "").trim();
  const projectId = String(row?.projectId ?? "").trim();
  const motorStage =
    row?.motorStage != null && String(row.motorStage).trim() !== "" ? String(row.motorStage) : "";
  const motorId = String(row?.motorId ?? row?.motorNo ?? "").trim();
  const casingType = String(row?.casingType ?? "").trim();
  const statusRaw = String(row?.status ?? "");
  const rmStatus = normalizeRocketCasingListStatus(statusRaw);

  const createdBy =
    row?.createdBy && typeof row.createdBy === "object"
      ? {
          id: String((row.createdBy as { id?: string }).id ?? "").trim(),
          fullName: String((row.createdBy as { fullName?: string }).fullName ?? "").trim(),
        }
      : null;

  return {
    id: motorCasingId || motorId,
    formId: null,
    procurementId: null,
    motorCasingId,
    projectId,
    motorStage,
    motorNo: motorId,
    motorId: motorId || "—",
    casingType,
    insulationType: String(row?.insulationType ?? "").trim(),
    receivingDate: String(row?.receivingDate ?? "").trim(),
    nextStep: row?.nextStep != null ? String(row.nextStep) : null,
    batchId: motorCasingId || "—",
    batchType: casingType || "—",
    motorType: motorStage,
    priority: "",
    assignedTo: createdBy ? { fullName: createdBy.fullName } : null,
    createdBy,
    createdOn: String(row?.createdOn ?? ""),
    rmStatus,
    draftData: null,
    rejectionReason: null,
  };
}

const mapStatusCountsForUi = (server: Record<string, number> | undefined, totalRecords: number) => {
  const S = OPERATION_STATUS;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = server?.[k];
      if (typeof v === "number") return v;
    }
    return 0;
  };

  const byLabel: Record<string, number> = {
    [S.INITIATED]: pick("initiated", "Initiated", "INITIATED"),
    [S.IN_PROGRESS]: pick("inProgress", "inProgress", "In Progress", "IN_PROGRESS"),
    [S.WAITING_FOR_APPROVAL]: pick("waitingForApproval", "waitingforApproval", "Waiting for Approval", "WAITING_FOR_APPROVAL"),
    [S.APPROVED]: pick("approved", "Approved", "APPROVED"),
    [S.REJECTED]: pick("rejected", "Rejected", "REJECTED"),
  };

  const sum = Object.values(byLabel).reduce((a, b) => a + b, 0);
  return {
    ...byLabel,
    [FILTER_ALL]: sum > 0 ? sum : totalRecords,
  };
};

export const useRocketMotorCasingList = () => {
  const user = useAuthStore((s) => s.user);
  const refreshVersion = useUserBatchRefreshStore((s) => s.version);

  const subDepartmentId = useMemo(
    () => user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "rocket-motor")?.subDepartmentId,
    [user]
  );

  const [batches, setBatches] = useState<RocketMotorBatch[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilterState] = useState<string>(FILTER_ALL);
  const [totalRecords, setTotalRecords] = useState(0);
  const [advancedFilters, setAdvancedFilters] = useState<RocketMotorCasingListAdvancedFilters>(emptyAdvanced);
  const [motorStageOptions, setMotorStageOptions] = useState<MotorStageOption[]>([]);
  const [motorStagesLoading, setMotorStagesLoading] = useState(false);

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value);
    setPage(0);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    const loadStages = async () => {
      if (!subDepartmentId) {
        setMotorStageOptions([]);
        return;
      }
      setMotorStagesLoading(true);
      try {
        const res = await operationsController.fetchMotorsStageList();
        if (!active) return;
        if (res?.success && res.data) {
          setMotorStageOptions(
            (res.data.stages ?? []).map((s: { motorStage?: string; noOfmotors?: number }) => ({
              motorStage: String(s.motorStage ?? ""),
              noOfmotors: Number(s.noOfmotors ?? 0),
            }))
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
    void loadStages();
    return () => {
      active = false;
    };
  }, [subDepartmentId]);

  const applyAdvancedFilters = useCallback((next: RocketMotorCasingListAdvancedFilters & { status: string }) => {
    setAdvancedFilters({
      motorStages: [...next.motorStages],
      casingTypes: [...next.casingTypes],
      insulationTypes: [...next.insulationTypes],
      fromDate: next.fromDate,
      toDate: next.toDate,
    });
    setStatusFilterState(next.status);
    setPage(0);
  }, []);

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(emptyAdvanced);
    setStatusFilterState(FILTER_ALL);
    setPage(0);
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (advancedFilters.motorStages.length) n += 1;
    if (advancedFilters.casingTypes.length) n += 1;
    if (advancedFilters.insulationTypes.length) n += 1;
    if (advancedFilters.fromDate) n += 1;
    if (advancedFilters.toDate) n += 1;
    if (statusFilter !== FILTER_ALL) n += 1;
    return n;
  }, [advancedFilters, statusFilter]);

  const fetchBatches = useCallback(async () => {
    if (!subDepartmentId) {
      setLoading(false);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
      return;
    }

    setLoading(true);
    try {
      const isClientSearch = Boolean(debouncedSearch.trim());
      const payload: Parameters<typeof rocketMotorCasingController.fetchCasingList>[0] = {
        subDepartmentId,
        page: isClientSearch ? 1 : page + 1,
        limit: isClientSearch ? CLIENT_SEARCH_FETCH_LIMIT : rowsPerPage,
      };

      if (statusFilter !== FILTER_ALL) {
        const apiStatus = UI_STATUS_TO_API[statusFilter];
        if (apiStatus) {
          payload.status = [apiStatus];
        }
      }

      if (advancedFilters.motorStages.length) {
        payload.motorStage = advancedFilters.motorStages;
      }
      if (advancedFilters.casingTypes.length) {
        payload.casingType = advancedFilters.casingTypes;
      }
      if (advancedFilters.insulationTypes.length) {
        payload.insulationType = advancedFilters.insulationTypes;
      }

      let from = advancedFilters.fromDate;
      let to = advancedFilters.toDate;
      if (from && to && from > to) {
        const swap = from;
        from = to;
        to = swap;
      }
      if (from) payload.fromDate = from;
      if (to) payload.toDate = to;

      const res = await rocketMotorCasingController.fetchCasingList(payload);

      if (res?.success && res.data) {
        const data = res.data as {
          casings?: unknown[];
          statusCounts?: Record<string, number>;
          pagination?: { totalRecords?: number };
        };
        const rows = Array.isArray(data.casings) ? data.casings : [];
        const mapped = rows.map((r) => mapRocketMotorCasingListRow(r as Record<string, unknown>));

        if (isClientSearch) {
          const matched = mapped.filter((batch) => rocketMotorCasingMatchesSearch(batch, debouncedSearch));
          const paged = matched.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
          setBatches(paged);
          setTotalRecords(matched.length);
          setStatusCounts(buildStatusCountsFromBatches(matched, matched.length));
        } else {
          const total = Number(data.pagination?.totalRecords ?? mapped.length);
          setBatches(mapped);
          setStatusCounts(mapStatusCountsForUi(data.statusCounts, total));
          setTotalRecords(total);
        }
      } else {
        setBatches([]);
        setTotalRecords(0);
        setStatusCounts({});
      }
    } catch (e) {
      console.error("Rocket motor casing list fetch failed", e);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
    } finally {
      setLoading(false);
    }
  }, [subDepartmentId, page, rowsPerPage, debouncedSearch, statusFilter, advancedFilters, refreshVersion]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    statusCounts,
    loading,
    page,
    rowsPerPage,
    search,
    statusFilter,
    totalRecords,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    refreshUserBatches: fetchBatches,
    motorStageOptions,
    motorStagesLoading,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
  };
};
