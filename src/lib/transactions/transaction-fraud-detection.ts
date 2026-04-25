// Transaction Fraud Detection Hook
// Flag high risk transactions

import type { Transaction, FraudCheckResult } from './transaction-types';

// ============================================
// FRAUD DETECTION ENGINE
// ============================================

export class FraudDetectionEngine {
  private riskThresholds = {
    high: 70,
    medium: 40,
  };

  // ============================================
  // CHECK TRANSACTION FRAUD RISK
  // ============================================

  checkFraudRisk(transaction: Transaction): FraudCheckResult {
    const reasons: string[] = [];
    let score = 0;

    // Rule 1: High amount transactions
    if (transaction.amount > 10000) {
      score += 30;
      reasons.push('High transaction amount');
    } else if (transaction.amount > 5000) {
      score += 15;
      reasons.push('Moderate transaction amount');
    }

    // Rule 2: New customer (first transaction)
    // In production, check customer's transaction history
    // For now, assume high risk for large amounts from new customers
    if (transaction.amount > 2000) {
      score += 10;
      reasons.push('Potential new customer with high amount');
    }

    // Rule 3: Suspicious payment method
    if (transaction.paymentMethod === 'other') {
      score += 20;
      reasons.push('Unusual payment method');
    }

    // Rule 4: Multiple transactions in short time
    // In production, check for rapid successive transactions
    // For now, placeholder
    score += 0;

    // Rule 5: Geographic anomalies
    // In production, check IP geolocation vs customer location
    // For now, placeholder
    score += 0;

    // Rule 6: Failed transactions followed by success
    // In production, check for retry patterns
    // For now, placeholder
    score += 0;

    // Determine risk level
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (score >= this.riskThresholds.high) {
      risk = 'high';
    } else if (score >= this.riskThresholds.medium) {
      risk = 'medium';
    }

    return {
      risk,
      reasons,
      score,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BATCH CHECK FRAUD RISK
  // ============================================

  batchCheckFraudRisk(transactions: Transaction[]): Map<string, FraudCheckResult> {
    const results = new Map<string, FraudCheckResult>();

    for (const transaction of transactions) {
      const result = this.checkFraudRisk(transaction);
      results.set(transaction.id, result);
    }

    return results;
  }

  // ============================================
  // FLAG HIGH RISK TRANSACTIONS
  // ============================================

  flagHighRiskTransactions(transactions: Transaction[]): Transaction[] {
    const flagged: Transaction[] = [];

    for (const transaction of transactions) {
      const result = this.checkFraudRisk(transaction);
      if (result.risk === 'high') {
        transaction.fraudRisk = 'high';
        transaction.metadata = {
          ...transaction.metadata,
          fraudScore: result.score,
          fraudReasons: result.reasons,
          fraudCheckedAt: new Date().toISOString(),
        };
        flagged.push(transaction);
      }
    }

    return flagged;
  }

  // ============================================
  // GET FRAUD SUMMARY
  // ============================================

  getFraudSummary(transactions: Transaction[]): {
    totalTransactions: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    highRiskAmount: number;
    flaggedTransactions: Transaction[];
  } {
    const highRiskCount = transactions.filter((t) => t.fraudRisk === 'high').length;
    const mediumRiskCount = transactions.filter((t) => t.fraudRisk === 'medium').length;
    const lowRiskCount = transactions.filter((t) => t.fraudRisk === 'low').length;
    const highRiskAmount = transactions
      .filter((t) => t.fraudRisk === 'high')
      .reduce((sum, t) => sum + t.amount, 0);
    const flaggedTransactions = transactions.filter((t) => t.fraudRisk === 'high');

    return {
      totalTransactions: transactions.length,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      highRiskAmount,
      flaggedTransactions,
    };
  }

  // ============================================
  // UPDATE RISK THRESHOLDS
  // ============================================

  updateRiskThresholds(high: number, medium: number): void {
    this.riskThresholds.high = high;
    this.riskThresholds.medium = medium;
  }

  // ============================================
  // GET RISK THRESHOLDS
  // ============================================

  getRiskThresholds(): { high: number; medium: number } {
    return { ...this.riskThresholds };
  }

  // ============================================
  // MANUAL FLAG TRANSACTION
  // ============================================

  manualFlagTransaction(transaction: Transaction, risk: 'low' | 'medium' | 'high', reason: string): Transaction {
    transaction.fraudRisk = risk;
    transaction.metadata = {
      ...transaction.metadata,
      manuallyFlagged: true,
      fraudReason: reason,
      fraudFlaggedAt: new Date().toISOString(),
    };
    return transaction;
  }

  // ============================================
  // UNFLAG TRANSACTION
  // ============================================

  unflagTransaction(transaction: Transaction): Transaction {
    transaction.fraudRisk = 'low';
    transaction.metadata = {
      ...transaction.metadata,
      manuallyFlagged: false,
      fraudUnflaggedAt: new Date().toISOString(),
    };
    return transaction;
  }
}

// Export singleton instance
export const fraudDetectionEngine = new FraudDetectionEngine();

// ============================================
// REACT HOOK FOR FRAUD DETECTION
// ============================================

import { useCallback } from 'react';

export function useFraudDetection() {
  const checkFraudRisk = useCallback((transaction: Transaction) => {
    return fraudDetectionEngine.checkFraudRisk(transaction);
  }, []);

  const batchCheckFraudRisk = useCallback((transactions: Transaction[]) => {
    return fraudDetectionEngine.batchCheckFraudRisk(transactions);
  }, []);

  const flagHighRiskTransactions = useCallback((transactions: Transaction[]) => {
    return fraudDetectionEngine.flagHighRiskTransactions(transactions);
  }, []);

  const getFraudSummary = useCallback((transactions: Transaction[]) => {
    return fraudDetectionEngine.getFraudSummary(transactions);
  }, []);

  const manualFlagTransaction = useCallback((
    transaction: Transaction,
    risk: 'low' | 'medium' | 'high',
    reason: string
  ) => {
    return fraudDetectionEngine.manualFlagTransaction(transaction, risk, reason);
  }, []);

  const unflagTransaction = useCallback((transaction: Transaction) => {
    return fraudDetectionEngine.unflagTransaction(transaction);
  }, []);

  const updateRiskThresholds = useCallback((high: number, medium: number) => {
    fraudDetectionEngine.updateRiskThresholds(high, medium);
  }, []);

  const getRiskThresholds = useCallback(() => {
    return fraudDetectionEngine.getRiskThresholds();
  }, []);

  return {
    checkFraudRisk,
    batchCheckFraudRisk,
    flagHighRiskTransactions,
    getFraudSummary,
    manualFlagTransaction,
    unflagTransaction,
    updateRiskThresholds,
    getRiskThresholds,
  };
}
