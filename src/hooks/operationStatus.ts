export const OPERATION_STATUS = {
  TO_BE_INITIATED: "To Be Initiated",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_PARTIAL_APPROVAL: "Waiting for Partial Approval",
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  WAITING_FOR_COMPLETE_APPROVAL: "Waiting for Complete Approval",
  APPROVED: "Approved",
  FINAL_APPROVAL_COMPLETED: "Final Approval Completed",
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
  OPERATION_STATUS.FINAL_APPROVAL_COMPLETED,
  OPERATION_STATUS.REJECTED,
];

/** Raw Material Sourcing + Rocket Motor Casing — hide these from top status tabs. */
export const SOURCING_LOT_HIDDEN_STATUS_FILTERS: OperationStatus[] = [
  OPERATION_STATUS.TO_BE_INITIATED,
  OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL,
  OPERATION_STATUS.FINAL_APPROVAL_COMPLETED,
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
 * Non-sourcing subdepartments show "Waiting for Complete Approval" instead of
 * "Waiting for Approval" (filter value / API key stays WAITING_FOR_APPROVAL).
 */
export const getOperationStatusFilterLabel = (
  status: string,
  options?: { isSourcingLotSubdepartment?: boolean; subDeptSlug?: string | null },
): string => {
  const sourcingLot =
    options?.isSourcingLotSubdepartment ?? isSourcingLotSubdepartment(options?.subDeptSlug);
  if (!sourcingLot && status === OPERATION_STATUS.WAITING_FOR_APPROVAL) {
    return OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL;
  }
  return status;
};

/** UI status labels → uppercase API enum values for list filters */
export const OPERATION_STATUS_UI_TO_API: Record<string, string> = {
  [OPERATION_STATUS.TO_BE_INITIATED]: "TO_BE_INITIATED",
  [OPERATION_STATUS.IN_PROGRESS]: "IN_PROGRESS",
  [OPERATION_STATUS.WAITING_FOR_PARTIAL_APPROVAL]: "WAITING_FOR_PARTIAL_APPROVAL",
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: "WAITING_FOR_APPROVAL",
  [OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL]: "WAITING_FOR_COMPLETE_APPROVAL",
  [OPERATION_STATUS.APPROVED]: "APPROVED",
  [OPERATION_STATUS.FINAL_APPROVAL_COMPLETED]: "FINAL_APPROVAL_COMPLETED",
  [OPERATION_STATUS.REJECTED]: "REJECTED",
};

const OPERATION_STATUS_API_VALUES = new Set(Object.values(OPERATION_STATUS_UI_TO_API));

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

  const upper = trimmed.toUpperCase().replace(/\s+/g, "_");
  if (upper === "INITIATED") return "TO_BE_INITIATED";
  if (OPERATION_STATUS_API_VALUES.has(upper)) return upper;

  return upper;
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
  const api = toOperationStatusApiValue(status);
  return (
    api === "WAITING_FOR_APPROVAL" ||
    api === "WAITING_FOR_COMPLETE_APPROVAL" ||
    api === "APPROVED" ||
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
  [OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL]: {
    Icon: icons.waitingForApproval,
    label: OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL,
  },
  [OPERATION_STATUS.APPROVED]: {
    Icon: icons.approved,
    label: OPERATION_STATUS.APPROVED,
  },
  [OPERATION_STATUS.FINAL_APPROVAL_COMPLETED]: {
    Icon: icons.approved,
    label: OPERATION_STATUS.FINAL_APPROVAL_COMPLETED,
  },
  [OPERATION_STATUS.REJECTED]: {
    Icon: icons.rejected,
    label: OPERATION_STATUS.REJECTED,
  },
});
