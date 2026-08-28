type FlushFn = () => void;

const pendingFlushFns = new Set<FlushFn>();

export const registerSubscalePendingDraft = (flush: FlushFn): (() => void) => {
  pendingFlushFns.add(flush);
  return () => pendingFlushFns.delete(flush);
};

/** Commit all in-flight debounced table cell edits before save, submit, or back. */
export const flushSubscalePendingDrafts = (): void => {
  pendingFlushFns.forEach((flush) => flush());
};
