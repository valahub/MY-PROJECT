// Pricing Error Handling
// Retry with backoff, optimistic UI updates, error recovery

import type { PricingPlan, PlanChangeRequest } from './pricing-types';
import { pricingAPI } from './pricing-api';
import { pricingCacheManager } from './pricing-cache';

// ============================================
// ERROR HANDLING CONFIG
// ============================================

export interface ErrorHandlingConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  enableOptimisticUI: boolean;
  enableFallback: boolean;
}

const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  enableOptimisticUI: true,
  enableFallback: true,
};

// ============================================
// ERROR RESULT
// ============================================

export interface ErrorResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  retried: boolean;
  usedFallback: boolean;
}

// ============================================
// OPTIMISTIC UPDATE STATE
// ============================================

export interface OptimisticUpdate<T> {
  id: string;
  originalData: T;
  optimisticData: T;
  timestamp: number;
}

// ============================================
// PRICING ERROR HANDLER
// ============================================

export class PricingErrorHandler {
  private config: ErrorHandlingConfig;
  private optimisticUpdates: Map<string, OptimisticUpdate<unknown>> = new Map();
  private fallbackCache: Map<string, unknown> = new Map();

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
  }

  // ============================================
  // RETRY WITH EXPONENTIAL BACKOFF
  // ============================================

  async retryWithBackoff<T>(
    key: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<ErrorResult<T>> {
    let lastError: Error | null = null;
    let attempt = 0;
    const maxRetries = this.config.maxRetries;

    while (attempt < maxRetries) {
      try {
        const result = await fn();
        return {
          success: true,
          data: result,
          error: null,
          retried: attempt > 0,
          usedFallback: false,
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt < maxRetries) {
          const delay = Math.min(
            this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1),
            this.config.maxDelay
          );

          console.warn(`[PricingErrorHandler] Retry ${attempt}/${maxRetries} for ${key} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - try fallback
    if (this.config.enableFallback && fallback) {
      try {
        console.warn(`[PricingErrorHandler] Using fallback for ${key}`);
        const fallbackResult = await fallback();

        return {
          success: true,
          data: fallbackResult,
          error: null,
          retried: true,
          usedFallback: true,
        };
      } catch (fallbackError) {
        console.error(`[PricingErrorHandler] Fallback also failed for ${key}:`, fallbackError);
      }
    }

    return {
      success: false,
      data: null,
      error: lastError?.message || 'Unknown error',
      retried: true,
      usedFallback: false,
    };
  }

  // ============================================
  // OPTIMISTIC UI UPDATE
  // ============================================

  beginOptimisticUpdate<T>(id: string, originalData: T, optimisticData: T): void {
    if (!this.config.enableOptimisticUI) return;

    this.optimisticUpdates.set(id, {
      id,
      originalData,
      optimisticData,
      timestamp: Date.now(),
    });
  }

  commitOptimisticUpdate<T>(id: string): void {
    this.optimisticUpdates.delete(id);
  }

  rollbackOptimisticUpdate<T>(id: string): T | null {
    const update = this.optimisticUpdates.get(id);
    if (!update) return null;

    this.optimisticUpdates.delete(id);
    return update.originalData as T;
  }

  hasPendingOptimisticUpdate(id: string): boolean {
    return this.optimisticUpdates.has(id);
  }

  getOptimisticData<T>(id: string): T | null {
    const update = this.optimisticUpdates.get(id);
    return update ? (update.optimisticData as T) : null;
  }

  // ============================================
  // FALLBACK CACHE
  // ============================================

  setFallback<T>(key: string, data: T): void {
    this.fallbackCache.set(key, data);
  }

  getFallback<T>(key: string): T | null {
    return (this.fallbackCache.get(key) as T) || null;
  }

  hasFallback(key: string): boolean {
    return this.fallbackCache.has(key);
  }

  clearFallback(key: string): void {
    this.fallbackCache.delete(key);
  }

  clearAllFallbacks(): void {
    this.fallbackCache.clear();
  }

  // ============================================
  // SAFE API CALL WITH ERROR HANDLING
  // ============================================

  async safeAPICall<T>(
    key: string,
    apiCall: () => Promise<{ success: boolean; data: T; error: string | null }>,
    optimisticData?: T
  ): Promise<{ success: boolean; data: T | null; error: string | null; retried: boolean; usedFallback: boolean }> {
    // Begin optimistic update if enabled
    if (optimisticData && this.config.enableOptimisticUI) {
      this.beginOptimisticUpdate(key, optimisticData, optimisticData);
    }

    try {
      // Retry with backoff
      const result = await this.retryWithBackoff(key, apiCall);

      if (result.success) {
        // Commit optimistic update
        if (optimisticData) {
          this.commitOptimisticUpdate(key);
        }
      } else {
        // Rollback optimistic update on failure
        if (optimisticData) {
          this.rollbackOptimisticUpdate(key);
        }
      }

      return {
        success: result.success,
        data: result.data as T,
        error: result.error,
        retried: result.retried,
        usedFallback: result.usedFallback,
      };
    } catch (error) {
      // Rollback optimistic update on error
      if (optimisticData) {
        this.rollbackOptimisticUpdate(key);
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        retried: true,
        usedFallback: false,
      };
    }
  }

  // ============================================
  // UPDATE CONFIG
  // ============================================

  updateConfig(config: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // GET STATS
  // ============================================

  getStats(): {
    pendingOptimisticUpdates: number;
    fallbackCacheSize: number;
  } {
    return {
      pendingOptimisticUpdates: this.optimisticUpdates.size,
      fallbackCacheSize: this.fallbackCache.size,
    };
  }

  // ============================================
  // CLEANUP
  // ============================================

  cleanup(): void {
    this.optimisticUpdates.clear();
    this.fallbackCache.clear();
  }
}

// Export singleton instance
export const pricingErrorHandler = new PricingErrorHandler();

// ============================================
// REACT HOOK FOR ERROR HANDLING
// ============================================

import { useState, useCallback } from 'react';

export function usePricingErrorHandling() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const safeAPICall = useCallback(async <T>(
    key: string,
    apiCall: () => Promise<{ success: boolean; data: T; error: string | null }>,
    optimisticData?: T
  ): Promise<ErrorResult<T>> => {
    setIsRetrying(true);
    setError(null);
    setUsedFallback(false);

    try {
      const result = await pricingErrorHandler.safeAPICall(key, apiCall, optimisticData);

      if (!result.success) {
        setError(result.error);
      }

      setUsedFallback(result.usedFallback);
      return result;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  const retryWithBackoff = useCallback(async <T>(
    key: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<ErrorResult<T>> => {
    setIsRetrying(true);
    setError(null);

    try {
      const result = await pricingErrorHandler.retryWithBackoff(key, fn, fallback);

      if (!result.success) {
        setError(result.error);
      }

      return result;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  const beginOptimisticUpdate = useCallback(<T>(id: string, originalData: T, optimisticData: T) => {
    pricingErrorHandler.beginOptimisticUpdate(id, originalData, optimisticData);
  }, []);

  const commitOptimisticUpdate = useCallback((id: string) => {
    pricingErrorHandler.commitOptimisticUpdate(id);
  }, []);

  const rollbackOptimisticUpdate = useCallback(<T>(id: string): T | null => {
    return pricingErrorHandler.rollbackOptimisticUpdate<T>(id);
  }, []);

  const hasPendingUpdate = useCallback((id: string) => {
    return pricingErrorHandler.hasPendingOptimisticUpdate(id);
  }, []);

  const getOptimisticData = useCallback(<T>(id: string): T | null => {
    return pricingErrorHandler.getOptimisticData<T>(id);
  }, []);

  const setFallback = useCallback(<T>(key: string, data: T) => {
    pricingErrorHandler.setFallback(key, data);
  }, []);

  const getFallback = useCallback(<T>(key: string): T | null => {
    return pricingErrorHandler.getFallback<T>(key);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isRetrying,
    error,
    usedFallback,
    safeAPICall,
    retryWithBackoff,
    beginOptimisticUpdate,
    commitOptimisticUpdate,
    rollbackOptimisticUpdate,
    hasPendingUpdate,
    getOptimisticData,
    setFallback,
    getFallback,
    clearError,
  };
}

// ============================================
// WRAPPER FOR STORE OPERATIONS WITH ERROR HANDLING
// ============================================

export async function safeCreatePlan(
  request: PlanChangeRequest,
  userId: string,
  optimisticPlan?: PricingPlan
): Promise<ErrorResult<PricingPlan>> {
  const key = `create_plan_${Date.now()}`;

  return pricingErrorHandler.safeAPICall(
    key,
    () => pricingAPI.createPlan(request),
    optimisticPlan
  );
}

export async function safeUpdatePlan(
  planId: string,
  request: PlanChangeRequest,
  userId: string,
  optimisticPlan?: PricingPlan
): Promise<ErrorResult<PricingPlan>> {
  const key = `update_plan_${planId}`;

  return pricingErrorHandler.safeAPICall(
    key,
    () => pricingAPI.updatePlan(planId, request),
    optimisticPlan
  );
}

export async function safeArchivePlan(
  planId: string,
  userId: string,
  optimisticPlan?: PricingPlan
): Promise<ErrorResult<PricingPlan>> {
  const key = `archive_plan_${planId}`;

  return pricingErrorHandler.safeAPICall(
    key,
    () => pricingAPI.archivePlan(planId),
    optimisticPlan
  );
}
