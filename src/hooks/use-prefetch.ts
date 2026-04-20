// usePrefetch — prefetch data before an action is triggered
//
// Keeps a module-level in-memory cache keyed by `key` with a configurable TTL.
// Components call `usePrefetch` as soon as they mount; by the time the user
// clicks an action button the data is already available.

import { useEffect, useRef, useCallback, useState } from "react";

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

// Module-level cache shared across all hook instances
const prefetchCache = new Map<string, CacheEntry<unknown>>();

export interface UsePrefetchOptions<T> {
  /** Unique cache key */
  key: string;
  /** Async fetcher function */
  fetcher: () => Promise<T>;
  /** Whether to run the fetch at all (default: true) */
  enabled?: boolean;
  /** Cache time-to-live in ms (default 60 000) */
  ttlMs?: number;
}

export interface UsePrefetchReturn<T> {
  /** Fetched (or cached) data; null until the first successful fetch */
  data: T | null;
  /** True once data has been fetched and is within TTL */
  isReady: boolean;
  /** Error from the last fetch attempt (if any) */
  error: unknown;
  /** Manually re-run the fetch */
  refetch: () => Promise<void>;
  /** Remove the cached entry so the next call fetches fresh data */
  invalidate: () => void;
}

export function usePrefetch<T>(options: UsePrefetchOptions<T>): UsePrefetchReturn<T> {
  const { key, fetcher, enabled = true, ttlMs = 60_000 } = options;

  const [data, setData] = useState<T | null>(() => {
    const cached = prefetchCache.get(key) as CacheEntry<T> | undefined;
    return cached && Date.now() - cached.fetchedAt < ttlMs ? cached.data : null;
  });
  const [isReady, setIsReady] = useState<boolean>(() => {
    const cached = prefetchCache.get(key);
    return !!(cached && Date.now() - cached.fetchedAt < ttlMs);
  });
  const [error, setError] = useState<unknown>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = useCallback(async (): Promise<void> => {
    const cached = prefetchCache.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.fetchedAt < ttlMs) {
      setData(cached.data);
      setIsReady(true);
      return;
    }

    try {
      const result = await fetcherRef.current();
      prefetchCache.set(key, { data: result as unknown, fetchedAt: Date.now() });
      setData(result);
      setIsReady(true);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [key, ttlMs]);

  useEffect(() => {
    if (enabled) void doFetch();
  }, [enabled, doFetch]);

  const invalidate = useCallback((): void => {
    prefetchCache.delete(key);
    setIsReady(false);
    setData(null);
  }, [key]);

  return { data, isReady, error, refetch: doFetch, invalidate };
}
