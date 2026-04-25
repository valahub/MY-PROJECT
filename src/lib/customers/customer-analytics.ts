// Customer Analytics
// Total customers, active vs inactive, avg LTV, churn rate

import type { Customer, CustomerAnalytics } from './customer-types';

// ============================================
// CUSTOMER ANALYTICS ENGINE
// ============================================

export class CustomerAnalyticsEngine {
  // ============================================
  // CALCULATE ANALYTICS
  // ============================================

  calculateAnalytics(customers: Customer[]): CustomerAnalytics {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const inactiveCustomers = customers.filter((c) => c.status === 'inactive').length;
    const blockedCustomers = customers.filter((c) => c.status === 'blocked').length;

    const averageLTV = this.calculateAverageLTV(customers);
    const totalRevenue = customers.reduce((sum, c) => sum + c.ltv, 0);
    const churnRate = this.calculateChurnRate(customers);
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCustomersThisMonth = customers.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo).length;
    
    const churnedCustomersThisMonth = customers.filter((c) => {
      const updatedAt = new Date(c.updatedAt);
      const wasActive = c.status === 'inactive' || c.status === 'blocked';
      return wasActive && updatedAt >= thirtyDaysAgo;
    }).length;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      blockedCustomers,
      averageLTV,
      totalRevenue,
      churnRate,
      newCustomersThisMonth,
      churnedCustomersThisMonth,
    };
  }

  // ============================================
  // CALCULATE AVERAGE LTV
  // ============================================

  private calculateAverageLTV(customers: Customer[]): number {
    if (customers.length === 0) return 0;
    const total = customers.reduce((sum, c) => sum + c.ltv, 0);
    return total / customers.length;
  }

  // ============================================
  // CALCULATE CHURN RATE
  // ============================================

  private calculateChurnRate(customers: Customer[]): number {
    if (customers.length === 0) return 0;
    const inactiveOrBlocked = customers.filter((c) => c.status === 'inactive' || c.status === 'blocked').length;
    return (inactiveOrBlocked / customers.length) * 100;
  }

  // ============================================
  // GET REVENUE TREND
  // ============================================

  getRevenueTrend(customers: Customer[], days: number = 30): {
    dailyRevenue: { date: string; revenue: number }[];
    dailyCustomers: { date: string; count: number }[];
  } {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const dailyRevenue: { date: string; revenue: number }[] = [];
    const dailyCustomers: { date: string; count: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const customersCreatedOnDate = customers.filter((c) => {
        const createdDate = new Date(c.createdAt).toISOString().split('T')[0];
        return createdDate === dateStr;
      });

      const revenue = customersCreatedOnDate.reduce((sum, c) => sum + c.ltv, 0);

      dailyRevenue.push({ date: dateStr, revenue });
      dailyCustomers.push({ date: dateStr, count: customersCreatedOnDate.length });
    }

    return { dailyRevenue, dailyCustomers };
  }

  // ============================================
  // GET CUSTOMER GROWTH RATE
  // ============================================

  getCustomerGrowthRate(customers: Customer[], periodDays: number = 30): number {
    const now = new Date();
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const customersAtStart = customers.filter((c) => new Date(c.createdAt) < startDate).length;
    const customersAtEnd = customers.length;

    if (customersAtStart === 0) return 0;

    return ((customersAtEnd - customersAtStart) / customersAtStart) * 100;
  }

  // ============================================
  // GET COUNTRY DISTRIBUTION
  // ============================================

  getCountryDistribution(customers: Customer[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const customer of customers) {
      distribution[customer.country] = (distribution[customer.country] || 0) + 1;
    }

    return distribution;
  }

  // ============================================
  // GET LTV DISTRIBUTION
  // ============================================

  getLTVDistribution(customers: Customer[]): {
    under50: number;
    between50And100: number;
    between100And250: number;
    between250And500: number;
    between500And1000: number;
    over1000: number;
  } {
    const distribution = {
      under50: 0,
      between50And100: 0,
      between100And250: 0,
      between250And500: 0,
      between500And1000: 0,
      over1000: 0,
    };

    for (const customer of customers) {
      if (customer.ltv < 50) {
        distribution.under50++;
      } else if (customer.ltv < 100) {
        distribution.between50And100++;
      } else if (customer.ltv < 250) {
        distribution.between100And250++;
      } else if (customer.ltv < 500) {
        distribution.between250And500++;
      } else if (customer.ltv < 1000) {
        distribution.between500And1000++;
      } else {
        distribution.over1000++;
      }
    }

    return distribution;
  }

  // ============================================
  // GET RETENTION METRICS
  // ============================================

  getRetentionMetrics(customers: Customer[]): {
    retentionRate: number;
    averageCustomerLifetime: number;
    repeatPurchaseRate: number;
  } {
    if (customers.length === 0) {
      return {
        retentionRate: 0,
        averageCustomerLifetime: 0,
        repeatPurchaseRate: 0,
      };
    }

    const activeCustomers = customers.filter((c) => c.status === 'active').length;
    const retentionRate = (activeCustomers / customers.length) * 100;

    const now = Date.now();
    const totalLifetime = customers.reduce((sum, c) => {
      const lifetime = (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return sum + lifetime;
    }, 0);
    const averageCustomerLifetime = totalLifetime / customers.length;

    const customersWithMultipleSubs = customers.filter((c) => c.activeSubscriptions > 1).length;
    const repeatPurchaseRate = (customersWithMultipleSubs / customers.length) * 100;

    return {
      retentionRate,
      averageCustomerLifetime,
      repeatPurchaseRate,
    };
  }

  // ============================================
  // GET TOP CUSTOMERS BY LTV
  // ============================================

  getTopCustomersByLTV(customers: Customer[], limit: number = 10): Customer[] {
    return [...customers]
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, limit);
  }

  // ============================================
  // GET TOP CUSTOMERS BY RECENT ACTIVITY
  // ============================================

  getTopCustomersByRecentActivity(customers: Customer[], limit: number = 10): Customer[] {
    return [...customers]
      .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
      .slice(0, limit);
  }

  // ============================================
  // GET CUSTOMER HEALTH SCORE
  // ============================================

  getCustomerHealthScore(customer: Customer): number {
    let score = 100;

    // Deduct for inactive status
    if (customer.status === 'inactive') {
      score -= 30;
    } else if (customer.status === 'blocked') {
      score -= 50;
    }

    // Deduct for high churn risk
    score -= customer.churnRiskScore * 0.3;

    // Deduct for high fraud risk
    score -= customer.fraudRiskScore * 0.2;

    // Bonus for high LTV
    if (customer.ltv > 500) {
      score += 10;
    } else if (customer.ltv > 250) {
      score += 5;
    }

    // Bonus for active subscriptions
    score += customer.activeSubscriptions * 5;

    return Math.max(0, Math.min(100, score));
  }

  // ============================================
  // GET OVERALL HEALTH SCORE
  // ============================================

  getOverallHealthScore(customers: Customer[]): number {
    if (customers.length === 0) return 0;

    const totalScore = customers.reduce((sum, c) => sum + this.getCustomerHealthScore(c), 0);
    return totalScore / customers.length;
  }

  // ============================================
  // GET DASHBOARD SUMMARY
  // ============================================

  getDashboardSummary(customers: Customer[]): {
    analytics: CustomerAnalytics;
    growthRate: number;
    retentionMetrics: ReturnType<typeof this.getRetentionMetrics>;
    countryDistribution: Record<string, number>;
    ltvDistribution: ReturnType<typeof this.getLTVDistribution>;
    overallHealthScore: number;
    topCustomersByLTV: Customer[];
    topCustomersByRecentActivity: Customer[];
  } {
    const analytics = this.calculateAnalytics(customers);
    const growthRate = this.getCustomerGrowthRate(customers);
    const retentionMetrics = this.getRetentionMetrics(customers);
    const countryDistribution = this.getCountryDistribution(customers);
    const ltvDistribution = this.getLTVDistribution(customers);
    const overallHealthScore = this.getOverallHealthScore(customers);
    const topCustomersByLTV = this.getTopCustomersByLTV(customers);
    const topCustomersByRecentActivity = this.getTopCustomersByRecentActivity(customers);

    return {
      analytics,
      growthRate,
      retentionMetrics,
      countryDistribution,
      ltvDistribution,
      overallHealthScore,
      topCustomersByLTV,
      topCustomersByRecentActivity,
    };
  }
}

