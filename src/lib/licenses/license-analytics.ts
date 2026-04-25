// License Analytics
// Total licenses, active ratio, expiry trend

import type { License, LicenseAnalytics } from './license-types';

// ============================================
// LICENSE ANALYTICS ENGINE
// ============================================

export class LicenseAnalyticsEngine {
  // ============================================
  // CALCULATE ANALYTICS
  // ============================================

  calculateAnalytics(licenses: License[]): LicenseAnalytics {
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter((l) => l.status === 'active').length;
    const expiredLicenses = licenses.filter((l) => l.status === 'expired').length;
    const disabledLicenses = licenses.filter((l) => l.status === 'disabled').length;
    const revokedLicenses = licenses.filter((l) => l.status === 'revoked').length;
    const activeRatio = totalLicenses > 0 ? (activeLicenses / totalLicenses) * 100 : 0;
    const totalActivations = licenses.reduce((sum, l) => sum + l.activationCount, 0);
    const averageActivationsPerLicense = totalLicenses > 0 ? totalActivations / totalLicenses : 0;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringNext7Days = licenses.filter((l) => {
      const expiresAt = new Date(l.expiresAt);
      return l.status === 'active' && expiresAt <= sevenDaysFromNow && expiresAt > now;
    }).length;

    const expiringNext30Days = licenses.filter((l) => {
      const expiresAt = new Date(l.expiresAt);
      return l.status === 'active' && expiresAt <= thirtyDaysFromNow && expiresAt > now;
    }).length;

    return {
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      disabledLicenses,
      revokedLicenses,
      activeRatio,
      totalActivations,
      averageActivationsPerLicense,
      expiringNext7Days,
      expiringNext30Days,
    };
  }

  // ============================================
  // GET EXPIRY TREND
  // ============================================

  getExpiryTrend(licenses: License[], days: number = 30): {
    dailyExpirations: { date: string; count: number }[];
    dailyActivations: { date: string; count: number }[];
  } {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const dailyExpirations: { date: string; count: number }[] = [];
    const dailyActivations: { date: string; count: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const licensesExpiringOnDate = licenses.filter((l) => {
        const expiresDate = new Date(l.expiresAt).toISOString().split('T')[0];
        return expiresDate === dateStr && l.status === 'expired';
      });

      const licensesActivatedOnDate = licenses.filter((l) => {
        const issuedDate = new Date(l.issuedAt).toISOString().split('T')[0];
        return issuedDate === dateStr;
      });

      dailyExpirations.push({ date: dateStr, count: licensesExpiringOnDate.length });
      dailyActivations.push({ date: dateStr, count: licensesActivatedOnDate.length });
    }

    return { dailyExpirations, dailyActivations };
  }

  // ============================================
  // GET PRODUCT DISTRIBUTION
  // ============================================

  getProductDistribution(licenses: License[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const license of licenses) {
      distribution[license.productId] = (distribution[license.productId] || 0) + 1;
    }

    return distribution;
  }

  // ============================================
  // GET CUSTOMER DISTRIBUTION
  // ============================================

  getCustomerDistribution(licenses: License[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const license of licenses) {
      distribution[license.customerId] = (distribution[license.customerId] || 0) + 1;
    }

    return distribution;
  }

  // ============================================
  // GET ACTIVATION DISTRIBUTION
  // ============================================

  getActivationDistribution(licenses: License[]): {
    zeroActivations: number;
    oneActivation: number;
    twoActivations: number;
    threeToFive: number;
    moreThanFive: number;
  } {
    const distribution = {
      zeroActivations: 0,
      oneActivation: 0,
      twoActivations: 0,
      threeToFive: 0,
      moreThanFive: 0,
    };

    for (const license of licenses) {
      if (license.activationCount === 0) {
        distribution.zeroActivations++;
      } else if (license.activationCount === 1) {
        distribution.oneActivation++;
      } else if (license.activationCount === 2) {
        distribution.twoActivations++;
      } else if (license.activationCount <= 5) {
        distribution.threeToFive++;
      } else {
        distribution.moreThanFive++;
      }
    }

    return distribution;
  }

  // ============================================
  // GET EXPIRY DISTRIBUTION
  // ============================================

