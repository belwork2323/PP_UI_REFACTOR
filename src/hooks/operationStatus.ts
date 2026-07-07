export const OPERATION_STATUS = {
  INITIATED: "Initiated",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export type OperationStatus = (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

/** UI label map for each workflow stage (used by row action buttons). */
export type OperationStatusMap = typeof OPERATION_STATUS;

/** Ordered status values for list filter dropdowns (includes Initiated). */
export const OPERATION_STATUS_FILTER_VALUES: OperationStatus[] = [
  OPERATION_STATUS.INITIATED,
  OPERATION_STATUS.IN_PROGRESS,
  OPERATION_STATUS.WAITING_FOR_APPROVAL,
  OPERATION_STATUS.APPROVED,
  OPERATION_STATUS.REJECTED,
];

/** UI status labels → uppercase API enum values for list filters */
export const OPERATION_STATUS_UI_TO_API: Record<string, string> = {
  [OPERATION_STATUS.INITIATED]: "INITIATED",
  [OPERATION_STATUS.IN_PROGRESS]: "IN_PROGRESS",
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: "WAITING_FOR_APPROVAL",
  [OPERATION_STATUS.APPROVED]: "APPROVED",
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
  if (OPERATION_STATUS_API_VALUES.has(upper)) return upper;

  return upper;
}

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
  [OPERATION_STATUS.INITIATED]: {
    Icon: icons.initiated,
    label: OPERATION_STATUS.INITIATED,
  },
  [OPERATION_STATUS.IN_PROGRESS]: {
    Icon: icons.inProgress,
    label: OPERATION_STATUS.IN_PROGRESS,
  },
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: {
    Icon: icons.waitingForApproval,
    label: OPERATION_STATUS.WAITING_FOR_APPROVAL,
  },
  [OPERATION_STATUS.APPROVED]: {
    Icon: icons.approved,
    label: OPERATION_STATUS.APPROVED,
  },
  [OPERATION_STATUS.REJECTED]: {
    Icon: icons.rejected,
    label: OPERATION_STATUS.REJECTED,
  },
});
