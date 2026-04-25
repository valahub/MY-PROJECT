// Subscription MRR Calculation Engine
// Monthly → full value, Yearly → value / 12

import type { Subscription, SubscriptionAnalytics, BillingCycle } from './subscription-types';

// ============================================
// MRR CALCULATION ENGINE
// ============================================

export class MRRCalculationEngine {
  // ============================================
  // CALCULATE MRR FOR SUBSCRIPTION
  // ============================================

  calculateMRR(subscription: Subscription): number {
    if (subscription.billingCycle === 'monthly') {
      return subscription.mrr;
    } else if (subscription.billingCycle === 'yearly') {
      return subscription.mrr / 12;
    }

    return 0;
  }

  // ============================================
  // CALCULATE TOTAL MRR
  // ============================================

  calculateTotalMRR(subscriptions: Subscription[]): number {
    return subscriptions.reduce((total, subscription) => {
      return total + this.calculateMRR(subscription);
    }, 0);
  }

  // ============================================
  // CALCULATE MONTHLY MRR
  // ============================================

  calculateMonthlyMRR(subscriptions: Subscription[]): number {
    return subscriptions
      .filter((sub) => sub.billingCycle === 'monthly')
      .reduce((total, subscription) => total + subscription.mrr, 0);
  }

  // ============================================
  // CALCULATE YEARLY MRR
  // ============================================

  calculateYearlyMRR(subscriptions: Subscription[]): number {
    return subscriptions
      .filter((sub) => sub.billingCycle === 'yearly')
      .reduce((total, subscription) => total + subscription.mrr / 12, 0);
  }

  // ============================================
  // CALCULATE ANALYTICS
  // ============================================

  calculateAnalytics(subscriptions: Subscription[]): SubscriptionAnalytics {
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const trialingSubscriptions = subscriptions.filter((s) => s.status === 'trialing').length;
    const pastDueSubscriptions = subscriptions.filter((s) => s.status === 'past_due').length;
    const canceledSubscriptions = subscriptions.filter((s) => s.status === 'canceled').length;
    const pausedSubscriptions = subscriptions.filter((s) => s.status === 'paused').length;

    const totalMRR = this.calculateTotalMRR(subscriptions);
    const monthlyMRR = this.calculateMonthlyMRR(subscriptions);
    const yearlyMRR = this.calculateYearlyMRR(subscriptions);

    const churnRate = this.calculateChurnRate(subscriptions);
    const mrrGrowthRate = this.calculateMRRGrowthRate(subscriptions);

    return {
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      pastDueSubscriptions,
      canceledSubscriptions,
      pausedSubscriptions,
      totalMRR,
      monthlyMRR,
      yearlyMRR,
      churnRate,
      mrrGrowthRate,
    };
  }

  // ============================================
  // CALCULATE CHURN RATE
  // ============================================

