// AI Risk Scoring for Payment Recovery
// Predict payment recovery probability and churn risk

import type { Invoice, PaymentRiskScore } from './invoice-types';
import { invoiceAnalyticsEngine } from './invoice-analytics';

// ============================================
// AI RISK SCORING ENGINE
// ============================================

export class DunningAIEngine {
  // ============================================
  // CALCULATE PAYMENT RISK SCORE
  // ============================================

  async calculatePaymentRiskScore(
    invoice: Invoice,
    customerHistory: {
      totalInvoices: number;
      paidInvoices: number;
      failedInvoices: number;
      totalAmount: number;
      paidAmount: number;
      averagePaymentTime: number;
    },
    allInvoices: Invoice[]
  ): Promise<PaymentRiskScore> {
    // Factor 1: Payment history (weight: 30%)
    const paymentHistoryScore = this.calculatePaymentHistoryScore(customerHistory);

    // Factor 2: Invoice age (weight: 20%)
    const invoiceAgeScore = this.calculateInvoiceAgeScore(invoice);

    // Factor 3: Amount (weight: 20%)
    const amountScore = this.calculateAmountScore(invoice);

    // Factor 4: Customer tenure (weight: 15%)
    const tenureScore = this.calculateTenureScore(invoice, allInvoices);

    // Factor 5: Retry count (weight: 15%)
    const retryScore = this.calculateRetryScore(invoice);

    // Calculate overall risk score (0-100, higher = more risk)
    const riskScore =
      paymentHistoryScore * 0.3 +
      invoiceAgeScore * 0.2 +
      amountScore * 0.2 +
      tenureScore * 0.15 +
      retryScore * 0.15;

    // Calculate recovery probability (inverse of risk)
    const recoveryProbability = 100 - riskScore;

    // Calculate churn risk
    const churnRisk = this.calculateChurnRisk(customerHistory, invoice);

    return {
      customerId: invoice.customerId,
      riskScore: Math.round(riskScore),
      recoveryProbability: Math.round(recoveryProbability),
      churnRisk: Math.round(churnRisk),
      factors: {
        paymentHistory: Math.round(paymentHistoryScore),
        invoiceAge: Math.round(invoiceAgeScore),
        amount: Math.round(amountScore),
        customerTenure: Math.round(tenureScore),
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // CALCULATE PAYMENT HISTORY SCORE
  // ============================================

  private calculatePaymentHistoryScore(history: {
    totalInvoices: number;
    paidInvoices: number;
    failedInvoices: number;
  }): number {
    if (history.totalInvoices === 0) return 50;

    const paymentRate = history.paidInvoices / history.totalInvoices;
    const failureRate = history.failedInvoices / history.totalInvoices;

    // Lower payment rate = higher risk
    return (1 - paymentRate) * 100 * 0.7 + failureRate * 100 * 0.3;
  }

  // ============================================
  // CALCULATE INVOICE AGE SCORE
  // ============================================

  private calculateInvoiceAgeScore(invoice: Invoice): number {
    const daysOverdue = (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24);

    if (daysOverdue < 0) return 0; // Not overdue yet
    if (daysOverdue < 7) return 20; // 0-7 days overdue
    if (daysOverdue < 14) return 40; // 7-14 days overdue
    if (daysOverdue < 30) return 60; // 14-30 days overdue
    if (daysOverdue < 60) return 80; // 30-60 days overdue
    return 100; // 60+ days overdue
  }

  // ============================================
  // CALCULATE AMOUNT SCORE
  // ============================================

  private calculateAmountScore(invoice: Invoice): number {
    const amount = invoice.amount;

    // Higher amounts = higher risk
    if (amount < 25) return 10;
    if (amount < 50) return 20;
    if (amount < 100) return 30;
    if (amount < 250) return 50;
    if (amount < 500) return 70;
    return 90;
  }

  // ============================================
  // CALCULATE TENURE SCORE
  // ============================================

  private calculateTenureScore(invoice: Invoice, allInvoices: Invoice[]): number {
    const customerInvoices = allInvoices.filter((inv) => inv.customerId === invoice.customerId);
    const tenure = customerInvoices.length;

    // Newer customers = higher risk
    if (tenure < 3) return 80;
    if (tenure < 6) return 60;
    if (tenure < 12) return 40;
    if (tenure < 24) return 20;
    return 10;
  }

  // ============================================
  // CALCULATE RETRY SCORE
  // ============================================

  private calculateRetryScore(invoice: Invoice): number {
    const retryCount = invoice.retryCount || 0;

    // More retries = higher risk
    return Math.min(retryCount * 25, 100);
  }

  // ============================================
  // CALCULATE CHURN RISK
  // ============================================

  private calculateChurnRisk(
    history: {
      totalInvoices: number;
      paidInvoices: number;
      failedInvoices: number;
    },
    invoice: Invoice
  ): number {
    let churnRisk = 30; // Base risk

    // High failure rate increases churn risk
    if (history.totalInvoices > 0) {
      const failureRate = history.failedInvoices / history.totalInvoices;
      churnRisk += failureRate * 50;
    }

    // High retry count increases churn risk
    churnRisk += (invoice.retryCount || 0) * 15;

    // Overdue invoices increase churn risk
    const daysOverdue = (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOverdue > 30) {
      churnRisk += 30;
    } else if (daysOverdue > 14) {
      churnRisk += 15;
    }

    return Math.min(churnRisk, 100);
  }

  // ============================================
  // BATCH CALCULATE RISK SCORES
  // ============================================

  async batchCalculateRiskScores(
    invoices: Invoice[],
    tenantId: string
  ): Promise<Map<string, PaymentRiskScore>> {
    const riskScores = new Map<string, PaymentRiskScore>();

    for (const invoice of invoices) {
      if (invoice.tenantId !== tenantId) continue;

      // Get customer history
      const customerInvoices = invoices.filter((inv) => inv.customerId === invoice.customerId);
      const customerHistory = invoiceAnalyticsEngine.getCustomerPaymentHistory(
        customerInvoices,
        invoice.customerId
      );

      const riskScore = await this.calculatePaymentRiskScore(invoice, customerHistory, invoices);
      riskScores.set(invoice.id, riskScore);
    }

    return riskScores;
  }

  // ============================================
  // GET HIGH RISK INVOICES
  // ============================================

  async getHighRiskInvoices(
    invoices: Invoice[],
    tenantId: string,
    riskThreshold: number = 70
  ): Promise<{ invoice: Invoice; riskScore: PaymentRiskScore }[]> {
    const riskScores = await this.batchCalculateRiskScores(invoices, tenantId);
    const highRisk: { invoice: Invoice; riskScore: PaymentRiskScore }[] = [];

    for (const invoice of invoices) {
      if (invoice.tenantId !== tenantId) continue;

      const score = riskScores.get(invoice.id);
      if (score && score.riskScore >= riskThreshold) {
        highRisk.push({ invoice, riskScore: score });
      }
    }

    // Sort by risk score (highest first)
    highRisk.sort((a, b) => b.riskScore.riskScore - a.riskScore.riskScore);

    return highRisk;
  }

  // ============================================
  // PREDICT RECOVERY OUTCOME
  // ============================================

  predictRecoveryOutcome(riskScore: PaymentRiskScore): {
    willRecover: boolean;
    confidence: number;
    estimatedDays: number;
    recommendedAction: string;
  } {
    const { recoveryProbability, churnRisk } = riskScore;

    if (recoveryProbability > 70) {
      return {
        willRecover: true,
        confidence: recoveryProbability - 30,
        estimatedDays: 7,
        recommendedAction: 'Send reminder email',
      };
    } else if (recoveryProbability > 40) {
      return {
        willRecover: true,
        confidence: recoveryProbability - 20,
        estimatedDays: 14,
        recommendedAction: 'Retry payment with email reminder',
      };
    } else if (recoveryProbability > 20) {
      return {
        willRecover: false,
        confidence: 80 - recoveryProbability,
        estimatedDays: 30,
        recommendedAction: 'Contact customer directly',
      };
    } else {
      return {
        willRecover: false,
        confidence: 90,
        estimatedDays: 999,
        recommendedAction: 'Consider legal action or write-off',
      };
    }
  }

  // ============================================
  // GET RISK SUMMARY
  // ============================================

  async getRiskSummary(invoices: Invoice[], tenantId: string): Promise<{
    totalInvoices: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    averageRiskScore: number;
    averageRecoveryProbability: number;
  }> {
    const riskScores = await this.batchCalculateRiskScores(invoices, tenantId);

    let totalRiskScore = 0;
    let totalRecoveryProbability = 0;
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;

    for (const [invoiceId, riskScore] of riskScores) {
      totalRiskScore += riskScore.riskScore;
      totalRecoveryProbability += riskScore.recoveryProbability;

      if (riskScore.riskScore >= 70) {
        highRisk++;
      } else if (riskScore.riskScore >= 40) {
        mediumRisk++;
      } else {
        lowRisk++;
      }
    }

    const count = riskScores.size;

    return {
      totalInvoices: count,
      highRisk,
      mediumRisk,
      lowRisk,
      averageRiskScore: count > 0 ? Math.round(totalRiskScore / count) : 0,
      averageRecoveryProbability: count > 0 ? Math.round(totalRecoveryProbability / count) : 0,
    };
  }
}

// Export singleton instance
export const dunningAIEngine = new DunningAIEngine();

// ============================================
// REACT HOOK FOR DUNNING AI
// ============================================

import { useState, useCallback } from 'react';

export function useDunningAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const calculateRiskScore = useCallback(async (
    invoice: Invoice,
    customerHistory: {
      totalInvoices: number;
      paidInvoices: number;
      failedInvoices: number;
      totalAmount: number;
      paidAmount: number;
      averagePaymentTime: number;
    },
    allInvoices: Invoice[]
  ) => {
    setIsAnalyzing(true);
    try {
      const riskScore = await dunningAIEngine.calculatePaymentRiskScore(invoice, customerHistory, allInvoices);
      return riskScore;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const batchCalculateRiskScores = useCallback(async (invoices: Invoice[], tenantId: string) => {
    setIsAnalyzing(true);
    try {
      const riskScores = await dunningAIEngine.batchCalculateRiskScores(invoices, tenantId);
      return riskScores;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getHighRiskInvoices = useCallback(async (invoices: Invoice[], tenantId: string, riskThreshold?: number) => {
    setIsAnalyzing(true);
    try {
      const highRisk = await dunningAIEngine.getHighRiskInvoices(invoices, tenantId, riskThreshold);
      return highRisk;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const predictRecoveryOutcome = useCallback((riskScore: PaymentRiskScore) => {
    return dunningAIEngine.predictRecoveryOutcome(riskScore);
  }, []);

  const getRiskSummary = useCallback(async (invoices: Invoice[], tenantId: string) => {
    setIsAnalyzing(true);
    try {
      const summary = await dunningAIEngine.getRiskSummary(invoices, tenantId);
      return summary;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    isAnalyzing,
    calculateRiskScore,
    batchCalculateRiskScores,
    getHighRiskInvoices,
    predictRecoveryOutcome,
    getRiskSummary,
  };
}
