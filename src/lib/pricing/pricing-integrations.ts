// Pricing Integration Hooks
// Checkout links, subscription engine, billing integration

import type { PricingPlan, BillingCycle } from './pricing-types';
import { pricingAPI } from './pricing-api';
import { pricingCacheManager } from './pricing-cache';
import { pricingEventBus } from './pricing-events';

// ============================================
// CHECKOUT LINK GENERATION
// ============================================

export interface CheckoutLinkConfig {
  planId: string;
  quantity?: number;
  trialDays?: number;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutLink {
  url: string;
  planId: string;
  price: number;
  billingCycle: BillingCycle;
  expiresAt: string;
}

// ============================================
// SUBSCRIPTION PRICING CALCULATION
// ============================================

export interface SubscriptionPricing {
  basePrice: number;
  trialPrice: number;
  setupFee: number;
  discountAmount: number;
  discountPercentage: number;
  totalPrice: number;
  recurringPrice: number;
}

// ============================================
// BILLING INTEGRATION
// ============================================

export interface BillingIntegration {
  syncPlan(planId: string): Promise<boolean>;
  getInvoiceTemplate(planId: string): Promise<unknown>;
  calculateProration(oldPlan: PricingPlan, newPlan: PricingPlan, daysUsed: number): number;
}

// ============================================
// PRICING INTEGRATION MANAGER
// ============================================

export class PricingIntegrationManager {
  // ============================================
  // GENERATE CHECKOUT LINK
  // ============================================

  async generateCheckoutLink(config: CheckoutLinkConfig): Promise<CheckoutLink | null> {
    try {
      // Get plan details
      const planResult = await pricingAPI.getPlan(config.planId);
      if (!planResult.success || !planResult.data) {
        console.error(`[PricingIntegration] Failed to get plan ${config.planId}`);
        return null;
      }

      const plan = planResult.data;
      const currentVersion = plan.versions.find((v) => v.version === plan.currentVersion);
      if (!currentVersion) return null;

      // Generate checkout URL
      const baseUrl = window.location.origin;
      const params = new URLSearchParams({
        plan_id: config.planId,
        price: currentVersion.price.toString(),
        billing_cycle: currentVersion.billingCycle,
        trial_days: config.trialDays?.toString() || currentVersion.trialDays.toString(),
      });

      if (config.quantity) params.set('quantity', config.quantity.toString());
      if (config.successUrl) params.set('success_url', config.successUrl);
      if (config.cancelUrl) params.set('cancel_url', config.cancelUrl);

      if (config.metadata) {
        Object.entries(config.metadata).forEach(([key, value]) => {
          params.set(`metadata[${key}]`, value);
        });
      }

      const url = `${baseUrl}/checkout?${params.toString()}`;

      return {
        url,
        planId: plan.id,
        price: currentVersion.price,
        billingCycle: currentVersion.billingCycle,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };
    } catch (error) {
      console.error('[PricingIntegration] Failed to generate checkout link:', error);
      return null;
    }
  }

  // ============================================
  // CALCULATE SUBSCRIPTION PRICING
  // ============================================

  calculateSubscriptionPricing(
    plan: PricingPlan,
    quantity: number = 1,
    discountPercentage: number = 0,
    trialDays: number = 0
  ): SubscriptionPricing {
    const currentVersion = plan.versions.find((v) => v.version === plan.currentVersion);
    if (!currentVersion) {
      return {
        basePrice: 0,
        trialPrice: 0,
        setupFee: 0,
        discountAmount: 0,
        discountPercentage: 0,
        totalPrice: 0,
        recurringPrice: 0,
      };
    }

    const basePrice = currentVersion.price * quantity;
    const discountAmount = basePrice * (discountPercentage / 100);
    const setupFee = 0; // Can be configured per plan
    const trialPrice = trialDays > 0 ? 0 : basePrice; // Free during trial

    const totalPrice = basePrice - discountAmount + setupFee;
    const recurringPrice = basePrice - discountAmount;

    return {
      basePrice,
      trialPrice,
      setupFee,
      discountAmount,
      discountPercentage,
      totalPrice,
      recurringPrice,
    };
  }

