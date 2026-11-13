import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useApproverListRefreshStore } from "../../app/store/approverListRefreshStore";
import { useAuthStore } from "../../app/store/authStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { getApproverSubDepartmentBatchList } from "../../controllers/approver/approverController";
import {
  buildApproverBatchListPayload,
  mapApproverBatchListRow,
  mapApproverBatchStatusCounts,
  mirrorApproverSubdepartmentStatusFields,
  normalizeApproverBatchStatus,
  resolveSubdepartmentBatchPagination,
} from "../../data/models/approver/ApproverBatchListModel";
import type { SubDepartmentListFetcher } from "./subDepartmentListFetcher";

/** Subdepartments with their own list API; each fetcher is loaded only when that subdepartment is opened. */
const SUB_DEPARTMENT_LIST_FETCHERS: Record<string, () => Promise<SubDepartmentListFetcher>> = {
  "raw-material": () =>
    import("./sourcing/rms/rawMaterialSourcingApproverListFetcher").then(
      (m) => m.fetchRawMaterialSourcingApproverList,
    ),
  "rocket-motor": () =>
    import("./sourcing/rocketMotorCasingApproverListFetcher").then(
      (m) => m.fetchRocketMotorCasingApproverList,
    ),
};

type ApproverBatchStatusCounts = {
  initiated?: number;
  approved?: number;
  inProgress?: number;
  waitingForApproval?: number;
  rejected?: number;
};

type ApproverBatchSummary = Record<string, unknown> & {
  batchId?: string;
  formId?: string;
  batchType?: string;
  motorId?: string;
  motorType?: string;
  motorStage?: string;
  motorStageLabel?: string;
  projectId?: string;
  priority?: string;
  assignedTo?: {
    id?: string;
    fullName?: string;
  } | null;
  createdOn?: string;
  status?: string;
  submittedBy?: string;
  rejectionReason?: string | null;
};

type ApproverBatchPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

type ApproverBatchListResponse = {
  statusCounts?: ApproverBatchStatusCounts;
  batches?: ApproverBatchSummary[];
  pagination?: Partial<ApproverBatchPagination>;
};

type UseApproverSubDepartmentBatchListArgs<T> = {
  allLabel: string;
  department: ApproverDepartmentKey;
  extraFilters: Record<string, string>;
  items?: T[];
  searchText: string;
  status: string;
  subDepartment?: string;
};

const DEFAULT_PAGINATION: ApproverBatchPagination = {
  page: 1,
  limit: 10,
  totalRecords: 0,
  totalPages: 1,
};

const DEPARTMENT_SLUGS: Record<ApproverDepartmentKey, string> = {
  sourcing: "sourcing",
  manufacturing: "manufacturing",
  dispatch: "dispatch",
  qualityControl: "quality",
};

const createLookupKeys = (item: Record<string, unknown>) =>
  [item.batchId, item.formId, item.dispatchId]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());

