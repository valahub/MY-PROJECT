// Subscription Analytics
// Total active subscriptions, MRR total, churn rate

import type { Subscription, SubscriptionAnalytics } from './subscription-types';
import { mrrCalculationEngine } from './subscription-mrr';

// ============================================
// SUBSCRIPTION ANALYTICS ENGINE
// ============================================

export class SubscriptionAnalyticsEngine {
  // ============================================
  // CALCULATE ANALYTICS
  // ============================================

  calculateAnalytics(subscriptions: Subscription[]): SubscriptionAnalytics {
    return mrrCalculationEngine.calculateAnalytics(subscriptions);
  }

  // ============================================
  // GET STATUS DISTRIBUTION
  // ============================================

  getStatusDistribution(subscriptions: Subscription[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const subscription of subscriptions) {
      distribution[subscription.status] = (distribution[subscription.status] || 0) + 1;
    }

    return distribution;
  }

  // ============================================
  // GET BILLING CYCLE DISTRIBUTION
  // ============================================

  getBillingCycleDistribution(subscriptions: Subscription[]): {
    monthly: number;
    yearly: number;
  } {
    const monthly = subscriptions.filter((s) => s.billingCycle === 'monthly').length;
    const yearly = subscriptions.filter((s) => s.billingCycle === 'yearly').length;

    return { monthly, yearly };
  }

  // ============================================
  // GET PROVIDER DISTRIBUTION
  // ============================================

  getProviderDistribution(subscriptions: Subscription[]): {
    stripe: number;
    razorpay: number;
  } {
    const stripe = subscriptions.filter((s) => s.provider === 'stripe').length;
    const razorpay = subscriptions.filter((s) => s.provider === 'razorpay').length;

    return { stripe, razorpay };
  }

  // ============================================
  // GET SUBSCRIPTION GROWTH TREND
  // ============================================

  getSubscriptionGrowthTrend(subscriptions: Subscription[], days: number = 30): {
    dailyNewSubscriptions: { date: string; count: number }[];
  } {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const dailyNewSubscriptions: { date: string; count: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // In production, this would query historical data
      // For now, use placeholder data
      dailyNewSubscriptions.push({ date: dateStr, count: 0 });
    }

    return { dailyNewSubscriptions };
  }

  // ============================================
  // GET CHURN ANALYSIS
  // ============================================

  getChurnAnalysis(subscriptions: Subscription[]): {
    churnRate: number;
    churnedThisMonth: number;
    churnedLastMonth: number;
    churnReasons: Record<string, number>;
  } {
    const churnRate = mrrCalculationEngine.calculateChurnRate(subscriptions);
    const churnedThisMonth = subscriptions.filter((s) => {
      const canceledDate = new Date(s.updatedAt);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return s.status === 'canceled' && canceledDate > thirtyDaysAgo;
    }).length;

    const churnedLastMonth = subscriptions.filter((s) => {
      const canceledDate = new Date(s.updatedAt);
      const now = new Date();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return s.status === 'canceled' && canceledDate > sixtyDaysAgo && canceledDate <= thirtyDaysAgo;
    }).length;

    // In production, this would analyze actual churn reasons
    const churnReasons: Record<string, number> = {
      'payment_failed': 0,
      'user_canceled': 0,
      'plan_downgrade': 0,
      'other': 0,
    };

    return {
      churnRate,
      churnedThisMonth,
      churnedLastMonth,
      churnReasons,
    };
  }

  // ============================================
  // GET REVENUE ANALYSIS
  // ============================================

  getRevenueAnalysis(subscriptions: Subscription[]): {
    totalMRR: number;
    monthlyMRR: number;
    yearlyMRR: number;
    annualRevenue: number;
    averageRevenuePerSubscription: number;
  } {
    const totalMRR = mrrCalculationEngine.calculateTotalMRR(subscriptions);
    const monthlyMRR = mrrCalculationEngine.calculateMonthlyMRR(subscriptions);
    const yearlyMRR = mrrCalculationEngine.calculateYearlyMRR(subscriptions);
    const annualRevenue = totalMRR * 12;
    const averageRevenuePerSubscription = subscriptions.length > 0 ? totalMRR / subscriptions.length : 0;

    return {
      totalMRR,
      monthlyMRR,
      yearlyMRR,
      annualRevenue,
      averageRevenuePerSubscription,
    };
  }

  // ============================================
  // GET DASHBOARD SUMMARY
  // ============================================

  getDashboardSummary(subscriptions: Subscription[]): {
    analytics: SubscriptionAnalytics;
    statusDistribution: Record<string, number>;
    billingCycleDistribution: ReturnType<typeof this.getBillingCycleDistribution>;
    providerDistribution: ReturnType<typeof this.getProviderDistribution>;
    churnAnalysis: ReturnType<typeof this.getChurnAnalysis>;
    revenueAnalysis: ReturnType<typeof this.getRevenueAnalysis>;
  } {
    const analytics = this.calculateAnalytics(subscriptions);
    const statusDistribution = this.getStatusDistribution(subscriptions);
    const billingCycleDistribution = this.getBillingCycleDistribution(subscriptions);
    const providerDistribution = this.getProviderDistribution(subscriptions);
    const churnAnalysis = this.getChurnAnalysis(subscriptions);
    const revenueAnalysis = this.getRevenueAnalysis(subscriptions);

    return {
      analytics,
      statusDistribution,
      billingCycleDistribution,
      providerDistribution,
      churnAnalysis,
      revenueAnalysis,
    };
  }

  // ============================================
  // GET TOP METRICS
  // ============================================

  getTopMetrics(subscriptions: Subscription[]): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalMRR: number;
    churnRate: number;
    growthRate: number;
  } {
    const analytics = this.calculateAnalytics(subscriptions);

    return {
      totalSubscriptions: analytics.totalSubscriptions,
      activeSubscriptions: analytics.activeSubscriptions,
      totalMRR: analytics.totalMRR,
      churnRate: analytics.churnRate,
      growthRate: analytics.mrrGrowthRate,
    };
  }
}

// Export singleton instance
export const subscriptionAnalyticsEngine = new SubscriptionAnalyticsEngine();

// ============================================
// REACT HOOK FOR SUBSCRIPTION ANALYTICS
// ============================================

import { useState, useCallback } from 'react';

export function useSubscriptionAnalytics() {
  const [isLoading, setIsLoading] = useState(false);

  const calculateAnalytics = useCallback((subscriptions: Subscription[]) => {
    setIsLoading(true);
    try {
      const analytics = subscriptionAnalyticsEngine.calculateAnalytics(subscriptions);
      return analytics;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDashboardSummary = useCallback((subscriptions: Subscription[]) => {
    setIsLoading(true);
    try {
      const summary = subscriptionAnalyticsEngine.getDashboardSummary(subscriptions);
      return summary;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTopMetrics = useCallback((subscriptions: Subscription[]) => {
    return subscriptionAnalyticsEngine.getTopMetrics(subscriptions);
  }, []);

  const getChurnAnalysis = useCallback((subscriptions: Subscription[]) => {
    return subscriptionAnalyticsEngine.getChurnAnalysis(subscriptions);
  }, []);

  const getRevenueAnalysis = useCallback((subscriptions: Subscription[]) => {
    return subscriptionAnalyticsEngine.getRevenueAnalysis(subscriptions);
  }, []);

  return {
    isLoading,
    calculateAnalytics,
    getDashboardSummary,
    getTopMetrics,
    getChurnAnalysis,
    getRevenueAnalysis,
  };
}
