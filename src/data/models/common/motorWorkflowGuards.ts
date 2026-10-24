/** Shared motor workflow tab/edit guards — includes irreversible DISCARDED. */

export const normalizeMotorStatusKey = (
  status?: string | null,
): string =>
  String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

/** True when the motor must not be edited or approved (discarded by admin). */
export const isMotorWorkflowTabDisabled = (
  status?: string | null,
): boolean => normalizeMotorStatusKey(status) === "DISCARDED";

export const MOTOR_DISCARDED_TAB_REASON = "Motor discarded";

export const MOTOR_DISCARDED_LOCKED_MESSAGE =
  "This motor has been discarded and cannot be edited.";

/** Prefer DISCARDED when merging root motorStatuses with form motor rows. */
export const preferMotorSubmissionStatus = (
  primary?: string | null,
  secondary?: string | null,
): string => {
  const a = normalizeMotorStatusKey(primary);
  const b = normalizeMotorStatusKey(secondary);
  if (a === "DISCARDED" || b === "DISCARDED") return "DISCARDED";
  if (b) return b;
  if (a) return a;
  return "TO_BE_INITIATED";
};

export const isMotorDiscardedInBatch = (
  batch: { discardedMotors?: Array<{ motorId?: string | null } | null> | null } | null | undefined,
  motorId?: string | null,
): boolean => {
  const id = String(motorId ?? "").trim();
  if (!id || !batch?.discardedMotors?.length) return false;
  return batch.discardedMotors.some(
    (entry) => String(entry?.motorId ?? "").trim().toLowerCase() === id.toLowerCase(),
  );
};

/** Collect discarded motor IDs from form-details / batch payloads. */
export const collectDiscardedMotorIds = (source: any): Set<string> => {
  const ids = new Set<string>();
  const add = (raw: unknown) => {
    const id = String(raw ?? "").trim();
    if (id) ids.add(id.toLowerCase());
  };

  const root = source?.data ?? source ?? {};
  const listSources = [
    root?.discardedMotorIds,
    source?.discardedMotorIds,
    root?.discardedMotors,
    source?.discardedMotors,
    root?.batch?.discardedMotors,
    source?.batch?.discardedMotors,
  ];

  for (const list of listSources) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (typeof entry === "string" || typeof entry === "number") {
        add(entry);
      } else if (entry && typeof entry === "object") {
        add((entry as { motorId?: unknown }).motorId);
      }
    }
  }

  const statusLists = [
    root?.motorStatuses,
    source?.motorStatuses,
  ];
  for (const list of statusLists) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (!entry) continue;
      if (normalizeMotorStatusKey(entry.motorSubmissionStatus) === "DISCARDED") {
        add(entry.motorId);
      }
    }
  }

  const stages = [
    ...(Array.isArray(root?.currentStage) ? root.currentStage : []),
    ...(Array.isArray(root?.stageProgress) ? root.stageProgress : []),
    ...(Array.isArray(source?.currentStage) ? source.currentStage : []),
    ...(Array.isArray(source?.stageProgress) ? source.stageProgress : []),
  ];
  for (const stage of stages) {
    const motorStatuses = stage?.motorStatuses;
    if (!Array.isArray(motorStatuses)) continue;
    for (const entry of motorStatuses) {
      if (normalizeMotorStatusKey(entry?.motorSubmissionStatus) === "DISCARDED") {
        add(entry?.motorId);
      }
    }
  }

  return ids;
};

export const isDiscardedMotorId = (
  discardedIds: Set<string> | null | undefined,
  motorId?: string | null,
): boolean => {
  const id = String(motorId ?? "").trim().toLowerCase();
  return Boolean(id && discardedIds?.has(id));
};