// Export singleton instance
export const customerAnalyticsEngine = new CustomerAnalyticsEngine();

// ============================================
// REACT HOOK FOR CUSTOMER ANALYTICS
// ============================================

import { useState, useCallback } from 'react';

export function useCustomerAnalytics() {
  const [isLoading, setIsLoading] = useState(false);

  const calculateAnalytics = useCallback((customers: Customer[]) => {
    setIsLoading(true);
    try {
      const analytics = customerAnalyticsEngine.calculateAnalytics(customers);
      return analytics;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRevenueTrend = useCallback((customers: Customer[], days?: number) => {
    return customerAnalyticsEngine.getRevenueTrend(customers, days);
  }, []);

  const getCustomerGrowthRate = useCallback((customers: Customer[], periodDays?: number) => {
    return customerAnalyticsEngine.getCustomerGrowthRate(customers, periodDays);
  }, []);

  const getCountryDistribution = useCallback((customers: Customer[]) => {
    return customerAnalyticsEngine.getCountryDistribution(customers);
  }, []);

  const getLTVDistribution = useCallback((customers: Customer[]) => {
    return customerAnalyticsEngine.getLTVDistribution(customers);
  }, []);

  const getRetentionMetrics = useCallback((customers: Customer[]) => {
    return customerAnalyticsEngine.getRetentionMetrics(customers);
  }, []);

  const getDashboardSummary = useCallback((customers: Customer[]) => {
    setIsLoading(true);
    try {
      const summary = customerAnalyticsEngine.getDashboardSummary(customers);
      return summary;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    calculateAnalytics,
    getRevenueTrend,
    getCustomerGrowthRate,
    getCountryDistribution,
    getLTVDistribution,
    getRetentionMetrics,
    getDashboardSummary,
  };
}
