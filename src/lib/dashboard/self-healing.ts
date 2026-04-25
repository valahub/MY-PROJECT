// Self-Healing System for Dashboard
// Retry with backoff, fallback cache, anomaly detection

// ============================================
// SELF-HEALING CONFIGURATION
// ============================================

export interface SelfHealingConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  enableFallbackCache: boolean;
  enableAnomalyDetection: boolean;
  anomalyThreshold: number;
}

const DEFAULT_CONFIG: SelfHealingConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  enableFallbackCache: true,
  enableAnomalyDetection: true,
  anomalyThreshold: 3, // Standard deviations
};

// ============================================
// CACHE STORAGE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheStorage {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  set<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================
// ANOMALY DETECTION
// ============================================

export interface AnomalyReport {
  type: 'value' | 'trend' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: unknown;
  timestamp: number;
}

class AnomalyDetector {
  private history: Map<string, number[]> = new Map();
  private maxHistorySize: number = 100;

  // Add value to history
  addValue(key: string, value: number): void {
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }

    const values = this.history.get(key)!;
    values.push(value);

    // Limit history size
    if (values.length > this.maxHistorySize) {
      values.shift();
    }
  }

  // Calculate mean
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Calculate standard deviation
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length);
  }

  // Detect anomaly in value
  detectValueAnomaly(key: string, value: number, threshold: number = 3): AnomalyReport | null {
    const values = this.history.get(key);
    if (!values || values.length < 10) {
      // Not enough data
      this.addValue(key, value);
      return null;
    }

    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values, mean);

    // Check if value is beyond threshold standard deviations
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > threshold) {
      const severity = zScore > 5 ? 'critical' : zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low';
      
      return {
        type: 'value',
        severity,
        message: `Value ${value} is ${zScore.toFixed(2)} standard deviations from mean ${mean.toFixed(2)}`,
        data: { key, value, mean, stdDev, zScore },
        timestamp: Date.now(),
      };
    }

    // Add to history if not anomalous
    this.addValue(key, value);
    return null;
  }

  // Detect trend anomaly
  detectTrendAnomaly(key: string, threshold: number = 2): AnomalyReport | null {
    const values = this.history.get(key);
    if (!values || values.length < 5) return null;

    // Calculate recent trend
    const recent = values.slice(-5);
    const earlier = values.slice(-10, -5);

    if (earlier.length === 0) return null;

    const recentMean = this.calculateMean(recent);
    const earlierMean = this.calculateMean(earlier);

    const percentChange = ((recentMean - earlierMean) / earlierMean) * 100;

    // Check for sudden change
    if (Math.abs(percentChange) > threshold * 100) {
      const severity = Math.abs(percentChange) > 500 ? 'critical' : Math.abs(percentChange) > 200 ? 'high' : 'medium';
      
      return {
        type: 'trend',
        severity,
        message: `Sudden ${percentChange > 0 ? 'increase' : 'decrease'} of ${percentChange.toFixed(1)}% detected`,
        data: { key, recentMean, earlierMean, percentChange },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  // Clear history for key
  clear(key: string): void {
    this.history.delete(key);
  }

  // Clear all history
  clearAll(): void {
    this.history.clear();
  }
}

// ============================================
// SELF-HEALING MANAGER
// ============================================

export class SelfHealingManager {
  private config: SelfHealingConfig;
  private cache: CacheStorage;
  private anomalyDetector: AnomalyDetector;
  private retryCounters: Map<string, number> = new Map();

  constructor(config: Partial<SelfHealingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new CacheStorage();
    this.anomalyDetector = new AnomalyDetector();

    // Start periodic cache cleanup
    setInterval(() => this.cache.cleanup(), 60000); // Every minute
  }

  // ============================================
  // RETRY WITH BACKOFF
  // ============================================

  async retryWithBackoff<T>(
    key: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<{ success: boolean; data: T | null; error: string | null; usedFallback: boolean }> {
    let lastError: Error | null = null;
    let attempt = 0;
    const maxRetries = this.config.maxRetries;

    // Get retry counter
    const retryCount = this.retryCounters.get(key) || 0;

    while (attempt < maxRetries) {
      try {
        const result = await fn();
        
        // Success - reset retry counter
        this.retryCounters.set(key, 0);
        
        return {
          success: true,
          data: result,
          error: null,
          usedFallback: false,
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Increment retry counter
        this.retryCounters.set(key, retryCount + attempt);

        if (attempt < maxRetries) {
          // Calculate delay with exponential backoff
          const delay = Math.min(
            this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
            this.config.maxDelay
          );

          console.warn(`[SelfHealing] Retry ${attempt}/${maxRetries} for ${key} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - try fallback
    if (this.config.enableFallbackCache && fallback) {
      try {
        console.warn(`[SelfHealing] Using fallback for ${key}`);
        const fallbackResult = await fallback();
        
        return {
          success: true,
          data: fallbackResult,
          error: null,
          usedFallback: true,
        };
      } catch (fallbackError) {
        console.error(`[SelfHealing] Fallback also failed for ${key}:`, fallbackError);
      }
    }

    return {
      success: false,
      data: null,
      error: lastError?.message || 'Unknown error',
      usedFallback: false,
    };
  }

  // ============================================
  // CACHE OPERATIONS
  // ============================================

  setCache<T>(key: string, data: T, ttl?: number): void {
    if (this.config.enableFallbackCache) {
      this.cache.set(key, data, ttl);
    }
  }

  getCache<T>(key: string): T | null {
    if (this.config.enableFallbackCache) {
      return this.cache.get<T>(key);
    }
    return null;
  }

  hasCache(key: string): boolean {
    if (this.config.enableFallbackCache) {
      return this.cache.has(key);
    }
    return false;
  }

  deleteCache(key: string): void {
    this.cache.delete(key);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ============================================
  // ANOMALY DETECTION
  // ============================================

  detectAnomaly(key: string, value: number): AnomalyReport | null {
    if (!this.config.enableAnomalyDetection) return null;

    // Check value anomaly
    const valueAnomaly = this.anomalyDetector.detectValueAnomaly(
      key,
      value,
      this.config.anomalyThreshold
    );

    if (valueAnomaly) {
      this.logAnomaly(valueAnomaly);
      return valueAnomaly;
    }

    // Check trend anomaly
    const trendAnomaly = this.anomalyDetector.detectTrendAnomaly(key, this.config.anomalyThreshold);

    if (trendAnomaly) {
      this.logAnomaly(trendAnomaly);
      return trendAnomaly;
    }

    return null;
  }

  private logAnomaly(anomaly: AnomalyReport): void {
    console.warn('[SelfHealing] Anomaly detected:', anomaly);

    // Send to logging endpoint
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'anomaly_detected',
        anomaly,
      }),
    }).catch((error) => {
      console.error('[SelfHealing] Failed to log anomaly:', error);
    });

    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('dashboard:anomaly', {
      detail: anomaly,
    }));
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(endpoint: string): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        cache: 'no-cache',
      });

      const latency = Date.now() - start;

      return {
        healthy: response.ok,
        latency,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  updateConfig(config: Partial<SelfHealingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SelfHealingConfig {
    return { ...this.config };
  }

  // ============================================
  // STATISTICS
  // ============================================

  getStats(): {
    cacheSize: number;
    retryCounters: Record<string, number>;
    anomalyHistorySize: number;
  } {
    const retryCountersObj: Record<string, number> = {};
    this.retryCounters.forEach((count, key) => {
      retryCountersObj[key] = count;
    });

    return {
      cacheSize: (this.cache as any).cache.size,
      retryCounters: retryCountersObj,
      anomalyHistorySize: (this.anomalyDetector as any).history.size,
    };
  }
}

// Export singleton instance
export const selfHealingManager = new SelfHealingManager();

// ============================================
// REACT HOOK FOR SELF-HEALING
// ============================================

import { useState, useCallback, useEffect } from 'react';

export function useSelfHealing() {
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);

  // Execute with self-healing
  const executeWithHealing = useCallback(async <T>(
    key: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<{ success: boolean; data: T | null; error: string | null }> => {
    const result = await selfHealingManager.retryWithBackoff(key, fn, fallback);
    setIsUsingFallback(result.usedFallback);
    return result;
  }, []);

  // Check cache
  const getCached = useCallback(<T,>(key: string): T | null => {
    return selfHealingManager.getCache<T>(key);
  }, []);

  // Set cache
  const setCached = useCallback(<T,>(key: string, data: T, ttl?: number): void => {
    selfHealingManager.setCache(key, data, ttl);
  }, []);

  // Detect anomaly
  const detectAnomaly = useCallback((key: string, value: number): AnomalyReport | null => {
    return selfHealingManager.detectAnomaly(key, value);
  }, []);

  // Health check
  const healthCheck = useCallback(async (endpoint: string) => {
    return selfHealingManager.healthCheck(endpoint);
  }, []);

  // Listen for anomaly events
  useEffect(() => {
    const handleAnomaly = (e: CustomEvent) => {
      setAnomalies((prev) => [...prev, e.detail]);
    };

    window.addEventListener('dashboard:anomaly', handleAnomaly as EventListener);

    return () => {
      window.removeEventListener('dashboard:anomaly', handleAnomaly as EventListener);
    };
  }, []);

  // Clear anomalies
  const clearAnomalies = useCallback(() => {
    setAnomalies([]);
  }, []);

  return {
    isUsingFallback,
    anomalies,
    executeWithHealing,
    getCached,
    setCached,
    detectAnomaly,
    healthCheck,
    clearAnomalies,
  };
}

// ============================================
// API WRAPPER WITH SELF-HEALING
// ============================================

export async function fetchWithSelfHealing<T>(
  key: string,
  url: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<{ success: boolean; data: T | null; error: string | null; usedFallback: boolean }> {
  // Check cache first
  const cached = selfHealingManager.getCache<T>(key);
  if (cached) {
    console.log(`[SelfHealing] Using cached data for ${key}`);
    return {
      success: true,
      data: cached,
      error: null,
      usedFallback: true,
    };
  }

  // Fetch with retry
  const result = await selfHealingManager.retryWithBackoff(
    key,
    async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Cache successful response
      selfHealingManager.setCache(key, data);
      
      return data;
    },
    fallbackData ? async () => fallbackData : undefined
  );

  return result;
}
