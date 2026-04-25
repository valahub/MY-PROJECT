// Merchant Pricing Context Lock
// STRICT: merchant_id validation for all operations
// Prevents cross-tenant data leakage

import type { MerchantPricingPlan, MerchantRole } from './merchant-pricing-types';

// ============================================
// CONTEXT LOCK RESULT
// ============================================

export interface ContextLockResult {
  success: boolean;
  error?: string;
  merchantId: string;
  timestamp: string;
}

// ============================================
// MERCHANT PRICING CONTEXT LOCK
// ============================================

export class MerchantPricingContextLock {
  private pricingPlans: Map<string, MerchantPricingPlan> = new Map();

  // ============================================
  // VALIDATE MERCHANT ID
  // ============================================

  validateMerchantId(merchantId: string): ContextLockResult {
    if (!merchantId || merchantId.trim() === '') {
      return {
        success: false,
        error: 'Merchant ID is required',
        merchantId: '',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      merchantId,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // VALIDATE MERCHANT ACCESS
  // ============================================

  validateMerchantAccess(
    pricingPlan: MerchantPricingPlan,
    userMerchantId: string
  ): ContextLockResult {
    // First validate merchant ID
    const merchantIdValidation = this.validateMerchantId(userMerchantId);
    if (!merchantIdValidation.success) {
      return merchantIdValidation;
    }

    // Strict tenant boundary check
    if (pricingPlan.merchantId !== userMerchantId) {
      return {
        success: false,
        error: 'Access denied: Pricing plan does not belong to this merchant',
        merchantId: userMerchantId,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      merchantId: userMerchantId,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // VALIDATE BATCH MERCHANT ACCESS
  // ============================================

  validateBatchMerchantAccess(
    pricingPlans: MerchantPricingPlan[],
    userMerchantId: string
  ): {
    valid: MerchantPricingPlan[];
    invalid: Array<{ pricingPlan: MerchantPricingPlan; error: string }>;
  } {
    const valid: MerchantPricingPlan[] = [];
    const invalid: Array<{ pricingPlan: MerchantPricingPlan; error: string }> = [];

    for (const pricingPlan of pricingPlans) {
      const result = this.validateMerchantAccess(pricingPlan, userMerchantId);

      if (result.success) {
        valid.push(pricingPlan);
      } else {
        invalid.push({
          pricingPlan,
          error: result.error || 'Access denied',
        });
      }
    }

    return { valid, invalid };
  }

  // ============================================
  // FILTER BY MERCHANT
  // ============================================

  filterByMerchant(pricingPlans: MerchantPricingPlan[], merchantId: string): MerchantPricingPlan[] {
    const validation = this.validateMerchantId(merchantId);
    if (!validation.success) {
      return [];
    }

    return pricingPlans.filter((plan) => plan.merchantId === merchantId);
  }

  // ============================================
  // CHECK CROSS_MERCHANT ATTEMPT
  // ============================================

  checkCrossMerchantAttempt(
    pricingPlanId: string,
    userMerchantId: string,
    pricingPlanMerchantId: string
  ): boolean {
    return pricingPlanMerchantId !== userMerchantId;
  }

  // ============================================
  // LOG CROSS_MERCHANT ATTEMPT
  // ============================================

  logCrossMerchantAttempt(
    pricingPlanId: string,
    userMerchantId: string,
    pricingPlanMerchantId: string,
    userId: string
  ): void {
    console.error(
      `[ContextLock] Cross-merchant access attempt detected: User ${userId} (merchant: ${userMerchantId}) tried to access pricing plan ${pricingPlanId} (merchant: ${pricingPlanMerchantId})`
    );
  }

  // ============================================
  // SANITIZE PRICING PLAN FOR LOGGING
  // ============================================

  sanitizePricingPlanForLogging(pricingPlan: MerchantPricingPlan): Record<string, unknown> {
    return {
      id: pricingPlan.id,
      merchantId: pricingPlan.merchantId,
      name: pricingPlan.name,
      amount: pricingPlan.amount,
      currency: pricingPlan.currency,
      interval: pricingPlan.interval,
      status: pricingPlan.status,
    };
  }

  // ============================================
  // VALIDATE CREATE REQUEST
  // ============================================

  validateCreateRequest(
    merchantId: string,
    userId: string,
    userRole: MerchantRole
  ): ContextLockResult {
    const merchantIdValidation = this.validateMerchantId(merchantId);
    if (!merchantIdValidation.success) {
      return merchantIdValidation;
    }

    if (!userId || userId.trim() === '') {
      return {
        success: false,
        error: 'User ID is required',
        merchantId,
        timestamp: new Date().toISOString(),
      };
    }

    if (!userRole) {
      return {
        success: false,
        error: 'User role is required',
        merchantId,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      merchantId,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // VALIDATE UPDATE REQUEST
  // ============================================

  validateUpdateRequest(
    pricingPlan: MerchantPricingPlan,
    userMerchantId: string,
    userId: string,
    userRole: MerchantRole
  ): ContextLockResult {
    const accessValidation = this.validateMerchantAccess(pricingPlan, userMerchantId);
    if (!accessValidation.success) {
      return accessValidation;
    }

    if (!userId || userId.trim() === '') {
      return {
        success: false,
        error: 'User ID is required',
        merchantId: userMerchantId,
        timestamp: new Date().toISOString(),
      };
    }

    if (!userRole) {
      return {
        success: false,
        error: 'User role is required',
        merchantId: userMerchantId,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      merchantId: userMerchantId,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // VALIDATE ARCHIVE REQUEST
  // ============================================

  validateArchiveRequest(
    pricingPlan: MerchantPricingPlan,
    userMerchantId: string,
    userId: string,
    userRole: MerchantRole
  ): ContextLockResult {
    return this.validateUpdateRequest(pricingPlan, userMerchantId, userId, userRole);
  }

  // ============================================
  // GET MERCHANT SUMMARY
  // ============================================

  getMerchantSummary(pricingPlans: MerchantPricingPlan[], merchantId: string): {
    totalPlans: number;
    activePlans: number;
    archivedPlans: number;
    draftPlans: number;
  } {
    const merchantPlans = this.filterByMerchant(pricingPlans, merchantId);

    return {
      totalPlans: merchantPlans.length,
      activePlans: merchantPlans.filter((p) => p.status === 'active').length,
      archivedPlans: merchantPlans.filter((p) => p.status === 'archived').length,
      draftPlans: merchantPlans.filter((p) => p.status === 'draft').length,
    };
  }

  // ============================================
  // REGISTER PRICING PLAN
  // ============================================

  registerPricingPlan(pricingPlan: MerchantPricingPlan): void {
    this.pricingPlans.set(pricingPlan.id, pricingPlan);
  }

  // ============================================
  // UNREGISTER PRICING PLAN
  // ============================================

  unregisterPricingPlan(pricingPlanId: string): void {
    this.pricingPlans.delete(pricingPlanId);
  }

  // ============================================
  // GET PRICING PLAN
  // ============================================

  getPricingPlan(pricingPlanId: string): MerchantPricingPlan | null {
    return this.pricingPlans.get(pricingPlanId) || null;
  }

  // ============================================
  // GET ALL PRICING PLANS
  // ============================================

  getAllPricingPlans(): MerchantPricingPlan[] {
    return Array.from(this.pricingPlans.values());
  }
}

// Export singleton instance
export const merchantPricingContextLock = new MerchantPricingContextLock();

// ============================================
// REACT HOOK FOR CONTEXT LOCK
// ============================================

import { useCallback } from 'react';

export function useMerchantPricingContextLock() {
  const validateMerchantId = useCallback((merchantId: string) => {
    return merchantPricingContextLock.validateMerchantId(merchantId);
  }, []);

  const validateMerchantAccess = useCallback((pricingPlan: MerchantPricingPlan, userMerchantId: string) => {
    return merchantPricingContextLock.validateMerchantAccess(pricingPlan, userMerchantId);
  }, []);

  const filterByMerchant = useCallback((pricingPlans: MerchantPricingPlan[], merchantId: string) => {
    return merchantPricingContextLock.filterByMerchant(pricingPlans, merchantId);
  }, []);

  const validateCreateRequest = useCallback((merchantId: string, userId: string, userRole: MerchantRole) => {
    return merchantPricingContextLock.validateCreateRequest(merchantId, userId, userRole);
  }, []);

  const validateUpdateRequest = useCallback((
    pricingPlan: MerchantPricingPlan,
    userMerchantId: string,
    userId: string,
    userRole: MerchantRole
  ) => {
    return merchantPricingContextLock.validateUpdateRequest(pricingPlan, userMerchantId, userId, userRole);
  }, []);

  const getMerchantSummary = useCallback((pricingPlans: MerchantPricingPlan[], merchantId: string) => {
    return merchantPricingContextLock.getMerchantSummary(pricingPlans, merchantId);
  }, []);

  return {
    validateMerchantId,
    validateMerchantAccess,
    filterByMerchant,
    validateCreateRequest,
    validateUpdateRequest,
    getMerchantSummary,
  };
}
