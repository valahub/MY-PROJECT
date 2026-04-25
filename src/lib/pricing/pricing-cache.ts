// Pricing Cache Strategy
// Lazy load, background refresh, stale-while-revalidate

import { pricingAPI } from './pricing-api';
import { pricingEventBus } from './pricing-events';
import type { PricingPlan } from './pricing-types';

// ============================================
// CACHE CONFIGURATION
// ============================================

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate: boolean;
  backgroundRefresh: boolean;
  backgroundRefreshInterval: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 300000, // 5 minutes
  staleWhileRevalidate: true,
  backgroundRefresh: true,
  backgroundRefreshInterval: 60000, // 1 minute
};

// ============================================
// CACHE ENTRY
// ============================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  isStale: boolean;
}

// ============================================
// PRICING CACHE MANAGER
// ============================================

export class PricingCacheManager {
  private cache: Map<string, CacheEntry<PricingPlan[]>> = new Map();
  private planCache: Map<string, CacheEntry<PricingPlan>> = new Map();
  private config: CacheConfig;
  private refreshTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.setupEventListeners();
  }

  // ============================================
  // SETUP EVENT LISTENERS
  // ============================================

  private setupEventListeners(): void {
    // Invalidate cache on pricing updates
    pricingEventBus.on('pricing.updated', (event) => {
      this.invalidatePlan(event.planId);
    });

    pricingEventBus.on('pricing.created', (event) => {
      this.invalidateAll();
    });

    pricingEventBus.on('pricing.archived', (event) => {
      this.invalidatePlan(event.planId);
    });

    pricingEventBus.on('pricing.restored', (event) => {
      this.invalidatePlan(event.planId);
    });
  }

  // ============================================
  // CACHE PLANS LIST
  // ============================================

  setPlans(data: PricingPlan[]): void {
    const entry: CacheEntry<PricingPlan[]> = {
      data,
      timestamp: Date.now(),
      ttl: this.config.ttl,
      isStale: false,
    };

    this.cache.set('plans', entry);

    // Setup background refresh
    if (this.config.backgroundRefresh) {
      this.setupBackgroundRefresh('plans');
    }
  }

  getPlans(): PricingPlan[] | null {
    const entry = this.cache.get('plans');
    if (!entry) return null;

    // Check if expired
    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired && this.config.staleWhileRevalidate) {
      // Mark as stale but return data
      entry.isStale = true;
      this.triggerBackgroundRefresh('plans');
    } else if (isExpired) {
      // Expired and no stale-while-revalidate
      this.cache.delete('plans');
      return null;
    }

    return entry.data;
  }

  // ============================================
  // CACHE SINGLE PLAN
  // ============================================

  setPlan(planId: string, data: PricingPlan): void {
    const entry: CacheEntry<PricingPlan> = {
      data,
      timestamp: Date.now(),
      ttl: this.config.ttl,
      isStale: false,
    };

    this.planCache.set(planId, entry);

    // Setup background refresh
    if (this.config.backgroundRefresh) {
      this.setupBackgroundRefresh(planId);
    }
  }

  getPlan(planId: string): PricingPlan | null {
    const entry = this.planCache.get(planId);
    if (!entry) return null;

    // Check if expired
    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired && this.config.staleWhileRevalidate) {
      // Mark as stale but return data
      entry.isStale = true;
      this.triggerBackgroundRefresh(planId);
    } else if (isExpired) {
      // Expired and no stale-while-revalidate
      this.planCache.delete(planId);
      return null;
    }

    return entry.data;
  }

  // ============================================
  // SETUP BACKGROUND REFRESH
  // ============================================

  private setupBackgroundRefresh(key: string): void {
    // Clear existing timer
    const existingTimer = this.refreshTimers.get(key);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Setup new timer
    const timer = setInterval(() => {
      this.triggerBackgroundRefresh(key);
    }, this.config.backgroundRefreshInterval);

    this.refreshTimers.set(key, timer);
  }

  // ============================================
  // TRIGGER BACKGROUND REFRESH
  // ============================================

  private async triggerBackgroundRefresh(key: string): Promise<void> {
    try {
      if (key === 'plans') {
        const result = await pricingAPI.getPlans();
        if (result.success && result.data) {
          this.setPlans(result.data);
        }
      } else {
        const result = await pricingAPI.getPlan(key);
        if (result.success && result.data) {
          this.setPlan(key, result.data);
        }
      }
    } catch (error) {
      console.error(`[PricingCache] Background refresh failed for ${key}:`, error);
    }
  }

  // ============================================
  // INVALIDATE CACHE
  // ============================================

  invalidatePlan(planId: string): void {
    this.planCache.delete(planId);
    this.cache.delete('plans'); // Invalidate list since plan changed

    // Clear background refresh timer
    const timer = this.refreshTimers.get(planId);
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete(planId);
    }
  }

  invalidateAll(): void {
    this.cache.clear();
    this.planCache.clear();

    // Clear all timers
    for (const timer of this.refreshTimers.values()) {
      clearInterval(timer);
    }
    this.refreshTimers.clear();
  }

  // ============================================
  // CHECK IF DATA IS STALE
  // ============================================

  isStale(key: string): boolean {
    const entry = this.cache.get(key) || this.planCache.get(key);
    return entry?.isStale || false;
  }

  // ============================================
  // GET CACHE STATS
  // ============================================

  getStats(): {
    plansCached: boolean;
    planCacheSize: number;
    staleEntries: number;
    refreshTimersActive: number;
  } {
    const plansEntry = this.cache.get('plans');
    let staleEntries = 0;

    if (plansEntry?.isStale) staleEntries++;

    for (const entry of this.planCache.values()) {
      if (entry.isStale) staleEntries++;
    }

    return {
      plansCached: !!plansEntry,
      planCacheSize: this.planCache.size,
      staleEntries,
      refreshTimersActive: this.refreshTimers.size,
    };
  }

  // ============================================
  // UPDATE CONFIG
  // ============================================

  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // CLEANUP
  // ============================================

  cleanup(): void {
    this.invalidateAll();
  }
}

