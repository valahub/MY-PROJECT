// Transaction Refund Engine
// createRefund, call provider, update original transaction

import type { Transaction, RefundRequest, RefundResult } from './transaction-types';
import { transactionStatusEngine } from './transaction-status';

// ============================================
// REFUND ENGINE
// ============================================

export class RefundEngine {
  private transactions: Map<string, Transaction> = new Map();

  // ============================================
  // CREATE REFUND
  // ============================================

  async createRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      const originalTransaction = this.transactions.get(request.transactionId);

      if (!originalTransaction) {
        return {
          success: false,
          refundTransaction: null,
          originalTransaction: null,
          error: 'Original transaction not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Check if transaction can be refunded
      if (!transactionStatusEngine.canBeRefunded(originalTransaction.status)) {
        return {
          success: false,
          refundTransaction: null,
          originalTransaction,
          error: `Transaction with status ${originalTransaction.status} cannot be refunded`,
          timestamp: new Date().toISOString(),
        };
      }

      // Check if already refunded
      if (originalTransaction.status === 'refunded') {
        return {
          success: false,
          refundTransaction: null,
          originalTransaction,
          error: 'Transaction already refunded',
          timestamp: new Date().toISOString(),
        };
      }

      // Determine refund amount
      const refundAmount = request.amount || originalTransaction.amount;

      // Check if refund amount is valid
      if (refundAmount > originalTransaction.amount) {
        return {
          success: false,
          refundTransaction: null,
          originalTransaction,
          error: 'Refund amount cannot exceed original transaction amount',
          timestamp: new Date().toISOString(),
        };
      }

      // Call payment provider to create refund
      const providerResult = await this.callProviderRefund(originalTransaction, refundAmount, request.reason);

      if (!providerResult.success) {
        return {
          success: false,
          refundTransaction: null,
          originalTransaction,
          error: providerResult.error || 'Provider refund failed',
          timestamp: new Date().toISOString(),
        };
      }

      // Create refund transaction
      const refundTransaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: originalTransaction.customerId,
        subscriptionId: originalTransaction.subscriptionId,
        type: 'refund',
        amount: refundAmount,
        currency: originalTransaction.currency,
        status: 'completed',
        paymentMethod: originalTransaction.paymentMethod,
        provider: originalTransaction.provider,
        providerTxnId: providerResult.providerRefundId || '',
        metadata: {
          originalTransactionId: originalTransaction.id,
          originalProviderTxnId: originalTransaction.providerTxnId,
          reason: request.reason,
          userId: request.userId,
        },
        fraudRisk: 'low',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId: originalTransaction.tenantId,
      };

      // Update original transaction status
      const newStatus = transactionStatusEngine.transition(originalTransaction.status, 'refunded');
      originalTransaction.status = newStatus;
      originalTransaction.updatedAt = new Date().toISOString();
      originalTransaction.metadata = {
        ...originalTransaction.metadata,
        refundTransactionId: refundTransaction.id,
        refundAmount,
        refundReason: request.reason,
        refundedAt: new Date().toISOString(),
      };

      // Register both transactions
      this.transactions.set(refundTransaction.id, refundTransaction);
      this.transactions.set(originalTransaction.id, originalTransaction);

      console.log(`[RefundEngine] Refund created: ${refundTransaction.id} for original transaction ${originalTransaction.id}`);

      return {
        success: true,
        refundTransaction,
        originalTransaction,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        refundTransaction: null,
        originalTransaction: this.transactions.get(request.transactionId) || null,
        error: error instanceof Error ? error.message : 'Failed to create refund',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // CALL PROVIDER REFUND
  // ============================================

  private async callProviderRefund(
    transaction: Transaction,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; providerRefundId?: string; error?: string }> {
    // In production, call Stripe/Razorpay API to create refund
    console.log(`[RefundEngine] Calling provider ${transaction.provider} to refund ${amount} ${transaction.currency}`);

    // Placeholder - return success
    return {
      success: true,
      providerRefundId: `refund_${Date.now()}`,
    };
  }

  // ============================================
  // GET REFUND HISTORY
  // ============================================

  getRefundHistory(transactionId: string): Transaction[] {
    const refunds: Transaction[] = [];

    for (const transaction of this.transactions.values()) {
      if (transaction.type === 'refund' && transaction.metadata.originalTransactionId === transactionId) {
        refunds.push(transaction);
      }
    }

    return refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ============================================
  // GET TOTAL REFUNDED AMOUNT
  // ============================================

  getTotalRefundedAmount(transactionId: string): number {
    const refunds = this.getRefundHistory(transactionId);
    return refunds.reduce((total, refund) => total + refund.amount, 0);
  }

  // ============================================
  // CAN BE PARTIALLY REFUNDED
  // ============================================

  canBePartiallyRefunded(transactionId: string): boolean {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== 'completed') {
      return false;
    }

    const totalRefunded = this.getTotalRefundedAmount(transactionId);
    return totalRefunded < transaction.amount;
  }

  // ============================================
  // GET REMAINING REFUNDABLE AMOUNT
  // ============================================

  getRemainingRefundableAmount(transactionId: string): number {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return 0;
    }

    const totalRefunded = this.getTotalRefundedAmount(transactionId);
    return Math.max(0, transaction.amount - totalRefunded);
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
export const refundEngine = new RefundEngine();

// ============================================
// REACT HOOK FOR REFUND ENGINE
// ============================================

import { useState, useCallback } from 'react';

export function useRefund() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRefund = useCallback(async (request: RefundRequest) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await refundEngine.createRefund(request);
      if (!result.success) {
        setError(result.error || 'Failed to create refund');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create refund';
      setError(errorMessage);
      return {
        success: false,
        refundTransaction: null,
        originalTransaction: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getRefundHistory = useCallback((transactionId: string) => {
    return refundEngine.getRefundHistory(transactionId);
  }, []);

  const getTotalRefundedAmount = useCallback((transactionId: string) => {
    return refundEngine.getTotalRefundedAmount(transactionId);
  }, []);

  const canBePartiallyRefunded = useCallback((transactionId: string) => {
    return refundEngine.canBePartiallyRefunded(transactionId);
  }, []);

  const getRemainingRefundableAmount = useCallback((transactionId: string) => {
    return refundEngine.getRemainingRefundableAmount(transactionId);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    createRefund,
    getRefundHistory,
    getTotalRefundedAmount,
    canBePartiallyRefunded,
    getRemainingRefundableAmount,
    clearError,
  };
}
