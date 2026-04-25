// API Fail Fallback
// Retry with backoff and cached data fallback

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface FallbackConfig {
  useCache: boolean;
  cacheFallbackOnly: boolean;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// Default fallback configuration
const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  useCache: true,
  cacheFallbackOnly: false,
};

// Calculate delay with exponential backoff
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  return delay;
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fetcher: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// Fetch with fallback to cache
export async function fetchWithFallback<T>(
  key: string,
  fetcher: () => Promise<T>,
  getCached: (key: string) => T | null,
  setCached: (key: string, data: T) => void,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  fallbackConfig: FallbackConfig = DEFAULT_FALLBACK_CONFIG
): Promise<T> {
  // If cache fallback only, try cache first
  if (fallbackConfig.cacheFallbackOnly) {
    const cached = getCached(key);
    if (cached) {
      return cached;
    }
  }

  try {
    const data = await retryWithBackoff(fetcher, retryConfig);
    
    // Cache successful response
    if (fallbackConfig.useCache) {
      setCached(key, data);
    }
    
    return data;
  } catch (error) {
    // Fallback to cache if available
    if (fallbackConfig.useCache) {
      const cached = getCached(key);
      if (cached) {
        console.warn('API failed, returning cached data:', error);
        return cached;
      }
    }
    
    throw error;
  }
}

// Fetch with offline support
export async function fetchWithOfflineSupport<T>(
  key: string,
  fetcher: () => Promise<T>,
  getCached: (key: string) => T | null,
  setCached: (key: string, data: T) => void,
  isOnline: () => boolean
): Promise<T> {
  if (!isOnline()) {
    const cached = getCached(key);
    if (cached) {
      console.warn('Offline, returning cached data');
      return cached;
    }
    throw new Error('Offline and no cached data available');
  }

  return fetchWithFallback(key, fetcher, getCached, setCached);
}

// Circuit breaker pattern
export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
};

// Execute with circuit breaker
export async function executeWithCircuitBreaker<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const state = circuitBreakers.get(key) || {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
  };

  const now = Date.now();

  // Check if circuit is open
  if (state.isOpen) {
    if (now < state.nextAttemptTime) {
      throw new Error('Circuit breaker is open');
    }
    // Attempt to reset
    state.isOpen = false;
    state.failureCount = 0;
  }

  try {
    const result = await fetcher();
    
    // Reset on success
    state.failureCount = 0;
    state.isOpen = false;
    circuitBreakers.set(key, state);
    
    return result;
  } catch (error) {
    state.failureCount++;
    state.lastFailureTime = now;

    // Open circuit if threshold reached
    if (state.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      state.isOpen = true;
      state.nextAttemptTime = now + CIRCUIT_BREAKER_CONFIG.resetTimeout;
    }

    circuitBreakers.set(key, state);
    throw error;
  }
}

// Reset circuit breaker
export function resetCircuitBreaker(key: string): void {
  circuitBreakers.delete(key);
}

// Get circuit breaker status
export function getCircuitBreakerStatus(key: string): CircuitBreakerState | null {
  return circuitBreakers.get(key) || null;
}

// Batch fetch with fallback
export async function batchFetchWithFallback<T>(
  keys: string[],
  fetcher: (key: string) => Promise<T>,
  getCached: (key: string) => T | null,
  setCached: (key: string, data: T) => void,
  retryConfig?: RetryConfig,
  fallbackConfig?: FallbackConfig
): Promise<Map<string, T>> {
  const results = new Map<string, T>();

  const promises = keys.map(async (key) => {
    try {
      const data = await fetchWithFallback(
        key,
        () => fetcher(key),
        getCached,
        setCached,
        retryConfig,
        fallbackConfig
      );
      results.set(key, data);
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
    }
  });

  await Promise.all(promises);
  return results;
}

// Health check for API
export async function healthCheck(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Degraded mode - return simplified data when API fails
export async function fetchWithDegradedMode<T>(
  key: string,
  fetcher: () => Promise<T>,
  degradedFetcher: () => Promise<T>,
  getCached: (key: string) => T | null,
  setCached: (key: string, data: T) => void
): Promise<T> {
  try {
    return await fetchWithFallback(key, fetcher, getCached, setCached);
  } catch (error) {
    console.warn('Primary fetcher failed, trying degraded mode:', error);
    try {
      const degradedData = await degradedFetcher();
      setCached(key, degradedData);
      return degradedData;
    } catch (degradedError) {
      const cached = getCached(key);
      if (cached) {
        console.warn('Degraded mode failed, returning cached data');
        return cached;
      }
      throw new Error('All fetchers failed and no cached data available');
    }
  }
}

// Get retry statistics
export function getRetryStatistics(): {
  totalRetries: number;
  circuitBreakersOpen: number;
  averageRetryDelay: number;
} {
  // In production, track actual retry attempts
  return {
    totalRetries: 0,
    circuitBreakersOpen: Array.from(circuitBreakers.values()).filter((s) => s.isOpen).length,
    averageRetryDelay: DEFAULT_RETRY_CONFIG.initialDelay,
  };
}

// Clear all circuit breakers
export function clearAllCircuitBreakers(): void {
  circuitBreakers.clear();
}