  getExpiryDistribution(licenses: License[]): {
    next7Days: number;
    next30Days: number;
    next90Days: number;
    next180Days: number;
    moreThan180Days: number;
  } {
    const now = new Date();
    const distribution = {
      next7Days: 0,
      next30Days: 0,
      next90Days: 0,
      next180Days: 0,
      moreThan180Days: 0,
    };

    for (const license of licenses) {
      if (license.status !== 'active') continue;

      const expiresAt = new Date(license.expiresAt);
      const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry <= 7) {
        distribution.next7Days++;
      } else if (daysUntilExpiry <= 30) {
        distribution.next30Days++;
      } else if (daysUntilExpiry <= 90) {
        distribution.next90Days++;
      } else if (daysUntilExpiry <= 180) {
        distribution.next180Days++;
      } else {
        distribution.moreThan180Days++;
      }
    }

    return distribution;
  }

  // ============================================
  // GET TOP PRODUCTS BY LICENSES
  // ============================================

  getTopProductsByLicenses(licenses: License[], limit: number = 10): Array<{
    productId: string;
    count: number;
  }> {
    const distribution = this.getProductDistribution(licenses);

    return Object.entries(distribution)
      .map(([productId, count]) => ({ productId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ============================================
  // GET TOP CUSTOMERS BY LICENSES
  // ============================================

  getTopCustomersByLicenses(licenses: License[], limit: number = 10): Array<{
    customerId: string;
    count: number;
  }> {
    const distribution = this.getCustomerDistribution(licenses);

    return Object.entries(distribution)
      .map(([customerId, count]) => ({ customerId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ============================================
  // GET REVENUE ESTIMATE
  // ============================================

  getRevenueEstimate(licenses: License[], pricePerLicense: number = 100): {
    totalRevenue: number;
    activeRevenue: number;
    expiredRevenue: number;
  } {
    const totalRevenue = licenses.length * pricePerLicense;
    const activeRevenue = licenses.filter((l) => l.status === 'active').length * pricePerLicense;
    const expiredRevenue = licenses.filter((l) => l.status === 'expired').length * pricePerLicense;

    return {
      totalRevenue,
      activeRevenue,
      expiredRevenue,
    };
  }

  // ============================================
  // GET DASHBOARD SUMMARY
  // ============================================

  getDashboardSummary(licenses: License[]): {
    analytics: LicenseAnalytics;
    expiryTrend: ReturnType<typeof this.getExpiryTrend>;
    productDistribution: Record<string, number>;
    activationDistribution: ReturnType<typeof this.getActivationDistribution>;
    expiryDistribution: ReturnType<typeof this.getExpiryDistribution>;
    topProducts: ReturnType<typeof this.getTopProductsByLicenses>;
    topCustomers: ReturnType<typeof this.getTopCustomersByLicenses>;
  } {
    const analytics = this.calculateAnalytics(licenses);
    const expiryTrend = this.getExpiryTrend(licenses);
    const productDistribution = this.getProductDistribution(licenses);
    const activationDistribution = this.getActivationDistribution(licenses);
    const expiryDistribution = this.getExpiryDistribution(licenses);
    const topProducts = this.getTopProductsByLicenses(licenses);
    const topCustomers = this.getTopCustomersByLicenses(licenses);

    return {
      analytics,
      expiryTrend,
      productDistribution,
      activationDistribution,
      expiryDistribution,
      topProducts,
      topCustomers,
    };
  }
}

// Export singleton instance
export const licenseAnalyticsEngine = new LicenseAnalyticsEngine();

// ============================================
// REACT HOOK FOR LICENSE ANALYTICS
// ============================================

import { useState, useCallback } from 'react';

export function useLicenseAnalytics() {
  const [isLoading, setIsLoading] = useState(false);

  const calculateAnalytics = useCallback((licenses: License[]) => {
    setIsLoading(true);
    try {
      const analytics = licenseAnalyticsEngine.calculateAnalytics(licenses);
      return analytics;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getExpiryTrend = useCallback((licenses: License[], days?: number) => {
    return licenseAnalyticsEngine.getExpiryTrend(licenses, days);
  }, []);

  const getDashboardSummary = useCallback((licenses: License[]) => {
    setIsLoading(true);
    try {
      const summary = licenseAnalyticsEngine.getDashboardSummary(licenses);
      return summary;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    calculateAnalytics,
    getExpiryTrend,
    getDashboardSummary,
  };
}
