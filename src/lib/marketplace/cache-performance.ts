// Cache + Performance Boost
// React Query-like caching with stale-while-revalidate and preloading

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
}

export interface CacheConfig {
  staleTime: number; // Time in ms before data is considered stale
  cacheTime: number; // Time in ms before data is removed from cache
}

// Default cache configuration
const DEFAULT_CONFIG: CacheConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
};

// Cache storage
const cacheStore = new Map<string, CacheEntry<any>>();

// Get from cache
export function getFromCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  
  if (!entry) return null;

  const now = Date.now();

  // Check if cache entry has expired
  if (now - entry.timestamp > entry.cacheTime) {
    cacheStore.delete(key);
    return null;
  }

  return entry.data as T;
}

// Set cache
export function setCache<T>(key: string, data: T, config: CacheConfig = DEFAULT_CONFIG): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    staleTime: config.staleTime,
    cacheTime: config.cacheTime,
  };

  cacheStore.set(key, entry);
}

// Check if cache is stale
export function isCacheStale(key: string): boolean {
  const entry = cacheStore.get(key);
  
  if (!entry) return true;

  const now = Date.now();
  return now - entry.timestamp > entry.staleTime;
}

// Invalidate cache
export function invalidateCache(key: string): void {
  cacheStore.delete(key);
}

// Invalidate all cache
export function invalidateAllCache(): void {
  cacheStore.clear();
}

// Stale-while-revalidate pattern
export async function staleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = DEFAULT_CONFIG
): Promise<T> {
  const cached = getFromCache<T>(key);
  const stale = isCacheStale(key);

  // Return cached data immediately if available
  if (cached && !stale) {
    return cached;
  }

  // If stale or no cache, fetch fresh data
  try {
    const freshData = await fetcher();
    setCache(key, freshData, config);
    return freshData;
  } catch (error) {
    // If fetch fails, return stale data if available
    if (cached) {
      console.warn('Fetch failed, returning stale data:', error);
      return cached;
    }
    throw error;
  }
}

// Prefetch data
export async function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = DEFAULT_CONFIG
): Promise<void> {
  try {
    const data = await fetcher();
    setCache(key, data, config);
  } catch (error) {
    console.warn('Prefetch failed:', error);
  }
}

// Preload first page of data
export function preloadFirstPage<T>(
  keyPrefix: string,
  fetcher: (page: number) => Promise<T[]>
): void {
  prefetch(`${keyPrefix}-page-1`, () => fetcher(1));
}

// Get cache statistics
export function getCacheStats(): {
  totalEntries: number;
  staleEntries: number;
  expiredEntries: number;
  memoryUsage: number;
} {
  const now = Date.now();
  let staleEntries = 0;
  let expiredEntries = 0;
  let memoryUsage = 0;

  cacheStore.forEach((entry) => {
    if (now - entry.timestamp > entry.staleTime) {
      staleEntries++;
    }
    if (now - entry.timestamp > entry.cacheTime) {
      expiredEntries++;
    }
    memoryUsage += JSON.stringify(entry.data).length;
  });

  return {
    totalEntries: cacheStore.size,
    staleEntries,
    expiredEntries,
    memoryUsage,
  };
}

// Clean expired cache entries
export function cleanExpiredCache(): number {
  const now = Date.now();
  let cleaned = 0;

  cacheStore.forEach((entry, key) => {
    if (now - entry.timestamp > entry.cacheTime) {
      cacheStore.delete(key);
      cleaned++;
    }
  });

  return cleaned;
}

// Schedule periodic cache cleanup
export function scheduleCacheCleanup(intervalMinutes: number = 5): number {
  return setInterval(() => {
    cleanExpiredCache();
  }, intervalMinutes * 60 * 1000) as unknown as number;
}

// Export cache data
export function exportCacheData(): string {
  return JSON.stringify(Array.from(cacheStore.entries()), null, 2);
}

// Import cache data
export function importCacheData(json: string): void {
  const data = JSON.parse(json) as Array<[string, CacheEntry<any>]>;
  data.forEach(([key, entry]) => {
    cacheStore.set(key, entry);
  });
}

// Batch cache operations
export function batchSetCache<T>(entries: Array<{ key: string; data: T }>, config?: CacheConfig): void {
  entries.forEach(({ key, data }) => {
    setCache(key, data, config);
  });
}

// Batch cache invalidation
export function batchInvalidateCache(keys: string[]): void {
  keys.forEach((key) => {
    invalidateCache(key);
  });
}

// Get cache keys by pattern
export function getCacheKeysByPattern(pattern: string): string[] {
  const regex = new RegExp(pattern);
  return Array.from(cacheStore.keys()).filter((key) => regex.test(key));
}

// Invalidate cache by pattern
export function invalidateCacheByPattern(pattern: string): number {
  const keys = getCacheKeysByPattern(pattern);
  keys.forEach((key) => invalidateCache(key));
  return keys.length;
}

// Cache warming - preload frequently accessed data
export function warmCache<T>(
  keys: string[],
  fetchers: Map<string, () => Promise<T>>,
  config?: CacheConfig
): Promise<void[]> {
  const promises = keys.map((key) => {
    const fetcher = fetchers.get(key);
    if (fetcher) {
      return prefetch(key, fetcher, config);
    }
    return Promise.resolve();
  });

  return Promise.all(promises);
}

// Deduplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

export function dedupeRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing;
  }

  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// Clear pending requests
export function clearPendingRequests(): void {
  pendingRequests.clear();
}
