// Customer Churn Detection Rules
// IF no login + no payment 30 days → mark churn risk

import type { Customer } from './customer-types';
import { activityTrackingEngine } from './customer-activity';
import { customerRelationsEngine } from './customer-relations';

// ============================================
// CHURN DETECTION RESULT
// ============================================

export interface ChurnDetectionResult {
  customerId: string;
  isChurned: boolean;
  churnRiskScore: number; // 0-100
  riskFactors: {
    noLoginDays: number;
    noPaymentDays: number;
    noActiveSubscriptions: boolean;
    lowEngagement: boolean;
    supportTickets: number;
  };
  predictedChurnDate?: string;
  recommendedAction: string;
  timestamp: string;
}

// ============================================
// CHURN DETECTION ENGINE
// ============================================

export class ChurnDetectionEngine {
  private readonly CHURN_THRESHOLD_DAYS = 30;
  private readonly HIGH_RISK_THRESHOLD_DAYS = 14;

  // ============================================
  // DETECT CHURN
  // ============================================

  async detectChurn(customer: Customer): Promise<ChurnDetectionResult> {
    const now = Date.now();
    const lastActiveDate = new Date(customer.lastActiveAt).getTime();
    const daysSinceLastActive = (now - lastActiveDate) / (1000 * 60 * 60 * 24);

    const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);
    const lastPaymentDate = customerRelationsEngine.getLastPaymentDate(relations.transactions);
    const daysSinceLastPayment = lastPaymentDate ? (now - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24) : 999;

