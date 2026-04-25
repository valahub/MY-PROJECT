// Security Layer for Merchant Dashboard
// Merchant data isolation, JWT validation, rate limiting

// ============================================
// JWT VALIDATION
// ============================================

export interface JWTPayload {
  sub: string; // User ID
  merchantId: string; // Merchant ID for data isolation
  role: 'merchant' | 'admin' | 'superadmin';
  email: string;
  iat: number;
  exp: number;
}

export class JWTValidator {
  private secret: string;

  constructor(secret: string = process.env.VITE_JWT_SECRET || 'default-secret') {
    this.secret = secret;
  }

  // Validate JWT token (simplified - in production use proper JWT library)
  validate(token: string): JWTPayload | null {
    try {
      // Split token
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode payload (base64)
      const payload = JSON.parse(atob(parts[1]));

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }

      // Validate required fields
      if (!payload.sub || !payload.merchantId || !payload.role) {
        return null;
      }

      return payload as JWTPayload;
    } catch (error) {
      console.error('[JWTValidator] Validation error:', error);
      return null;
    }
  }

  // Check if token is expired
  isExpired(token: string): boolean {
    const payload = this.validate(token);
    if (!payload) return true;
    return payload.exp < Date.now() / 1000;
  }

  // Get merchant ID from token
  getMerchantId(token: string): string | null {
    const payload = this.validate(token);
    return payload?.merchantId || null;
  }

  // Get user role from token
  getRole(token: string): string | null {
    const payload = this.validate(token);
    return payload?.role || null;
  }
}

// ============================================
// MERCHANT DATA ISOLATION
// ============================================

export class MerchantDataIsolation {
  private currentMerchantId: string | null = null;

  // Set current merchant context
  setMerchant(merchantId: string): void {
    this.currentMerchantId = merchantId;
  }

  // Get current merchant ID
  getMerchant(): string | null {
    return this.currentMerchantId;
  }

  // Clear merchant context
  clearMerchant(): void {
    this.currentMerchantId = null;
  }

  // Filter data by merchant ID
  filterByMerchant<T extends { merchantId?: string }>(data: T[], merchantId?: string): T[] {
    const targetMerchantId = merchantId || this.currentMerchantId;
    if (!targetMerchantId) return data;

    return data.filter((item) => item.merchantId === targetMerchantId);
  }

  // Validate data belongs to current merchant
  validateOwnership<T extends { merchantId?: string }>(item: T, merchantId?: string): boolean {
    const targetMerchantId = merchantId || this.currentMerchantId;
    if (!targetMerchantId) return false;

    return item.merchantId === targetMerchantId;
  }

  // Add merchant ID to data
  addMerchantId<T>(data: T, merchantId?: string): T & { merchantId: string } {
    const targetMerchantId = merchantId || this.currentMerchantId;
    if (!targetMerchantId) {
      throw new Error('No merchant ID available');
    }

    return {
      ...data,
      merchantId: targetMerchantId,
    };
  }
}

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private defaultLimit: number;
  private windowMs: number;

  constructor(defaultLimit: number = 100, windowMs: number = 60000) {
    this.defaultLimit = defaultLimit;
    this.windowMs = windowMs;
  }

  // Check if request is allowed
  check(identifier: string, limit?: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const requestLimit = limit || this.defaultLimit;
    const entry = this.limits.get(identifier);

    // Clean up expired entries
    if (entry && entry.resetTime < now) {
      this.limits.delete(identifier);
    }

    const currentEntry = this.limits.get(identifier) || {
      count: 0,
      resetTime: now + this.windowMs,
    };

    if (currentEntry.count >= requestLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: currentEntry.resetTime,
      };
    }

    // Increment count
    currentEntry.count++;
    this.limits.set(identifier, currentEntry);

    return {
      allowed: true,
      remaining: requestLimit - currentEntry.count,
      resetTime: currentEntry.resetTime,
    };
  }

  // Reset rate limit for identifier
  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  // Clear all rate limits
  clearAll(): void {
    this.limits.clear();
  }

  // Get rate limit status
  getStatus(identifier: string): { count: number; resetTime: number } | null {
    const entry = this.limits.get(identifier);
    if (!entry) return null;

    // Clean up expired entries
    if (entry.resetTime < Date.now()) {
      this.limits.delete(identifier);
      return null;
    }

    return {
      count: entry.count,
      resetTime: entry.resetTime,
    };
  }
}

// ============================================
// SECURITY MANAGER
// ============================================

export class SecurityManager {
  private jwtValidator: JWTValidator;
  private merchantIsolation: MerchantDataIsolation;
  private rateLimiter: RateLimiter;

