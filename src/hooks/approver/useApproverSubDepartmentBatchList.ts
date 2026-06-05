import { useEffect, useMemo, useState } from "react";

import { useApproverListRefreshStore } from "../../app/store/approverListRefreshStore";
import { useAuthStore } from "../../app/store/authStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { getApproverSubDepartmentBatchList } from "../../controllers/approver/approverController";
import rawMaterialProcurementApproverController from "../../controllers/approver/rawMaterialProcurementApproverController";
import rocketMotorCasingApproverController from "../../controllers/approver/rocketMotorCasingApproverController";
import { mapRawMaterialProcurementApproverListItem } from "../../data/models/approver/RawMaterialProcurementApproverModel";
import { mapRocketMotorCasingApproverListItem } from "../../data/models/approver/RocketMotorCasingApproverModel";
import { OPERATION_STATUS } from "../operationStatus";

const RAW_MATERIAL_PROCUREMENT_SUBDEPT = "raw-material";
const ROCKET_MOTOR_CASING_SUBDEPT = "rocket-motor";

const SOURCING_REMOTE_LIST_SUBDEPTS = new Set([
  RAW_MATERIAL_PROCUREMENT_SUBDEPT,
  ROCKET_MOTOR_CASING_SUBDEPT,
]);

const APPROVER_UI_STATUS_TO_API: Partial<Record<string, string>> = {
  [OPERATION_STATUS.INITIATED]: "INITIATED",
  [OPERATION_STATUS.IN_PROGRESS]: "IN_PROGRESS",
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: "WAITING_FOR_APPROVAL",
  [OPERATION_STATUS.APPROVED]: "APPROVED",
  [OPERATION_STATUS.REJECTED]: "REJECTED",
};

const toRocketMotorApproverApiStatus = (uiStatus: string) =>
  APPROVER_UI_STATUS_TO_API[uiStatus] ??
  uiStatus.trim().toUpperCase().replace(/\s+/g, "_");

type ApproverBatchStatusCounts = {
  initiated?: number;
  approved?: number;
  inProgress?: number;
  waitingForApproval?: number;
  rejected?: number;
};

