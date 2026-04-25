// Checkout Link Tenant Isolation
// WHERE tenant_id = current_user - Block cross-tenant access

import type { CheckoutLink } from './checkout-link-types';

// ============================================
// TENANT ISOLATION RESULT
// ============================================

export interface TenantIsolationResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

// ============================================
// CHECKOUT LINK TENANT ISOLATION MANAGER
// ============================================

export class CheckoutLinkTenantIsolationManager {
  // ============================================
  // VALIDATE TENANT ACCESS
  // ============================================

  validateTenantAccess(checkoutLink: CheckoutLink, userTenantId: string): TenantIsolationResult {
    if (checkoutLink.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Checkout link does not belong to this tenant',
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

  filterByTenant(checkoutLinks: CheckoutLink[], tenantId: string): CheckoutLink[] {
    return checkoutLinks.filter((checkoutLink) => checkoutLink.tenantId === tenantId);
  }

  // ============================================
  // FILTER BY TENANT AND STATUS
  // ============================================

  filterByTenantAndStatus(
    checkoutLinks: CheckoutLink[],
    tenantId: string,
    status?: string
  ): CheckoutLink[] {
    let filtered = this.filterByTenant(checkoutLinks, tenantId);

    if (status) {
      filtered = filtered.filter((checkoutLink) => checkoutLink.status === status);
    }

    return filtered;
  }

  // ============================================
  // VALIDATE BATCH TENANT ACCESS
  // ============================================

  validateBatchTenantAccess(checkoutLinks: CheckoutLink[], userTenantId: string): {
    valid: CheckoutLink[];
    invalid: Array<{ checkoutLink: CheckoutLink; error: string }>;
  } {
    const valid: CheckoutLink[] = [];
    const invalid: Array<{ checkoutLink: CheckoutLink; error: string }> = [];

    for (const checkoutLink of checkoutLinks) {
      const result = this.validateTenantAccess(checkoutLink, userTenantId);

      if (result.success) {
        valid.push(checkoutLink);
      } else {
        invalid.push({
          checkoutLink,
          error: result.error || 'Access denied',
        });
      }
    }

    return { valid, invalid };
  }

  // ============================================
  // CHECK CROSS_TENANT ATTEMPT
  // ============================================

  checkCrossTenantAttempt(checkoutLinkId: string, userTenantId: string, checkoutLinkTenantId: string): boolean {
    return checkoutLinkTenantId !== userTenantId;
  }

  // ============================================
  // LOG CROSS_TENANT ATTEMPT
  // ============================================

  logCrossTenantAttempt(
    checkoutLinkId: string,
    userTenantId: string,
    checkoutLinkTenantId: string,
    userId: string
  ): void {
    console.error(
      `[TenantIsolation] Cross-tenant access attempt detected: User ${userId} (tenant: ${userTenantId}) tried to access checkout link ${checkoutLinkId} (tenant: ${checkoutLinkTenantId})`
    );
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
      // tenantId included for audit purposes
      tenantId: checkoutLink.tenantId,
    };
  }

  // ============================================
  // VALIDATE TENANT FOR CREATE
  // ============================================

  validateTenantForCreate(userTenantId: string, requestTenantId: string): TenantIsolationResult {
    if (userTenantId !== requestTenantId) {
      return {
        success: false,
        error: 'Cannot create checkout link for different tenant',
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

  validateTenantForUpdate(checkoutLink: CheckoutLink, userTenantId: string): TenantIsolationResult {
    return this.validateTenantAccess(checkoutLink, userTenantId);
  }

  // ============================================
  // VALIDATE TENANT FOR DELETE
  // ============================================

  validateTenantForDelete(checkoutLink: CheckoutLink, userTenantId: string): TenantIsolationResult {
    return this.validateTenantAccess(checkoutLink, userTenantId);
  }

  // ============================================
  // GET TENANT SUMMARY
  // ============================================

  getTenantSummary(checkoutLinks: CheckoutLink[], tenantId: string): {
    totalLinks: number;
    activeLinks: number;
    inactiveLinks: number;
    expiredLinks: number;
    totalViews: number;
    totalConversions: number;
  } {
    const tenantLinks = this.filterByTenant(checkoutLinks, tenantId);

    return {
      totalLinks: tenantLinks.length,
      activeLinks: tenantLinks.filter((l) => l.status === 'active').length,
      inactiveLinks: tenantLinks.filter((l) => l.status === 'inactive').length,
      expiredLinks: tenantLinks.filter((l) => l.status === 'expired').length,
      totalViews: tenantLinks.reduce((sum, l) => sum + l.viewCount, 0),
      totalConversions: tenantLinks.reduce((sum, l) => sum + l.conversionCount, 0),
    };
  }

  // ============================================
  // CHECK TENANT QUOTA
  // ============================================

  checkTenantQuota(checkoutLinks: CheckoutLink[], tenantId: string, maxLinks: number): {
    hasQuota: boolean;
    currentCount: number;
    remainingQuota: number;
  } {
    const tenantLinks = this.filterByTenant(checkoutLinks, tenantId);
    const currentCount = tenantLinks.length;
    const remainingQuota = maxLinks - currentCount;

    return {
      hasQuota: currentCount < maxLinks,
      currentCount,
      remainingQuota,
    };
  }
}

// Export singleton instance
export const checkoutLinkTenantIsolationManager = new CheckoutLinkTenantIsolationManager();

// ============================================
// REACT HOOK FOR TENANT ISOLATION
// ============================================

import { useCallback } from 'react';

export function useCheckoutLinkTenantIsolation() {
  const validateTenantAccess = useCallback((checkoutLink: CheckoutLink, userTenantId: string) => {
    return checkoutLinkTenantIsolationManager.validateTenantAccess(checkoutLink, userTenantId);
  }, []);

  const filterByTenant = useCallback((checkoutLinks: CheckoutLink[], tenantId: string) => {
    return checkoutLinkTenantIsolationManager.filterByTenant(checkoutLinks, tenantId);
  }, []);

  const filterByTenantAndStatus = useCallback((checkoutLinks: CheckoutLink[], tenantId: string, status?: string) => {
    return checkoutLinkTenantIsolationManager.filterByTenantAndStatus(checkoutLinks, tenantId, status);
  }, []);

  const validateBatchTenantAccess = useCallback((checkoutLinks: CheckoutLink[], userTenantId: string) => {
    return checkoutLinkTenantIsolationManager.validateBatchTenantAccess(checkoutLinks, userTenantId);
  }, []);

  const validateTenantForCreate = useCallback((userTenantId: string, requestTenantId: string) => {
    return checkoutLinkTenantIsolationManager.validateTenantForCreate(userTenantId, requestTenantId);
  }, []);

  const getTenantSummary = useCallback((checkoutLinks: CheckoutLink[], tenantId: string) => {
    return checkoutLinkTenantIsolationManager.getTenantSummary(checkoutLinks, tenantId);
  }, []);

  const checkTenantQuota = useCallback((checkoutLinks: CheckoutLink[], tenantId: string, maxLinks: number) => {
    return checkoutLinkTenantIsolationManager.checkTenantQuota(checkoutLinks, tenantId, maxLinks);
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
