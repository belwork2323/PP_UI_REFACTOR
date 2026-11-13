import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Draft state for a collapsible list filter panel. The draft is re-read from the applied
 * filters each time the panel opens, and follows the status tab while the panel is open.
 */
export const useListFilterDraft = <D extends { status: string }>({
  empty,
  fromApplied,
  statusFilter,
  onOpen,
}: {
  empty: D;
  fromApplied: () => D;
  statusFilter: string;
  /** Called each time the panel opens (e.g. lazy-load dropdown options). */
  onOpen?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<D>(empty);

  const fromAppliedRef = useRef(fromApplied);
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    fromAppliedRef.current = fromApplied;
    onOpenRef.current = onOpen;
  });

  useEffect(() => {
    if (!isOpen) return;
    setDraft(fromAppliedRef.current());
    onOpenRef.current?.();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setDraft((current) => ({ ...current, status: statusFilter }));
  }, [statusFilter, isOpen]);

  const updateDraft = useCallback(
    (patch: Partial<D>) => setDraft((current) => ({ ...current, ...patch })),
    [],
  );

  const emptyRef = useRef(empty);
  const resetDraft = useCallback(() => setDraft(emptyRef.current), []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((open) => !open),
    draft,
    updateDraft,
    resetDraft,
  };
};

export default useListFilterDraft;
