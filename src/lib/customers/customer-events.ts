// Customer Events System
// Event-driven customer lifecycle management

import type { Customer } from './customer-types';

// ============================================
// CUSTOMER EVENT TYPES
// ============================================

export type CustomerEventType =
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'customer.churned'
  | 'customer.reactivated'
  | 'customer.blocked'
  | 'customer.unblocked'
  | 'customer.payment.success'
  | 'customer.payment.failed'
  | 'customer.subscription.created'
  | 'customer.subscription.cancelled'
  | 'customer.license.issued'
  | 'customer.license.revoked';

// ============================================
// CUSTOMER EVENT
// ============================================

export interface CustomerEvent {
  type: CustomerEventType;
  data: {
    customerId?: string;
    customerEmail?: string;
    customerName?: string;
    amount?: number;
    currency?: string;
    subscriptionId?: string;
    licenseId?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

// ============================================
// CUSTOMER EVENT LISTENER
// ============================================

export type CustomerEventListener = (event: CustomerEvent) => void | Promise<void>;

// ============================================
// CUSTOMER EVENT BUS
// ============================================

export class CustomerEventBus {
  private listeners: Map<CustomerEventType, Set<CustomerEventListener>> = new Map();
  private eventHistory: CustomerEvent[] = [];
  private maxHistorySize: number = 1000;

  // ============================================
  // SUBSCRIBE TO EVENT
  // ============================================

  on(eventType: CustomerEventType, listener: CustomerEventListener): () => void {
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

  off(eventType: CustomerEventType, listener: CustomerEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // ============================================
  // EMIT EVENT
  // ============================================

  async emit(event: CustomerEvent): Promise<void> {
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
          console.error(`[CustomerEventBus] Error in listener for ${event.type}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    // Log event
    console.log(`[CustomerEventBus] Event emitted: ${event.type}`, event);
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getHistory(eventType?: CustomerEventType, limit?: number): CustomerEvent[] {
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

  clearListeners(eventType?: CustomerEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const customerEventBus = new CustomerEventBus();

// ============================================
// CUSTOMER EVENT EMITTER
// ============================================

export class CustomerEventEmitter {
  // ============================================
  // EMIT CUSTOMER CREATED EVENT
  // ============================================

  async emitCustomerCreated(customer: Customer, userId?: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.created',
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: customer.tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT CUSTOMER UPDATED EVENT
  // ============================================

  async emitCustomerUpdated(customer: Customer, userId?: string, changes?: Record<string, unknown>): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.updated',
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name,
        ...changes,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: customer.tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT CUSTOMER DELETED EVENT
  // ============================================

  async emitCustomerDeleted(customerId: string, customerEmail: string, tenantId: string, userId?: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.deleted',
      data: {
        customerId,
        customerEmail,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT CUSTOMER CHURNED EVENT
  // ============================================

  async emitCustomerChurned(customer: Customer, userId?: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.churned',
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name,
        ltv: customer.ltv,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: customer.tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT CUSTOMER REACTIVATED EVENT
  // ============================================

  async emitCustomerReactivated(customer: Customer, userId?: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.reactivated',
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: customer.tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT CUSTOMER BLOCKED EVENT
  // ============================================

  async emitCustomerBlocked(customer: Customer, userId?: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.blocked',
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: customer.tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT CUSTOMER UNBLOCKED EVENT
  // ============================================

  async emitCustomerUnblocked(customer: Customer, userId?: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.unblocked',
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: customer.tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT PAYMENT SUCCESS EVENT
  // ============================================

  async emitPaymentSuccess(customerId: string, customerEmail: string, amount: number, currency: string, tenantId: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.payment.success',
      data: {
        customerId,
        customerEmail,
        amount,
        currency,
      },
      timestamp: new Date().toISOString(),
      tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT PAYMENT FAILED EVENT
  // ============================================

  async emitPaymentFailed(customerId: string, customerEmail: string, amount: number, currency: string, tenantId: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.payment.failed',
      data: {
        customerId,
        customerEmail,
        amount,
        currency,
      },
      timestamp: new Date().toISOString(),
      tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION CREATED EVENT
  // ============================================

  async emitSubscriptionCreated(customerId: string, customerEmail: string, subscriptionId: string, tenantId: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.subscription.created',
      data: {
        customerId,
        customerEmail,
        subscriptionId,
      },
      timestamp: new Date().toISOString(),
      tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT SUBSCRIPTION CANCELLED EVENT
  // ============================================

  async emitSubscriptionCancelled(customerId: string, customerEmail: string, subscriptionId: string, tenantId: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.subscription.cancelled',
      data: {
        customerId,
        customerEmail,
        subscriptionId,
      },
      timestamp: new Date().toISOString(),
      tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE ISSUED EVENT
  // ============================================

  async emitLicenseIssued(customerId: string, customerEmail: string, licenseId: string, tenantId: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.license.issued',
      data: {
        customerId,
        customerEmail,
        licenseId,
      },
      timestamp: new Date().toISOString(),
      tenantId,
    };

    await customerEventBus.emit(event);
  }

  // ============================================
  // EMIT LICENSE REVOKED EVENT
  // ============================================

  async emitLicenseRevoked(customerId: string, customerEmail: string, licenseId: string, tenantId: string): Promise<void> {
    const event: CustomerEvent = {
      type: 'customer.license.revoked',
      data: {
        customerId,
        customerEmail,
        licenseId,
      },
      timestamp: new Date().toISOString(),
      tenantId,
    };

    await customerEventBus.emit(event);
  }
}

// Export singleton instance
export const customerEventEmitter = new CustomerEventEmitter();

// ============================================
// REACT HOOK FOR CUSTOMER EVENTS
// ============================================

import { useEffect, useCallback } from 'react';

export function useCustomerEvents() {
  const subscribe = useCallback((eventType: CustomerEventType, listener: CustomerEventListener) => {
    return customerEventBus.on(eventType, listener);
  }, []);

  const getHistory = useCallback((eventType?: CustomerEventType, limit?: number) => {
    return customerEventBus.getHistory(eventType, limit);
  }, []);

  return {
    subscribe,
    getHistory,
  };
}
