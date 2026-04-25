// Merchant Pricing Data Security Layer
// JWT validation, merchant_id mapping
// STRICT: No cross-tenant leakage

// ============================================
// JWT PAYLOAD
// ============================================

export interface JWTPayload {
  sub: string; // User ID
  merchantId: string; // MANDATORY - Merchant ID from token
  role: string;
  iat: number;
  exp: number;
}

// ============================================
// SECURITY RESULT
// ============================================

export interface SecurityResult {
  success: boolean;
  error?: string;
  merchantId?: string;
  userId?: string;
  timestamp: string;
}

// ============================================
// MERCHANT PRICING SECURITY MANAGER
// ============================================

export class MerchantPricingSecurityManager {
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private auditLogs: Array<{
    action: string;
    merchantId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> = [];

  // ============================================
  // VALIDATE JWT TOKEN
  // ============================================

  validateJWTToken(token: string): SecurityResult {
    try {
      // In production, verify JWT signature and expiration
      // For now, decode the token (base64)
      const payload = this.decodeJWT(token);

      if (!payload) {
        return {
          success: false,
          error: 'Invalid JWT token',
          timestamp: new Date().toISOString(),
        };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return {
          success: false,
          error: 'JWT token expired',
          timestamp: new Date().toISOString(),
        };
      }

      // Check merchant ID presence
      if (!payload.merchantId) {
        return {
          success: false,
          error: 'JWT token missing merchant ID',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        merchantId: payload.merchantId,
        userId: payload.sub,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate JWT token',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // DECODE JWT
  // ============================================

  private decodeJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // EXTRACT MERCHANT ID FROM TOKEN
  // ============================================

  extractMerchantIdFromToken(token: string): string | null {
    const payload = this.decodeJWT(token);
    return payload?.merchantId || null;
  }

  // ============================================
  // EXTRACT USER ID FROM TOKEN
  // ============================================

  extractUserIdFromToken(token: string): string | null {
    const payload = this.decodeJWT(token);
    return payload?.sub || null;
  }

  // ============================================
  // EXTRACT ROLE FROM TOKEN
  // ============================================

  extractRoleFromToken(token: string): string | null {
    const payload = this.decodeJWT(token);
    return payload?.role || null;
  }

  // ============================================
  // VALIDATE MERCHANT ID MAPPING
  // ============================================

  validateMerchantIdMapping(tokenMerchantId: string, requestMerchantId: string): SecurityResult {
    if (tokenMerchantId !== requestMerchantId) {
      return {
        success: false,
        error: 'Merchant ID mismatch between token and request',
        merchantId: tokenMerchantId,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      merchantId: tokenMerchantId,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // CHECK RATE LIMIT
  // ============================================

  checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): SecurityResult {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { success: true, timestamp: new Date().toISOString() };
    }

    if (entry.count >= limit) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        timestamp: new Date().toISOString(),
      };
    }

    entry.count++;
    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // CLEAR RATE LIMIT
  // ============================================

  clearRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }

  // ============================================
  // AUDIT LOG
  // ============================================

  auditLog(action: string, merchantId: string, userId: string, metadata?: Record<string, unknown>): void {
    const logEntry = {
      action,
      merchantId,
      userId,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    this.auditLogs.push(logEntry);
    console.log('[Security Audit]', logEntry);
  }

  // ============================================
  // GET AUDIT LOG
  // ============================================

  getAuditLog(merchantId?: string, limit?: number): Array<{
    action: string;
    merchantId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> {
    let logs = this.auditLogs;

    if (merchantId) {
      logs = logs.filter((log) => log.merchantId === merchantId);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  // ============================================
  // CLEAR AUDIT LOG
  // ============================================

  clearAuditLog(): void {
    this.auditLogs = [];
  }

  // ============================================
  // SANITIZE FOR LOGGING
  // ============================================

  sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('password')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // ============================================
  // VALIDATE REQUEST AUTHORIZATION
  // ============================================

  validateRequestAuthorization(
    token: string,
    requestMerchantId: string,
    requiredRole?: string
  ): SecurityResult {
    // Validate JWT
    const jwtValidation = this.validateJWTToken(token);
    if (!jwtValidation.success) {
      return jwtValidation;
    }

    // Validate merchant ID mapping
    const mappingValidation = this.validateMerchantIdMapping(
      jwtValidation.merchantId!,
      requestMerchantId
    );
    if (!mappingValidation.success) {
      return mappingValidation;
    }

    // Validate role if required
    if (requiredRole) {
      const userRole = this.extractRoleFromToken(token);
      if (userRole !== requiredRole && userRole !== 'owner') {
        return {
          success: false,
          error: `Insufficient permissions. Required role: ${requiredRole}`,
          merchantId: requestMerchantId,
          userId: jwtValidation.userId,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      success: true,
      merchantId: requestMerchantId,
      userId: jwtValidation.userId,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // LOG SECURITY VIOLATION
  // ============================================

  logSecurityViolation(
    violationType: string,
    merchantId: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    console.error(
      `[Security Violation] ${violationType} - User ${userId} attempted unauthorized action for merchant ${merchantId}`,
      metadata
    );

    this.auditLog(
      `security_violation_${violationType}`,
      merchantId,
      userId,
      metadata
    );
  }

  // ============================================
  // GET SECURITY SUMMARY
  // ============================================

  getSecuritySummary(): {
    activeRateLimits: number;
    auditLogEntries: number;
  } {
    return {
      activeRateLimits: this.rateLimitMap.size,
      auditLogEntries: this.auditLogs.length,
    };
  }
}

// Export singleton instance
export const merchantPricingSecurityManager = new MerchantPricingSecurityManager();

// ============================================
// REACT HOOK FOR SECURITY
// ============================================

import { useCallback } from 'react';

export function useMerchantPricingSecurity() {
  const validateJWTToken = useCallback((token: string) => {
    return merchantPricingSecurityManager.validateJWTToken(token);
  }, []);

  const extractMerchantIdFromToken = useCallback((token: string) => {
    return merchantPricingSecurityManager.extractMerchantIdFromToken(token);
  }, []);

  const extractUserIdFromToken = useCallback((token: string) => {
    return merchantPricingSecurityManager.extractUserIdFromToken(token);
  }, []);

  const extractRoleFromToken = useCallback((token: string) => {
    return merchantPricingSecurityManager.extractRoleFromToken(token);
  }, []);

  const validateMerchantIdMapping = useCallback((tokenMerchantId: string, requestMerchantId: string) => {
    return merchantPricingSecurityManager.validateMerchantIdMapping(tokenMerchantId, requestMerchantId);
  }, []);

  const validateRequestAuthorization = useCallback((
    token: string,
    requestMerchantId: string,
    requiredRole?: string
  ) => {
    return merchantPricingSecurityManager.validateRequestAuthorization(token, requestMerchantId, requiredRole);
  }, []);

  const checkRateLimit = useCallback((identifier: string, limit?: number, windowMs?: number) => {
    return merchantPricingSecurityManager.checkRateLimit(identifier, limit, windowMs);
  }, []);

  return {
    validateJWTToken,
    extractMerchantIdFromToken,
    extractUserIdFromToken,
    extractRoleFromToken,
    validateMerchantIdMapping,
    validateRequestAuthorization,
    checkRateLimit,
  };
}
