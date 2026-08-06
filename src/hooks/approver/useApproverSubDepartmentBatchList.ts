import { useEffect, useMemo, useRef, useState } from "react";

import { useApproverListRefreshStore } from "../../app/store/approverListRefreshStore";
import { useAuthStore } from "../../app/store/authStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { getApproverSubDepartmentBatchList } from "../../controllers/approver/approverController";
import rawMaterialProcurementApproverController from "../../controllers/approver/rawMaterialProcurementApproverController";
import rocketMotorCasingApproverController from "../../controllers/approver/rocketMotorCasingApproverController";
import {
  buildApproverBatchListPayload,
  mapApproverBatchListRow,
  mapApproverBatchStatusCounts,
  mirrorApproverSubdepartmentStatusFields,
  normalizeApproverBatchStatus,
  resolveSubdepartmentBatchPagination,
} from "../../data/models/approver/ApproverBatchListModel";
import {
  mapRawMaterialApproverStatusCountsForUi,
  mapRawMaterialProcurementApproverListItem,
  toRawMaterialApproverListApiStatus,
} from "../../data/models/approver/RawMaterialProcurementApproverModel";
import { toOperationStatusApiValue } from "../operationStatus";

const RAW_MATERIAL_PROCUREMENT_SUBDEPT = "raw-material";
const ROCKET_MOTOR_CASING_SUBDEPT = "rocket-motor";

const SOURCING_REMOTE_LIST_SUBDEPTS = new Set([
  RAW_MATERIAL_PROCUREMENT_SUBDEPT,
  ROCKET_MOTOR_CASING_SUBDEPT,
]);

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

const STATUS_LABELS: Record<string, string> = {
  toBeInitiated: "To Be Initiated",
  initiated: "To Be Initiated",
  approved: "Approved",
  inProgress: "In Progress",
  waitingForPartialApproval: "Waiting for Partial Approval",
  waitingForApproval: "Waiting for Approval",
  waitingForCompleteApproval: "Waiting for Approval",
  finalApprovalCompleted: "Final Approval Completed",
  rejected: "Rejected",

  TO_BE_INITIATED: "To Be Initiated",
  INITIATED: "To Be Initiated",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_PARTIAL_APPROVAL: "Waiting for Partial Approval",
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  WAITING_FOR_COMPLETE_APPROVAL: "Waiting for Approval",
  FINAL_APPROVAL_COMPLETED: "Final Approval Completed",
  REJECTED: "Rejected",
};

const createLookupKeys = (item: Record<string, unknown>) =>
  [item.batchId, item.formId, item.dispatchId]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase());

