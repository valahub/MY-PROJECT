// Customer AI Layer
// Churn prediction, upsell probability, fraud risk

import type { Customer, ChurnPrediction, UpsellPrediction, FraudRiskAssessment } from './customer-types';
import { customerRelationsEngine } from './customer-relations';

// ============================================
// CUSTOMER AI ENGINE
// ============================================

export class CustomerAIEngine {
  // ============================================
  // PREDICT CHURN
  // ============================================

  async predictChurn(customer: Customer): Promise<ChurnPrediction> {
    const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);
    
    // Factor 1: Payment history (weight: 30%)
    const paymentHistoryScore = this.calculatePaymentHistoryScore(relations.transactions);
    
    // Factor 2: Login frequency (weight: 25%)
    const loginFrequencyScore = this.calculateLoginFrequencyScore(customer);
    
    // Factor 3: Support tickets (weight: 20%)
    const supportTicketsScore = this.calculateSupportTicketsScore(customer);
    
    // Factor 4: Feature usage (weight: 25%)
    const featureUsageScore = this.calculateFeatureUsageScore(relations.subscriptions);

    // Calculate overall churn probability
    const churnProbability =
      paymentHistoryScore * 0.3 +
      loginFrequencyScore * 0.25 +
      supportTicketsScore * 0.2 +
      featureUsageScore * 0.25;

    // Determine predicted churn date
    const predictedChurnDate = churnProbability > 60
      ? new Date(Date.now() + (90 - churnProbability) * 86400000 * 3).toISOString()
      : undefined;

    // Determine recommended action
    let recommendedAction = 'Monitor';
    if (churnProbability > 80) {
      recommendedAction = 'Immediate intervention - offer discount';
    } else if (churnProbability > 60) {
      recommendedAction = 'Reach out with personalized offer';
    } else if (churnProbability > 40) {
      recommendedAction = 'Send engagement campaign';
    }