  // ============================================
  // SYNC PLAN WITH CHECKOUT SYSTEM
  // ============================================

  async syncWithCheckout(planId: string): Promise<boolean> {
    try {
      const planResult = await pricingAPI.getPlan(planId);
      if (!planResult.success || !planResult.data) return false;

      const plan = planResult.data;

      // In production, this would call the checkout system API
      console.log(`[PricingIntegration] Syncing plan ${planId} with checkout system`);

      // Emit sync event
      pricingEventBus.emit({
        type: 'pricing.sync.checkout',
        planId,
        data: { plan },
        timestamp: new Date().toISOString(),
        userId: 'system',
      });

      return true;
    } catch (error) {
      console.error('[PricingIntegration] Failed to sync with checkout:', error);
      return false;
    }
  }

  // ============================================
  // SYNC PLAN WITH SUBSCRIPTION ENGINE
  // ============================================

  async syncWithSubscriptionEngine(planId: string): Promise<boolean> {
    try {
      const planResult = await pricingAPI.getPlan(planId);
      if (!planResult.success || !planResult.data) return false;

      const plan = planResult.data;

      // In production, this would call the subscription engine API
      console.log(`[PricingIntegration] Syncing plan ${planId} with subscription engine`);

      // Emit sync event
      pricingEventBus.emit({
        type: 'pricing.sync.subscriptions',
        planId,
        data: { plan },
        timestamp: new Date().toISOString(),
        userId: 'system',
      });

      return true;
    } catch (error) {
      console.error('[PricingIntegration] Failed to sync with subscription engine:', error);
      return false;
    }
  }

  // ============================================
  // SYNC PLAN WITH BILLING SYSTEM
  // ============================================

  async syncWithBilling(planId: string): Promise<boolean> {
    try {
      const planResult = await pricingAPI.getPlan(planId);
      if (!planResult.success || !planResult.data) return false;

      const plan = planResult.data;

      // In production, this would call the billing system API
      console.log(`[PricingIntegration] Syncing plan ${planId} with billing system`);

      // Emit sync event
      pricingEventBus.emit({
        type: 'pricing.sync.invoices',
        planId,
        data: { plan },
        timestamp: new Date().toISOString(),
        userId: 'system',
      });

      return true;
    } catch (error) {
      console.error('[PricingIntegration] Failed to sync with billing:', error);
      return false;
    }
  }

  // ============================================
  // CALCULATE PRORATION
  // ============================================

  calculateProration(
    oldPlan: PricingPlan,
    newPlan: PricingPlan,
    daysUsed: number,
    billingCycleDays: number = 30
  ): number {
    const oldVersion = oldPlan.versions.find((v) => v.version === oldPlan.currentVersion);
    const newVersion = newPlan.versions.find((v) => v.version === newPlan.currentVersion);

    if (!oldVersion || !newVersion) return 0;

    const oldPrice = oldVersion.price;
    const newPrice = newVersion.price;

    // Calculate unused portion of old plan
    const daysRemaining = billingCycleDays - daysUsed;
    const unusedAmount = (oldPrice / billingCycleDays) * daysRemaining;

    // Calculate new plan cost for remaining days
    const newAmountForRemaining = (newPrice / billingCycleDays) * daysRemaining;

    // Proration amount (positive = user pays more, negative = user gets credit)
    return newAmountForRemaining - unusedAmount;
  }

  // ============================================
  // GET INVOICE TEMPLATE
  // ============================================

  async getInvoiceTemplate(planId: string): Promise<unknown> {
    try {
      const planResult = await pricingAPI.getPlan(planId);
      if (!planResult.success || !planResult.data) return null;

      const plan = planResult.data;
      const currentVersion = plan.versions.find((v) => v.version === plan.currentVersion);

      // Generate invoice template
      const template = {
        planId: plan.id,
        planName: plan.name,
        price: currentVersion?.price || 0,
        billingCycle: currentVersion?.billingCycle || 'monthly',
        features: plan.features,
        currency: 'USD',
        taxRate: 0, // Can be configured
      };

      return template;
    } catch (error) {
      console.error('[PricingIntegration] Failed to get invoice template:', error);
      return null;
    }
  }

