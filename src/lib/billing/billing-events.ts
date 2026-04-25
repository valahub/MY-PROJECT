// Billing Event System
// Event-driven billing cycle and payment failure handling

import type { Invoice } from './invoice-types';

// ============================================
// BILLING EVENT TYPES
// ============================================

export type BillingEventType =
  | 'subscription.billing_cycle'
  | 'payment.failed'
  | 'payment.success'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.overdue'
  | 'dunning.attempt'
  | 'dunning.suspended'
  | 'dunning.recovered';

// ============================================
// BILLING EVENT
// ============================================

export interface BillingEvent {
  type: BillingEventType;
  data: {
    invoiceId?: string;
    customerId?: string;
    subscriptionId?: string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  userId?: string;
}

// ============================================
// BILLING EVENT LISTENER
// ============================================

export type BillingEventListener = (event: BillingEvent) => void | Promise<void>;

// ============================================
// BILLING EVENT BUS
// ============================================

export class BillingEventBus {
  private listeners: Map<BillingEventType, Set<BillingEventListener>> = new Map();
  private eventHistory: BillingEvent[] = [];
  private maxHistorySize: number = 1000;

  // ============================================
  // SUBSCRIBE TO EVENT
  // ============================================

  on(eventType: BillingEventType, listener: BillingEventListener): () => void {
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

  off(eventType: BillingEventType, listener: BillingEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // ============================================
  // EMIT EVENT
  // ============================================

  async emit(event: BillingEvent): Promise<void> {
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
          console.error(`[BillingEventBus] Error in listener for ${event.type}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    // Log event
    console.log(`[BillingEventBus] Event emitted: ${event.type}`, event);
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getHistory(eventType?: BillingEventType, limit?: number): BillingEvent[] {
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

  clearListeners(eventType?: BillingEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const billingEventBus = new BillingEventBus();

// ============================================
// BILLING EVENT EMITTER
// ============================================

export class BillingEventEmitter {
  // ============================================
  // EMIT BILLING CYCLE EVENT
  // ============================================

  async emitBillingCycle(subscriptionId: string, customerId: string, amount: number, currency: string): Promise<void> {
    const event: BillingEvent = {
      type: 'subscription.billing_cycle',
      data: {
        subscriptionId,
        customerId,
        amount,
        currency,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }

  // ============================================
  // EMIT PAYMENT FAILED EVENT
  // ============================================

  async emitPaymentFailed(invoiceId: string, customerId: string, subscriptionId: string, amount: number, currency: string, errorMessage?: string): Promise<void> {
    const event: BillingEvent = {
      type: 'payment.failed',
      data: {
        invoiceId,
        customerId,
        subscriptionId,
        amount,
        currency,
        errorMessage,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }

  // ============================================
  // EMIT PAYMENT SUCCESS EVENT
  // ============================================

  async emitPaymentSuccess(invoiceId: string, customerId: string, subscriptionId: string, amount: number, currency: string): Promise<void> {
    const event: BillingEvent = {
      type: 'payment.success',
      data: {
        invoiceId,
        customerId,
        subscriptionId,
        amount,
        currency,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }

  // ============================================
  // EMIT INVOICE CREATED EVENT
  // ============================================

  async emitInvoiceCreated(invoice: Invoice): Promise<void> {
    const event: BillingEvent = {
      type: 'invoice.created',
      data: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        subscriptionId: invoice.subscriptionId,
        amount: invoice.amount,
        currency: invoice.currency,
        invoiceNumber: invoice.invoiceNumber,
        dueDate: invoice.dueDate,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }

  // ============================================
  // EMIT INVOICE PAID EVENT
  // ============================================

  async emitInvoicePaid(invoice: Invoice): Promise<void> {
    const event: BillingEvent = {
      type: 'invoice.paid',
      data: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        subscriptionId: invoice.subscriptionId,
        amount: invoice.amount,
        currency: invoice.currency,
        paidAt: invoice.paidAt,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }

  // ============================================
  // EMIT INVOICE OVERDUE EVENT
  // ============================================

  async emitInvoiceOverdue(invoice: Invoice): Promise<void> {
    const event: BillingEvent = {
      type: 'invoice.overdue',
      data: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        subscriptionId: invoice.subscriptionId,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        retryCount: invoice.retryCount,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }

  // ============================================
  // EMIT DUNNING ATTEMPT EVENT
  // ============================================

  async emitDunningAttempt(invoiceId: string, customerId: string, attemptNumber: number, action: string): Promise<void> {
    const event: BillingEvent = {
      type: 'dunning.attempt',
      data: {
        invoiceId,
        customerId,
        attemptNumber,
        action,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }

  // ============================================
  // EMIT DUNNING SUSPENDED EVENT
  // ============================================

  async emitDunningSuspended(invoiceId: string, customerId: string, subscriptionId: string): Promise<void> {
    const event: BillingEvent = {
      type: 'dunning.suspended',
      data: {
        invoiceId,
        customerId,
        subscriptionId,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }

  // ============================================
  // EMIT DUNNING RECOVERED EVENT
  // ============================================

  async emitDunningRecovered(invoiceId: string, customerId: string, subscriptionId: string, amount: number, currency: string): Promise<void> {
    const event: BillingEvent = {
      type: 'dunning.recovered',
      data: {
        invoiceId,
        customerId,
        subscriptionId,
        amount,
        currency,
      },
      timestamp: new Date().toISOString(),
    };

    await billingEventBus.emit(event);
  }
}

// Export singleton instance
export const billingEventEmitter = new BillingEventEmitter();

// ============================================
// REACT HOOK FOR BILLING EVENTS
// ============================================

import { useEffect, useCallback } from 'react';

export function useBillingEvents() {
  const subscribe = useCallback(
    (eventType: BillingEventType, listener: BillingEventListener) => {
      return billingEventBus.on(eventType, listener);
    },
    []
  );

  const getHistory = useCallback((eventType?: BillingEventType, limit?: number) => {
    return billingEventBus.getHistory(eventType, limit);
  }, []);

  return {
    subscribe,
    getHistory,
  };
}