type ApproverBatchSummary = {
  batchId?: string;
  formId?: string;
  batchType?: string;
  motorId?: string;
  motorType?: string;
  priority?: string;
  assignedTo?: {
    id?: string;
    fullName?: string;
  } | null;
  createdOn?: string;
  status?: string;
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
  initiated: "Initiated",
  approved: "Approved",
  inProgress: "In Progress",
  waitingForApproval: "Waiting for Approval",
  rejected: "Rejected",
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

    if (mapped[batch.status] === undefined) {
      mapped[batch.status] = fallbackBatches.filter((item) => item.status === batch.status).length;
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
  const user = useAuthStore((state) => state.user);
  const refreshVersion = useApproverListRefreshStore((state) => state.version);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApproverBatchPagination>(DEFAULT_PAGINATION);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ [allLabel]: items.length });
  const [remoteBatches, setRemoteBatches] = useState<ApproverBatchSummary[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, [status, extraFilters.priority, extraFilters.motorType, subDepartment]);

  const selectedSubDepartment = useMemo(() => {
    const deptSlug = DEPARTMENT_SLUGS[department];

    return (
      user?.allSubDepartments.find(
        (item) => item.slugs?.dept === deptSlug && item.slugs?.subDept === subDepartment,
      ) ?? null
    );
  }, [department, subDepartment, user]);

  useEffect(() => {
    let cancelled = false;

    const loadBatches = async () => {
      if (!selectedSubDepartment?.subDepartmentId || !subDepartment) {
        if (!cancelled) {
          setRemoteBatches([]);
          setPagination(DEFAULT_PAGINATION);
          setStatusCounts({ [allLabel]: items.length });
          setLoading(false);
        }
        return;
      }

      if (!SOURCING_REMOTE_LIST_SUBDEPTS.has(subDepartment ?? "") && !user?.userId) {
        if (!cancelled) {
          setRemoteBatches([]);
          setPagination(DEFAULT_PAGINATION);
          setStatusCounts({ [allLabel]: items.length });
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      if (subDepartment === RAW_MATERIAL_PROCUREMENT_SUBDEPT) {
        const payload = {
          subDepartmentId: selectedSubDepartment.subDepartmentId,
          page,
          limit: DEFAULT_PAGINATION.limit,
          ...(status !== allLabel ? { status: [status] } : {}),
          ...(extraFilters.priority && extraFilters.priority !== allLabel
            ? { priority: [extraFilters.priority] }
            : {}),
          ...(debouncedSearchText ? { search: debouncedSearchText } : {}),
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
          setStatusCounts(mapStatusCounts(response.data.statusCounts, allLabel, nextBatches));
        } else {
          setRemoteBatches([]);
          setPagination(DEFAULT_PAGINATION);
          setStatusCounts({ [allLabel]: 0 });
        }

        setLoading(false);
        return;
      }

      if (subDepartment === ROCKET_MOTOR_CASING_SUBDEPT) {
        const apiStatus = status !== allLabel ? toRocketMotorApproverApiStatus(status) : null;

        const payload = {
          subDepartmentId: selectedSubDepartment.subDepartmentId,
          page,
          limit: DEFAULT_PAGINATION.limit,
          ...(apiStatus ? { status: [apiStatus] } : {}),
          ...(extraFilters.motorType && extraFilters.motorType !== allLabel
            ? { motorStage: [extraFilters.motorType] }
            : {}),
          ...(debouncedSearchText ? { search: debouncedSearchText } : {}),
        };

        const response = await rocketMotorCasingApproverController.fetchCasingList(payload);

        if (cancelled) {
          return;
        }

        if (response.success && response.data) {
          const nextCasings = response.data.casings ?? [];
          const nextBatches = nextCasings.map((casing, index) =>
            mapRocketMotorCasingApproverListItem(casing, index),
          ) as unknown as ApproverBatchSummary[];

          setRemoteBatches(nextBatches);
          setPagination({
            page: response.data.pagination?.page ?? page,
            limit: response.data.pagination?.limit ?? DEFAULT_PAGINATION.limit,
            totalRecords: response.data.pagination?.totalRecords ?? nextCasings.length,
            totalPages: response.data.pagination?.totalPages ?? 1,
          });
          setStatusCounts(mapStatusCounts(response.data.statusCounts, allLabel, nextBatches));
        } else {
          setRemoteBatches([]);
          setPagination(DEFAULT_PAGINATION);
          setStatusCounts({ [allLabel]: 0 });
        }

        setLoading(false);
        return;
      }

      const payload = {
        subDepartmentId: selectedSubDepartment.subDepartmentId,
        userId: String(user!.userId),
        page,
        limit: DEFAULT_PAGINATION.limit,
        ...(status !== allLabel ? { status: [status] } : {}),
        ...(extraFilters.priority && extraFilters.priority !== allLabel
          ? { priority: [extraFilters.priority] }
          : {}),
        ...(debouncedSearchText ? { search: debouncedSearchText } : {}),
      };

      const response = await getApproverSubDepartmentBatchList(payload);
      const data = (response.data ?? null) as ApproverBatchListResponse | null;

      if (cancelled) {
        return;
      }

      if (response.success && data) {
        const nextBatches = data.batches ?? [];

        setRemoteBatches(nextBatches);
        setPagination({
          page: data.pagination?.page ?? page,
          limit: data.pagination?.limit ?? DEFAULT_PAGINATION.limit,
          totalRecords: data.pagination?.totalRecords ?? nextBatches.length,
          totalPages: data.pagination?.totalPages ?? 1,
        });
        setStatusCounts(mapStatusCounts(data.statusCounts, allLabel, nextBatches));
      } else {
        setRemoteBatches([]);
        setPagination(DEFAULT_PAGINATION);
        setStatusCounts({ [allLabel]: 0 });
      }

      setLoading(false);
    };

    loadBatches();

    return () => {
      cancelled = true;
    };
  }, [allLabel, debouncedSearchText, extraFilters.motorType, extraFilters.priority, items.length, page, refreshVersion, selectedSubDepartment?.subDepartmentId, status, subDepartment, user?.userId]);

  const mergedItems = useMemo(() => {
    if (remoteBatches.length === 0) {
      return items;
    }

    if (items.length === 0) {
      return remoteBatches.map((remote, index) => ({
        ...(remote as Record<string, unknown>),
        id: remote.formId ?? remote.batchId ?? index + 1,
        batchId: remote.batchId ?? "",
        formId: remote.formId ?? null,
        batchType: remote.batchType ?? "",
        motorId: remote.motorId ?? "",
        motorType: remote.motorType ?? "",
        priority: remote.priority ?? "Medium",
        createdOn: remote.createdOn ?? "",
        status: remote.status ?? "Pending",
        rejectionReason: remote.rejectionReason ?? null,
        assignedTo: remote.assignedTo ?? null,
        submittedBy:
          (remote as { submittedBy?: string }).submittedBy ??
          remote.assignedTo?.fullName ??
          "NA",
      })) as unknown as T[];
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

        return {
          ...item,
          batchId: remote.batchId ?? item.batchId,
          formId: remote.formId ?? item.formId,
          batchType: remote.batchType ?? item.batchType,
          motorId: remote.motorId ?? item.motorId,
          motorType: remote.motorType ?? item.motorType,
          priority: remote.priority ?? item.priority,
          createdOn: remote.createdOn ?? item.createdOn,
          status: remote.status ?? item.status,
          rejectionReason: remote.rejectionReason ?? item.rejectionReason,
          assignedTo: remote.assignedTo ?? item.assignedTo,
          submittedBy:
            (typeof item.submittedBy === "string" && item.submittedBy) ||
            remote.assignedTo?.fullName ||
            item.submittedBy,
        } as T;
      })
      .filter((item): item is T => item !== null);

    return merged.length > 0 ? merged : items;
  }, [items, remoteBatches]);

  return {
    items: mergedItems,
    loading,
    page,
    pagination,
    setPage,
    statusCounts,
  };
};

export default useApproverSubDepartmentBatchList;