  // ============================================
  // SYNC ALL PLANS
  // ============================================

  async syncAllPlans(): Promise<{ success: number; failed: number }> {
    const result = await pricingAPI.getPlans();
    if (!result.success || !result.data) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    for (const plan of result.data) {
      try {
        const checkoutSync = await this.syncWithCheckout(plan.id);
        const subscriptionSync = await this.syncWithSubscriptionEngine(plan.id);
        const billingSync = await this.syncWithBilling(plan.id);

        if (checkoutSync && subscriptionSync && billingSync) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  // ============================================
  // INVALIDATE CACHE ON PRICING CHANGE
  // ============================================

  invalidatePricingCache(planId: string): void {
    pricingCacheManager.invalidatePlan(planId);
  }
}

// Export singleton instance
export const pricingIntegrationManager = new PricingIntegrationManager();

// ============================================
// REACT HOOK FOR PRICING INTEGRATIONS
// ============================================

import { useState, useCallback } from 'react';

export function usePricingIntegrations() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);

  const generateCheckoutLink = useCallback(async (config: CheckoutLinkConfig) => {
    return pricingIntegrationManager.generateCheckoutLink(config);
  }, []);

  const calculateSubscriptionPricing = useCallback(
    (plan: PricingPlan, quantity?: number, discountPercentage?: number, trialDays?: number) => {
      return pricingIntegrationManager.calculateSubscriptionPricing(plan, quantity, discountPercentage, trialDays);
    },
    []
  );

  const syncWithCheckout = useCallback(async (planId: string) => {
    return pricingIntegrationManager.syncWithCheckout(planId);
  }, []);

  const syncWithSubscriptionEngine = useCallback(async (planId: string) => {
    return pricingIntegrationManager.syncWithSubscriptionEngine(planId);
  }, []);

  const syncWithBilling = useCallback(async (planId: string) => {
    return pricingIntegrationManager.syncWithBilling(planId);
  }, []);

  const calculateProration = useCallback(
    (oldPlan: PricingPlan, newPlan: PricingPlan, daysUsed: number, billingCycleDays?: number) => {
      return pricingIntegrationManager.calculateProration(oldPlan, newPlan, daysUsed, billingCycleDays);
    },
    []
  );

  const getInvoiceTemplate = useCallback(async (planId: string) => {
    return pricingIntegrationManager.getInvoiceTemplate(planId);
  }, []);

  const syncAllPlans = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await pricingIntegrationManager.syncAllPlans();
      setSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const invalidateCache = useCallback((planId: string) => {
    pricingIntegrationManager.invalidatePricingCache(planId);
  }, []);

  return {
    isSyncing,
    syncResult,
    generateCheckoutLink,
    calculateSubscriptionPricing,
    syncWithCheckout,
    syncWithSubscriptionEngine,
    syncWithBilling,
    calculateProration,
    getInvoiceTemplate,
    syncAllPlans,
    invalidateCache,
  };
}

// ============================================
// CHECKOUT URL BUILDER
// ============================================

export function buildCheckoutUrl(config: CheckoutLinkConfig): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    plan_id: config.planId,
  });

  if (config.quantity) params.set('quantity', config.quantity.toString());
  if (config.trialDays) params.set('trial_days', config.trialDays.toString());
  if (config.successUrl) params.set('success_url', config.successUrl);
  if (config.cancelUrl) params.set('cancel_url', config.cancelUrl);

  if (config.metadata) {
    Object.entries(config.metadata).forEach(([key, value]) => {
      params.set(`metadata[${key}]`, value);
    });
  }

  return `${baseUrl}/checkout?${params.toString()}`;
}
