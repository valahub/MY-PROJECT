// Checkout Link Events System
// checkout.updated for real-time UI updates

import type { CheckoutLink, CheckoutLinkEvent, CheckoutLinkEventType } from './checkout-link-types';

// ============================================
// CHECKOUT LINK EVENT LISTENER
// ============================================

export type CheckoutLinkEventListener = (event: CheckoutLinkEvent) => void | Promise<void>;

// ============================================
// CHECKOUT LINK EVENT BUS
// ============================================

export class CheckoutLinkEventBus {
  private listeners: Map<CheckoutLinkEventType, Set<CheckoutLinkEventListener>> = new Map();
  private eventHistory: CheckoutLinkEvent[] = [];
  private maxHistorySize: number = 1000;

  // ============================================
  // SUBSCRIBE TO EVENT
  // ============================================

  on(eventType: CheckoutLinkEventType, listener: CheckoutLinkEventListener): () => void {
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

  off(eventType: CheckoutLinkEventType, listener: CheckoutLinkEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // ============================================
  // EMIT EVENT
  // ============================================

  async emit(event: CheckoutLinkEvent): Promise<void> {
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
          console.error(`[CheckoutLinkEventBus] Error in listener for ${event.type}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    // Log event
    console.log(`[CheckoutLinkEventBus] Event emitted: ${event.type}`, event);
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getHistory(eventType?: CheckoutLinkEventType, limit?: number): CheckoutLinkEvent[] {
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

  clearListeners(eventType?: CheckoutLinkEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const checkoutLinkEventBus = new CheckoutLinkEventBus();

// ============================================
// CHECKOUT LINK EVENT EMITTER
// ============================================

export class CheckoutLinkEventEmitter {
  // ============================================
  // EMIT CHECKOUT LINK CREATED EVENT
  // ============================================

  async emitCheckoutLinkCreated(checkoutLink: CheckoutLink, userId?: string): Promise<void> {
    const event: CheckoutLinkEvent = {
      type: 'checkout_link.created',
      data: {
        checkoutLinkId: checkoutLink.id,
        slug: checkoutLink.slug,
        productId: checkoutLink.productId,
        pricingId: checkoutLink.pricingId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: checkoutLink.tenantId,
    };

    await checkoutLinkEventBus.emit(event);
  }

  // ============================================
  // EMIT CHECKOUT LINK UPDATED EVENT
  // ============================================

  async emitCheckoutLinkUpdated(checkoutLink: CheckoutLink, userId?: string): Promise<void> {
    const event: CheckoutLinkEvent = {
      type: 'checkout_link.updated',
      data: {
        checkoutLinkId: checkoutLink.id,
        slug: checkoutLink.slug,
        productId: checkoutLink.productId,
        pricingId: checkoutLink.pricingId,
        status: checkoutLink.status,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: checkoutLink.tenantId,
    };

    await checkoutLinkEventBus.emit(event);
  }

  // ============================================
  // EMIT CHECKOUT LINK ACTIVATED EVENT
  // ============================================

  async emitCheckoutLinkActivated(checkoutLink: CheckoutLink, userId?: string): Promise<void> {
    const event: CheckoutLinkEvent = {
      type: 'checkout_link.activated',
      data: {
        checkoutLinkId: checkoutLink.id,
        slug: checkoutLink.slug,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: checkoutLink.tenantId,
    };

    await checkoutLinkEventBus.emit(event);
  }

  // ============================================
  // EMIT CHECKOUT LINK DEACTIVATED EVENT
  // ============================================

  async emitCheckoutLinkDeactivated(checkoutLink: CheckoutLink, userId?: string): Promise<void> {
    const event: CheckoutLinkEvent = {
      type: 'checkout_link.deactivated',
      data: {
        checkoutLinkId: checkoutLink.id,
        slug: checkoutLink.slug,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: checkoutLink.tenantId,
    };

    await checkoutLinkEventBus.emit(event);
  }

  // ============================================
  // EMIT CHECKOUT LINK EXPIRED EVENT
  // ============================================

  async emitCheckoutLinkExpired(checkoutLink: CheckoutLink): Promise<void> {
    const event: CheckoutLinkEvent = {
      type: 'checkout_link.expired',
      data: {
        checkoutLinkId: checkoutLink.id,
        slug: checkoutLink.slug,
      },
      timestamp: new Date().toISOString(),
      tenantId: checkoutLink.tenantId,
    };

    await checkoutLinkEventBus.emit(event);
  }

  // ============================================
  // EMIT CHECKOUT VIEWED EVENT
  // ============================================

  async emitCheckoutViewed(checkoutLink: CheckoutLink): Promise<void> {
    const event: CheckoutLinkEvent = {
      type: 'checkout_link.viewed',
      data: {
        checkoutLinkId: checkoutLink.id,
        slug: checkoutLink.slug,
      },
      timestamp: new Date().toISOString(),
      tenantId: checkoutLink.tenantId,
    };

    await checkoutLinkEventBus.emit(event);
  }

  // ============================================
  // EMIT CHECKOUT CONVERTED EVENT
  // ============================================

  async emitCheckoutConverted(checkoutLink: CheckoutLink): Promise<void> {
    const event: CheckoutLinkEvent = {
      type: 'checkout_link.converted',
      data: {
        checkoutLinkId: checkoutLink.id,
        slug: checkoutLink.slug,
      },
      timestamp: new Date().toISOString(),
      tenantId: checkoutLink.tenantId,
    };

    await checkoutLinkEventBus.emit(event);
  }
}

// Export singleton instance
export const checkoutLinkEventEmitter = new CheckoutLinkEventEmitter();

// ============================================
// REACT HOOK FOR CHECKOUT LINK EVENTS
// ============================================

import { useEffect, useCallback } from 'react';

export function useCheckoutLinkEvents() {
  const subscribe = useCallback((eventType: CheckoutLinkEventType, listener: CheckoutLinkEventListener) => {
    return checkoutLinkEventBus.on(eventType, listener);
  }, []);

  const getHistory = useCallback((eventType?: CheckoutLinkEventType, limit?: number) => {
    return checkoutLinkEventBus.getHistory(eventType, limit);
  }, []);

  return {
    subscribe,
    getHistory,
  };
}
