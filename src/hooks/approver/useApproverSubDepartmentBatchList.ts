import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useApproverListRefreshStore } from "../../app/store/approverListRefreshStore";
import { useAuthStore } from "../../app/store/authStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { getApproverSubDepartmentBatchList } from "../../controllers/approver/approverController";
import { mapApiStatusCountKeyToUiTab, toApiStatusEnum } from "../operationStatus";
import { formatToIsoDateInput } from "../../utils/dateUtils";
import {
  buildApproverBatchListPayload,
  approverRowMatchesSearchQuery,
  APPROVER_BATCH_LIST_SEARCH_KEYS,
  mapApproverBatchListRow,
  mapApproverBatchStatusCounts,
  mirrorApproverSubdepartmentStatusFields,
  normalizeApproverBatchStatus,
  resolveSubdepartmentBatchPagination,
  approverRowMatchesSubmittedByFilter,
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

const CLIENT_SEARCH_FETCH_LIMIT = 5000;
const CLIENT_SEARCH_KEYS = APPROVER_BATCH_LIST_SEARCH_KEYS;

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
  const [limit, setLimit] = useState(DEFAULT_PAGINATION.limit);
  const [pagination, setPagination] = useState<ApproverBatchPagination>(DEFAULT_PAGINATION);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    [allLabel]: items.length,
  });
  const [remoteBatches, setRemoteBatches] = useState<ApproverBatchSummary[]>([]);
  // Start true so first paint shows loader instead of a false empty list.
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const fetchRequestIdRef = useRef(0);

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
  }, [limit]);

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
    extraFilters.manufacturer,
    extraFilters.manufacturerName,
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
    // Keep chrome in loading state across subdept switch until the next fetch starts.
    setLoading(true);
  }, [subDepartment, selectedSubDepartment?.subDepartmentId]);

  const loadBatches = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;
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
      if (requestId !== fetchRequestIdRef.current) return;
      const result = await fetchList({
        subDepartmentId: selectedSubDepartment.subDepartmentId,
        page,
        limit,
        status,
        allLabel,
        search: debouncedSearchText,
        extraFilters,
      });
      if (requestId !== fetchRequestIdRef.current) return;

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

    const isClientSearch = Boolean(debouncedSearchText.trim());
    const submittedByQuery = String(extraFilters.submittedBy ?? "").trim();
    const hasSubmittedByFilter = Boolean(submittedByQuery);
    const projectIdFilter = String(extraFilters.projectId ?? "").trim();
    const hasProjectFilter = Boolean(projectIdFilter && projectIdFilter !== allLabel);
    const fromDateFilter = String(extraFilters.fromDate ?? "").trim();
    const toDateFilter = String(extraFilters.toDate ?? "").trim();
    // Keep every status in the fetched set so the tab counts and the rows use
    // the same normalized client-side status values.
    const isClientFiltering = true;
    const payload = buildApproverBatchListPayload({
      subDepartmentId: selectedSubDepartment.subDepartmentId,
      userId: String(userId),
      page: isClientFiltering ? 1 : page,
      limit: isClientFiltering ? CLIENT_SEARCH_FETCH_LIMIT : limit,
      statusFilter: allLabel,
      search: isClientSearch ? undefined : debouncedSearchText,
      priority: extraFilters.priority,
      advancedFilters: {
        batchId: extraFilters.batchId,
        batchType: extraFilters.batchType,
        motorId: extraFilters.motorId,
        motorStage: extraFilters.motorStage,
        fromDate: fromDateFilter,
        toDate: toDateFilter,
        projectId: hasProjectFilter ? "" : extraFilters.projectId,
      },
      allLabel,
    });

    const response = await getApproverSubDepartmentBatchList(payload);
    if (requestId !== fetchRequestIdRef.current) return;
    const data = (response.data ?? null) as ApproverBatchListResponse | null;

    if (response.success && data) {
      const fetchedBatches = (Array.isArray(data.batches) ? data.batches : []).map(
        (batch: Record<string, unknown>) =>
          mapApproverBatchListRow(
            batch,
            selectedSubDepartment.subDepartmentId,
          ) as ApproverBatchSummary,
      );
      const batchesMatchingOtherFilters = fetchedBatches.filter((batch) => {
            if (hasProjectFilter) {
              const nestedProject =
                batch.project && typeof batch.project === "object"
                  ? (batch.project as { projectId?: string | null })
                  : null;
              const rowProjectId = String(nestedProject?.projectId ?? batch.projectId ?? "")
                .trim()
                .toLowerCase();
              if (rowProjectId !== projectIdFilter.toLowerCase()) return false;
            }
            if (
              hasSubmittedByFilter &&
              !approverRowMatchesSubmittedByFilter(batch, submittedByQuery)
            ) {
              return false;
            }
            if (fromDateFilter || toDateFilter) {
              const rowCreatedDate = formatToIsoDateInput(
                String(batch.createdOn ?? batch.createdAt ?? batch.submittedAt ?? ""),
              );
              if (!rowCreatedDate) return false;
              if (fromDateFilter && rowCreatedDate < fromDateFilter) return false;
              if (toDateFilter && rowCreatedDate > toDateFilter) return false;
            }
            return (
              !isClientSearch ||
              approverRowMatchesSearchQuery(batch, debouncedSearchText, CLIENT_SEARCH_KEYS)
            );
          });
      const localStatusCounts = batchesMatchingOtherFilters.reduce<Record<string, number>>((counts, batch) => {
        const tab = mapApiStatusCountKeyToUiTab(String(batch.status ?? ""));
        if (tab) counts[tab] = (counts[tab] ?? 0) + 1;
        return counts;
      }, {});
      const matchingBatches = status === allLabel
        ? batchesMatchingOtherFilters
        : batchesMatchingOtherFilters.filter(
            (batch) => toApiStatusEnum(batch.status) === toApiStatusEnum(status),
          );
      const nextBatches = matchingBatches.slice((page - 1) * limit, page * limit);
      const resolvedPagination = resolveSubdepartmentBatchPagination(
        data.pagination as Record<string, unknown> | undefined,
        limit,
      );

      setRemoteBatches(nextBatches);
      setPagination(
        isClientFiltering
          ? {
              page,
              limit,
              totalRecords: matchingBatches.length,
              totalPages: Math.max(1, Math.ceil(matchingBatches.length / limit)),
            }
          : resolvedPagination,
      );
      setStatusCounts(
        mapApproverBatchStatusCounts(
          localStatusCounts,
          allLabel,
          batchesMatchingOtherFilters.length,
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
    limit,
    page,
    refreshVersion,
    selectedSubDepartment?.subDepartmentId,
    status,
    subDepartment,
    userId,
  ]);
  useEffect(() => {
    void loadBatches();
    return () => {
      fetchRequestIdRef.current += 1;
    };
  }, [loadBatches]);

  const mergedItems = useMemo(() => {
    if (remoteBatches.length === 0) {
      return subDepartment ? (remoteBatches as unknown as T[]) : items;
    }

    if (items.length === 0) {
      return remoteBatches as unknown as T[];
    }

    const localByKey = new Map<string, T>();
    items.forEach((item) => {
      createLookupKeys(item).forEach((key) => localByKey.set(key, item));
    });
    const preferPopulated = <V,>(remote: V | undefined, local: V | undefined): V | undefined => {
      if (remote === undefined || remote === null) return local;
      if (typeof remote === "object") {
        const values = Object.values(remote as Record<string, unknown>);
        return values.some((value) => String(value ?? "").trim() !== "") ? remote : local;
      }
      return String(remote).trim() ? remote : local;
    };

    const merged = remoteBatches.map((remote) => {
      const lookupKey = createLookupKeys(remote).find((key) => localByKey.has(key));
      const item = lookupKey ? localByKey.get(lookupKey) : undefined;
      const workflowStatus = normalizeApproverBatchStatus(
        preferPopulated(remote.status, item?.status),
      );

      return {
        ...item,
        ...remote,
        batchId: preferPopulated(remote.batchId, item?.batchId),
        formId: preferPopulated(remote.formId, item?.formId),
        batchType: preferPopulated(remote.batchType, item?.batchType),
        motorId: preferPopulated(remote.motorId, item?.motorId),
        motorType: preferPopulated(remote.motorType, item?.motorType),
        motorStage: preferPopulated(remote.motorStage, item?.motorStage),
        motorStageLabel: preferPopulated(remote.motorStageLabel, item?.motorStageLabel),
        projectId: preferPopulated(remote.projectId, item?.projectId),
        priority: preferPopulated(remote.priority, item?.priority),
        createdOn: preferPopulated(remote.createdOn, item?.createdOn),
        status: workflowStatus,
        ...mirrorApproverSubdepartmentStatusFields(workflowStatus),
        rejectionReason: preferPopulated(remote.rejectionReason, item?.rejectionReason),
        assignedTo: preferPopulated(remote.assignedTo, item?.assignedTo),
        submittedBy: preferPopulated(
          (remote as { submittedBy?: string }).submittedBy,
          item?.submittedBy as string | undefined,
        ),
      } as T;
    });

    return subDepartment ? merged : merged.length > 0 ? merged : items;
  }, [items, remoteBatches, subDepartment]);

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  return {
    items: mergedItems,
    loading,
    isRefreshing,
    page,
    limit,
    pagination,
    setPage,
    setLimit: handleLimitChange,
    statusCounts,
    refresh: loadBatches,
  };
};

export default useApproverSubDepartmentBatchList;