const mapStatusCounts = (
  counts: ApproverBatchStatusCounts | undefined,
  allLabel: string,
  fallbackBatches: ApproverBatchSummary[],
) => {
  const mapped: Record<string, number> = {
    [allLabel]: 0,
  };

  Object.entries(counts ?? {}).forEach(([key, value]) => {
    const label = STATUS_LABELS[key] ?? key;
    mapped[label] = value ?? 0;
    mapped[allLabel] += value ?? 0;
  });

  fallbackBatches.forEach((batch) => {
    if (!batch.status) {
      return;
    }
    const normalizedStatus =
    STATUS_LABELS[batch.status] ?? batch.status;
    if (mapped[normalizedStatus] === undefined) {
    mapped[normalizedStatus] =
      fallbackBatches.filter(
        (item) => item.status === batch.status
      ).length;
    }
  });

  if ((counts == null || Object.keys(counts).length === 0) && fallbackBatches.length > 0) {
    mapped[allLabel] = fallbackBatches.length;
  }

  return mapped;
};

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
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ [allLabel]: items.length });
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

  useEffect(() => {
    let cancelled = false;

    const loadBatches = async () => {
      if (!selectedSubDepartment?.subDepartmentId || !subDepartment) {
        if (!cancelled) {
          setRemoteBatches([]);
          setPagination(DEFAULT_PAGINATION);
          setStatusCounts({ [allLabel]: items.length });
          setLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      if (!SOURCING_REMOTE_LIST_SUBDEPTS.has(subDepartment ?? "") && !userId) {
        if (!cancelled) {
          setRemoteBatches([]);
          setPagination(DEFAULT_PAGINATION);
          setStatusCounts({ [allLabel]: items.length });
          setLoading(false);
          setIsRefreshing(false);
        }
        return;
      }

      const isInitialLoad = !hasLoadedOnceRef.current;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      if (subDepartment === RAW_MATERIAL_PROCUREMENT_SUBDEPT) {
        const apiStatus = status !== allLabel ? toRawMaterialApproverListApiStatus(status, allLabel) : null;
        const materialCode = String(extraFilters.materialCode ?? "").trim();
        let fromDate = String(extraFilters.fromDate ?? "").trim();
        let toDate = String(extraFilters.toDate ?? "").trim();
        if (fromDate && toDate && fromDate > toDate) {
          const swap = fromDate;
          fromDate = toDate;
          toDate = swap;
        }

        const payload = {
          subDepartmentId: selectedSubDepartment.subDepartmentId,
          page,
          limit: DEFAULT_PAGINATION.limit,
          ...(apiStatus ? { status: [apiStatus] } : {}),
          ...(materialCode && materialCode !== allLabel ? { materialCode: [materialCode] } : {}),
          ...(debouncedSearchText ? { search: debouncedSearchText } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        };

        const response = await rawMaterialProcurementApproverController.fetchLotList(payload);

        if (cancelled) {
          return;
        }

        if (response.success && response.data) {
          const nextLots = response.data.lots ?? [];
          const nextBatches = nextLots.map((lot, index) =>
            mapRawMaterialProcurementApproverListItem(lot, index),
          ) as unknown as ApproverBatchSummary[];

          setRemoteBatches(nextBatches);
          setPagination({
            page: response.data.pagination?.page ?? page,
            limit: response.data.pagination?.limit ?? DEFAULT_PAGINATION.limit,
            totalRecords: response.data.pagination?.totalRecords ?? nextLots.length,
            totalPages: response.data.pagination?.totalPages ?? 1,
          });
          setStatusCounts(
            mapRawMaterialApproverStatusCountsForUi(
              response.data.statusCounts,
              allLabel,
              response.data.pagination?.totalRecords ?? nextLots.length,
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
        return;
      }

      if (subDepartment === ROCKET_MOTOR_CASING_SUBDEPT) {
        const apiStatus = status !== allLabel ? toOperationStatusApiValue(status, allLabel) : null;

        let fromDate = String(extraFilters.fromDate ?? "").trim();
        let toDate = String(extraFilters.toDate ?? "").trim();
        if (fromDate && toDate && fromDate > toDate) {
          const swap = fromDate;
          fromDate = toDate;
          toDate = swap;
        }

        const motorStage = String(extraFilters.motorStage ?? "").trim();
        const casingType = String(extraFilters.casingType ?? "").trim();
        const insulationType = String(extraFilters.insulationType ?? "").trim();

        const payload = {
          subDepartmentId: selectedSubDepartment.subDepartmentId,
          page,
          limit: DEFAULT_PAGINATION.limit,
          ...(apiStatus ? { status: [apiStatus] } : {}),
          ...(motorStage && motorStage !== allLabel ? { motorStage: [motorStage] } : {}),
          ...(casingType && casingType !== allLabel ? { casingType: [casingType] } : {}),
          ...(insulationType && insulationType !== allLabel ? { insulationType: [insulationType] } : {}),
          ...(debouncedSearchText ? { search: debouncedSearchText } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        };

        const response = await rocketMotorCasingApproverController.fetchCasingList(payload);

        if (cancelled) {
          return;
        }

        if (response.success && response.data) {
          const nextBatches = (response.data.casings ?? []) as unknown as ApproverBatchSummary[];

          setRemoteBatches(nextBatches);
          setPagination({
            page: response.data.pagination?.page ?? page,
            limit: response.data.pagination?.limit ?? DEFAULT_PAGINATION.limit,
            totalRecords: response.data.pagination?.totalRecords ?? nextBatches.length,
            totalPages: response.data.pagination?.totalPages ?? 1,
          });
          setStatusCounts(mapStatusCounts(response.data.statusCounts, allLabel, nextBatches));
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

      if (cancelled) {
        return;
      }

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
    };

    loadBatches();

    return () => {
      cancelled = true;
    };
  }, [allLabel, debouncedSearchText, extraFilters.batchId, extraFilters.batchType, extraFilters.casingType, extraFilters.fromDate, extraFilters.insulationType, extraFilters.materialCode, extraFilters.motorId, extraFilters.motorStage, extraFilters.motorType, extraFilters.priority, extraFilters.projectId, extraFilters.submittedBy, extraFilters.toDate, items.length, page, refreshVersion, selectedSubDepartment?.subDepartmentId, status, subDepartment, userId]);

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
  };
};

export default useApproverSubDepartmentBatchList;