  constructor() {
    this.jwtValidator = new JWTValidator();
    this.merchantIsolation = new MerchantDataIsolation();
    this.rateLimiter = new RateLimiter();
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  // Validate authentication token
  authenticate(token: string): { valid: boolean; payload: JWTPayload | null } {
    const payload = this.jwtValidator.validate(token);
    return {
      valid: payload !== null,
      payload,
    };
  }

  // Check if user has required role
  hasRole(token: string, requiredRoles: string[]): boolean {
    const payload = this.jwtValidator.validate(token);
    if (!payload) return false;

    return requiredRoles.includes(payload.role);
  }

  // ============================================
  // AUTHORIZATION
  // ============================================

  // Check if user can access resource
  canAccess(
    token: string,
    resource: string,
    action: 'read' | 'write' | 'delete' | 'admin'
  ): boolean {
    const payload = this.jwtValidator.validate(token);
    if (!payload) return false;

    // Superadmin can do everything
    if (payload.role === 'superadmin') return true;

    // Admin can do everything except delete
    if (payload.role === 'admin' && action !== 'delete') return true;

    // Merchant can only read/write their own data
    if (payload.role === 'merchant') {
      return action === 'read' || action === 'write';
    }

    return false;
  }

  // Check rate limit
  checkRateLimit(identifier: string, endpoint?: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = endpoint ? `${identifier}:${endpoint}` : identifier;
    return this.rateLimiter.check(key);
  }

  // ============================================
  // DATA ISOLATION
  // ============================================

  // Set merchant context
  setMerchantContext(merchantId: string): void {
    this.merchantIsolation.setMerchant(merchantId);
  }

  // Get merchant context
  getMerchantContext(): string | null {
    return this.merchantIsolation.getMerchant();
  }

  // Filter data by merchant
  filterData<T extends { merchantId?: string }>(data: T[]): T[] {
    return this.merchantIsolation.filterByMerchant(data);
  }

  // Validate data ownership
  validateOwnership<T extends { merchantId?: string }>(item: T): boolean {
    return this.merchantIsolation.validateOwnership(item);
  }

  // ============================================
  // SECURITY HEADERS
  // ============================================

  // Get security headers for API requests
  getSecurityHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-ID': this.generateRequestId(),
      'X-Merchant-ID': this.merchantIsolation.getMerchant() || '',
    };
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // SECURITY LOGGING
  // ============================================

  // Log security event
  logSecurityEvent(event: {
    type: 'auth_success' | 'auth_failure' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_access_denied';
    userId?: string;
    merchantId?: string;
    details?: Record<string, unknown>;
  }): void {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    console.log('[SecurityManager] Security event:', logEntry);

    // Send to logging endpoint
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'security_event',
        event: logEntry,
      }),
    }).catch((error) => {
      console.error('[SecurityManager] Failed to log security event:', error);
    });
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();

// ============================================
// REACT HOOK FOR SECURITY
// ============================================

import { useState, useCallback, useEffect } from 'react';

export function useSecurity() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  // Get token from localStorage
  const getToken = useCallback((): string | null => {
    return localStorage.getItem('auth_token');
  }, []);

  // Set token in localStorage
  const setToken = useCallback((token: string): void => {
    localStorage.setItem('auth_token', token);
    validateToken(token);
  }, []);

  // Clear token from localStorage
  const clearToken = useCallback((): void => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUserRole(null);
    setMerchantId(null);
    securityManager.setMerchantContext('');
  }, []);

  // Validate current token
  const validateToken = useCallback((token?: string): boolean => {
    const authToken = token || getToken();
    if (!authToken) {
      setIsAuthenticated(false);
      return false;
    }

    const result = securityManager.authenticate(authToken);
    if (result.valid && result.payload) {
      setIsAuthenticated(true);
      setUserRole(result.payload.role);
      setMerchantId(result.payload.merchantId);
      securityManager.setMerchantContext(result.payload.merchantId);
      return true;
    }

    setIsAuthenticated(false);
    return false;
  }, [getToken]);

  // Check if user has role
  const hasRole = useCallback((roles: string[]): boolean => {
    const token = getToken();
    if (!token) return false;
    return securityManager.hasRole(token, roles);
  }, [getToken]);

  // Check if user can access resource
  const canAccess = useCallback((resource: string, action: 'read' | 'write' | 'delete' | 'admin'): boolean => {
    const token = getToken();
    if (!token) return false;
    return securityManager.canAccess(token, resource, action);
  }, [getToken]);

  // Check rate limit
  const checkRateLimit = useCallback((identifier: string, endpoint?: string) => {
    return securityManager.checkRateLimit(identifier, endpoint);
  }, []);

  // Initialize on mount
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  return {
    isAuthenticated,
    userRole,
    merchantId,
    getToken,
    setToken,
    clearToken,
    validateToken,
    hasRole,
    canAccess,
    checkRateLimit,
  };
}

// ============================================
// API REQUEST WRAPPER WITH SECURITY
// ============================================

export async function secureFetch<T>(
  url: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<{ success: boolean; data: T | null; error: string | null }> {
  const token = localStorage.getItem('auth_token');

  if (requireAuth && !token) {
    return {
      success: false,
      data: null,
      error: 'Authentication required',
    };
  }

  try {
    const headers = {
      ...options.headers,
      ...(requireAuth && token ? securityManager.getSecurityHeaders(token) : {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - clear token
        localStorage.removeItem('auth_token');
        return {
          success: false,
          data: null,
          error: 'Unauthorized - please log in again',
        };
      }

      if (response.status === 403) {
        securityManager.logSecurityEvent({
          type: 'unauthorized_access',
          details: { url, method: options.method },
        });
        return {
          success: false,
          data: null,
          error: 'Forbidden - insufficient permissions',
        };
      }

      if (response.status === 429) {
        securityManager.logSecurityEvent({
          type: 'rate_limit_exceeded',
          details: { url },
        });
        return {
          success: false,
          data: null,
          error: 'Rate limit exceeded - please try again later',
        };
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error('[secureFetch] Error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