  calculateChurnRate(subscriptions: Subscription[]): number {
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const canceledSubscriptions = subscriptions.filter((s) => s.status === 'canceled').length;

    if (activeSubscriptions === 0) return 0;

    return (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions)) * 100;
  }

  // ============================================
  // CALCULATE MRR GROWTH RATE
  // ============================================

  calculateMRRGrowthRate(subscriptions: Subscription[]): number {
    // In production, this would compare with previous period
    // For now, return 0 as placeholder
    return 0;
  }

  // ============================================
  // GET MRR BY BILLING CYCLE
  // ============================================

  getMRRByBillingCycle(subscriptions: Subscription[]): {
    monthly: number;
    yearly: number;
  } {
    return {
      monthly: this.calculateMonthlyMRR(subscriptions),
      yearly: this.calculateYearlyMRR(subscriptions),
    };
  }

  // ============================================
  // GET MRR BY STATUS
  // ============================================

  getMRRByStatus(subscriptions: Subscription[]): {
    active: number;
    trialing: number;
    past_due: number;
    paused: number;
  } {
    const active = this.calculateTotalMRR(subscriptions.filter((s) => s.status === 'active'));
    const trialing = this.calculateTotalMRR(subscriptions.filter((s) => s.status === 'trialing'));
    const past_due = this.calculateTotalMRR(subscriptions.filter((s) => s.status === 'past_due'));
    const paused = this.calculateTotalMRR(subscriptions.filter((s) => s.status === 'paused'));

    return { active, trialing, past_due, paused };
  }

  // ============================================
  // GET MRR TREND
  // ============================================

  getMRRTrend(subscriptions: Subscription[], days: number = 30): {
    dailyMRR: { date: string; mrr: number }[];
  } {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const dailyMRR: { date: string; mrr: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // In production, this would query historical data
      // For now, use current MRR as placeholder
      dailyMRR.push({ date: dateStr, mrr: this.calculateTotalMRR(subscriptions) });
    }

    return { dailyMRR };
  }

  // ============================================
  // GET SUBSCRIPTION VALUE
  // ============================================

  getSubscriptionValue(subscription: Subscription): number {
    return subscription.mrr;
  }

  // ============================================
  // GET LIFETIME VALUE (LTV)
  // ============================================

  getLifetimeValue(subscription: Subscription, avgMonths: number = 12): number {
    const monthlyMRR = this.calculateMRR(subscription);
    return monthlyMRR * avgMonths;
  }

  // ============================================
  // GET ANNUAL REVENUE
  // ============================================

  getAnnualRevenue(subscriptions: Subscription[]): number {
    return this.calculateTotalMRR(subscriptions) * 12;
  }

  // ============================================
  // GET REVENUE FORECAST
  // ============================================

  getRevenueForecast(subscriptions: Subscription[], months: number = 12): {
    month: number;
    revenue: number;
  }[] {
    const forecast: { month: number; revenue: number }[] = [];
    const monthlyMRR = this.calculateTotalMRR(subscriptions);

    for (let i = 1; i <= months; i++) {
      forecast.push({
        month: i,
        revenue: monthlyMRR * i,
      });
    }

    return forecast;
  }

  // ============================================
  // UPDATE MRR ON SUBSCRIPTION CHANGE
  // ============================================

  updateMRROnSubscriptionChange(
    subscriptions: Subscription[],
    changedSubscription: Subscription
  ): SubscriptionAnalytics {
    // Find and update the subscription
    const index = subscriptions.findIndex((s) => s.id === changedSubscription.id);
    if (index !== -1) {
      subscriptions[index] = changedSubscription;
    }

    return this.calculateAnalytics(subscriptions);
  }
}

// Export singleton instance
export const mrrCalculationEngine = new MRRCalculationEngine();

// ============================================
// REACT HOOK FOR MRR CALCULATION
// ============================================

import { useState, useCallback } from 'react';

export function useMRRCalculation() {
  const [isLoading, setIsLoading] = useState(false);

  const calculateMRR = useCallback((subscription: Subscription) => {
    return mrrCalculationEngine.calculateMRR(subscription);
  }, []);

  const calculateTotalMRR = useCallback((subscriptions: Subscription[]) => {
    return mrrCalculationEngine.calculateTotalMRR(subscriptions);
  }, []);

  const calculateAnalytics = useCallback((subscriptions: Subscription[]) => {
    setIsLoading(true);
    try {
      const analytics = mrrCalculationEngine.calculateAnalytics(subscriptions);
      return analytics;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMRRByBillingCycle = useCallback((subscriptions: Subscription[]) => {
    return mrrCalculationEngine.getMRRByBillingCycle(subscriptions);
  }, []);

  const getMRRByStatus = useCallback((subscriptions: Subscription[]) => {
    return mrrCalculationEngine.getMRRByStatus(subscriptions);
  }, []);

  const getRevenueForecast = useCallback((subscriptions: Subscription[], months?: number) => {
    return mrrCalculationEngine.getRevenueForecast(subscriptions, months);
  }, []);

  return {
    isLoading,
    calculateMRR,
    calculateTotalMRR,
    calculateAnalytics,
    getMRRByBillingCycle,
    getMRRByStatus,
    getRevenueForecast,
  };
}
