export const OPERATION_STATUS = {
  TO_BE_INITIATED: "To Be Initiated",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_PARTIAL_APPROVAL: "Waiting for Partial Approval",
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  APPROVED: "Approved",
  COMPLETELY_APPROVED: "Completely Approved",
  REJECTED: "Rejected",
} as const;

export type OperationStatus = (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

/** UI label map for each workflow stage (used by row action buttons). */
export type OperationStatusMap = typeof OPERATION_STATUS;

/** Ordered status values for list filter dropdowns (includes To Be Initiated). */
export const OPERATION_STATUS_FILTER_VALUES: OperationStatus[] = [
  OPERATION_STATUS.TO_BE_INITIATED,
  OPERATION_STATUS.IN_PROGRESS,
  OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL,
  OPERATION_STATUS.WAITING_FOR_APPROVAL,
  OPERATION_STATUS.APPROVED,
  OPERATION_STATUS.COMPLETELY_APPROVED,
  OPERATION_STATUS.REJECTED,
];

/**
 * Manufacturing / QC / Dispatch list tabs — matches user batch-list `statusCounts` keys.
 * Waiting for Approval is not a batch-list filter (only Waiting for Partial Approval).
 */
export const MANUFACTURING_STATUS_FILTER_VALUES: OperationStatus[] = [
  OPERATION_STATUS.TO_BE_INITIATED,
  OPERATION_STATUS.IN_PROGRESS,
  OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL,
  OPERATION_STATUS.COMPLETELY_APPROVED,
  OPERATION_STATUS.REJECTED,
];

/** Raw Material Sourcing + Rocket Motor Casing — hide these from top status tabs. */
export const SOURCING_LOT_HIDDEN_STATUS_FILTERS: OperationStatus[] = [
  OPERATION_STATUS.TO_BE_INITIATED,
  OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL,
  OPERATION_STATUS.COMPLETELY_APPROVED,
];

const SOURCING_LOT_SUBDEPT_SLUGS = new Set(["raw-material", "rocket-motor"]);

export const isSourcingLotSubdepartment = (subDeptSlug?: string | null): boolean =>
  SOURCING_LOT_SUBDEPT_SLUGS.has(String(subDeptSlug ?? "").trim());

/** Status filter values for Raw Material / Rocket Motor Casing list tabs. */
export const SOURCING_LOT_STATUS_FILTER_VALUES: OperationStatus[] =
  OPERATION_STATUS_FILTER_VALUES.filter(
    (status) => !SOURCING_LOT_HIDDEN_STATUS_FILTERS.includes(status),
  );

/**
 * Display label for status filter tabs.
 * Kept for callers that pass options for sourcing vs manufacturing lists.
 */
export const getOperationStatusFilterLabel = (
  status: string,
  _options?: { isSourcingLotSubdepartment?: boolean; subDeptSlug?: string | null },
): string => status;

/** UI status filter tabs → API enum values for list requests */
export const OPERATION_STATUS_UI_TO_API: Record<string, string> = {
  [OPERATION_STATUS.TO_BE_INITIATED]: "TO_BE_INITIATED",
  [OPERATION_STATUS.IN_PROGRESS]: "IN_PROGRESS",
  [OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL]: "WAITING_FOR_PARTIAL_APPROVAL",
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: "WAITING_FOR_APPROVAL",
  [OPERATION_STATUS.APPROVED]: "APPROVED",
  [OPERATION_STATUS.COMPLETELY_APPROVED]: "COMPLETELY_APPROVED",
  [OPERATION_STATUS.REJECTED]: "REJECTED",
};

const OPERATION_STATUS_API_VALUES = new Set(Object.values(OPERATION_STATUS_UI_TO_API));

/** Format an API status enum for display — no remapping to other statuses. */
export const formatApiStatusForDisplay = (status: unknown): string => {
  const trimmed = String(status ?? "").trim();
  if (!trimmed) return "";

  if (OPERATION_STATUS_FILTER_VALUES.includes(trimmed as OperationStatus)) {
    return trimmed;
  }

  if (/^[A-Z0-9_]+$/.test(trimmed)) {
    return trimmed
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return trimmed;
};

const compactApiStatusKey = (value: string) => value.replace(/[\s_-]/g, "").toLowerCase();

/** Uppercase API enum for action/filter helpers — no remapping between statuses. */
export const toApiStatusEnum = (status: unknown): string => {
  const trimmed = String(status ?? "").trim();
  if (!trimmed) return "";

  const fromUi = OPERATION_STATUS_UI_TO_API[trimmed];
  if (fromUi) return fromUi;

  const upper = trimmed.toUpperCase().replace(/\s+/g, "_");
  if (upper === "INITIATED") return "TO_BE_INITIATED";
  if (upper === "PENDING") return "WAITING_FOR_APPROVAL";
  if (OPERATION_STATUS_API_VALUES.has(upper)) return upper;

  return upper;
};

/** Map API statusCounts camelCase keys onto UI filter tab labels (counts only). */
export const mapApiStatusCountKeyToUiTab = (key: string): OperationStatus | null => {
  const normalized = compactApiStatusKey(key);
  const map: Record<string, OperationStatus> = {
    initiated: OPERATION_STATUS.TO_BE_INITIATED,
    tobeinitiated: OPERATION_STATUS.TO_BE_INITIATED,
    inprogress: OPERATION_STATUS.IN_PROGRESS,
    waitingforpartialapproval: OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL,
    waitingforapproval: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    approved: OPERATION_STATUS.APPROVED,
    completelyapproved: OPERATION_STATUS.COMPLETELY_APPROVED,
    finalapprovalcompleted: OPERATION_STATUS.COMPLETELY_APPROVED,
    rejected: OPERATION_STATUS.REJECTED,
  };
  return map[normalized] ?? null;
};

/** Bucket a displayed batch status into a UI filter tab (counts only). */
export const mapDisplayStatusToUiTab = (displayStatus: string): OperationStatus | null => {
  if (OPERATION_STATUS_FILTER_VALUES.includes(displayStatus as OperationStatus)) {
    return displayStatus as OperationStatus;
  }

  const api = toApiStatusEnum(displayStatus);
  if (api === "FINAL_APPROVAL_COMPLETED" || api === "COMPLETELY_APPROVED") {
    return OPERATION_STATUS.COMPLETELY_APPROVED;
  }
  if (api === "WAITING_FOR_COMPLETE_APPROVAL") {
    return null;
  }

  const fromKey = mapApiStatusCountKeyToUiTab(api);
  if (fromKey) return fromKey;

  return OPERATION_STATUS_FILTER_VALUES.includes(displayStatus as OperationStatus)
    ? (displayStatus as OperationStatus)
    : null;
};

/**
 * Map UI status label to API enum (Approved → APPROVED, Waiting for Approval → WAITING_FOR_APPROVAL).
 * Returns null when status is empty or matches the "all" filter label.
 */
export function toOperationStatusApiValue(
  status: string | null | undefined,
  allLabel?: string,
): string | null {
  const trimmed = String(status ?? "").trim();
  if (!trimmed || (allLabel && trimmed === allLabel)) return null;

  if (trimmed === "Pending") return "WAITING_FOR_APPROVAL";

  const mapped = OPERATION_STATUS_UI_TO_API[trimmed];
  if (mapped) return mapped;

  return toApiStatusEnum(trimmed);
}

/** New form — Fill Details; do not call subdepartment form-details. */
export const isManufacturingFillDetailsStatus = (status: string | null | undefined): boolean => {
  const api = toOperationStatusApiValue(status);
  return !api || api === "TO_BE_INITIATED";
};

/** Continue filling — call form-details and allow editing. */
export const isManufacturingContinueFillingStatus = (
  status: string | null | undefined,
): boolean => {
  const api = toOperationStatusApiValue(status);
  return api === "IN_PROGRESS" || api === "WAITING_FOR_PARTIAL_APPROVAL";
};

/** View-only — eye icon + details UI, no editing. */
export const isManufacturingViewOnlyStatus = (status: string | null | undefined): boolean => {
  const api = toApiStatusEnum(status);
  return (
    api === "WAITING_FOR_APPROVAL" ||
    api === "WAITING_FOR_COMPLETE_APPROVAL" ||
    api === "APPROVED" ||
    api === "COMPLETELY_APPROVED" ||
    api === "FINAL_APPROVAL_COMPLETED"
  );
};

/** Normalize list request `status` array values to uppercase API enums. */
export function normalizeListStatusFilter(status: string[] | undefined): string[] | undefined {
  if (!status?.length) return status;

  const normalized = status
    .map((value) => toOperationStatusApiValue(value))
    .filter((value): value is string => Boolean(value));

  return normalized.length > 0 ? normalized : undefined;
}

type OperationStatusIconMap = {
  initiated: any;
  inProgress: any;
  waitingForApproval: any;
  approved: any;
  rejected: any;
};

export const getOperationStatusConfig = (icons: OperationStatusIconMap) => ({
  [OPERATION_STATUS.TO_BE_INITIATED]: {
    Icon: icons.initiated,
    label: OPERATION_STATUS.TO_BE_INITIATED,
  },
  [OPERATION_STATUS.IN_PROGRESS]: {
    Icon: icons.inProgress,
    label: OPERATION_STATUS.IN_PROGRESS,
  },
  [OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL]: {
    Icon: icons.inProgress,
    label: OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL,
  },
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: {
    Icon: icons.waitingForApproval,
    label: OPERATION_STATUS.WAITING_FOR_APPROVAL,
  },
  [OPERATION_STATUS.APPROVED]: {
    Icon: icons.approved,
    label: OPERATION_STATUS.APPROVED,
  },
  [OPERATION_STATUS.COMPLETELY_APPROVED]: {
    Icon: icons.approved,
    label: OPERATION_STATUS.COMPLETELY_APPROVED,
  },
  [OPERATION_STATUS.REJECTED]: {
    Icon: icons.rejected,
    label: OPERATION_STATUS.REJECTED,
  },
  "Status Unavailable": {
    Icon: icons.initiated,
    label: "Status Unavailable",
  },
});
