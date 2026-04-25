// Transaction Self-Healing Logic
// Status mismatch, missing txn, duplicate txn, pending > 10min

import type { Transaction, TransactionStatus } from './transaction-types';
import { transactionStatusEngine } from './transaction-status';

// ============================================
// SELF-HEAL RESULT
// ============================================

export interface SelfHealResult {
  success: boolean;
  transaction: Transaction;
  fixes: string[];
  issues: string[];
  timestamp: string;
}

// ============================================
// TRANSACTION SELF-HEALING ENGINE
// ============================================

export class TransactionSelfHealingEngine {
  private transactions: Map<string, Transaction> = new Map();
  private webhookLogs: Array<{ type: string; data: Record<string, unknown>; timestamp: string }> = [];

  // ============================================
  // HEAL TRANSACTION
  // ============================================

  async healTransaction(transaction: Transaction): Promise<SelfHealResult> {
    const fixes: string[] = [];
    const issues: string[] = [];
    const healedTransaction = { ...transaction };

    // 1. Fix status mismatch with provider
    const providerStatus = await this.fetchProviderStatus(healedTransaction);
    if (providerStatus && providerStatus !== healedTransaction.status) {
      try {
        const newStatus = transactionStatusEngine.transition(healedTransaction.status, providerStatus);
        healedTransaction.status = newStatus;
        healedTransaction.updatedAt = new Date().toISOString();
        fixes.push('Fixed status mismatch with provider');
      } catch {
        issues.push('Status mismatch but cannot transition');
      }
    }

    // 2. Fix pending transactions > 10 minutes
    if (healedTransaction.status === 'pending') {
      const pendingMinutes = this.getMinutesSince(healedTransaction.createdAt);
      if (pendingMinutes > 10) {
        // Recheck provider
        const recheckedStatus = await this.fetchProviderStatus(healedTransaction);
        if (recheckedStatus && recheckedStatus !== 'pending') {
          try {
            const newStatus = transactionStatusEngine.transition(healedTransaction.status, recheckedStatus);
            healedTransaction.status = newStatus;
            healedTransaction.updatedAt = new Date().toISOString();
            fixes.push('Auto-rechecked provider for pending > 10min');
          } catch {
            issues.push('Pending > 10min but cannot update status');
          }
        } else {
          issues.push('Pending > 10min and provider still pending');
        }
      }
    }

    // 3. Check for duplicate transactions
    const duplicates = this.findDuplicateTransactions(healedTransaction);
    if (duplicates.length > 0) {
      // Merge duplicates
      for (const duplicate of duplicates) {
        this.transactions.delete(duplicate.id);
      }
      healedTransaction.metadata = {
        ...healedTransaction.metadata,
        duplicateCount: duplicates.length,
        duplicateIds: duplicates.map((d) => d.id),
      };
      fixes.push(`Merged ${duplicates.length} duplicate transactions`);
    }

    healedTransaction.updatedAt = new Date().toISOString();

    const success = fixes.length > 0 || issues.length === 0;

    console.log(`[TransactionSelfHeal] Healed transaction ${transaction.id}: ${fixes.join(', ')}`);

    return {
      success,
      transaction: healedTransaction,
      fixes,
      issues,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BATCH HEAL TRANSACTIONS
  // ============================================

  async batchHealTransactions(transactions: Transaction[]): Promise<Map<string, SelfHealResult>> {
    const results = new Map<string, SelfHealResult>();

    for (const transaction of transactions) {
      const result = await this.healTransaction(transaction);
      results.set(transaction.id, result);
    }

    return results;
  }

  // ============================================
  // FETCH PROVIDER STATUS
  // ============================================

  private async fetchProviderStatus(transaction: Transaction): Promise<TransactionStatus | null> {
    // In production, this would fetch from Stripe/Razorpay API
    // For now, return null to indicate provider sync not implemented
    return null;
  }

  // ============================================
  // GET MINUTES SINCE
  // ============================================

  private getMinutesSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes;
  }

  // ============================================
  // FIND DUPLICATE TRANSACTIONS
  // ============================================

  findDuplicateTransactions(transaction: Transaction): Transaction[] {
    const duplicates: Transaction[] = [];

    for (const txn of this.transactions.values()) {
      if (txn.id === transaction.id) continue;

      // Check for duplicates based on provider transaction ID
      if (txn.providerTxnId === transaction.providerTxnId && txn.provider === transaction.provider) {
        duplicates.push(txn);
      }

      // Check for duplicates based on amount, customer, and time window (within 1 minute)
      const timeDiff = Math.abs(new Date(txn.createdAt).getTime() - new Date(transaction.createdAt).getTime());
      const withinOneMinute = timeDiff < 60000;

      if (
        txn.amount === transaction.amount &&
        txn.customerId === transaction.customerId &&
        txn.currency === transaction.currency &&
        withinOneMinute
      ) {
        duplicates.push(txn);
      }
    }

    return duplicates;
  }

  // ============================================
  // RECREATE MISSING TRANSACTION
  // ============================================

  async recreateMissingTransaction(webhookLog: {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
  }): Promise<Transaction | null> {
    // In production, this would recreate transaction from webhook log
    console.log(`[TransactionSelfHeal] Attempting to recreate transaction from webhook log`);
    return null;
  }

  // ============================================
  // DETECT MISSING TRANSACTIONS
  // ============================================

  detectMissingTransactions(webhookLogs: Array<{ type: string; data: Record<string, unknown>; timestamp: string }>): string[] {
    const missing: string[] = [];

    for (const log of webhookLogs) {
      const providerTxnId = log.data.provider_txn_id as string;
      const exists = this.findTransactionByProviderId(providerTxnId);

      if (!exists) {
        missing.push(providerTxnId);
      }
    }

    return missing;
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
  // DETECT INCONSISTENCIES
  // ============================================

  detectInconsistencies(transaction: Transaction): string[] {
    const issues: string[] = [];

    // Check pending > 10 minutes
    if (transaction.status === 'pending') {
      const pendingMinutes = this.getMinutesSince(transaction.createdAt);
      if (pendingMinutes > 10) {
        issues.push('Pending > 10 minutes');
      }
    }

    // Check for duplicates
    const duplicates = this.findDuplicateTransactions(transaction);
    if (duplicates.length > 0) {
      issues.push(`Has ${duplicates.length} duplicate transactions`);
    }

    // Check currency format
    if (!['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD'].includes(transaction.currency)) {
      issues.push('Invalid currency format');
    }

    // Check amount
    if (transaction.amount <= 0) {
      issues.push('Invalid amount (must be positive)');
    }

    return issues;
  }

  // ============================================
  // GET HEALTH SUMMARY
  // ============================================

  getHealthSummary(transscriptions: Transaction[]): {
    totalTransactions: number;
    healthyTransactions: number;
    transactionsWithIssues: number;
    issues: Map<string, string[]>;
  } {
    const issues = new Map<string, string[]>();
    let transactionsWithIssues = 0;

    for (const transaction of subscriptions) {
      const transactionIssues = this.detectInconsistencies(transaction);
      if (transactionIssues.length > 0) {
        issues.set(transaction.id, transactionIssues);
        transactionsWithIssues++;
      }
    }

    const healthyTransactions = subscriptions.length - transactionsWithIssues;

    return {
      totalTransactions: subscriptions.length,
      healthyTransactions,
      transactionsWithIssues,
      issues,
    };
  }

  // ============================================
  // AUTO FIX PENDING TRANSACTIONS
  // ============================================

  async autoFixPendingTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    const fixedTransactions: Transaction[] = [];

    for (const transaction of transactions) {
      if (transaction.status === 'pending') {
        const pendingMinutes = this.getMinutesSince(transaction.createdAt);
        if (pendingMinutes > 10) {
          const result = await this.healTransaction(transaction);
          if (result.success) {
            fixedTransactions.push(result.transaction);
          }
        }
      }
    }

    return fixedTransactions;
  }

  // ============================================
  // SYNC ALL WITH PROVIDER
  // ============================================

  async syncAllWithProvider(transactions: Transaction[]): Promise<Transaction[]> {
    const syncedTransactions: Transaction[] = [];

    for (const transaction of transactions) {
      const providerStatus = await this.fetchProviderStatus(transaction);
      if (providerStatus && providerStatus !== transaction.status) {
        try {
          const newStatus = transactionStatusEngine.transition(transaction.status, providerStatus);
          transaction.status = newStatus;
          transaction.updatedAt = new Date().toISOString();
          syncedTransactions.push(transaction);
        } catch {
          console.error(`[TransactionSelfHeal] Failed to sync transaction ${transaction.id}`);
        }
      }
    }

    return syncedTransactions;
  }

  // ============================================
  // RUN FULL HEAL
  // ============================================

  async runFullHeal(transactions: Transaction[]): Promise<{
    statusFixed: number;
    pendingFixed: number;
    duplicatesMerged: number;
    providerSyncs: number;
  }> {
    let statusFixed = 0;
    let pendingFixed = 0;
    let duplicatesMerged = 0;
    let providerSyncs = 0;

    for (const transaction of transactions) {
      const result = await this.healTransaction(transaction);

      if (result.fixes.includes('Fixed status mismatch with provider')) {
        statusFixed++;
      }

      if (result.fixes.includes('Auto-rechecked provider for pending > 10min')) {
        pendingFixed++;
      }

      if (result.fixes.includes('Merged') && result.fixes.some((f) => f.includes('duplicate'))) {
        duplicatesMerged++;
      }
    }

    const synced = await this.syncAllWithProvider(transactions);
    providerSyncs = synced.length;

    return {
      statusFixed,
      pendingFixed,
      duplicatesMerged,
      providerSyncs,
    };
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
  // ADD WEBHOOK LOG
  // ============================================

  addWebhookLog(log: { type: string; data: Record<string, unknown>; timestamp: string }): void {
    this.webhookLogs.push(log);
  }

  // ============================================
  // GET WEBHOOK LOGS
  // ============================================

  getWebhookLogs(): Array<{ type: string; data: Record<string, unknown>; timestamp: string }> {
    return this.webhookLogs;
  }
}

// Export singleton instance
export const transactionSelfHealingEngine = new TransactionSelfHealingEngine();

// ============================================
// REACT HOOK FOR SELF-HEALING
// ============================================

import { useState, useCallback } from 'react';

export function useTransactionSelfHealing() {
  const [isHealing, setIsHealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const healTransaction = useCallback(async (transaction: Transaction) => {
    setIsHealing(true);
    setError(null);

    try {
      const result = await transactionSelfHealingEngine.healTransaction(transaction);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to heal transaction';
      setError(errorMessage);
      return {
        success: false,
        transaction,
        fixes: [],
        issues: [errorMessage],
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsHealing(false);
    }
  }, []);

  const runFullHeal = useCallback(async (transactions: Transaction[]) => {
    setIsHealing(true);
    setError(null);

    try {
      const result = await transactionSelfHealingEngine.runFullHeal(transactions);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to run full heal';
      setError(errorMessage);
      return {
        statusFixed: 0,
        pendingFixed: 0,
        duplicatesMerged: 0,
        providerSyncs: 0,
      };
    } finally {
      setIsHealing(false);
    }
  }, []);

  const getHealthSummary = useCallback((transactions: Transaction[]) => {
    return transactionSelfHealingEngine.getHealthSummary(transactions);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isHealing,
    error,
    healTransaction,
    runFullHeal,
    getHealthSummary,
    clearError,
  };
}
