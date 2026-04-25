// Customer Fraud Detection Engine
// Auto flag multiple cards, unusual country switch, rapid payments

import type { Customer } from './customer-types';
import { customerRelationsEngine } from './customer-relations';

// ============================================
// FRAUD DETECTION RESULT
// ============================================

export interface FraudDetectionResult {
  customerId: string;
  isFraudulent: boolean;
  fraudRiskScore: number; // 0-100
  riskFactors: {
    multipleCards: boolean;
    unusualCountrySwitch: boolean;
    rapidPayments: boolean;
    suspiciousIP: boolean;
    unusualAmount: boolean;
    patternAnomaly: boolean;
  };
  flaggedTransactions: string[];
  recommendedAction: string;
  timestamp: string;
}

// ============================================
// FRAUD DETECTION ENGINE
// ============================================

export class FraudDetectionEngine {
  // ============================================
  // DETECT FRAUD
  // ============================================

  async detectFraud(customer: Customer): Promise<FraudDetectionResult> {
    const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);

    const riskFactors = {
      multipleCards: this.detectMultipleCards(relations.transactions),
      unusualCountrySwitch: this.detectUnusualCountrySwitch(customer, relations.transactions),
      rapidPayments: this.detectRapidPayments(relations.transactions),
      suspiciousIP: await this.detectSuspiciousIP(customer),
      unusualAmount: this.detectUnusualAmount(relations.transactions),
      patternAnomaly: this.detectPatternAnomaly(relations.transactions),
    };

    // Calculate fraud risk score
    let fraudRiskScore = 0;
    if (riskFactors.multipleCards) fraudRiskScore += 25;
    if (riskFactors.unusualCountrySwitch) fraudRiskScore += 35;
    if (riskFactors.rapidPayments) fraudRiskScore += 30;
    if (riskFactors.suspiciousIP) fraudRiskScore += 40;
    if (riskFactors.unusualAmount) fraudRiskScore += 20;
    if (riskFactors.patternAnomaly) fraudRiskScore += 25;

    // Get flagged transactions
    const flaggedTransactions = relations.transactions
      .filter((t: any) => t.status === 'failed' || t.amount > 1000)
      .map((t: any) => t.id);

    // Determine if fraudulent
    const isFraudulent = fraudRiskScore >= 70;

    // Determine recommended action
    let recommendedAction = 'Monitor';
    if (isFraudulent) {
      recommendedAction = 'Block customer and review manually';
    } else if (fraudRiskScore >= 50) {
      recommendedAction = 'Flag for manual review';
    } else if (fraudRiskScore >= 30) {
      recommendedAction = 'Increase monitoring frequency';
    }

