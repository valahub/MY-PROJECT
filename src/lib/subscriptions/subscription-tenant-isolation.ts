// Subscription Tenant Isolation
// WHERE tenant_id = current_user - Block cross-tenant access

import type { Subscription } from './subscription-types';

// ============================================
// TENANT ISOLATION RESULT
// ============================================

export interface TenantIsolationResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

// ============================================
// TENANT ISOLATION MANAGER
// ============================================

export class TenantIsolationManager {
  // ============================================
  // VALIDATE TENANT ACCESS
  // ============================================

  validateTenantAccess(subscription: Subscription, userTenantId: string): TenantIsolationResult {
    if (subscription.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Subscription does not belong to this tenant',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // FILTER BY TENANT
  // ============================================

  filterByTenant(subscriptions: Subscription[], tenantId: string): Subscription[] {
    return subscriptions.filter((subscription) => subscription.tenantId === tenantId);
  }

  // ============================================
  // FILTER BY TENANT AND STATUS
  // ============================================

  filterByTenantAndStatus(
    subscriptions: Subscription[],
    tenantId: string,
    status?: string
  ): Subscription[] {
    let filtered = this.filterByTenant(subscriptions, tenantId);

    if (status) {
      filtered = filtered.filter((subscription) => subscription.status === status);
    }

    return filtered;
  }

  // ============================================
  // VALIDATE BATCH TENANT ACCESS
  // ============================================

  validateBatchTenantAccess(subscriptions: Subscription[], userTenantId: string): {
    valid: Subscription[];
    invalid: Array<{ subscription: Subscription; error: string }>;
  } {
    const valid: Subscription[] = [];
    const invalid: Array<{ subscription: Subscription; error: string }> = [];

    for (const subscription of subscriptions) {
      const result = this.validateTenantAccess(subscription, userTenantId);

      if (result.success) {
        valid.push(subscription);
      } else {
        invalid.push({
          subscription,
          error: result.error || 'Access denied',
        });
      }
    }

    return { valid, invalid };
  }

  // ============================================
  // CHECK CROSS_TENANT ATTEMPT
  // ============================================

  checkCrossTenantAttempt(subscriptionId: string, userTenantId: string, subscriptionTenantId: string): boolean {
    return subscriptionTenantId !== userTenantId;
  }

  // ============================================
  // LOG CROSS_TENANT ATTEMPT
  // ============================================

  logCrossTenantAttempt(
    subscriptionId: string,
    userTenantId: string,
    subscriptionTenantId: string,
    userId: string
  ): void {
    console.error(
      `[TenantIsolation] Cross-tenant access attempt detected: User ${userId} (tenant: ${userTenantId}) tried to access subscription ${subscriptionId} (tenant: ${subscriptionTenantId})`
    );
  }

  // ============================================
  // SANITIZE SUBSCRIPTION FOR LOGGING
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
      // tenantId included for audit purposes
      tenantId: subscription.tenantId,
    };
  }

  // ============================================
  // VALIDATE TENANT FOR CREATE
  // ============================================

  validateTenantForCreate(userTenantId: string, requestTenantId: string): TenantIsolationResult {
    if (userTenantId !== requestTenantId) {
      return {
        success: false,
        error: 'Cannot create subscription for different tenant',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // VALIDATE TENANT FOR UPDATE
  // ============================================

  validateTenantForUpdate(subscription: Subscription, userTenantId: string): TenantIsolationResult {
    return this.validateTenantAccess(subscription, userTenantId);
  }

  // ============================================
  // VALIDATE TENANT FOR DELETE
  // ============================================

  validateTenantForDelete(subscription: Subscription, userTenantId: string): TenantIsolationResult {
    return this.validateTenantAccess(subscription, userTenantId);
  }

  // ============================================
  // GET TENANT SUMMARY
  // ============================================

  getTenantSummary(subscriptions: Subscription[], tenantId: string): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    pastDueSubscriptions: number;
    canceledSubscriptions: number;
    pausedSubscriptions: number;
  } {
    const tenantSubscriptions = this.filterByTenant(subscriptions, tenantId);

    return {
      totalSubscriptions: tenantSubscriptions.length,
      activeSubscriptions: tenantSubscriptions.filter((s) => s.status === 'active').length,
      trialingSubscriptions: tenantSubscriptions.filter((s) => s.status === 'trialing').length,
      pastDueSubscriptions: tenantSubscriptions.filter((s) => s.status === 'past_due').length,
      canceledSubscriptions: tenantSubscriptions.filter((s) => s.status === 'canceled').length,
      pausedSubscriptions: tenantSubscriptions.filter((s) => s.status === 'paused').length,
    };
  }

  // ============================================
  // CHECK TENANT QUOTA
  // ============================================

  checkTenantQuota(subscriptions: Subscription[], tenantId: string, maxSubscriptions: number): {
    hasQuota: boolean;
    currentCount: number;
    remainingQuota: number;
  } {
    const tenantSubscriptions = this.filterByTenant(subscriptions, tenantId);
    const currentCount = tenantSubscriptions.length;
    const remainingQuota = maxSubscriptions - currentCount;

    return {
      hasQuota: currentCount < maxSubscriptions,
      currentCount,
      remainingQuota,
    };
  }
}

// Export singleton instance
export const tenantIsolationManager = new TenantIsolationManager();

// ============================================
// REACT HOOK FOR TENANT ISOLATION
// ============================================

import { useCallback } from 'react';

export function useTenantIsolation() {
  const validateTenantAccess = useCallback((subscription: Subscription, userTenantId: string) => {
    return tenantIsolationManager.validateTenantAccess(subscription, userTenantId);
  }, []);

  const filterByTenant = useCallback((subscriptions: Subscription[], tenantId: string) => {
    return tenantIsolationManager.filterByTenant(subscriptions, tenantId);
  }, []);

  const filterByTenantAndStatus = useCallback((subscriptions: Subscription[], tenantId: string, status?: string) => {
    return tenantIsolationManager.filterByTenantAndStatus(subscriptions, tenantId, status);
  }, []);

  const validateBatchTenantAccess = useCallback((subscriptions: Subscription[], userTenantId: string) => {
    return tenantIsolationManager.validateBatchTenantAccess(subscriptions, userTenantId);
  }, []);

  const validateTenantForCreate = useCallback((userTenantId: string, requestTenantId: string) => {
    return tenantIsolationManager.validateTenantForCreate(userTenantId, requestTenantId);
  }, []);

  const getTenantSummary = useCallback((subscriptions: Subscription[], tenantId: string) => {
    return tenantIsolationManager.getTenantSummary(subscriptions, tenantId);
  }, []);

  const checkTenantQuota = useCallback((subscriptions: Subscription[], tenantId: string, maxSubscriptions: number) => {
    return tenantIsolationManager.checkTenantQuota(subscriptions, tenantId, maxSubscriptions);
  }, []);

  return {
    validateTenantAccess,
    filterByTenant,
    filterByTenantAndStatus,
    validateBatchTenantAccess,
    validateTenantForCreate,
    getTenantSummary,
    checkTenantQuota,
  };
}