    return {
      customerId: customer.id,
      churnProbability: Math.round(churnProbability),
      riskFactors: {
        paymentHistory: Math.round(paymentHistoryScore),
        loginFrequency: Math.round(loginFrequencyScore),
        supportTickets: Math.round(supportTicketsScore),
        featureUsage: Math.round(featureUsageScore),
      },
      predictedChurnDate,
      recommendedAction,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // CALCULATE PAYMENT HISTORY SCORE
  // ============================================

  private calculatePaymentHistoryScore(transactions: any[]): number {
    if (transactions.length === 0) return 80;

    const failedTransactions = transactions.filter((t) => t.status === 'failed').length;
    const failureRate = (failedTransactions / transactions.length) * 100;

    return failureRate;
  }

  // ============================================
  // CALCULATE LOGIN FREQUENCY SCORE
  // ============================================

  private calculateLoginFrequencyScore(customer: Customer): number {
    const daysSinceLastActive = (Date.now() - new Date(customer.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastActive > 60) return 90;
    if (daysSinceLastActive > 30) return 70;
    if (daysSinceLastActive > 14) return 50;
    if (daysSinceLastActive > 7) return 30;
    return 10;
  }

  // ============================================
  // CALCULATE SUPPORT TICKETS SCORE
  // ============================================

  private calculateSupportTicketsScore(customer: Customer): number {
    // In production, fetch from support system
    // For now, use customer status as proxy
    if (customer.status === 'blocked') return 90;
    if (customer.status === 'inactive') return 60;
    return 20;
  }

  // ============================================
  // CALCULATE FEATURE USAGE SCORE
  // ============================================

  private calculateFeatureUsageScore(subscriptions: any[]): number {
    if (subscriptions.length === 0) return 80;

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const usageRate = (activeSubscriptions / subscriptions.length) * 100;

    return 100 - usageRate;
  }

  // ============================================
  // PREDICT UPSELL
  // ============================================

  async predictUpsell(customer: Customer): Promise<UpsellPrediction> {
    const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);

    // Calculate upsell probability based on LTV and engagement
    const ltvScore = Math.min(customer.ltv / 100, 100);
    const engagementScore = this.calculateEngagementScore(customer, relations);
    const upsellProbability = (ltvScore * 0.6 + engagementScore * 0.4);

    // Generate recommended products
    const recommendedProducts = this.generateRecommendedProducts(customer, upsellProbability);

    return {
      customerId: customer.id,
      upsellProbability: Math.round(upsellProbability),
      recommendedProducts,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // CALCULATE ENGAGEMENT SCORE
  // ============================================

  private calculateEngagementScore(customer: Customer, relations: any): number {
    const daysSinceLastActive = (Date.now() - new Date(customer.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
    
    let score = 100 - Math.min(daysSinceLastActive * 2, 80);
    
    if (relations.subscriptions.length > 0) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  // ============================================
  // GENERATE RECOMMENDED PRODUCTS
  // ============================================

  private generateRecommendedProducts(customer: Customer, upsellProbability: number): Array<{
    productId: string;
    productName: string;
    probability: number;
    expectedRevenue: number;
  }> {
    const products = [
      { productId: 'prod_1', productName: 'Enterprise Plan', basePrice: 99 },
      { productId: 'prod_2', productName: 'Premium Support', basePrice: 49 },
      { productId: 'prod_3', productName: 'Advanced Analytics', basePrice: 79 },
    ];

    return products.map((product) => ({
      ...product,
      probability: Math.round(upsellProbability * (0.8 + Math.random() * 0.2)),
      expectedRevenue: product.basePrice * (upsellProbability / 100),
    }));
  }

  // ============================================
  // ASSESS FRAUD RISK
  // ============================================

  async assessFraudRisk(customer: Customer, relations: any): Promise<FraudRiskAssessment> {
    const riskFactors = {
      multipleCards: this.detectMultipleCards(relations.transactions),
      unusualCountrySwitch: this.detectUnusualCountrySwitch(customer, relations.transactions),
      rapidPayments: this.detectRapidPayments(relations.transactions),
      suspiciousIP: false, // In production, check IP reputation
    };

    // Calculate fraud risk score
    let fraudRiskScore = 0;
    if (riskFactors.multipleCards) fraudRiskScore += 30;
    if (riskFactors.unusualCountrySwitch) fraudRiskScore += 40;
    if (riskFactors.rapidPayments) fraudRiskScore += 30;
    if (riskFactors.suspiciousIP) fraudRiskScore += 50;

    // Get flagged transactions
    const flaggedTransactions = relations.transactions
      .filter((t: any) => t.status === 'failed' || t.amount > 1000)
      .map((t: any) => t.id);

    return {
      customerId: customer.id,
      fraudRiskScore: Math.min(fraudRiskScore, 100),
      riskFactors,
      flaggedTransactions,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // DETECT MULTIPLE CARDS
  // ============================================

  private detectMultipleCards(transactions: any[]): boolean {
    // In production, check payment methods
    // For now, assume false
    return false;
  }

  // ============================================
  // DETECT UNUSUAL COUNTRY SWITCH
  // ============================================

  private detectUnusualCountrySwitch(customer: Customer, transactions: any[]): boolean {
    // In production, check transaction locations
    return false;
  }

  // ============================================
  // DETECT RAPID PAYMENTS
  // ============================================

  private detectRapidPayments(transactions: any[]): boolean {
    if (transactions.length < 3) return false;

    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (let i = 2; i < sortedTransactions.length; i++) {
      const timeDiff = new Date(sortedTransactions[i].createdAt).getTime() - 
                     new Date(sortedTransactions[i - 2].createdAt).getTime();
      
      // If 3 transactions within 1 hour
      if (timeDiff < 3600000) {
        return true;
      }
    }

    return false;
  }

  // ============================================
  // BATCH PREDICT CHURN
  // ============================================

  async batchPredictChurn(customers: Customer[]): Promise<Map<string, ChurnPrediction>> {
    const predictions = new Map<string, ChurnPrediction>();

    for (const customer of customers) {
      const prediction = await this.predictChurn(customer);
      predictions.set(customer.id, prediction);
    }

    return predictions;
  }

  // ============================================
  // BATCH PREDICT UPSELL
  // ============================================

  async batchPredictUpsell(customers: Customer[]): Promise<Map<string, UpsellPrediction>> {
    const predictions = new Map<string, UpsellPrediction>();

    for (const customer of customers) {
      const prediction = await this.predictUpsell(customer);
      predictions.set(customer.id, prediction);
    }

    return predictions;
  }

  // ============================================
  // BATCH ASSESS FRAUD RISK
  // ============================================

  async batchAssessFraudRisk(customers: Customer[]): Promise<Map<string, FraudRiskAssessment>> {
    const assessments = new Map<string, FraudRiskAssessment>();

    for (const customer of customers) {
      const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);
      const assessment = await this.assessFraudRisk(customer, relations);
      assessments.set(customer.id, assessment);
    }

    return assessments;
  }

  // ============================================
  // GET HIGH RISK CUSTOMERS
  // ============================================

  async getHighRiskCustomers(
    customers: Customer[],
    riskThreshold: number = 70
  ): Promise<{
    highChurnRisk: { customer: Customer; prediction: ChurnPrediction }[];
    highFraudRisk: { customer: Customer; assessment: FraudRiskAssessment }[];
  }> {
    const churnPredictions = await this.batchPredictChurn(customers);
    const fraudAssessments = await this.batchAssessFraudRisk(customers);

    const highChurnRisk: { customer: Customer; prediction: ChurnPrediction }[] = [];
    const highFraudRisk: { customer: Customer; assessment: FraudRiskAssessment }[] = [];

    for (const customer of customers) {
      const churnPrediction = churnPredictions.get(customer.id);
      if (churnPrediction && churnPrediction.churnProbability >= riskThreshold) {
        highChurnRisk.push({ customer, prediction: churnPrediction });
      }

      const fraudAssessment = fraudAssessments.get(customer.id);
      if (fraudAssessment && fraudAssessment.fraudRiskScore >= riskThreshold) {
        highFraudRisk.push({ customer, assessment: fraudAssessment });
      }
    }

    // Sort by risk score (highest first)
    highChurnRisk.sort((a, b) => b.prediction.churnProbability - a.prediction.churnProbability);
    highFraudRisk.sort((a, b) => b.assessment.fraudRiskScore - a.assessment.fraudRiskScore);

    return { highChurnRisk, highFraudRisk };
  }
}

// Export singleton instance
export const customerAIEngine = new CustomerAIEngine();

// ============================================
// REACT HOOK FOR CUSTOMER AI
// ============================================

import { useState, useCallback } from 'react';

export function useCustomerAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const predictChurn = useCallback(async (customer: Customer) => {
    setIsAnalyzing(true);
    try {
      const prediction = await customerAIEngine.predictChurn(customer);
      return prediction;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const predictUpsell = useCallback(async (customer: Customer) => {
    setIsAnalyzing(true);
    try {
      const prediction = await customerAIEngine.predictUpsell(customer);
      return prediction;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const assessFraudRisk = useCallback(async (customer: Customer, relations: any) => {
    setIsAnalyzing(true);
    try {
      const assessment = await customerAIEngine.assessFraudRisk(customer, relations);
      return assessment;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getHighRiskCustomers = useCallback(async (customers: Customer[], riskThreshold?: number) => {
    setIsAnalyzing(true);
    try {
      const result = await customerAIEngine.getHighRiskCustomers(customers, riskThreshold);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    isAnalyzing,
    predictChurn,
    predictUpsell,
    assessFraudRisk,
    getHighRiskCustomers,
  };
}
