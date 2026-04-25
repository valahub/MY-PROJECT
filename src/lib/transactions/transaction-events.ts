// Transaction Events System
// transaction.updated for real-time UI updates

import type { Transaction, TransactionEvent, TransactionEventType } from './transaction-types';

// ============================================
// TRANSACTION EVENT LISTENER
// ============================================

export type TransactionEventListener = (event: TransactionEvent) => void | Promise<void>;

// ============================================
// TRANSACTION EVENT BUS
// ============================================

export class TransactionEventBus {
  private listeners: Map<TransactionEventType, Set<TransactionEventListener>> = new Map();
  private eventHistory: TransactionEvent[] = [];
  private maxHistorySize: number = 1000;

  // ============================================
  // SUBSCRIBE TO EVENT
  // ============================================

  on(eventType: TransactionEventType, listener: TransactionEventListener): () => void {
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

  off(eventType: TransactionEventType, listener: TransactionEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // ============================================
  // EMIT EVENT
  // ============================================

  async emit(event: TransactionEvent): Promise<void> {
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
          console.error(`[TransactionEventBus] Error in listener for ${event.type}:`, error);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
    }

    // Log event
    console.log(`[TransactionEventBus] Event emitted: ${event.type}`, event);
  }

  // ============================================
  // GET EVENT HISTORY
  // ============================================

  getHistory(eventType?: TransactionEventType, limit?: number): TransactionEvent[] {
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

  clearListeners(eventType?: TransactionEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Export singleton instance
export const transactionEventBus = new TransactionEventBus();

// ============================================
// TRANSACTION EVENT EMITTER
// ============================================

export class TransactionEventEmitter {
  // ============================================
  // EMIT TRANSACTION CREATED EVENT
  // ============================================

  async emitTransactionCreated(transaction: Transaction, userId?: string): Promise<void> {
    const event: TransactionEvent = {
      type: 'transaction.created',
      data: {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        providerTxnId: transaction.providerTxnId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: transaction.tenantId,
    };

    await transactionEventBus.emit(event);
  }

  // ============================================
  // EMIT TRANSACTION PENDING EVENT
  // ============================================

  async emitTransactionPending(transaction: Transaction, userId?: string): Promise<void> {
    const event: TransactionEvent = {
      type: 'transaction.pending',
      data: {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        providerTxnId: transaction.providerTxnId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: transaction.tenantId,
    };

    await transactionEventBus.emit(event);
  }

  // ============================================
  // EMIT TRANSACTION COMPLETED EVENT
  // ============================================

  async emitTransactionCompleted(transaction: Transaction, userId?: string): Promise<void> {
    const event: TransactionEvent = {
      type: 'transaction.completed',
      data: {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        providerTxnId: transaction.providerTxnId,
        amount: transaction.amount,
        currency: transaction.currency,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: transaction.tenantId,
    };

    await transactionEventBus.emit(event);
  }

  // ============================================
  // EMIT TRANSACTION FAILED EVENT
  // ============================================

  async emitTransactionFailed(transaction: Transaction, userId?: string): Promise<void> {
    const event: TransactionEvent = {
      type: 'transaction.failed',
      data: {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        providerTxnId: transaction.providerTxnId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: transaction.tenantId,
    };

    await transactionEventBus.emit(event);
  }

  // ============================================
  // EMIT TRANSACTION REFUNDED EVENT
  // ============================================

  async emitTransactionRefunded(transaction: Transaction, userId?: string): Promise<void> {
    const event: TransactionEvent = {
      type: 'transaction.refunded',
      data: {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        providerTxnId: transaction.providerTxnId,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: transaction.tenantId,
    };

    await transactionEventBus.emit(event);
  }

  // ============================================
  // EMIT TRANSACTION FRAUD FLAGGED EVENT
  // ============================================

  async emitTransactionFraudFlagged(transaction: Transaction, userId?: string): Promise<void> {
    const event: TransactionEvent = {
      type: 'transaction.fraud_flagged',
      data: {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        fraudRisk: transaction.fraudRisk,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: transaction.tenantId,
    };

    await transactionEventBus.emit(event);
  }

  // ============================================
  // EMIT TRANSACTION STATUS CHANGED EVENT
  // ============================================

  async emitTransactionStatusChanged(
    transaction: Transaction,
    previousStatus: string,
    userId?: string
  ): Promise<void> {
    const event: TransactionEvent = {
      type: 'transaction.status_changed',
      data: {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        previousStatus,
        newStatus: transaction.status,
      },
      timestamp: new Date().toISOString(),
      userId,
      tenantId: transaction.tenantId,
    };

    await transactionEventBus.emit(event);
  }
}

// Export singleton instance
export const transactionEventEmitter = new TransactionEventEmitter();

// ============================================
// REACT HOOK FOR TRANSACTION EVENTS
// ============================================

import { useEffect, useCallback } from 'react';

export function useTransactionEvents() {
  const subscribe = useCallback((eventType: TransactionEventType, listener: TransactionEventListener) => {
    return transactionEventBus.on(eventType, listener);
  }, []);

  const getHistory = useCallback((eventType?: TransactionEventType, limit?: number) => {
    return transactionEventBus.getHistory(eventType, limit);
  }, []);

  return {
    subscribe,
    getHistory,
  };
}
