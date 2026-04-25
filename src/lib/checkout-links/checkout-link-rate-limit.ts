// Checkout Link Rate Limiting for Public Route
// Rate limit per IP to prevent abuse

// ============================================
// RATE LIMIT RESULT
// ============================================

export interface RateLimitResult {
  success: boolean;
  error?: string;
  remainingRequests: number;
  resetTime: number;
  timestamp: string;
}

// ============================================
// RATE LIMIT MANAGER
// ============================================

export class RateLimitManager {
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private defaultLimit: number = 10;
  private defaultWindowMs: number = 60000; // 1 minute

  // ============================================
  // CHECK RATE LIMIT
  // ============================================

  checkRateLimit(identifier: string, limit?: number, windowMs?: number): RateLimitResult {
    const requestLimit = limit || this.defaultLimit;
    const requestWindowMs = windowMs || this.defaultWindowMs;
    const now = Date.now();

    const entry = this.rateLimitMap.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + requestWindowMs,
      });

      return {
        success: true,
        remainingRequests: requestLimit - 1,
        resetTime: now + requestWindowMs,
        timestamp: new Date().toISOString(),
      };
    }

    if (entry.count >= requestLimit) {
      // Rate limit exceeded
      return {
        success: false,
        error: 'Rate limit exceeded',
        remainingRequests: 0,
        resetTime: entry.resetTime,
        timestamp: new Date().toISOString(),
      };
    }

    // Increment count
    entry.count++;
    this.rateLimitMap.set(identifier, entry);

    return {
      success: true,
      remainingRequests: requestLimit - entry.count,
      resetTime: entry.resetTime,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // CLEAR RATE LIMIT
  // ============================================

  clearRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }

  // ============================================
  // CLEAR ALL RATE LIMITS
  // ============================================

  clearAllRateLimits(): void {
    this.rateLimitMap.clear();
  }

  // ============================================
  // GET RATE LIMIT INFO
  // ============================================

  getRateLimitInfo(identifier: string): {
    count: number;
    resetTime: number;
    remainingTime: number;
  } | null {
    const entry = this.rateLimitMap.get(identifier);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const remainingTime = Math.max(0, entry.resetTime - now);

    return {
      count: entry.count,
      resetTime: entry.resetTime,
      remainingTime,
    };
  }

  // ============================================
  // SET DEFAULT LIMIT
  // ============================================

  setDefaultLimit(limit: number): void {
    this.defaultLimit = limit;
  }

  // ============================================
  // SET DEFAULT WINDOW
  // ============================================

  setDefaultWindow(windowMs: number): void {
    this.defaultWindowMs = windowMs;
  }

  // ============================================
  // CLEANUP EXPIRED ENTRIES
  // ============================================

  cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.rateLimitMap.delete(key);
    }
  }

  // ============================================
  // GET ACTIVE ENTRIES COUNT
  // ============================================

  getActiveEntriesCount(): number {
    return this.rateLimitMap.size;
  }
}

// Export singleton instance
export const rateLimitManager = new RateLimitManager();

// ============================================
// REACT HOOK FOR RATE LIMITING
// ============================================

import { useCallback } from 'react';

export function useRateLimit() {
  const checkRateLimit = useCallback((identifier: string, limit?: number, windowMs?: number) => {
    return rateLimitManager.checkRateLimit(identifier, limit, windowMs);
  }, []);

  const clearRateLimit = useCallback((identifier: string) => {
    rateLimitManager.clearRateLimit(identifier);
  }, []);

  const getRateLimitInfo = useCallback((identifier: string) => {
    return rateLimitManager.getRateLimitInfo(identifier);
  }, []);

  const cleanupExpiredEntries = useCallback(() => {
    rateLimitManager.cleanupExpiredEntries();
  }, []);

  return {
    checkRateLimit,
    clearRateLimit,
    getRateLimitInfo,
    cleanupExpiredEntries,
  };
}