    const activityLogs = activityTrackingEngine.getActivityLogs(customer.id);
    const loginLogs = activityLogs.filter((log) => log.type === 'login');
    const daysSinceLastLogin = loginLogs.length > 0 
      ? (now - new Date(loginLogs[loginLogs.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    const riskFactors = {
      noLoginDays: Math.round(daysSinceLastLogin),
      noPaymentDays: Math.round(daysSinceLastPayment),
      noActiveSubscriptions: customer.activeSubscriptions === 0,
      lowEngagement: this.detectLowEngagement(customer, activityLogs),
      supportTickets: this.countSupportTickets(activityLogs),
    };

    // Calculate churn risk score
    let churnRiskScore = 0;
    
    // No login factor (weight: 30%)
    if (daysSinceLastLogin > this.CHURN_THRESHOLD_DAYS) {
      churnRiskScore += 30;
    } else if (daysSinceLastLogin > this.HIGH_RISK_THRESHOLD_DAYS) {
      churnRiskScore += 15;
    }

    // No payment factor (weight: 25%)
    if (daysSinceLastPayment > this.CHURN_THRESHOLD_DAYS) {
      churnRiskScore += 25;
    } else if (daysSinceLastPayment > this.HIGH_RISK_THRESHOLD_DAYS) {
      churnRiskScore += 12;
    }

    // No active subscriptions factor (weight: 20%)
    if (riskFactors.noActiveSubscriptions) {
      churnRiskScore += 20;
    }

    // Low engagement factor (weight: 15%)
    if (riskFactors.lowEngagement) {
      churnRiskScore += 15;
    }

    // Support tickets factor (weight: 10%)
    if (riskFactors.supportTickets >= 3) {
      churnRiskScore += 10;
    } else if (riskFactors.supportTickets >= 1) {
      churnRiskScore += 5;
    }

    // Determine if churned
    const isChurned = churnRiskScore >= 70 || (daysSinceLastLogin > this.CHURN_THRESHOLD_DAYS && daysSinceLastPayment > this.CHURN_THRESHOLD_DAYS);

    // Predict churn date
    let predictedChurnDate: string | undefined;
    if (churnRiskScore >= 50) {
      const daysToChurn = Math.max(7, 90 - churnRiskScore);
      predictedChurnDate = new Date(now + daysToChurn * 24 * 60 * 60 * 1000).toISOString();
    }

    // Determine recommended action
    let recommendedAction = 'Monitor';
    if (isChurned) {
      recommendedAction = 'Mark as churned and offer reactivation campaign';
    } else if (churnRiskScore >= 70) {
      recommendedAction = 'Immediate intervention - offer discount';
    } else if (churnRiskScore >= 50) {
      recommendedAction = 'Send engagement campaign';
    } else if (churnRiskScore >= 30) {
      recommendedAction = 'Increase monitoring';
    }

    return {
      customerId: customer.id,
      isChurned,
      churnRiskScore: Math.min(churnRiskScore, 100),
      riskFactors,
      predictedChurnDate,
      recommendedAction,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // DETECT LOW ENGAGEMENT
  // ============================================

  private detectLowEngagement(customer: Customer, activityLogs: any[]): boolean {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = activityLogs.filter((log) => new Date(log.timestamp) >= thirtyDaysAgo);

    // Less than 5 activities in 30 days = low engagement
    return recentActivity.length < 5;
  }

  // ============================================
  // COUNT SUPPORT TICKETS
  // ============================================

  private countSupportTickets(activityLogs: any[]): number {
    // In production, check support system
    // For now, count profile updates as proxy for support interactions
    return activityLogs.filter((log) => log.type === 'profile_update').length;
  }

  // ============================================
  // BATCH DETECT CHURN
  // ============================================

  async batchDetectChurn(customers: Customer[]): Promise<Map<string, ChurnDetectionResult>> {
    const results = new Map<string, ChurnDetectionResult>();

    for (const customer of customers) {
      const result = await this.detectChurn(customer);
      results.set(customer.id, result);
    }

    return results;
  }

  // ============================================
  // GET CHURNED CUSTOMERS
  // ============================================

  async getChurnedCustomers(customers: Customer[]): Promise<{
    churned: { customer: Customer; result: ChurnDetectionResult }[];
    atRisk: { customer: Customer; result: ChurnDetectionResult }[];
  }> {
    const results = await this.batchDetectChurn(customers);

    const churned: { customer: Customer; result: ChurnDetectionResult }[] = [];
    const atRisk: { customer: Customer; result: ChurnDetectionResult }[] = [];

    for (const customer of customers) {
      const result = results.get(customer.id);
      if (!result) continue;

      if (result.isChurned) {
        churned.push({ customer, result });
      } else if (result.churnRiskScore >= 50) {
        atRisk.push({ customer, result });
      }
    }

    // Sort by churn risk score (highest first)
    churned.sort((a, b) => b.result.churnRiskScore - a.result.churnRiskScore);
    atRisk.sort((a, b) => b.result.churnRiskScore - a.result.churnRiskScore);

    return { churned, atRisk };
  }

  // ============================================
  // GET CHURN SUMMARY
  // ============================================

  async getChurnSummary(customers: Customer[]): Promise<{
    totalCustomers: number;
    churnedCustomers: number;
    atRiskCustomers: number;
    averageChurnRiskScore: number;
    churnRate: number;
    predictedChurnNextMonth: number;
  }> {
    const results = await this.batchDetectChurn(customers);

    let churnedCustomers = 0;
    let atRiskCustomers = 0;
    let totalRiskScore = 0;

    for (const result of results.values()) {
      totalRiskScore += result.churnRiskScore;

      if (result.isChurned) {
        churnedCustomers++;
      } else if (result.churnRiskScore >= 50) {
        atRiskCustomers++;
      }
    }

    const averageChurnRiskScore = results.size > 0 ? totalRiskScore / results.size : 0;
    const churnRate = customers.length > 0 ? (churnedCustomers / customers.length) * 100 : 0;
    const predictedChurnNextMonth = Math.round(atRiskCustomers * 0.3); // 30% of at-risk will churn

    return {
      totalCustomers: customers.length,
      churnedCustomers,
      atRiskCustomers,
      averageChurnRiskScore: Math.round(averageChurnRiskScore),
      churnRate: Math.round(churnRate),
      predictedChurnNextMonth,
    };
  }

  // ============================================
  // UPDATE CUSTOMER CHURN SCORE
  // ============================================

  async updateCustomerChurnScore(customer: Customer): Promise<Customer> {
    const result = await this.detectChurn(customer);

    return {
      ...customer,
      churnRiskScore: result.churnRiskScore,
      updatedAt: new Date().toISOString(),
    };
  }

  // ============================================
  // BATCH UPDATE CHURN SCORES
  // ============================================

  async batchUpdateChurnScores(customers: Customer[]): Promise<Customer[]> {
    const updatedCustomers: Customer[] = [];

    for (const customer of customers) {
      const updated = await this.updateCustomerChurnScore(customer);
      updatedCustomers.push(updated);
    }

    return updatedCustomers;
  }

  // ============================================
  // SET CHURN THRESHOLD
  // ============================================

  setChurnThresholdDays(days: number): void {
    (this as any).CHURN_THRESHOLD_DAYS = days;
  }

  // ============================================
  // GET CHURN THRESHOLD
  // ============================================

  getChurnThresholdDays(): number {
    return this.CHURN_THRESHOLD_DAYS;
  }
}

// Export singleton instance
export const churnDetectionEngine = new ChurnDetectionEngine();

// ============================================
// REACT HOOK FOR CHURN DETECTION
// ============================================

import { useState, useCallback } from 'react';

export function useChurnDetection() {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectChurn = useCallback(async (customer: Customer) => {
    setIsDetecting(true);
    try {
      const result = await churnDetectionEngine.detectChurn(customer);
      return result;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const batchDetectChurn = useCallback(async (customers: Customer[]) => {
    setIsDetecting(true);
    try {
      const results = await churnDetectionEngine.batchDetectChurn(customers);
      return results;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const getChurnedCustomers = useCallback(async (customers: Customer[]) => {
    setIsDetecting(true);
    try {
      const result = await churnDetectionEngine.getChurnedCustomers(customers);
      return result;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const getChurnSummary = useCallback(async (customers: Customer[]) => {
    setIsDetecting(true);
    try {
      const summary = await churnDetectionEngine.getChurnSummary(customers);
      return summary;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  return {
    isDetecting,
    detectChurn,
    batchDetectChurn,
    getChurnedCustomers,
    getChurnSummary,
  };
}
