// Pricing Event System
// pricing.updated event for sync with checkout, subscriptions, billing

import type { PricingPlan, PricingEvent } from './pricing-types';

// ============================================
// EVENT LISTENER
// ============================================

export type PricingEventListener = (event: PricingEvent) => void;

// ============================================
// PRICING EVENT BUS
// ============================================

export class PricingEventBus {
  private listeners: Map<string, Set<PricingEventListener>> = new Map();
  private eventHistory: PricingEvent[] = [];
  private maxHistorySize: number = 100;

  // ============================================
  // SUBSCRIBE TO EVENTS
  // ============================================

  on(eventType: string, listener: PricingEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.off(eventType, listener);
    };
  }

  // ============================================
  // UNSUBSCRIBE FROM EVENTS
  // ============================================

  off(eventType: string, listener: PricingEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // ============================================
  // EMIT EVENT
  // ============================================

  emit(event: PricingEvent): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[PricingEventBus] Error in listener for ${event.type}:`, error);
        }
      });
    }

    // Also dispatch to window for cross-component communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pricing:event', {
        detail: event,
      }));
    }
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getHistory(eventType?: string): PricingEvent[] {
    if (eventType) {
      return this.eventHistory.filter((e) => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  // ============================================
  // CLEAR ALL LISTENERS
  // ============================================

  clearListeners(): void {
    this.listeners.clear();
  }
}

// Export singleton instance
export const pricingEventBus = new PricingEventBus();

// ============================================
// PRICING EVENT EMITTER
// ============================================

export class PricingEventEmitter {
  private eventBus: PricingEventBus;

  constructor(eventBus: PricingEventBus = pricingEventBus) {
    this.eventBus = eventBus;
  }

  // ============================================
  // EMIT PRICING EVENTS
  // ============================================

  emitCreated(plan: PricingPlan, userId: string): void {
    const event: PricingEvent = {
      type: 'pricing.created',
      planId: plan.id,
      data: {
        plan,
      },
      timestamp: new Date().toISOString(),
      userId,
    };

    this.eventBus.emit(event);
  }

  emitUpdated(plan: PricingPlan, oldPlan: PricingPlan | undefined, userId: string): void {
    const event: PricingEvent = {
      type: 'pricing.updated',
      planId: plan.id,
      data: {
        plan,
        oldPlan,
      },
      timestamp: new Date().toISOString(),
      userId,
    };

    this.eventBus.emit(event);
  }

  emitArchived(plan: PricingPlan, oldPlan: PricingPlan | undefined, userId: string): void {
    const event: PricingEvent = {
      type: 'pricing.archived',
      planId: plan.id,
      data: {
        plan,
        oldPlan,
      },
      timestamp: new Date().toISOString(),
      userId,
    };

    this.eventBus.emit(event);
  }

  emitRestored(plan: PricingPlan, oldPlan: PricingPlan | undefined, userId: string): void {
    const event: PricingEvent = {
      type: 'pricing.restored',
      planId: plan.id,
      data: {
        plan,
        oldPlan,
      },
      timestamp: new Date().toISOString(),
      userId,
    };

    this.eventBus.emit(event);
  }

  emitVersionCreated(plan: PricingPlan, userId: string): void {
    const event: PricingEvent = {
      type: 'pricing.version_created',
      planId: plan.id,
      data: {
        plan,
      },
      timestamp: new Date().toISOString(),
      userId,
    };

    this.eventBus.emit(event);
  }
}

// Export singleton instance
export const pricingEventEmitter = new PricingEventEmitter();

// ============================================
// SYNC INTEGRATION
// ============================================

export class PricingSyncIntegration {
  private eventBus: PricingEventBus;

  constructor(eventBus: PricingEventBus = pricingEventBus) {
    this.eventBus = eventBus;
    this.setupSyncListeners();
  }

  // ============================================
  // SETUP SYNC LISTENERS
  // ============================================

  private setupSyncListeners(): void {
    // Listen for pricing updates and sync with external systems
    this.eventBus.on('pricing.updated', (event) => {
      this.syncWithCheckout(event);
      this.syncWithSubscriptions(event);
      this.syncWithInvoices(event);
    });

    this.eventBus.on('pricing.created', (event) => {
      this.syncWithCheckout(event);
    });

    this.eventBus.on('pricing.archived', (event) => {
      this.syncWithCheckout(event);
      this.syncWithSubscriptions(event);
    });
  }

  // ============================================
  // SYNC WITH CHECKOUT
  // ============================================

  private async syncWithCheckout(event: PricingEvent): Promise<void> {
    try {
      const { plan } = event.data;

      // Update checkout links/pricing
      console.log(`[PricingSync] Syncing plan ${plan.id} with checkout system`);

      // In production, this would call the checkout API
      // await checkoutAPI.updatePricing(plan);

      // Emit sync event
      this.eventBus.emit({
        type: 'pricing.sync.checkout',
        planId: plan.id,
        data: { plan },
        timestamp: new Date().toISOString(),
        userId: event.userId,
      });
    } catch (error) {
      console.error('[PricingSync] Failed to sync with checkout:', error);
    }
  }

  // ============================================
  // SYNC WITH SUBSCRIPTIONS
  // ============================================

  private async syncWithSubscriptions(event: PricingEvent): Promise<void> {
    try {
      const { plan, oldPlan } = event.data;

      // Update subscription logic if price changed
      if (oldPlan && plan.currentVersion !== oldPlan.currentVersion) {
        console.log(`[PricingSync] Syncing plan ${plan.id} with subscription system`);

        // In production, this would call the subscription API
        // await subscriptionAPI.handlePricingChange(plan.id, oldPlan, plan);
      }

      // Emit sync event
      this.eventBus.emit({
        type: 'pricing.sync.subscriptions',
        planId: plan.id,
        data: { plan, oldPlan },
        timestamp: new Date().toISOString(),
        userId: event.userId,
      });
    } catch (error) {
      console.error('[PricingSync] Failed to sync with subscriptions:', error);
    }
  }

  // ============================================
  // SYNC WITH INVOICES
  // ============================================

  private async syncWithInvoices(event: PricingEvent): Promise<void> {
    try {
      const { plan } = event.data;

      // Update invoice templates/pricing
      console.log(`[PricingSync] Syncing plan ${plan.id} with invoice system`);

      // In production, this would call the billing/invoice API
      // await invoiceAPI.updatePricing(plan);

      // Emit sync event
      this.eventBus.emit({
        type: 'pricing.sync.invoices',
        planId: plan.id,
        data: { plan },
        timestamp: new Date().toISOString(),
        userId: event.userId,
      });
    } catch (error) {
      console.error('[PricingSync] Failed to sync with invoices:', error);
    }
  }
}

// Export singleton instance
export const pricingSyncIntegration = new PricingSyncIntegration();

// ============================================
// REACT HOOK FOR PRICING EVENTS
// ============================================

import { useEffect, useCallback } from 'react';

export function usePricingEvents() {
  const subscribe = useCallback((eventType: string, listener: PricingEventListener) => {
    const unsubscribe = pricingEventBus.on(eventType, listener);
    return unsubscribe;
  }, []);

  const onPricingCreated = useCallback((listener: PricingEventListener) => {
    return pricingEventBus.on('pricing.created', listener);
  }, []);

  const onPricingUpdated = useCallback((listener: PricingEventListener) => {
    return pricingEventBus.on('pricing.updated', listener);
  }, []);

  const onPricingArchived = useCallback((listener: PricingEventListener) => {
    return pricingEventBus.on('pricing.archived', listener);
  }, []);

  const onPricingRestored = useCallback((listener: PricingEventListener) => {
    return pricingEventBus.on('pricing.restored', listener);
  }, []);

  const onPricingVersionCreated = useCallback((listener: PricingEventListener) => {
    return pricingEventBus.on('pricing.version_created', listener);
  }, []);

  const getHistory = useCallback((eventType?: string) => {
    return pricingEventBus.getHistory(eventType);
  }, []);

  return {
    subscribe,
    onPricingCreated,
    onPricingUpdated,
    onPricingArchived,
    onPricingRestored,
    onPricingVersionCreated,
    getHistory,
  };
}

// ============================================
// WINDOW EVENT LISTENER HOOK
// ============================================

export function useWindowPricingEvents() {
  useEffect(() => {
    const handlePricingEvent = (e: CustomEvent) => {
      console.log('[useWindowPricingEvents] Pricing event received:', e.detail);
      // Handle event in UI components
    };

    window.addEventListener('pricing:event', handlePricingEvent as EventListener);

    return () => {
      window.removeEventListener('pricing:event', handlePricingEvent as EventListener);
    };
  }, []);
}
