"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getApiRevision,
  subscribeApiRevision,
} from "@/lib/api/revision";
import { toUserMessage } from "@/lib/services/errors";

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** True only for the very first load — used to pick skeleton vs. inline spinner. */
  initialLoading: boolean;
  refresh: () => void;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

const NO_STORE_SUBSCRIPTION = () => () => {};
const ZERO = () => 0;

/**
 * Runs a service call and tracks loading/error state.
 *
 * Re-runs whenever `deps` change or the datastore is mutated, so a decision made
 * on one screen is reflected everywhere without manual cache juggling.
 *
 * `deps` must be JSON-serialisable primitives — they form the request key that
 * decides when a result is stale.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean; watchStore?: boolean } = {},
): AsyncState<T> {
  const { enabled = true, watchStore = true } = options;

  const [nonce, setNonce] = useState(0);
  const revision = useSyncExternalStore(
    watchStore ? subscribeApiRevision : NO_STORE_SUBSCRIPTION,
    watchStore ? getApiRevision : ZERO,
    ZERO,
  );

  const key = JSON.stringify([deps, nonce, enabled, revision]);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  // Keeps the effect from re-running when an inline loader closure changes
  // identity — only the request key drives a refetch.
  const runLoader = useEffectEvent(() => loader());

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    runLoader()
      .then((data) => {
        if (active) setSettled({ key, data, error: null });
      })
      .catch((cause: unknown) => {
        if (active) setSettled({ key, data: null, error: toUserMessage(cause) });
      });

    return () => {
      active = false;
    };
  }, [key, enabled]);

  const isCurrent = settled?.key === key;
  const loading = enabled && !isCurrent;

  return {
    // Previous data stays visible while a refetch is in flight, so filtered
    // tables don't flash empty between keystrokes.
    data: isCurrent ? settled.data : (settled?.data ?? null),
    error: isCurrent ? settled.error : null,
    loading,
    initialLoading: loading && settled === null,
    refresh: useCallback(() => setNonce((value) => value + 1), []),
  };
}

/** Tracks an in-flight mutation and surfaces a user-safe error message. */
export function useMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (cause) {
        setError(toUserMessage(cause));
        return null;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, pending, error, clearError };
}

/** Debounces a rapidly changing value, e.g. a search box. */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  const commit = useEffectEvent((next: T) => setDebounced(next));

  useEffect(() => {
    const timer = setTimeout(() => commit(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * False during server render and the first client render, true afterwards.
 * The standard guard for portals and other browser-only rendering.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    NO_STORE_SUBSCRIPTION,
    () => true,
    () => false,
  );
}

/**
 * Resets a paged view to page 1 whenever the filter signature changes, without
 * a state-syncing effect.
 */
export function usePagination(filterKey: string) {
  const [state, setState] = useState({ page: 1, key: filterKey });
  const page = state.key === filterKey ? state.page : 1;

  const setPage = useCallback(
    (next: number) => setState({ page: next, key: filterKey }),
    [filterKey],
  );

  return [page, setPage] as const;
}