// Export singleton instance
export const pricingCacheManager = new PricingCacheManager();

// ============================================
// REACT HOOK FOR PRICING CACHE
// ============================================

import { useState, useCallback, useEffect } from 'react';

export function usePricingCache() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheStats, setCacheStats] = useState(pricingCacheManager.getStats());

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(pricingCacheManager.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPlans = useCallback(() => {
    return pricingCacheManager.getPlans();
  }, []);

  const getPlan = useCallback((planId: string) => {
    return pricingCacheManager.getPlan(planId);
  }, []);

  const setPlans = useCallback((data: PricingPlan[]) => {
    pricingCacheManager.setPlans(data);
  }, []);

  const setPlan = useCallback((planId: string, data: PricingPlan) => {
    pricingCacheManager.setPlan(planId, data);
  }, []);

  const invalidatePlan = useCallback((planId: string) => {
    pricingCacheManager.invalidatePlan(planId);
  }, []);

  const invalidateAll = useCallback(() => {
    pricingCacheManager.invalidateAll();
  }, []);

  const isStale = useCallback((key: string) => {
    return pricingCacheManager.isStale(key);
  }, []);

  const refreshPlans = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await pricingAPI.getPlans();
      if (result.success && result.data) {
        pricingCacheManager.setPlans(result.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshPlan = useCallback(async (planId: string) => {
    setIsRefreshing(true);
    try {
      const result = await pricingAPI.getPlan(planId);
      if (result.success && result.data) {
        pricingCacheManager.setPlan(planId, result.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    isRefreshing,
    cacheStats,
    getPlans,
    getPlan,
    setPlans,
    setPlan,
    invalidatePlan,
    invalidateAll,
    isStale,
    refreshPlans,
    refreshPlan,
  };
}

// ============================================
// LAZY LOADING HOOK
// ============================================

export function useLazyPricing() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadPlans = useCallback(async () => {
    if (isLoaded) {
      const cached = pricingCacheManager.getPlans();
      if (cached) return cached;
    }

    setIsLoading(true);
    try {
      const result = await pricingAPI.getPlans();
      if (result.success && result.data) {
        pricingCacheManager.setPlans(result.data);
        setIsLoaded(true);
        return result.data;
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded]);

  const loadPlan = useCallback(async (planId: string) => {
    const cached = pricingCacheManager.getPlan(planId);
    if (cached) return cached;

    setIsLoading(true);
    try {
      const result = await pricingAPI.getPlan(planId);
      if (result.success && result.data) {
        pricingCacheManager.setPlan(planId, result.data);
        return result.data;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    isLoaded,
    loadPlans,
    loadPlan,
  };
}
