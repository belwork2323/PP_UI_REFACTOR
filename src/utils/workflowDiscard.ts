import { diffNewTempFileIds, noopTempFileExtractor, type TempFileIdExtractor } from "./workflowTempFiles";

export type DiscardWorkflowFormArgs<T = unknown> = {
  subDepartmentId?: number | null;
  baselineState: T;
  currentState: T;
  extractTempFileIds: TempFileIdExtractor<T>;
  deleteTemp: (fileId: string, subDepartmentId: number) => Promise<boolean>;
  resetForm: () => void;
  onBeforeReset?: () => void;
};

/** Delete session-new temp uploads, then reset local form state. Never deletes baseline files. */
export async function discardWorkflowForm<T>({
  subDepartmentId,
  baselineState,
  currentState,
  extractTempFileIds,
  deleteTemp,
  resetForm,
  onBeforeReset,
}: DiscardWorkflowFormArgs<T>): Promise<void> {
  const baselineIds = extractTempFileIds(baselineState);
  const currentIds = extractTempFileIds(currentState);
  const newIds = diffNewTempFileIds(currentIds, baselineIds);

  if (subDepartmentId && newIds.length) {
    await Promise.allSettled(newIds.map((fileId) => deleteTemp(fileId, subDepartmentId)));
  }

  onBeforeReset?.();
  resetForm();
}

export type DiscardWorkflowSnapshotFormArgs<T = unknown> = {
  subDepartmentId?: number | null;
  initialSnapshot: string;
  currentState: T;
  extractTempFileIds?: TempFileIdExtractor<T>;
  deleteTemp: (fileId: string, subDepartmentId: number) => Promise<boolean>;
  resetForm: () => void;
  onBeforeReset?: () => void;
};

/** Parse baseline from stored snapshot string, then run session-new temp cleanup. */
export async function discardWorkflowSnapshotForm<T>({
  subDepartmentId,
  initialSnapshot,
  currentState,
  extractTempFileIds = noopTempFileExtractor,
  deleteTemp,
  resetForm,
  onBeforeReset,
}: DiscardWorkflowSnapshotFormArgs<T>): Promise<void> {
  let baselineState: T;
  try {
    baselineState = JSON.parse(initialSnapshot) as T;
  } catch {
    baselineState = (Array.isArray(currentState) ? [] : {}) as T;
  }

  await discardWorkflowForm({
    subDepartmentId,
    baselineState,
    currentState,
    extractTempFileIds,
    deleteTemp,
    resetForm,
    onBeforeReset,
  });
}
