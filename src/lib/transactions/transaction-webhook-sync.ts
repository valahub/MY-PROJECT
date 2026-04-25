// Transaction Webhook Sync Engine
// payment.success → completed, payment.failed → failed, refund.created → refunded

import type { Transaction, TransactionStatus } from './transaction-types';
import { transactionStatusEngine } from './transaction-status';

// ============================================
// WEBHOOK SYNC RESULT
// ============================================

export interface WebhookSyncResult {
  success: boolean;
  transaction: Transaction | null;
  error?: string;
  timestamp: string;
}

// ============================================
// TRANSACTION WEBHOOK SYNC ENGINE
// ============================================

export class TransactionWebhookSyncEngine {
  private transactions: Map<string, Transaction> = new Map();

  // ============================================
  // PROCESS WEBHOOK EVENT
  // ============================================

  async processWebhookEvent(event: {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
  }): Promise<WebhookSyncResult> {
    try {
      console.log(`[TransactionWebhookSync] Processing event ${event.type}`);

      let transaction: Transaction | null = null;

      switch (event.type) {
        case 'payment.success':
          transaction = await this.handlePaymentSuccess(event);
          break;
        case 'payment.failed':
          transaction = await this.handlePaymentFailed(event);
          break;
        case 'refund.created':
          transaction = await this.handleRefundCreated(event);
          break;
        case 'payment.pending':
          transaction = await this.handlePaymentPending(event);
          break;
        default:
          console.log(`[TransactionWebhookSync] Unsupported event type: ${event.type}`);
          return {
            success: false,
            transaction: null,
            error: 'Unsupported event type',
            timestamp: new Date().toISOString(),
          };
      }

      if (transaction) {
        this.transactions.set(transaction.id, transaction);
      }

      return {
        success: true,
        transaction,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        transaction: null,
        error: error instanceof Error ? error.message : 'Failed to process webhook event',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // HANDLE PAYMENT SUCCESS
  // ============================================

  private async handlePaymentSuccess(event: { data: Record<string, unknown> }): Promise<Transaction | null> {
    const providerTxnId = event.data.provider_txn_id as string;
    const transaction = this.findTransactionByProviderId(providerTxnId);

    if (!transaction) {
      console.log(`[TransactionWebhookSync] Transaction not found for provider_txn_id: ${providerTxnId}`);
      return null;
    }

    // Transition to completed if currently pending
    if (transaction.status === 'pending') {
      const newStatus = transactionStatusEngine.transition(transaction.status, 'completed');
      transaction.status = newStatus;
      transaction.updatedAt = new Date().toISOString();

      console.log(`[TransactionWebhookSync] Payment success - transaction ${transaction.id} transitioned to completed`);
    }

    return transaction;
  }

  // ============================================
  // HANDLE PAYMENT FAILED
  // ============================================

  private async handlePaymentFailed(event: { data: Record<string, unknown> }): Promise<Transaction | null> {
    const providerTxnId = event.data.provider_txn_id as string;
    const transaction = this.findTransactionByProviderId(providerTxnId);

    if (!transaction) {
      console.log(`[TransactionWebhookSync] Transaction not found for provider_txn_id: ${providerTxnId}`);
      return null;
    }

    // Transition to failed if currently pending
    if (transaction.status === 'pending') {
      const newStatus = transactionStatusEngine.transition(transaction.status, 'failed');
      transaction.status = newStatus;
      transaction.updatedAt = new Date().toISOString();

      console.log(`[TransactionWebhookSync] Payment failed - transaction ${transaction.id} transitioned to failed`);
    }

    return transaction;
  }

  // ============================================
  // HANDLE REFUND CREATED
  // ============================================

  private async handleRefundCreated(event: { data: Record<string, unknown> }): Promise<Transaction | null> {
    const originalTxnId = event.data.original_txn_id as string;
    const originalTransaction = this.findTransactionById(originalTxnId);

    if (!originalTransaction) {
      console.log(`[TransactionWebhookSync] Original transaction not found: ${originalTxnId}`);
      return null;
    }

    // Transition original transaction to refunded
    if (originalTransaction.status === 'completed') {
      const newStatus = transactionStatusEngine.transition(originalTransaction.status, 'refunded');
      originalTransaction.status = newStatus;
      originalTransaction.updatedAt = new Date().toISOString();

      console.log(`[TransactionWebhookSync] Refund created - transaction ${originalTransaction.id} transitioned to refunded`);
    }

    return originalTransaction;
  }

  // ============================================
  // HANDLE PAYMENT PENDING
  // ============================================

  private async handlePaymentPending(event: { data: Record<string, unknown> }): Promise<Transaction | null> {
    const providerTxnId = event.data.provider_txn_id as string;
    const transaction = this.findTransactionByProviderId(providerTxnId);

    if (!transaction) {
      console.log(`[TransactionWebhookSync] Transaction not found for provider_txn_id: ${providerTxnId}`);
      return null;
    }

    // Ensure status is pending
    if (transaction.status !== 'pending') {
      transaction.status = 'pending';
      transaction.updatedAt = new Date().toISOString();

      console.log(`[TransactionWebhookSync] Payment pending - transaction ${transaction.id} set to pending`);
    }

    return transaction;
  }

  // ============================================
  // FIND TRANSACTION BY PROVIDER ID
  // ============================================

  private findTransactionByProviderId(providerTxnId: string): Transaction | null {
    for (const transaction of this.transactions.values()) {
      if (transaction.providerTxnId === providerTxnId) {
        return transaction;
      }
    }
    return null;
  }

  // ============================================
  // FIND TRANSACTION BY ID
  // ============================================

  private findTransactionById(transactionId: string): Transaction | null {
    return this.transactions.get(transactionId) || null;
  }

  // ============================================
  // REGISTER TRANSACTION
  // ============================================

  registerTransaction(transaction: Transaction): void {
    this.transactions.set(transaction.id, transaction);
  }

  // ============================================
  // UNREGISTER TRANSACTION
  // ============================================

  unregisterTransaction(transactionId: string): void {
    this.transactions.delete(transactionId);
  }

  // ============================================
  // GET TRANSACTION
  // ============================================

  getTransaction(transactionId: string): Transaction | null {
    return this.transactions.get(transactionId) || null;
  }

  // ============================================
  // GET ALL TRANSACTIONS
  // ============================================

  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
  }
}

// Export singleton instance
export const transactionWebhookSyncEngine = new TransactionWebhookSyncEngine();

// ============================================
// REACT HOOK FOR WEBHOOK SYNC
// ============================================

import { useState, useCallback } from 'react';

export function useTransactionWebhookSync() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processWebhookEvent = useCallback(async (event: {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
  }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await transactionWebhookSyncEngine.processWebhookEvent(event);
      if (!result.success) {
        setError(result.error || 'Failed to process webhook event');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process webhook event';
      setError(errorMessage);
      return {
        success: false,
        transaction: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    processWebhookEvent,
    clearError,
  };
}
