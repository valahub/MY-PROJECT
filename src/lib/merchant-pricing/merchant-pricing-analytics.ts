// Merchant Pricing Analytics
// Plan-wise revenue, conversion rate, churn per merchant
// STRICT: merchant-scoped analytics only

import type { MerchantPricingPlan, MerchantPricingAnalytics, MerchantCurrency } from './merchant-pricing-types';

// ============================================
// MERCHANT PRICING ANALYTICS ENGINE
// ============================================

export class MerchantPricingAnalyticsEngine {
  private pricingPlans: Map<string, MerchantPricingPlan> = new Map();
  private subscriptionData: Map<string, { planId: string; amount: number; status: string }> = new Map();

  // ============================================
  // CALCULATE ANALYTICS
  // ============================================

  calculateAnalytics(merchantId: string): MerchantPricingAnalytics {
    const merchantPlans = Array.from(this.pricingPlans.values()).filter(
      (plan) => plan.merchantId === merchantId
    );

    const totalPlans = merchantPlans.length;
    const activePlans = merchantPlans.filter((p) => p.status === 'active').length;
    const archivedPlans = merchantPlans.filter((p) => p.status === 'archived').length;
    const draftPlans = merchantPlans.filter((p) => p.status === 'draft').length;

    // Plan-wise revenue
    const planWiseRevenue = this.calculatePlanWiseRevenue(merchantId, merchantPlans);

    // Plan conversion rate
    const planConversionRate = this.calculatePlanConversionRate(merchantId, merchantPlans);

    // Churn per plan
    const churnPerPlan = this.calculateChurnPerPlan(merchantId, merchantPlans);

    // Total MRR and ARR
    const { totalMRR, totalARR, currency } = this.calculateMRRARR(merchantId, merchantPlans);

    return {
      merchantId,
      totalPlans,
      activePlans,
      archivedPlans,
      draftPlans,
      planWiseRevenue,
      planConversionRate,
      churnPerPlan,
      totalMRR,
      totalARR,
      currency,
    };
  }

  // ============================================
  // CALCULATE PLAN-WISE REVENUE
  // ============================================

  private calculatePlanWiseRevenue(
    merchantId: string,
    merchantPlans: MerchantPricingPlan[]
  ): Array<{ planId: string; planName: string; revenue: number; currency: MerchantCurrency }> {
    const planRevenue: Map<string, { planName: string; revenue: number; currency: MerchantCurrency }> = new Map();

    // Initialize with all plans
    for (const plan of merchantPlans) {
      planRevenue.set(plan.id, {
        planName: plan.name,
        revenue: 0,
        currency: plan.currency,
      });
    }

    // Add subscription revenue
    for (const sub of this.subscriptionData.values()) {
      const plan = merchantPlans.find((p) => p.id === sub.planId);
      if (plan && plan.merchantId === merchantId && sub.status === 'active') {
        const current = planRevenue.get(plan.id);
        if (current) {
          current.revenue += sub.amount;
        }
      }
    }

    return Array.from(planRevenue.entries()).map(([planId, data]) => ({
      planId,
      planName: data.planName,
      revenue: data.revenue,
      currency: data.currency,
    }));
  }

  // ============================================
  // CALCULATE PLAN CONVERSION RATE
  // ============================================

  private calculatePlanConversionRate(
    merchantId: string,
    merchantPlans: MerchantPricingPlan[]
  ): Array<{ planId: string; planName: string; conversionRate: number }> {
    const planStats: Map<string, { views: number; conversions: number }> = new Map();

    // Initialize with all plans
    for (const plan of merchantPlans) {
      planStats.set(plan.id, { views: 0, conversions: 0 });
    }

    // In production, fetch actual view and conversion data
    // For now, use placeholder data
    for (const plan of merchantPlans) {
      const stats = planStats.get(plan.id);
      if (stats) {
        stats.views = Math.floor(Math.random() * 1000) + 100;
        stats.conversions = Math.floor(stats.views * (Math.random() * 0.1 + 0.05));
      }
    }

    return Array.from(planStats.entries()).map(([planId, stats]) => {
      const plan = merchantPlans.find((p) => p.id === planId);
      const conversionRate = stats.views > 0 ? (stats.conversions / stats.views) * 100 : 0;
      return {
        planId,
        planName: plan?.name || 'Unknown',
        conversionRate,
      };
    });
  }

  // ============================================
  // CALCULATE CHURN PER PLAN
  // ============================================

  private calculateChurnPerPlan(
    merchantId: string,
    merchantPlans: MerchantPricingPlan[]
  ): Array<{ planId: string; planName: string; churnRate: number }> {
    const planChurn: Map<string, { active: number; churned: number }> = new Map();

    // Initialize with all plans
    for (const plan of merchantPlans) {
      planChurn.set(plan.id, { active: 0, churned: 0 });
    }

    // Count active and churned subscriptions
    for (const sub of this.subscriptionData.values()) {
      const plan = merchantPlans.find((p) => p.id === sub.planId);
      if (plan && plan.merchantId === merchantId) {
        const stats = planChurn.get(plan.id);
        if (stats) {
          if (sub.status === 'active') {
            stats.active++;
          } else if (sub.status === 'cancelled' || sub.status === 'churned') {
            stats.churned++;
          }
        }
      }
    }

    return Array.from(planChurn.entries()).map(([planId, stats]) => {
      const plan = merchantPlans.find((p) => p.id === planId);
      const total = stats.active + stats.churned;
      const churnRate = total > 0 ? (stats.churned / total) * 100 : 0;
      return {
        planId,
        planName: plan?.name || 'Unknown',
        churnRate,
      };
    });
  }

