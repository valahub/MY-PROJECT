// Paddle RBAC Rate Limiter
// Rate limiting for sensitive API endpoints

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.limits.set(identifier, newEntry);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  clear(): void {
    this.limits.clear();
  }
}

// Pre-configured rate limiters for different sensitivity levels
export const sensitiveApiLimiter = new RateLimiter(10, 60 * 1000); // 10 requests per minute
export const standardApiLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute
export const bulkApiLimiter = new RateLimiter(5, 60 * 1000); // 5 requests per minute for bulk operations
