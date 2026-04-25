// Merchant Pricing Event Flow
// merchant.pricing.updated event emission
// Updates: dashboard, subscriptions, checkout

import type { MerchantPricingEvent, MerchantPricingEventType, MerchantRole } from './merchant-pricing-types';

// ============================================
// MERCHANT PRICING EVENT LISTENER
// ============================================

export type MerchantPricingEventListener = (event: MerchantPricingEvent) => void | Promise<void>;

// ============================================
// MERCHANT PRICING EVENT BUS
// ============================================

export class MerchantPricingEventBus {
  private listeners: Map<MerchantPricingEventType, Set<MerchantPricingEventListener>> = new Map();
  private eventHistory: MerchantPricingEvent[] = [];
  private maxHistorySize: number = 1000;

  // ============================================
  // SUBSCRIBE TO EVENT
  // ============================================

  on(eventType: MerchantPricingEventType, listener: MerchantPricingEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  // ============================================
  // UNSUBSCRIBE FROM EVENT
  // ============================================

  off(eventType: MerchantPricingEventType, listener: MerchantPricingEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // ============================================
  // EMIT EVENT
  // ============================================

  async emit(event: MerchantPricingEvent): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      const promises = Array.from(listeners).map((listener) => {
        try {
          return listener(event);
        } catch (error) {
          console.error(`[MerchantPricingEventBus] Error in listener for ${event.type}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    // Log event
    console.log(`[MerchantPricingEventBus] Event emitted: ${event.type}`, event);
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getHistory(merchantId?: string, eventType?: MerchantPricingEventType, limit?: number): MerchantPricingEvent[] {
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
  // CLEAR LISTENERS
  // ============================================

  clearListeners(eventType?: MerchantPricingEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const merchantPricingEventBus = new MerchantPricingEventBus();

// ============================================
// MERCHANT PRICING EVENT EMITTER
// ============================================

export class MerchantPricingEventEmitter {
  // ============================================
  // EMIT PRICING CREATED EVENT
  // ============================================

  async emitPricingCreated(
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: MerchantRole
  ): Promise<void> {
    const event: MerchantPricingEvent = {
      type: 'merchant.pricing.created',
      merchantId,
      data: {
        pricingPlanId,
        pricingPlanName,
        userId,
        userRole,
      },
      timestamp: new Date().toISOString(),
    };

    await merchantPricingEventBus.emit(event);
  }

  // ============================================
  // EMIT PRICING UPDATED EVENT
  // ============================================

  async emitPricingUpdated(
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: MerchantRole
  ): Promise<void> {
    const event: MerchantPricingEvent = {
      type: 'merchant.pricing.updated',
      merchantId,
      data: {
        pricingPlanId,
        pricingPlanName,
        userId,
        userRole,
      },
      timestamp: new Date().toISOString(),
    };

    await merchantPricingEventBus.emit(event);
  }

  // ============================================
  // EMIT PRICING ARCHIVED EVENT
  // ============================================

  async emitPricingArchived(
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: MerchantRole
  ): Promise<void> {
    const event: MerchantPricingEvent = {
      type: 'merchant.pricing.archived',
      merchantId,
      data: {
        pricingPlanId,
        pricingPlanName,
        userId,
        userRole,
      },
      timestamp: new Date().toISOString(),
    };

    await merchantPricingEventBus.emit(event);
  }

  // ============================================
  // EMIT PRICING REACTIVATED EVENT
  // ============================================

  async emitPricingReactivated(
    merchantId: string,
    pricingPlanId: string,
    pricingPlanName: string,
    userId: string,
    userRole: MerchantRole
  ): Promise<void> {
    const event: MerchantPricingEvent = {
      type: 'merchant.pricing.reactivated',
      merchantId,
      data: {
        pricingPlanId,
        pricingPlanName,
        userId,
        userRole,
      },
      timestamp: new Date().toISOString(),
    };

    await merchantPricingEventBus.emit(event);
  }

  // ============================================
  // EMIT DASHBOARD REFRESH EVENT
  // ============================================

  async emitDashboardRefresh(merchantId: string, trigger: string): Promise<void> {
    const event: MerchantPricingEvent = {
      type: 'merchant.dashboard.refresh',
      merchantId,
      data: {
        trigger,
      },
      timestamp: new Date().toISOString(),
    };

    await merchantPricingEventBus.emit(event);
  }
}

// Export singleton instance
export const merchantPricingEventEmitter = new MerchantPricingEventEmitter();

// ============================================
// REACT HOOK FOR MERCHANT PRICING EVENTS
// ============================================

import { useEffect, useCallback } from 'react';

export function useMerchantPricingEvents() {
  const subscribe = useCallback((eventType: MerchantPricingEventType, listener: MerchantPricingEventListener) => {
    return merchantPricingEventBus.on(eventType, listener);
  }, []);

  const getHistory = useCallback((merchantId?: string, eventType?: MerchantPricingEventType, limit?: number) => {
    return merchantPricingEventBus.getHistory(merchantId, eventType, limit);
  }, []);

  return {
    subscribe,
    getHistory,
  };
}
