import { useCallback, useEffect, useRef } from "react";

type DebouncedFn<T extends (...args: never[]) => void> = T & {
  cancel: () => void;
  flush: (...args: Parameters<T>) => void;
};

/** Returns a debounced callback that exposes cancel/flush for pending draft commits. */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number,
): DebouncedFn<T> {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  callbackRef.current = callback;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  const flush = useCallback((...args: Parameters<T>) => {
    cancel();
    callbackRef.current(...args);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (lastArgsRef.current) {
          callbackRef.current(...lastArgsRef.current);
          lastArgsRef.current = null;
        }
      }, delayMs);
    },
    [delayMs],
  ) as DebouncedFn<T>;

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}
