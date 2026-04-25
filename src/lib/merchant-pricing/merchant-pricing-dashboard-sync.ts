// Merchant Pricing Dashboard Sync
// Triggers merchant.dashboard.refresh on pricing changes
// Updates: dashboard, subscriptions, checkout links, invoices

import type { MerchantPricingEvent, MerchantPricingEventType, MerchantRole } from './merchant-pricing-types';

// ============================================
// DASHBOARD SYNC RESULT
// ============================================

export interface DashboardSyncResult {
  success: boolean;
  merchantId: string;
  refreshedComponents: string[];
  error?: string;
  timestamp: string;
}

// ============================================
// MERCHANT PRICING DASHBOARD SYNC
// ============================================

export class MerchantPricingDashboardSync {
  private eventHistory: MerchantPricingEvent[] = [];
  private maxHistorySize: number = 1000;

  // ============================================
  // TRIGGER DASHBOARD REFRESH
  // ============================================

  async triggerDashboardRefresh(merchantId: string, trigger: string): Promise<DashboardSyncResult> {
    try {
      const event: MerchantPricingEvent = {
        type: 'merchant.dashboard.refresh',
        merchantId,
        data: {
          trigger,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      this.eventHistory.push(event);
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }

      // Simulate dashboard refresh
      const refreshedComponents = [
        'merchant_revenue_cards',
        'merchant_mrr_arr',
        'merchant_subscriptions',
        'merchant_checkout_links',
        'merchant_invoices',
      ];

      console.log(`[DashboardSync] Triggered dashboard refresh for merchant ${merchantId} due to ${trigger}`);

      return {
        success: true,
        merchantId,
        refreshedComponents,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId,
        refreshedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to trigger dashboard refresh',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // EMIT PRICING EVENT
  // ============================================

  async emitPricingEvent(event: MerchantPricingEvent): Promise<DashboardSyncResult> {
    try {
      // Add to history
      this.eventHistory.push(event);
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }

      // Trigger dashboard refresh on pricing events
      if (event.type === 'merchant.pricing.created' ||
          event.type === 'merchant.pricing.updated' ||
          event.type === 'merchant.pricing.archived' ||
          event.type === 'merchant.pricing.reactivated') {
        return await this.triggerDashboardRefresh(event.merchantId, event.type);
      }

      console.log(`[DashboardSync] Emitted pricing event ${event.type} for merchant ${event.merchantId}`);

      return {
        success: true,
        merchantId: event.merchantId,
        refreshedComponents: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        merchantId: event.merchantId,
        refreshedComponents: [],
        error: error instanceof Error ? error.message : 'Failed to emit pricing event',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // ON PRICING CREATED
  // ============================================

  async onPricingCreated(
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: string
  ): Promise<DashboardSyncResult> {
    const event: MerchantPricingEvent = {
      type: 'merchant.pricing.created',
      merchantId,
      data: {
        pricingPlanId,
        pricingPlanName,
        userId,
        userRole: userRole as MerchantRole,
      },
      timestamp: new Date().toISOString(),
    };

    return await this.emitPricingEvent(event);
  }

  // ============================================
  // ON PRICING UPDATED
  // ============================================

  async onPricingUpdated(
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: string
  ): Promise<DashboardSyncResult> {
    const event: MerchantPricingEvent = {
      type: 'merchant.pricing.updated',
      merchantId,
      data: {
        pricingPlanId,
        pricingPlanName,
        userId,
        userRole: userRole as MerchantRole,
      },
      timestamp: new Date().toISOString(),
    };

    return await this.emitPricingEvent(event);
  }

  // ============================================
  // ON PRICING ARCHIVED
  // ============================================

  async onPricingArchived(
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: string
  ): Promise<DashboardSyncResult> {
    const event: MerchantPricingEvent = {
      type: 'merchant.pricing.archived',
      merchantId,
      data: {
        pricingPlanId,
        pricingPlanName,
        userId,
        userRole: userRole as MerchantRole,
      },
      timestamp: new Date().toISOString(),
    };

    return await this.emitPricingEvent(event);
  }

  // ============================================
  // ON PRICING REACTIVATED
  // ============================================

  async onPricingReactivated(
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: string
  ): Promise<DashboardSyncResult> {
    const event: MerchantPricingEvent = {
      type: 'merchant.pricing.reactivated',
      merchantId,
      data: {
        pricingPlanId,
        pricingPlanName,
        userId,
        userRole: userRole as MerchantRole,
      },
      timestamp: new Date().toISOString(),
    };

    return await this.emitPricingEvent(event);
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getEventHistory(merchantId?: string, eventType?: MerchantPricingEventType, limit?: number): MerchantPricingEvent[] {
    let history = this.eventHistory;

    if (merchantId) {
      history = history.filter((e) => e.merchantId === merchantId);
    }

    if (eventType) {
      history = history.filter((e) => e.type === eventType);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ============================================
  // CLEAR HISTORY
  // ============================================

  clearHistory(merchantId?: string): void {
    if (merchantId) {
      this.eventHistory = this.eventHistory.filter((e) => e.merchantId !== merchantId);
    } else {
      this.eventHistory = [];
    }
  }

  // ============================================
  // GET SYNC SUMMARY
  // ============================================

  getSyncSummary(merchantId: string): {
    totalEvents: number;
    dashboardRefreshCount: number;
    pricingCreatedCount: number;
    pricingUpdatedCount: number;
    pricingArchivedCount: number;
  } {
    const merchantEvents = this.eventHistory.filter((e) => e.merchantId === merchantId);

    return {
      totalEvents: merchantEvents.length,
      dashboardRefreshCount: merchantEvents.filter((e) => e.type === 'merchant.dashboard.refresh').length,
      pricingCreatedCount: merchantEvents.filter((e) => e.type === 'merchant.pricing.created').length,
      pricingUpdatedCount: merchantEvents.filter((e) => e.type === 'merchant.pricing.updated').length,
      pricingArchivedCount: merchantEvents.filter((e) => e.type === 'merchant.pricing.archived').length,
    };
  }
}

// Export singleton instance
export const merchantPricingDashboardSync = new MerchantPricingDashboardSync();

// ============================================
// REACT HOOK FOR DASHBOARD SYNC
// ============================================

import { useCallback } from 'react';

export function useMerchantPricingDashboardSync() {
  const triggerDashboardRefresh = useCallback((merchantId: string, trigger: string) => {
    return merchantPricingDashboardSync.triggerDashboardRefresh(merchantId, trigger);
  }, []);

  const onPricingCreated = useCallback((
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: string
  ) => {
    return merchantPricingDashboardSync.onPricingCreated(merchantId, pricingPlanId, pricingPlanName, userId, userRole);
  }, []);

  const onPricingUpdated = useCallback((
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: string
  ) => {
    return merchantPricingDashboardSync.onPricingUpdated(merchantId, pricingPlanId, pricingPlanName, userId, userRole);
  }, []);

  const onPricingArchived = useCallback((
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: string
  ) => {
    return merchantPricingDashboardSync.onPricingArchived(merchantId, pricingPlanId, pricingPlanName, userId, userRole);
  }, []);

  const getSyncSummary = useCallback((merchantId: string) => {
    return merchantPricingDashboardSync.getSyncSummary(merchantId);
  }, []);

  return {
    triggerDashboardRefresh,
    onPricingCreated,
    onPricingUpdated,
    onPricingArchived,
    getSyncSummary,
  };
}