export const useApproverSubDepartmentBatchList = <T extends Record<string, unknown>>({
  allLabel,
  department,
  extraFilters,
  items = [],
  searchText,
  status,
  subDepartment,
}: UseApproverSubDepartmentBatchListArgs<T>) => {
  const userId = useAuthStore((state) => state.user?.userId);
  const refreshVersion = useApproverListRefreshStore((state) => state.version);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApproverBatchPagination>(DEFAULT_PAGINATION);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    [allLabel]: items.length,
  });
  const [remoteBatches, setRemoteBatches] = useState<ApproverBatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timerId);
  }, [searchText]);

  useEffect(() => {
    setPage(1);
  }, [
    status,
    extraFilters.batchId,
    extraFilters.batchType,
    extraFilters.motorId,
    extraFilters.motorStage,
    extraFilters.projectId,
    extraFilters.submittedBy,
    extraFilters.casingType,
    extraFilters.insulationType,
    extraFilters.motorType,
    extraFilters.materialCode,
    extraFilters.fromDate,
    extraFilters.toDate,
    subDepartment,
  ]);

  const selectedSubDepartment = useMemo(() => {
    const user = useAuthStore.getState().user;
    if (!user || !subDepartment) return null;

    const deptSlug = DEPARTMENT_SLUGS[department];
    return (
      user.allSubDepartments.find(
        (item) => item.slugs?.dept === deptSlug && item.slugs?.subDept === subDepartment,
      ) ??
      user.allSubDepartments.find((item) => item.slugs?.subDept === subDepartment) ??
      null
    );
  }, [department, subDepartment, userId]);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
  }, [subDepartment, selectedSubDepartment?.subDepartmentId]);

  const loadBatches = useCallback(async () => {
    if (!selectedSubDepartment?.subDepartmentId || !subDepartment) {
      setRemoteBatches([]);
      setPagination(DEFAULT_PAGINATION);
      setStatusCounts({ [allLabel]: items.length });
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    const loadSubDepartmentFetcher = SUB_DEPARTMENT_LIST_FETCHERS[subDepartment];

    if (!loadSubDepartmentFetcher && !userId) {
      setRemoteBatches([]);
      setPagination(DEFAULT_PAGINATION);
      setStatusCounts({ [allLabel]: items.length });
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    const isInitialLoad = !hasLoadedOnceRef.current;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    if (loadSubDepartmentFetcher) {
      const fetchList = await loadSubDepartmentFetcher();
      const result = await fetchList({
        subDepartmentId: selectedSubDepartment.subDepartmentId,
        page,
        limit: DEFAULT_PAGINATION.limit,
        status,
        allLabel,
        search: debouncedSearchText,
        extraFilters,
      });

      if (result) {
        setRemoteBatches(result.batches as ApproverBatchSummary[]);
        setPagination(result.pagination);
        setStatusCounts(result.statusCounts);
      } else {
        setRemoteBatches([]);
        setPagination(DEFAULT_PAGINATION);
        setStatusCounts({ [allLabel]: 0 });
      }

      setLoading(false);
      setIsRefreshing(false);
      hasLoadedOnceRef.current = true;
      return;
    }

    const payload = buildApproverBatchListPayload({
      subDepartmentId: selectedSubDepartment.subDepartmentId,
      userId: String(userId),
      page,
      limit: DEFAULT_PAGINATION.limit,
      statusFilter: status,
      search: debouncedSearchText,
      priority: extraFilters.priority,
      advancedFilters: {
        batchId: extraFilters.batchId,
        batchType: extraFilters.batchType,
        motorId: extraFilters.motorId,
        motorStage: extraFilters.motorStage,
        submittedBy: extraFilters.submittedBy,
        fromDate: extraFilters.fromDate,
        toDate: extraFilters.toDate,
        projectId: extraFilters.projectId,
      },
      allLabel,
    });

    const response = await getApproverSubDepartmentBatchList(payload);
    const data = (response.data ?? null) as ApproverBatchListResponse | null;

    if (response.success && data) {
      const nextBatches = (Array.isArray(data.batches) ? data.batches : []).map(
        (batch: Record<string, unknown>) =>
          mapApproverBatchListRow(
            batch,
            selectedSubDepartment.subDepartmentId,
          ) as ApproverBatchSummary,
      );
      const resolvedPagination = resolveSubdepartmentBatchPagination(
        data.pagination as Record<string, unknown> | undefined,
        DEFAULT_PAGINATION.limit,
      );

      setRemoteBatches(nextBatches);
      setPagination(resolvedPagination);
      setStatusCounts(
        mapApproverBatchStatusCounts(
          data.statusCounts as Record<string, number> | undefined,
          allLabel,
          resolvedPagination.totalRecords || nextBatches.length,
        ),
      );
    } else {
      setRemoteBatches([]);
      setPagination(DEFAULT_PAGINATION);
      setStatusCounts({ [allLabel]: 0 });
    }
    setLoading(false);
    setIsRefreshing(false);
    hasLoadedOnceRef.current = true;
  }, [
    allLabel,
    debouncedSearchText,
    extraFilters,
    items.length,
    page,
    refreshVersion,
    selectedSubDepartment?.subDepartmentId,
    status,
    subDepartment,
    userId,
  ]);
  useEffect(() => {
    let cancelled = false;
    void loadBatches();
    return () => {
      cancelled = true;
    };
  }, [loadBatches]);

  const mergedItems = useMemo(() => {
    if (remoteBatches.length === 0) {
      return items;
    }

    if (items.length === 0) {
      return remoteBatches as unknown as T[];
    }

    const remoteByKey = new Map<string, ApproverBatchSummary>();
    remoteBatches.forEach((batch) => {
      [batch.batchId, batch.formId]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .forEach((value) => {
          remoteByKey.set(value.trim().toLowerCase(), batch);
        });
    });

    const merged = items
      .map((item) => {
        const lookupKey = createLookupKeys(item).find((value) => remoteByKey.has(value));
        const remote = lookupKey ? remoteByKey.get(lookupKey) : null;

        if (!remote) {
          return null;
        }

        const workflowStatus = normalizeApproverBatchStatus(remote.status ?? item.status);

        return {
          ...item,
          ...remote,
          batchId: remote.batchId ?? item.batchId,
          formId: remote.formId ?? item.formId,
          batchType: remote.batchType ?? item.batchType,
          motorId: remote.motorId ?? item.motorId,
          motorType: remote.motorType ?? item.motorType,
          motorStage: remote.motorStage ?? item.motorStage,
          motorStageLabel: remote.motorStageLabel ?? item.motorStageLabel,
          projectId: remote.projectId ?? item.projectId,
          priority: remote.priority ?? item.priority,
          createdOn: remote.createdOn ?? item.createdOn,
          status: workflowStatus,
          ...mirrorApproverSubdepartmentStatusFields(workflowStatus),
          rejectionReason: remote.rejectionReason ?? item.rejectionReason,
          assignedTo: remote.assignedTo ?? item.assignedTo,
          submittedBy: (remote as { submittedBy?: string }).submittedBy ?? item.submittedBy,
        } as T;
      })
      .filter((item): item is T => item !== null);

    return merged.length > 0 ? merged : items;
  }, [items, remoteBatches]);

  return {
    items: mergedItems,
    loading,
    isRefreshing,
    page,
    pagination,
    setPage,
    statusCounts,
    refresh: loadBatches,
  };
};

export default useApproverSubDepartmentBatchList;