  // ============================================
  // CALCULATE MRR AND ARR
  // ============================================

  private calculateMRRARR(
    merchantId: string,
    merchantPlans: MerchantPricingPlan[]
  ): { totalMRR: number; totalARR: number; currency: MerchantCurrency } {
    let totalMRR = 0;
    let currency: MerchantCurrency = 'USD';

    for (const sub of this.subscriptionData.values()) {
      const plan = merchantPlans.find((p) => p.id === sub.planId);
      if (plan && plan.merchantId === merchantId && sub.status === 'active') {
        currency = plan.currency;
        // Calculate monthly recurring revenue
        if (plan.interval === 'monthly') {
          totalMRR += sub.amount;
        } else if (plan.interval === 'yearly') {
          totalMRR += sub.amount / 12;
        } else if (plan.interval === 'quarterly') {
          totalMRR += sub.amount / 3;
        } else if (plan.interval === 'weekly') {
          totalMRR += sub.amount * 4;
        }
      }
    }

    const totalARR = totalMRR * 12;

    return { totalMRR, totalARR, currency };
  }

  // ============================================
  // GET REVENUE TREND
  // ============================================

  getRevenueTrend(merchantId: string, days: number = 30): Array<{
    date: string;
    revenue: number;
    currency: MerchantCurrency;
  }> {
    const trend: Array<{ date: string; revenue: number; currency: MerchantCurrency }> = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // In production, fetch actual revenue data
      // For now, use placeholder data
      const revenue = Math.random() * 10000 + 5000;
      const currency = 'USD' as MerchantCurrency;

      trend.push({ date: dateStr, revenue, currency });
    }

    return trend;
  }

  // ============================================
  // GET TOP PERFORMING PLANS
  // ============================================

  getTopPerformingPlans(merchantId: string, limit: number = 5): Array<{
    planId: string;
    planName: string;
    revenue: number;
    conversionRate: number;
  }> {
    const analytics = this.calculateAnalytics(merchantId);

    const planPerformance = analytics.planWiseRevenue.map((revenueData) => {
      const conversionData = analytics.planConversionRate.find(
        (c) => c.planId === revenueData.planId
      );
      return {
        planId: revenueData.planId,
        planName: revenueData.planName,
        revenue: revenueData.revenue,
        conversionRate: conversionData?.conversionRate || 0,
      };
    });

    return planPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  // ============================================
  // REGISTER PRICING PLAN
  // ============================================

  registerPricingPlan(pricingPlan: MerchantPricingPlan): void {
    this.pricingPlans.set(pricingPlan.id, pricingPlan);
  }

  // ============================================
  // UNREGISTER PRICING PLAN
  // ============================================

  unregisterPricingPlan(pricingPlanId: string): void {
    this.pricingPlans.delete(pricingPlanId);
  }

  // ============================================
  // ADD SUBSCRIPTION DATA
  // ============================================

  addSubscriptionData(subscriptionId: string, planId: string, amount: number, status: string): void {
    this.subscriptionData.set(subscriptionId, { planId, amount, status });
  }

  // ============================================
  // REMOVE SUBSCRIPTION DATA
  // ============================================

  removeSubscriptionData(subscriptionId: string): void {
    this.subscriptionData.delete(subscriptionId);
  }

  // ============================================
  // GET PRICING PLAN
  // ============================================

  getPricingPlan(pricingPlanId: string): MerchantPricingPlan | null {
    return this.pricingPlans.get(pricingPlanId) || null;
  }

  // ============================================
  // GET ALL PRICING PLANS
  // ============================================

  getAllPricingPlans(): MerchantPricingPlan[] {
    return Array.from(this.pricingPlans.values());
  }
}

// Export singleton instance
export const merchantPricingAnalyticsEngine = new MerchantPricingAnalyticsEngine();

// ============================================
// REACT HOOK FOR ANALYTICS
// ============================================

import { useCallback } from 'react';

export function useMerchantPricingAnalytics() {
  const calculateAnalytics = useCallback((merchantId: string) => {
    return merchantPricingAnalyticsEngine.calculateAnalytics(merchantId);
  }, []);

  const getRevenueTrend = useCallback((merchantId: string, days?: number) => {
    return merchantPricingAnalyticsEngine.getRevenueTrend(merchantId, days);
  }, []);

  const getTopPerformingPlans = useCallback((merchantId: string, limit?: number) => {
    return merchantPricingAnalyticsEngine.getTopPerformingPlans(merchantId, limit);
  }, []);

  return {
    calculateAnalytics,
    getRevenueTrend,
    getTopPerformingPlans,
  };
}
