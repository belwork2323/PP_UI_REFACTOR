import { STRINGS } from "../../../app/config/strings";

export type WorkflowFormHeaderStatusVariant = "new" | "edit";

export type WorkflowFormHeaderStatusResult = {
  status: string;
  statusLabel: string;
  statusVariant: WorkflowFormHeaderStatusVariant;
  isRejected: boolean;
  rejectionReason: string | null;
};

const DEFAULT_STATUS_KEYS = [
  "rmStatus",
  "cpStatus",
  "mxStatus",
  "ccStatus",
  "pcStatus",
  "ssStatus",
  "trStatus",
  "dispatchStatus",
  "qcStatus",
  "ndtStatus",
  "stfStatus",
  "status",
] as const;

/** Canonical form-header chip labels (shared across all subdepartments). */
export const WORKFLOW_FORM_HEADER_STATUS_LABELS = {
  newSubmission: STRINGS.MANUFACTURING.FORM_HEADER.NEW_SUBMISSION,
  draft: STRINGS.MANUFACTURING.FORM_HEADER.DRAFT,
  rejected: STRINGS.MANUFACTURING.FORM_HEADER.REJECTED,
  approved: STRINGS.MANUFACTURING.FORM_HEADER.APPROVED,
  waitingForApproval: STRINGS.MANUFACTURING.FORM_HEADER.WAITING_FOR_APPROVAL,
} as const;

export const normalizeWorkflowStatus = (raw: unknown): string =>
  String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const pickBatchWorkflowStatus = (
  batch: Record<string, unknown> | null | undefined,
  preferredKeys: string[] = [],
): string => {
  const keys = [...preferredKeys, ...DEFAULT_STATUS_KEYS];
  for (const key of keys) {
    const value = batch?.[key];
    if (value != null && String(value).trim() !== "") {
      return normalizeWorkflowStatus(value);
    }
  }
  return "";
};

/**
 * Form header chip from batch workflow status (not editMode).
 *
 * | Status                 | Chip                  |
 * |------------------------|-----------------------|
 * | TO_BE_INITIATED        | New Submission        |
 * | IN_PROGRESS            | Draft                 |
 * | REJECTED               | Rejected              |
 * | APPROVED               | Approved              |
 * | WAITING_FOR_APPROVAL   | Waiting for Approval  |
 */
export const resolveWorkflowFormHeaderStatus = (
  batch: Record<string, unknown> | null | undefined,
  options?: {
    preferredStatusKeys?: string[];
    /** Override default "New Submission" (e.g. "New Revalidation"). */
    newSubmissionLabel?: string;
  },
): WorkflowFormHeaderStatusResult => {
  const status = pickBatchWorkflowStatus(batch, options?.preferredStatusKeys);
  const labels = WORKFLOW_FORM_HEADER_STATUS_LABELS;
  const newLabel = options?.newSubmissionLabel ?? labels.newSubmission;

  let statusLabel = newLabel;
  if (status === "IN_PROGRESS") statusLabel = labels.draft;
  else if (status === "REJECTED") statusLabel = labels.rejected;
  else if (status === "APPROVED") statusLabel = labels.approved;
  else if (
    status === "WAITING_FOR_APPROVAL" ||
    status === "WAITING_FOR_PARTIAL_APPROVAL"
  ) {
    statusLabel = labels.waitingForApproval;
  }

  const isRejected = status === "REJECTED";
  const rejectionReason = isRejected
    ? String((batch as { rejectionReason?: unknown } | null | undefined)?.rejectionReason ?? "").trim() ||
      null
    : null;

  return {
    status,
    statusLabel,
    statusVariant: isRejected ? "edit" : "new",
    isRejected,
    rejectionReason,
  };
};
