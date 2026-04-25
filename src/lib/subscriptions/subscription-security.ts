// Subscription Security Layer
// Merchant only, block cross-tenant access

import type { Subscription } from './subscription-types';

// ============================================
// SECURITY RESULT
// ============================================

export interface SecurityResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

// ============================================
// SUBSCRIPTION SECURITY MANAGER
// ============================================

export class SubscriptionSecurityManager {
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private auditLogs: Array<{
    action: string;
    subscriptionId: string;
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

  validateTenantAccess(subscription: Subscription, userTenantId: string): SecurityResult {
    if (subscription.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Access denied: subscription does not belong to this tenant',
        timestamp: new Date().toISOString(),
      };
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // AUDIT LOG
  // ============================================

  auditLog(action: string, subscriptionId: string, userId: string, metadata?: Record<string, unknown>): void {
    const logEntry = {
      action,
      subscriptionId,
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

  getAuditLog(subscriptionId?: string, limit?: number): Array<{
    action: string;
    subscriptionId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> {
    let logs = this.auditLogs;

    if (subscriptionId) {
      logs = logs.filter((log) => log.subscriptionId === subscriptionId);
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
  // SANITIZE SUBSCRIPTION DATA FOR LOGGING
  // ============================================

  sanitizeSubscriptionForLogging(subscription: Subscription): Record<string, unknown> {
    return {
      id: subscription.id,
      customerId: subscription.customerId,
      pricingId: subscription.pricingId,
      status: subscription.status,
      mrr: subscription.mrr,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      provider: subscription.provider,
      tenantId: subscription.tenantId,
    };
  }

  // ============================================
  // VALIDATE UPDATE PERMISSIONS
  // ============================================

  validateUpdatePermissions(
    subscription: Subscription,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can update any subscription
    if (isSystemAdmin) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    // Check merchant access
    const merchantAccess = this.validateMerchantAccess(userRole);
    if (!merchantAccess.success) {
      return merchantAccess;
    }

    // Check tenant access
    const tenantAccess = this.validateTenantAccess(subscription, userTenantId);
    if (!tenantAccess.success) {
      return tenantAccess;
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // VALIDATE DELETE PERMISSIONS
  // ============================================

  validateDeletePermissions(
    subscription: Subscription,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can delete any subscription
    if (isSystemAdmin) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    // Check merchant access
    const merchantAccess = this.validateMerchantAccess(userRole);
    if (!merchantAccess.success) {
      return merchantAccess;
    }

    // Check tenant access
    const tenantAccess = this.validateTenantAccess(subscription, userTenantId);
    if (!tenantAccess.success) {
      return tenantAccess;
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
      auditLogEntries: this.auditLog.length,
    };
  }

  // ============================================
  // LOG SECURITY VIOLATION
  // ============================================

  logSecurityViolation(
    violationType: string,
    subscriptionId: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    console.error(
      `[Security Violation] ${violationType} - User ${userId} attempted to access subscription ${subscriptionId}`,
      metadata
    );

    this.auditLog(
      `security_violation_${violationType}`,
      subscriptionId,
      userId,
      metadata
    );
  }
}

// Export singleton instance
export const subscriptionSecurityManager = new SubscriptionSecurityManager();

// ============================================
// REACT HOOK FOR SUBSCRIPTION SECURITY
// ============================================

import { useCallback } from 'react';

export function useSubscriptionSecurity() {
  const checkRateLimit = useCallback((identifier: string, limit?: number, windowMs?: number) => {
    return subscriptionSecurityManager.checkRateLimit(identifier, limit, windowMs);
  }, []);

  const validateMerchantAccess = useCallback((userRole: string) => {
    return subscriptionSecurityManager.validateMerchantAccess(userRole);
  }, []);

  const validateTenantAccess = useCallback((subscription: Subscription, userTenantId: string) => {
    return subscriptionSecurityManager.validateTenantAccess(subscription, userTenantId);
  }, []);

  const validateUpdatePermissions = useCallback((
    subscription: Subscription,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin?: boolean
  ) => {
    return subscriptionSecurityManager.validateUpdatePermissions(
      subscription,
      userId,
      userTenantId,
      userRole,
      isSystemAdmin
    );
  }, []);

  const validateDeletePermissions = useCallback((
    subscription: Subscription,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin?: boolean
  ) => {
    return subscriptionSecurityManager.validateDeletePermissions(
      subscription,
      userId,
      userTenantId,
      userRole,
      isSystemAdmin
    );
  }, []);

  const sanitizeSubscriptionForLogging = useCallback((subscription: Subscription) => {
    return subscriptionSecurityManager.sanitizeSubscriptionForLogging(subscription);
  }, []);

  return {
    checkRateLimit,
    validateMerchantAccess,
    validateTenantAccess,
    validateUpdatePermissions,
    validateDeletePermissions,
    sanitizeSubscriptionForLogging,
  };
}
