import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../../app/store/authStore";
import { useUserBatchRefreshStore } from "../../../app/store/userBatchRefreshStore";
import { STRINGS } from "../../../app/config/strings";
import { operationsController } from "../../../controllers/user/operationsController";
import { fetchProjectFilterOptions } from "@hooks/projectFilterOptions";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import {
  normalizeRocketCasingListStatus,
  rocketMotorCasingMatchesSearch,
} from "../../../data/models/user/RocketMotorCasingProcurementModel";
import { OPERATION_STATUS, toOperationStatusApiValue } from "../../operationStatus";
import type { RocketMotorBatch } from "@hooks/user/sourcing/shared/sourcingWorkflowData";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
/** Fetch up to this many rows when filtering search client-side across all columns */
const CLIENT_SEARCH_FETCH_LIMIT = 5000;

const buildStatusCountsFromBatches = (batches: RocketMotorBatch[], totalRecords: number) => {
  const S = OPERATION_STATUS;
  const counts: Record<string, number> = {
    [S.TO_BE_INITIATED]: 0,
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

export type MotorStageOption = { motorStage: string; noOfmotors: number };
export type ProjectFilterOption = { projectId: string; projectName: string };

export type RocketMotorCasingListAdvancedFilters = {
  projectIds: string[];
  motorStages: string[];
  casingTypes: string[];
  insulationTypes: string[];
  fromDate: string;
  toDate: string;
};

const emptyAdvanced: RocketMotorCasingListAdvancedFilters = {
  projectIds: [],
  motorStages: [],
  casingTypes: [],
  insulationTypes: [],
  fromDate: "",
  toDate: "",
};

/** Map list API row → batch shape used by RocketMotorBatchList / form hook */
export function mapRocketMotorCasingListRow(row: Record<string, unknown>): RocketMotorBatch {
  const motorCasingId = String(row?.motorCasingId ?? "").trim();
  const project =
    row?.project && typeof row.project === "object"
      ? (row.project as { projectId?: string | null; projectName?: string | null })
      : null;
  const projectId = String(project?.projectId ?? row?.projectId ?? "").trim();
  const projectName = String(project?.projectName ?? row?.projectName ?? "").trim();
  const motorStage =
    row?.motorStage != null && String(row.motorStage).trim() !== ""
      ? String(row.motorStage)
      : String(row?.motorStageName ?? row?.motorType ?? row?.stage ?? "").trim();
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
    sourcingId: null,
    motorCasingId,
    projectId,
    projectName,
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
    [S.TO_BE_INITIATED]: pick(
      "toBeInitiated",
      "TO_BE_INITIATED",
      "To Be Initiated",
      "initiated",
      "Initiated",
      "INITIATED",
    ),
    [S.IN_PROGRESS]: pick("inProgress", "inProgress", "In Progress", "IN_PROGRESS"),
    [S.WAITING_FOR_APPROVAL]: pick(
      "waitingForApproval",
      "waitingforApproval",
      "Waiting for Approval",
      "WAITING_FOR_APPROVAL",
    ),
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
  const bumpBatchRefresh = useUserBatchRefreshStore((s) => s.bumpVersion);
  const suppressVersionFetchRef = useRef(false);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "rocket-motor")?.subDepartmentId,
    [user],
  );

  const [batches, setBatches] = useState<RocketMotorBatch[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilterState] = useState<string>(FILTER_ALL);
  const [totalRecords, setTotalRecords] = useState(0);
  const [advancedFilters, setAdvancedFilters] =
    useState<RocketMotorCasingListAdvancedFilters>(emptyAdvanced);
  const [motorStageOptions, setMotorStageOptions] = useState<MotorStageOption[]>([]);
  const [motorStagesLoading, setMotorStagesLoading] = useState(false);
  const [motorStagesLoaded, setMotorStagesLoaded] = useState(false);
  const [projectOptions, setProjectOptions] = useState<ProjectFilterOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [insulationTypeOptions, setInsulationTypeOptions] = useState<string[]>([]);
  const [insulationTypesLoading, setInsulationTypesLoading] = useState(false);
  const [insulationTypesLoaded, setInsulationTypesLoaded] = useState(false);

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

  /** Load motor stages only when Filters panel opens (not on list mount). */
  const ensureMotorStageOptions = useCallback(async () => {
    if (!subDepartmentId) {
      setMotorStageOptions([]);
      return;
    }
    if (motorStagesLoaded || motorStagesLoading) return;
    setMotorStagesLoading(true);
    try {
      const res = await operationsController.fetchMotorsStageList();
      if (res?.success && res.data) {
        setMotorStageOptions(
          (res.data.stages ?? []).map((s: { motorStage?: string; noOfmotors?: number }) => ({
            motorStage: String(s.motorStage ?? ""),
            noOfmotors: Number(s.noOfmotors ?? 0),
          })),
        );
      } else {
        setMotorStageOptions([]);
      }
      setMotorStagesLoaded(true);
    } catch {
      setMotorStageOptions([]);
    } finally {
      setMotorStagesLoading(false);
    }
  }, [subDepartmentId, motorStagesLoaded, motorStagesLoading]);

  /** Load projects only when Filters panel opens (not on list mount). */
  const ensureProjectOptions = useCallback(async () => {
    if (projectsLoaded || projectsLoading) return;
    setProjectsLoading(true);
    try {
      setProjectOptions(await fetchProjectFilterOptions());
      setProjectsLoaded(true);
    } catch {
      setProjectOptions([]);
    } finally {
      setProjectsLoading(false);
    }
  }, [projectsLoaded, projectsLoading]);

  const ensureInsulationTypeOptions = useCallback(async () => {
    if (!subDepartmentId || insulationTypesLoaded || insulationTypesLoading) return;
    setInsulationTypesLoading(true);
    try {
      const response = await operationsController.fetchInsulationTypeList();
      const types = response?.success
        ? (response.data ?? []).map((row) => String(row.insulationType ?? "").trim()).filter(Boolean)
        : [];
      setInsulationTypeOptions([...new Set(types)].sort((a, b) => a.localeCompare(b)));
      setInsulationTypesLoaded(true);
    } catch {
      setInsulationTypeOptions([]);
    } finally {
      setInsulationTypesLoading(false);
    }
  }, [insulationTypesLoaded, insulationTypesLoading, subDepartmentId]);

  useEffect(() => {
    setMotorStagesLoaded(false);
    setMotorStageOptions([]);
  }, [subDepartmentId]);

  const applyAdvancedFilters = useCallback(
    (next: RocketMotorCasingListAdvancedFilters & { status: string }) => {
      setAdvancedFilters({
        projectIds: [...next.projectIds],
        motorStages: [...next.motorStages],
        casingTypes: [...next.casingTypes],
        insulationTypes: [...next.insulationTypes],
        fromDate: next.fromDate,
        toDate: next.toDate,
      });
      setStatusFilterState(next.status);
      setPage(0);
    },
    [],
  );

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedFilters(emptyAdvanced);
    setStatusFilterState(FILTER_ALL);
    setPage(0);
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (advancedFilters.projectIds.length) n += 1;
    if (advancedFilters.motorStages.length) n += 1;
    if (advancedFilters.casingTypes.length) n += 1;
    if (advancedFilters.insulationTypes.length) n += 1;
    if (advancedFilters.fromDate) n += 1;
    if (advancedFilters.toDate) n += 1;
    if (statusFilter !== FILTER_ALL) n += 1;
    return n;
  }, [advancedFilters, statusFilter]);

  const fetchBatches = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;
    if (!subDepartmentId) {
      setLoading(false);
      setIsRefreshing(false);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
      return;
    }

    const isInitialLoad = !hasLoadedOnceRef.current;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const isClientSearch = Boolean(debouncedSearch.trim());
      const hasProjectFilter = advancedFilters.projectIds.length > 0;
      const isClientFiltering = isClientSearch || hasProjectFilter;
      const payload: Parameters<typeof rocketMotorCasingController.fetchCasingList>[0] = {
        subDepartmentId,
        page: isClientFiltering ? 1 : page + 1,
        limit: isClientFiltering ? CLIENT_SEARCH_FETCH_LIMIT : rowsPerPage,
      };

      if (statusFilter !== FILTER_ALL) {
        const apiStatus = toOperationStatusApiValue(statusFilter, FILTER_ALL);
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

      const from = advancedFilters.fromDate;
      const to = advancedFilters.toDate;
      if (from) payload.fromDate = from;
      if (to) payload.toDate = to;

      const res = await rocketMotorCasingController.fetchCasingList(payload);
      if (requestId !== fetchRequestIdRef.current) return;

      if (res?.success && res.data) {
        const data = res.data as {
          casings?: unknown[];
          statusCounts?: Record<string, number>;
          pagination?: { totalRecords?: number };
        };
        const rows = Array.isArray(data.casings) ? data.casings : [];
        const mapped = rows.map((r) => mapRocketMotorCasingListRow(r as Record<string, unknown>));

        if (isClientFiltering) {
          const matched = mapped.filter((batch) => {
            if (
              hasProjectFilter &&
              !advancedFilters.projectIds.some(
                (projectId) => projectId.trim().toLowerCase() === batch.projectId.trim().toLowerCase(),
              )
            ) {
              return false;
            }
            return !isClientSearch || rocketMotorCasingMatchesSearch(batch, debouncedSearch);
          });
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
      if (requestId !== fetchRequestIdRef.current) return;
      console.error("Rocket motor casing list fetch failed", e);
      setBatches([]);
      setTotalRecords(0);
      setStatusCounts({});
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
        setIsRefreshing(false);
        hasLoadedOnceRef.current = true;
      }
    }
  }, [subDepartmentId, page, rowsPerPage, debouncedSearch, statusFilter, advancedFilters]);

  useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (suppressVersionFetchRef.current) {
      suppressVersionFetchRef.current = false;
      return;
    }
    if (refreshVersion === 0) return;
    void fetchBatches();
  }, [refreshVersion, fetchBatches]);

  const refreshUserBatches = useCallback(async () => {
    suppressVersionFetchRef.current = true;
    await fetchBatches();
    bumpBatchRefresh();
  }, [fetchBatches, bumpBatchRefresh]);

  return {
    batches,
    statusCounts,
    loading,
    isRefreshing,
    page,
    rowsPerPage,
    search,
    statusFilter,
    totalRecords,
    setPage,
    setRowsPerPage,
    setSearch,
    setStatusFilter,
    refreshUserBatches,
    motorStageOptions,
    motorStagesLoading,
    ensureMotorStageOptions,
    projectOptions,
    projectsLoading,
    ensureProjectOptions,
    insulationTypeOptions,
    insulationTypesLoading,
    ensureInsulationTypeOptions,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    activeFilterCount,
  };
};
