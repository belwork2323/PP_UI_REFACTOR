type FlushFn = () => void;

const pendingFlushFns = new Set<FlushFn>();

export const registerCasingPendingDraft = (flush: FlushFn): (() => void) => {
  pendingFlushFns.add(flush);
  return () => pendingFlushFns.delete(flush);
};

/** Commit all in-flight debounced field edits before save, submit, or back. */
export const flushCasingPendingDrafts = (): void => {
  pendingFlushFns.forEach((flush) => flush());
};
