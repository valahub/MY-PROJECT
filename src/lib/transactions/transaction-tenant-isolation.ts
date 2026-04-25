// Transaction Tenant Isolation
// WHERE tenant_id = current_user - Block cross-tenant access

import type { Transaction } from './transaction-types';

// ============================================
// TENANT ISOLATION RESULT
// ============================================

export interface TenantIsolationResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

// ============================================
// TENANT ISOLATION MANAGER
// ============================================

export class TenantIsolationManager {
  // ============================================
  // VALIDATE TENANT ACCESS
  // ============================================

  validateTenantAccess(transaction: Transaction, userTenantId: string): TenantIsolationResult {
    if (transaction.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Transaction does not belong to this tenant',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // FILTER BY TENANT
  // ============================================

  filterByTenant(transactions: Transaction[], tenantId: string): Transaction[] {
    return transactions.filter((transaction) => transaction.tenantId === tenantId);
  }

  // ============================================
  // FILTER BY TENANT AND TYPE
  // ============================================

  filterByTenantAndType(
    transactions: Transaction[],
    tenantId: string,
    type?: 'payment' | 'refund'
  ): Transaction[] {
    let filtered = this.filterByTenant(transactions, tenantId);

    if (type) {
      filtered = filtered.filter((transaction) => transaction.type === type);
    }

    return filtered;
  }

  // ============================================
  // FILTER BY TENANT AND STATUS
  // ============================================

  filterByTenantAndStatus(
    transactions: Transaction[],
    tenantId: string,
    status?: string
  ): Transaction[] {
    let filtered = this.filterByTenant(transactions, tenantId);

    if (status) {
      filtered = filtered.filter((transaction) => transaction.status === status);
    }

    return filtered;
  }

  // ============================================
  // VALIDATE BATCH TENANT ACCESS
  // ============================================

  validateBatchTenantAccess(transactions: Transaction[], userTenantId: string): {
    valid: Transaction[];
    invalid: Array<{ transaction: Transaction; error: string }>;
  } {
    const valid: Transaction[] = [];
    const invalid: Array<{ transaction: Transaction; error: string }> = [];

    for (const transaction of transactions) {
      const result = this.validateTenantAccess(transaction, userTenantId);

      if (result.success) {
        valid.push(transaction);
      } else {
        invalid.push({
          transaction,
          error: result.error || 'Access denied',
        });
      }
    }

    return { valid, invalid };
  }

  // ============================================
  // CHECK CROSS_TENANT ATTEMPT
  // ============================================

  checkCrossTenantAttempt(transactionId: string, userTenantId: string, transactionTenantId: string): boolean {
    return transactionTenantId !== userTenantId;
  }

  // ============================================
  // LOG CROSS_TENANT ATTEMPT
  // ============================================

  logCrossTenantAttempt(
    transactionId: string,
    userTenantId: string,
    transactionTenantId: string,
    userId: string
  ): void {
    console.error(
      `[TenantIsolation] Cross-tenant access attempt detected: User ${userId} (tenant: ${userTenantId}) tried to access transaction ${transactionId} (tenant: ${transactionTenantId})`
    );
  }

  // ============================================
  // SANITIZE TRANSACTION FOR LOGGING
  // ============================================

  sanitizeTransactionForLogging(transaction: Transaction): Record<string, unknown> {
    return {
      id: transaction.id,
      customerId: transaction.customerId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      provider: transaction.provider,
      providerTxnId: transaction.providerTxnId,
      // tenantId included for audit purposes
      tenantId: transaction.tenantId,
    };
  }

  // ============================================
  // VALIDATE TENANT FOR CREATE
  // ============================================

  validateTenantForCreate(userTenantId: string, requestTenantId: string): TenantIsolationResult {
    if (userTenantId !== requestTenantId) {
      return {
        success: false,
        error: 'Cannot create transaction for different tenant',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // VALIDATE TENANT FOR UPDATE
  // ============================================

  validateTenantForUpdate(transaction: Transaction, userTenantId: string): TenantIsolationResult {
    return this.validateTenantAccess(transaction, userTenantId);
  }

  // ============================================
  // VALIDATE TENANT FOR DELETE
  // ============================================

  validateTenantForDelete(transaction: Transaction, userTenantId: string): TenantIsolationResult {
    return this.validateTenantAccess(transaction, userTenantId);
  }

  // ============================================
  // GET TENANT SUMMARY
  // ============================================

  getTenantSummary(transactions: Transaction[], tenantId: string): {
    totalTransactions: number;
    paymentTransactions: number;
    refundTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    refundedTransactions: number;
    totalAmount: number;
  } {
    const tenantTransactions = this.filterByTenant(transactions, tenantId);

    return {
      totalTransactions: tenantTransactions.length,
      paymentTransactions: tenantTransactions.filter((t) => t.type === 'payment').length,
      refundTransactions: tenantTransactions.filter((t) => t.type === 'refund').length,
      completedTransactions: tenantTransactions.filter((t) => t.status === 'completed').length,
      failedTransactions: tenantTransactions.filter((t) => t.status === 'failed').length,
      pendingTransactions: tenantTransactions.filter((t) => t.status === 'pending').length,
      refundedTransactions: tenantTransactions.filter((t) => t.status === 'refunded').length,
      totalAmount: tenantTransactions.reduce((sum, t) => sum + t.amount, 0),
    };
  }

  // ============================================
  // CHECK TENANT QUOTA
  // ============================================

  checkTenantQuota(transactions: Transaction[], tenantId: string, maxTransactions: number): {
    hasQuota: boolean;
    currentCount: number;
    remainingQuota: number;
  } {
    const tenantTransactions = this.filterByTenant(transactions, tenantId);
    const currentCount = tenantTransactions.length;
    const remainingQuota = maxTransactions - currentCount;

    return {
      hasQuota: currentCount < maxTransactions,
      currentCount,
      remainingQuota,
    };
  }
}

// Export singleton instance
export const tenantIsolationManager = new TenantIsolationManager();

// ============================================
// REACT HOOK FOR TENANT ISOLATION
// ============================================

import { useCallback } from 'react';

export function useTenantIsolation() {
  const validateTenantAccess = useCallback((transaction: Transaction, userTenantId: string) => {
    return tenantIsolationManager.validateTenantAccess(transaction, userTenantId);
  }, []);

  const filterByTenant = useCallback((transactions: Transaction[], tenantId: string) => {
    return tenantIsolationManager.filterByTenant(transactions, tenantId);
  }, []);

  const filterByTenantAndType = useCallback((transactions: Transaction[], tenantId: string, type?: 'payment' | 'refund') => {
    return tenantIsolationManager.filterByTenantAndType(transactions, tenantId, type);
  }, []);

  const filterByTenantAndStatus = useCallback((transactions: Transaction[], tenantId: string, status?: string) => {
    return tenantIsolationManager.filterByTenantAndStatus(transactions, tenantId, status);
  }, []);

  const validateBatchTenantAccess = useCallback((transactions: Transaction[], userTenantId: string) => {
    return tenantIsolationManager.validateBatchTenantAccess(transactions, userTenantId);
  }, []);

  const validateTenantForCreate = useCallback((userTenantId: string, requestTenantId: string) => {
    return tenantIsolationManager.validateTenantForCreate(userTenantId, requestTenantId);
  }, []);

  const getTenantSummary = useCallback((transactions: Transaction[], tenantId: string) => {
    return tenantIsolationManager.getTenantSummary(transactions, tenantId);
  }, []);

  const checkTenantQuota = useCallback((transactions: Transaction[], tenantId: string, maxTransactions: number) => {
    return tenantIsolationManager.checkTenantQuota(transactions, tenantId, maxTransactions);
  }, []);

  return {
    validateTenantAccess,
    filterByTenant,
    filterByTenantAndType,
    filterByTenantAndStatus,
    validateBatchTenantAccess,
    validateTenantForCreate,
    getTenantSummary,
    checkTenantQuota,
  };
}
