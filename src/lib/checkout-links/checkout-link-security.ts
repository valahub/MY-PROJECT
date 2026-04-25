// Checkout Link Security Layer
// Merchant only, block cross-tenant access

import type { CheckoutLink } from './checkout-link-types';

// ============================================
// SECURITY RESULT
// ============================================

export interface SecurityResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

// ============================================
// CHECKOUT LINK SECURITY MANAGER
// ============================================

export class CheckoutLinkSecurityManager {
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private auditLogs: Array<{
    action: string;
    checkoutLinkId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> = [];

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
  // VALIDATE MERCHANT ACCESS
  // ============================================

  validateMerchantAccess(userRole: string): SecurityResult {
    if (userRole !== 'merchant' && userRole !== 'admin') {
      return {
        success: false,
        error: 'Access denied: merchant role required',
        timestamp: new Date().toISOString(),
      };
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // VALIDATE TENANT ACCESS
  // ============================================

  validateTenantAccess(checkoutLink: CheckoutLink, userTenantId: string): SecurityResult {
    if (checkoutLink.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Access denied: checkout link does not belong to this tenant',
        timestamp: new Date().toISOString(),
      };
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // AUDIT LOG
  // ============================================

  auditLog(action: string, checkoutLinkId: string, userId: string, metadata?: Record<string, unknown>): void {
    const logEntry = {
      action,
      checkoutLinkId,
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

  getAuditLog(checkoutLinkId?: string, limit?: number): Array<{
    action: string;
    checkoutLinkId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> {
    let logs = this.auditLogs;

    if (checkoutLinkId) {
      logs = logs.filter((log) => log.checkoutLinkId === checkoutLinkId);
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
  // SANITIZE CHECKOUT LINK FOR LOGGING
  // ============================================

  sanitizeCheckoutLinkForLogging(checkoutLink: CheckoutLink): Record<string, unknown> {
    return {
      id: checkoutLink.id,
      name: checkoutLink.name,
      slug: checkoutLink.slug,
      status: checkoutLink.status,
      productId: checkoutLink.productId,
      pricingId: checkoutLink.pricingId,
      tenantId: checkoutLink.tenantId,
    };
  }

  // ============================================
  // VALIDATE UPDATE PERMISSIONS
  // ============================================

  validateUpdatePermissions(
    checkoutLink: CheckoutLink,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can update any checkout link
    if (isSystemAdmin) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    // Check merchant access
    const merchantAccess = this.validateMerchantAccess(userRole);
    if (!merchantAccess.success) {
      return merchantAccess;
    }

    // Check tenant access
    const tenantAccess = this.validateTenantAccess(checkoutLink, userTenantId);
    if (!tenantAccess.success) {
      return tenantAccess;
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // VALIDATE DELETE PERMISSIONS
  // ============================================

  validateDeletePermissions(
    checkoutLink: CheckoutLink,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can delete any checkout link
    if (isSystemAdmin) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    // Check merchant access
    const merchantAccess = this.validateMerchantAccess(userRole);
    if (!merchantAccess.success) {
      return merchantAccess;
    }

    // Check tenant access
    const tenantAccess = this.validateTenantAccess(checkoutLink, userTenantId);
    if (!tenantAccess.success) {
      return tenantAccess;
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // VALIDATE PUBLIC ACCESS
  // ============================================

  validatePublicAccess(checkoutLink: CheckoutLink): SecurityResult {
    // Check if link is active
    if (checkoutLink.status !== 'active') {
      return {
        success: false,
        error: 'Checkout link is not active',
        timestamp: new Date().toISOString(),
      };
    }

    // Check if link is expired
    if (checkoutLink.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(checkoutLink.expiresAt);
      if (now > expiryDate) {
        return {
          success: false,
          error: 'Checkout link has expired',
          timestamp: new Date().toISOString(),
        };
      }
    }

    return { success: true, timestamp: new Date().toISOString() };
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

  // ============================================
  // LOG SECURITY VIOLATION
  // ============================================

  logSecurityViolation(
    violationType: string,
    checkoutLinkId: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    console.error(
      `[Security Violation] ${violationType} - User ${userId} attempted to access checkout link ${checkoutLinkId}`,
      metadata
    );

    this.auditLog(
      `security_violation_${violationType}`,
      checkoutLinkId,
      userId,
      metadata
    );
  }
}

// Export singleton instance
export const checkoutLinkSecurityManager = new CheckoutLinkSecurityManager();

// ============================================
// REACT HOOK FOR CHECKOUT LINK SECURITY
// ============================================

import { useCallback } from 'react';

export function useCheckoutLinkSecurity() {
  const checkRateLimit = useCallback((identifier: string, limit?: number, windowMs?: number) => {
    return checkoutLinkSecurityManager.checkRateLimit(identifier, limit, windowMs);
  }, []);

  const validateMerchantAccess = useCallback((userRole: string) => {
    return checkoutLinkSecurityManager.validateMerchantAccess(userRole);
  }, []);

  const validateTenantAccess = useCallback((checkoutLink: CheckoutLink, userTenantId: string) => {
    return checkoutLinkSecurityManager.validateTenantAccess(checkoutLink, userTenantId);
  }, []);

  const validateUpdatePermissions = useCallback((
    checkoutLink: CheckoutLink,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin?: boolean
  ) => {
    return checkoutLinkSecurityManager.validateUpdatePermissions(
      checkoutLink,
      userId,
      userTenantId,
      userRole,
      isSystemAdmin
    );
  }, []);

  const validateDeletePermissions = useCallback((
    checkoutLink: CheckoutLink,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin?: boolean
  ) => {
    return checkoutLinkSecurityManager.validateDeletePermissions(
      checkoutLink,
      userId,
      userTenantId,
      userRole,
      isSystemAdmin
    );
  }, []);

  const validatePublicAccess = useCallback((checkoutLink: CheckoutLink) => {
    return checkoutLinkSecurityManager.validatePublicAccess(checkoutLink);
  }, []);

  const sanitizeCheckoutLinkForLogging = useCallback((checkoutLink: CheckoutLink) => {
    return checkoutLinkSecurityManager.sanitizeCheckoutLinkForLogging(checkoutLink);
  }, []);

  return {
    checkRateLimit,
    validateMerchantAccess,
    validateTenantAccess,
    validateUpdatePermissions,
    validateDeletePermissions,
    validatePublicAccess,
    sanitizeCheckoutLinkForLogging,
  };
}
