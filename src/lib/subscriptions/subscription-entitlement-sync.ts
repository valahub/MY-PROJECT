// Subscription Entitlement Sync
// subscription.updated → update entitlements, apply instantly

import type { Subscription, SubscriptionEvent } from './subscription-types';

// ============================================
// ENTITLEMENT
// ============================================

export interface Entitlement {
  customerId: string;
  subscriptionId: string;
  pricingId: string;
  features: string[];
  limits: Record<string, number>;
  status: 'active' | 'inactive';
  validFrom: string;
  validUntil: string;
  updatedAt: string;
}

// ============================================
// ENTITLEMENT SYNC RESULT
// ============================================

export interface EntitlementSyncResult {
  success: boolean;
  entitlement: Entitlement | null;
  error?: string;
  timestamp: string;
}

// ============================================
// ENTITLEMENT SYNC MANAGER
// ============================================

export class EntitlementSyncManager {
  private entitlements: Map<string, Entitlement> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  // ============================================
  // SYNC ENTITLEMENT FOR SUBSCRIPTION
  // ============================================

  async syncEntitlement(subscription: Subscription): Promise<EntitlementSyncResult> {
    try {
      console.log(`[EntitlementSync] Syncing entitlement for subscription ${subscription.id}`);

      // Determine entitlement status based on subscription status
      const entitlementStatus = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'inactive';

      // Get features and limits from pricing (placeholder - in production, fetch from pricing service)
      const features = this.getFeaturesForPricing(subscription.pricingId);
      const limits = this.getLimitsForPricing(subscription.pricingId);

      // Calculate validity period
      const validFrom = subscription.currentPeriodStart;
      const validUntil = subscription.status === 'canceled' ? subscription.currentPeriodEnd : subscription.nextBillingAt;

      // Create or update entitlement
      const entitlement: Entitlement = {
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
        pricingId: subscription.pricingId,
        features,
        limits,
        status: entitlementStatus,
        validFrom,
        validUntil,
        updatedAt: new Date().toISOString(),
      };

      this.entitlements.set(`${subscription.customerId}:${subscription.pricingId}`, entitlement);

      console.log(`[EntitlementSync] Entitlement synced for customer ${subscription.customerId}`);

      return {
        success: true,
        entitlement,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        entitlement: null,
        error: error instanceof Error ? error.message : 'Failed to sync entitlement',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // HANDLE SUBSCRIPTION EVENT
  // ============================================

  async handleSubscriptionEvent(event: SubscriptionEvent): Promise<EntitlementSyncResult> {
    const subscription = this.subscriptions.get(event.data.subscriptionId as string);

    if (!subscription) {
      return {
        success: false,
        entitlement: null,
        error: 'Subscription not found',
        timestamp: new Date().toISOString(),
      };
    }

    // Update subscription from event data
    if (event.data.pricingId) {
      subscription.pricingId = event.data.pricingId as string;
    }

    // Sync entitlement
    return await this.syncEntitlement(subscription);
  }

  // ============================================
  // GET FEATURES FOR PRICING
  // ============================================

  private getFeaturesForPricing(pricingId: string): string[] {
    // In production, fetch from pricing service
    // For now, return placeholder features
    const featuresMap: Record<string, string[]> = {
      'basic': ['feature1', 'feature2'],
      'pro': ['feature1', 'feature2', 'feature3', 'feature4'],
      'enterprise': ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6'],
    };

    return featuresMap[pricingId] || ['feature1'];
  }

  // ============================================
  // GET LIMITS FOR PRICING
  // ============================================

  private getLimitsForPricing(pricingId: string): Record<string, number> {
    // In production, fetch from pricing service
    // For now, return placeholder limits
    const limitsMap: Record<string, Record<string, number>> = {
      'basic': { users: 5, storage: 10, apiCalls: 1000 },
      'pro': { users: 25, storage: 100, apiCalls: 10000 },
      'enterprise': { users: -1, storage: -1, apiCalls: -1 }, // -1 means unlimited
    };

    return limitsMap[pricingId] || { users: 1, storage: 1, apiCalls: 100 };
  }

  // ============================================
  // GET ENTITLEMENT FOR CUSTOMER
  // ============================================

  getEntitlementForCustomer(customerId: string, pricingId: string): Entitlement | null {
    return this.entitlements.get(`${customerId}:${pricingId}`) || null;
  }

  // ============================================
  // GET ALL ENTITLEMENTS FOR CUSTOMER
  // ============================================

  getAllEntitlementsForCustomer(customerId: string): Entitlement[] {
    const entitlements: Entitlement[] = [];

    for (const entitlement of this.entitlements.values()) {
      if (entitlement.customerId === customerId) {
        entitlements.push(entitlement);
      }
    }

    return entitlements;
  }

  // ============================================
  // CHECK FEATURE ACCESS
  // ============================================

  checkFeatureAccess(customerId: string, pricingId: string, feature: string): boolean {
    const entitlement = this.getEntitlementForCustomer(customerId, pricingId);

    if (!entitlement || entitlement.status !== 'active') {
      return false;
    }

    // Check if feature is valid
    const now = new Date();
    const validFrom = new Date(entitlement.validFrom);
    const validUntil = new Date(entitlement.validUntil);

    if (now < validFrom || now > validUntil) {
      return false;
    }

    return entitlement.features.includes(feature);
  }

  // ============================================
  // CHECK LIMIT
  // ============================================

  checkLimit(customerId: string, pricingId: string, limitKey: string, currentValue: number): boolean {
    const entitlement = this.getEntitlementForCustomer(customerId, pricingId);

    if (!entitlement || entitlement.status !== 'active') {
      return false;
    }

    const limit = entitlement.limits[limitKey];

    // -1 means unlimited
    if (limit === -1) {
      return true;
    }

    return currentValue <= limit;
  }

  // ============================================
  // REVOKE ENTITLEMENT
  // ============================================

  revokeEntitlement(customerId: string, pricingId: string): void {
    const key = `${customerId}:${pricingId}`;
    const entitlement = this.entitlements.get(key);

    if (entitlement) {
      entitlement.status = 'inactive';
      entitlement.updatedAt = new Date().toISOString();
      console.log(`[EntitlementSync] Revoked entitlement for customer ${customerId}`);
    }
  }

  // ============================================
  // BATCH SYNC ENTITLEMENTS
  // ============================================

  async batchSyncEntitlements(subscriptions: Subscription[]): Promise<Map<string, EntitlementSyncResult>> {
    const results = new Map<string, EntitlementSyncResult>();

    for (const subscription of subscriptions) {
      const result = await this.syncEntitlement(subscription);
      results.set(subscription.id, result);
    }

    return results;
  }

  // ============================================
  // GET ENTITLEMENT SUMMARY
  // ============================================

  getEntitlementSummary(): {
    totalEntitlements: number;
    activeEntitlements: number;
    inactiveEntitlements: number;
    expiringSoon: number;
  } {
    const totalEntitlements = this.entitlements.size;
    const activeEntitlements = Array.from(this.entitlements.values()).filter((e) => e.status === 'active').length;
    const inactiveEntitlements = Array.from(this.entitlements.values()).filter((e) => e.status === 'inactive').length;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = Array.from(this.entitlements.values()).filter((e) => {
      const validUntil = new Date(e.validUntil);
      return e.status === 'active' && validUntil <= sevenDaysFromNow && validUntil > now;
    }).length;

    return {
      totalEntitlements,
      activeEntitlements,
      inactiveEntitlements,
      expiringSoon,
    };
  }

  // ============================================
  // REGISTER SUBSCRIPTION
  // ============================================

  registerSubscription(subscription: Subscription): void {
    this.subscriptions.set(subscription.id, subscription);
  }

  // ============================================
  // UNREGISTER SUBSCRIPTION
  // ============================================

  unregisterSubscription(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  // ============================================
  // GET SUBSCRIPTION
  // ============================================

  getSubscription(subscriptionId: string): Subscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }
}

// Export singleton instance
export const entitlementSyncManager = new EntitlementSyncManager();

// ============================================
// REACT HOOK FOR ENTITLEMENT SYNC
// ============================================

import { useState, useCallback } from 'react';

export function useEntitlementSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncEntitlement = useCallback(async (subscription: Subscription) => {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await entitlementSyncManager.syncEntitlement(subscription);
      if (!result.success) {
        setError(result.error || 'Failed to sync entitlement');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync entitlement';
      setError(errorMessage);
      return {
        success: false,
        entitlement: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleSubscriptionEvent = useCallback(async (event: SubscriptionEvent) => {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await entitlementSyncManager.handleSubscriptionEvent(event);
      if (!result.success) {
        setError(result.error || 'Failed to handle subscription event');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to handle subscription event';
      setError(errorMessage);
      return {
        success: false,
        entitlement: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const checkFeatureAccess = useCallback((customerId: string, pricingId: string, feature: string) => {
    return entitlementSyncManager.checkFeatureAccess(customerId, pricingId, feature);
  }, []);

  const checkLimit = useCallback((customerId: string, pricingId: string, limitKey: string, currentValue: number) => {
    return entitlementSyncManager.checkLimit(customerId, pricingId, limitKey, currentValue);
  }, []);

  const getEntitlementForCustomer = useCallback((customerId: string, pricingId: string) => {
    return entitlementSyncManager.getEntitlementForCustomer(customerId, pricingId);
  }, []);

  const getAllEntitlementsForCustomer = useCallback((customerId: string) => {
    return entitlementSyncManager.getAllEntitlementsForCustomer(customerId);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSyncing,
    error,
    syncEntitlement,
    handleSubscriptionEvent,
    checkFeatureAccess,
    checkLimit,
    getEntitlementForCustomer,
    getAllEntitlementsForCustomer,
    clearError,
  };
}
