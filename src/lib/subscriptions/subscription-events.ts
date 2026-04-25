// Subscription Events System
// subscription.updated for real-time UI updates

import type { Subscription, SubscriptionEvent, SubscriptionEventType } from './subscription-types';

// ============================================
// SUBSCRIPTION EVENT LISTENER
// ============================================

export type SubscriptionEventListener = (event: SubscriptionEvent) => void | Promise<void>;

// ============================================
// SUBSCRIPTION EVENT BUS
// ============================================

export class SubscriptionEventBus {
  private listeners: Map<SubscriptionEventType, Set<SubscriptionEventListener>> = new Map();
  private eventHistory: SubscriptionEvent[] = [];
  private maxHistorySize: number = 1000;

  // ============================================
  // SUBSCRIBE TO EVENT
  // ============================================

  on(eventType: SubscriptionEventType, listener: SubscriptionEventListener): () => void {
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

  off(eventType: SubscriptionEventType, listener: SubscriptionEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // ============================================
  // EMIT EVENT
  // ============================================

  async emit(event: SubscriptionEvent): Promise<void> {
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
          console.error(`[SubscriptionEventBus] Error in listener for ${event.type}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    // Log event
    console.log(`[SubscriptionEventBus] Event emitted: ${event.type}`, event);
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getHistory(eventType?: SubscriptionEventType, limit?: number): SubscriptionEvent[] {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter((e) => e.type === eventType);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  // ============================================
  // CLEAR HISTORY
  // ============================================

  clearHistory(): void {
    this.eventHistory = [];
  }

  // ============================================
  // CLEAR LISTENERS
  // ============================================

  clearListeners(eventType?: SubscriptionEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const subscriptionEventBus = new SubscriptionEventBus();

// ============================================
// SUBSCRIPTION EVENT EMITTER
// ============================================

export class SubscriptionEventEmitter {
  // ============================================
  // EMIT SUBSCRIPTION CREATED EVENT
  // ============================================

  async emitSubscriptionCreated(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.created',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION TRIALING EVENT
  // ============================================

  async emitSubscriptionTrialing(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.trialing',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION ACTIVE EVENT
  // ============================================

  async emitSubscriptionActive(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.active',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION PAST_DUE EVENT
  // ============================================

  async emitSubscriptionPastDue(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.past_due',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION CANCELED EVENT
  // ============================================

  async emitSubscriptionCanceled(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.canceled',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION PAUSED EVENT
  // ============================================

  async emitSubscriptionPaused(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.paused',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION RESUMED EVENT
  // ============================================

  async emitSubscriptionResumed(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.resumed',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION PLAN CHANGED EVENT
  // ============================================

  async emitSubscriptionPlanChanged(
    subscription: Subscription,
    previousPricingId: string,
    userId?: string
  ): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.plan_changed',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
        previousPricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION NEXT BILLING EVENT
  // ============================================

  async emitSubscriptionNextBilling(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.next_billing',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
        nextBillingAt: subscription.nextBillingAt,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION PAYMENT FAILED EVENT
  // ============================================

  async emitSubscriptionPaymentFailed(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.payment_failed',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION UPDATED EVENT
  // ============================================

  async emitSubscriptionUpdated(subscription: Subscription, userId?: string): Promise<void> {
    const event: SubscriptionEvent = {
      type: 'subscription.updated',
      data: {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        pricingId: subscription.pricingId,
        status: subscription.status,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: subscription.tenantId,
    };

    await subscriptionEventBus.emit(event);
  }
}

// Export singleton instance
export const subscriptionEventEmitter = new SubscriptionEventEmitter();

// ============================================
// REACT HOOK FOR SUBSCRIPTION EVENTS
// ============================================

import { useEffect, useCallback } from 'react';

export function useSubscriptionEvents() {
  const subscribe = useCallback((eventType: SubscriptionEventType, listener: SubscriptionEventListener) => {
    return subscriptionEventBus.on(eventType, listener);
  }, []);

  const getHistory = useCallback((eventType?: SubscriptionEventType, limit?: number) => {
    return subscriptionEventBus.getHistory(eventType, limit);
  }, []);

  return {
    subscribe,
    getHistory,
  };
}