    return {
      customerId: customer.id,
      isFraudulent,
      fraudRiskScore: Math.min(fraudRiskScore, 100),
      riskFactors,
      flaggedTransactions,
      recommendedAction,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // DETECT MULTIPLE CARDS
  // ============================================

  private detectMultipleCards(transactions: any[]): boolean {
    // In production, check payment methods
    // For now, simulate by checking transaction count
    const failedTransactions = transactions.filter((t) => t.status === 'failed');
    return failedTransactions.length >= 3;
  }

  // ============================================
  // DETECT UNUSUAL COUNTRY SWITCH
  // ============================================

  private detectUnusualCountrySwitch(customer: Customer, transactions: any[]): boolean {
    // In production, check transaction locations vs customer country
    const unusualCountries = ['RU', 'CN', 'KP', 'IR']; // Example high-risk countries
    return unusualCountries.includes(customer.country);
  }

  // ============================================
  // DETECT RAPID PAYMENTS
  // ============================================

  private detectRapidPayments(transactions: any[]): boolean {
    if (transactions.length < 3) return false;

    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (let i = 0; i < sortedTransactions.length - 2; i++) {
      const timeDiff = new Date(sortedTransactions[i + 2].createdAt).getTime() - 
                     new Date(sortedTransactions[i].createdAt).getTime();
      
      // If 3 transactions within 1 hour
      if (timeDiff < 3600000) {
        return true;
      }
    }

    return false;
  }

  // ============================================
  // DETECT SUSPICIOUS IP
  // ============================================

  private async detectSuspiciousIP(customer: Customer): Promise<boolean> {
    // In production, check IP reputation databases
    // For now, return false
    return false;
  }

  // ============================================
  // DETECT UNUSUAL AMOUNT
  // ============================================

  private detectUnusualAmount(transactions: any[]): boolean {
    if (transactions.length === 0) return false;

    const amounts = transactions.map((t) => t.amount);
    const average = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const threshold = average * 10; // 10x average

    return amounts.some((amount) => amount > threshold);
  }

  // ============================================
  // DETECT PATTERN ANOMALY
  // ============================================

  private detectPatternAnomaly(transactions: any[]): boolean {
    if (transactions.length < 5) return false;

    // Check for round numbers (e.g., $100.00, $500.00) which may indicate testing
    const roundNumbers = transactions.filter((t) => 
      t.amount % 1 === 0 && t.amount >= 100
    );

    return roundNumbers.length >= 3;
  }

  // ============================================
  // BATCH DETECT FRAUD
  // ============================================

  async batchDetectFraud(customers: Customer[]): Promise<Map<string, FraudDetectionResult>> {
    const results = new Map<string, FraudDetectionResult>();

    for (const customer of customers) {
      const result = await this.detectFraud(customer);
      results.set(customer.id, result);
    }

    return results;
  }

  // ============================================
  // GET HIGH RISK CUSTOMERS
  // ============================================

  async getHighRiskCustomers(customers: Customer[], riskThreshold: number = 70): Promise<{
    fraudulent: { customer: Customer; result: FraudDetectionResult }[];
    highRisk: { customer: Customer; result: FraudDetectionResult }[];
  }> {
    const results = await this.batchDetectFraud(customers);

    const fraudulent: { customer: Customer; result: FraudDetectionResult }[] = [];
    const highRisk: { customer: Customer; result: FraudDetectionResult }[] = [];

    for (const customer of customers) {
      const result = results.get(customer.id);
      if (!result) continue;

      if (result.isFraudulent) {
        fraudulent.push({ customer, result });
      } else if (result.fraudRiskScore >= riskThreshold) {
        highRisk.push({ customer, result });
      }
    }

    // Sort by risk score (highest first)
    fraudulent.sort((a, b) => b.result.fraudRiskScore - a.result.fraudRiskScore);
    highRisk.sort((a, b) => b.result.fraudRiskScore - a.result.fraudRiskScore);

    return { fraudulent, highRisk };
  }

  // ============================================
  // GET FRAUD SUMMARY
  // ============================================

  async getFraudSummary(customers: Customer[]): Promise<{
    totalCustomers: number;
    flaggedCustomers: number;
    fraudulentCustomers: number;
    averageRiskScore: number;
    highRiskCountries: Record<string, number>;
    commonRiskFactors: Record<string, number>;
  }> {
    const results = await this.batchDetectFraud(customers);

    let flaggedCustomers = 0;
    let fraudulentCustomers = 0;
    let totalRiskScore = 0;
    const highRiskCountries: Record<string, number> = {};
    const commonRiskFactors: Record<string, number> = {
      multipleCards: 0,
      unusualCountrySwitch: 0,
      rapidPayments: 0,
      suspiciousIP: 0,
      unusualAmount: 0,
      patternAnomaly: 0,
    };

    for (const [customerId, result] of results) {
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) continue;

      totalRiskScore += result.fraudRiskScore;

      if (result.fraudRiskScore >= 50) {
        flaggedCustomers++;
      }

      if (result.isFraudulent) {
        fraudulentCustomers++;
      }

      // Track high-risk countries
      if (result.fraudRiskScore >= 50) {
        highRiskCountries[customer.country] = (highRiskCountries[customer.country] || 0) + 1;
      }

      // Track risk factors
      if (result.riskFactors.multipleCards) commonRiskFactors.multipleCards++;
      if (result.riskFactors.unusualCountrySwitch) commonRiskFactors.unusualCountrySwitch++;
      if (result.riskFactors.rapidPayments) commonRiskFactors.rapidPayments++;
      if (result.riskFactors.suspiciousIP) commonRiskFactors.suspiciousIP++;
      if (result.riskFactors.unusualAmount) commonRiskFactors.unusualAmount++;
      if (result.riskFactors.patternAnomaly) commonRiskFactors.patternAnomaly++;
    }

    const averageRiskScore = results.size > 0 ? totalRiskScore / results.size : 0;

    return {
      totalCustomers: customers.length,
      flaggedCustomers,
      fraudulentCustomers,
      averageRiskScore: Math.round(averageRiskScore),
      highRiskCountries,
      commonRiskFactors,
    };
  }

  // ============================================
  // UPDATE CUSTOMER FRAUD SCORE
  // ============================================

  async updateCustomerFraudScore(customer: Customer): Promise<Customer> {
    const result = await this.detectFraud(customer);

    return {
      ...customer,
      fraudRiskScore: result.fraudRiskScore,
      updatedAt: new Date().toISOString(),
    };
  }

  // ============================================
  // BATCH UPDATE FRAUD SCORES
  // ============================================

  async batchUpdateFraudScores(customers: Customer[]): Promise<Customer[]> {
    const updatedCustomers: Customer[] = [];

    for (const customer of customers) {
      const updated = await this.updateCustomerFraudScore(customer);
      updatedCustomers.push(updated);
    }

    return updatedCustomers;
  }
}

// Export singleton instance
export const fraudDetectionEngine = new FraudDetectionEngine();

// ============================================
// REACT HOOK FOR FRAUD DETECTION
// ============================================

import { useState, useCallback } from 'react';

export function useFraudDetection() {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectFraud = useCallback(async (customer: Customer) => {
    setIsDetecting(true);
    try {
      const result = await fraudDetectionEngine.detectFraud(customer);
      return result;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const batchDetectFraud = useCallback(async (customers: Customer[]) => {
    setIsDetecting(true);
    try {
      const results = await fraudDetectionEngine.batchDetectFraud(customers);
      return results;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const getHighRiskCustomers = useCallback(async (customers: Customer[], riskThreshold?: number) => {
    setIsDetecting(true);
    try {
      const result = await fraudDetectionEngine.getHighRiskCustomers(customers, riskThreshold);
      return result;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const getFraudSummary = useCallback(async (customers: Customer[]) => {
    setIsDetecting(true);
    try {
      const summary = await fraudDetectionEngine.getFraudSummary(customers);
      return summary;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  return {
    isDetecting,
    detectFraud,
    batchDetectFraud,
    getHighRiskCustomers,
    getFraudSummary,
  };
}
