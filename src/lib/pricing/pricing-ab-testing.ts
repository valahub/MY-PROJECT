// A/B Testing Engine
// Variants, conversion tracking, auto selection

import type { ABTest, ABTestVariant, PricingPlan } from './pricing-types';
import { pricingAPI } from './pricing-api';

// ============================================
// A/B TEST CONFIGURATION
// ============================================

export interface ABTestConfig {
  minSampleSize: number;
  significanceLevel: number;
  minTestDuration: number; // in milliseconds
  autoSelectWinner: boolean;
}

const DEFAULT_AB_TEST_CONFIG: ABTestConfig = {
  minSampleSize: 100,
  significanceLevel: 0.05,
  minTestDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoSelectWinner: false,
};

// ============================================
// A/B TEST ENGINE
// ============================================

export class ABTestEngine {
  private config: ABTestConfig;
  private activeTests: Map<string, ABTest> = new Map();

  constructor(config: Partial<ABTestConfig> = {}) {
    this.config = { ...DEFAULT_AB_TEST_CONFIG, ...config };
  }

  // ============================================
  // CREATE A/B TEST
  // ============================================

  async createTest(
    planId: string,
    name: string,
    variants: Omit<ABTestVariant, 'id' | 'conversions' | 'views' | 'conversionRate' | 'revenue'>[],
    userId: string
  ): Promise<ABTest | null> {
    try {
      // Validate traffic allocation sums to 1
      const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
      if (Math.abs(totalAllocation - 1) > 0.01) {
        throw new Error('Traffic allocation must sum to 1');
      }

      const testVariants: ABTestVariant[] = variants.map((v, index) => ({
        ...v,
        id: `variant_${Date.now()}_${index}`,
        conversions: 0,
        views: 0,
        conversionRate: 0,
        revenue: 0,
      }));

      const test: Partial<ABTest> = {
        id: `test_${Date.now()}`,
        planId,
        name,
        status: 'running',
        variants: testVariants,
        startDate: new Date().toISOString(),
        createdBy: userId,
      };

      const result = await pricingAPI.createABTest(planId, test);

      if (result.success && result.data) {
        this.activeTests.set(result.data.id, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('[ABTestEngine] Failed to create test:', error);
      return null;
    }
  }

  // ============================================
  // TRACK VARIANT VIEW
  // ============================================

  trackView(testId: string, variantId: string): void {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const variant = test.variants.find((v) => v.id === variantId);
    if (!variant) return;

    variant.views++;
    this.updateConversionRate(variant);

    // Update in memory (would sync with API in production)
    this.activeTests.set(testId, test);
  }

  // ============================================
  // TRACK VARIANT CONVERSION
  // ============================================

  trackConversion(testId: string, variantId: string, revenue: number): void {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const variant = test.variants.find((v) => v.id === variantId);
    if (!variant) return;

    variant.conversions++;
    variant.revenue += revenue;
    this.updateConversionRate(variant);

    // Update in memory (would sync with API in production)
    this.activeTests.set(testId, test);

    // Check if we should auto-select winner
    if (this.config.autoSelectWinner) {
      this.checkForWinner(test);
    }
  }

  // ============================================
  // UPDATE CONVERSION RATE
  // ============================================

  private updateConversionRate(variant: ABTestVariant): void {
    if (variant.views > 0) {
      variant.conversionRate = variant.conversions / variant.views;
    }
  }

  // ============================================
  // GET VARIANT FOR USER
  // ============================================

  getVariantForUser(testId: string, userId: string): ABTestVariant | null {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') return null;

    // Use hash of userId for consistent assignment
    const hash = this.hashString(userId);
    const random = (hash % 100) / 100;

    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.trafficAllocation;
      if (random <= cumulative) {
        return variant;
      }
    }

    return test.variants[0];
  }

  // ============================================
  // HASH STRING (SIMPLE)
  // ============================================

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // ============================================
  // CHECK FOR WINNER
  // ============================================

  checkForWinner(test: ABTest): ABTestVariant | null {
    if (test.status !== 'running') return null;

    // Check minimum sample size
    const totalViews = test.variants.reduce((sum, v) => sum + v.views, 0);
    if (totalViews < this.config.minSampleSize) return null;

    // Check minimum test duration
    const testDuration = Date.now() - new Date(test.startDate).getTime();
    if (testDuration < this.config.minTestDuration) return null;

    // Perform statistical test (simplified chi-squared)
    const winner = this.performStatisticalTest(test);

    if (winner && this.config.autoSelectWinner) {
      this.selectWinner(test.id, winner.id);
    }

    return winner;
  }

  // ============================================
  // PERFORM STATISTICAL TEST
  // ============================================

  private performStatisticalTest(test: ABTest): ABTestVariant | null {
    const variants = test.variants.filter((v) => v.views >= this.config.minSampleSize / 2);
    if (variants.length < 2) return null;

    // Sort by conversion rate
    const sorted = [...variants].sort((a, b) => b.conversionRate - a.conversionRate);
    const best = sorted[0];
    const second = sorted[1];

    if (!best || !second) return null;

    // Calculate chi-squared statistic (simplified)
    const expectedConversionsBest = best.views * (best.conversions + second.conversions) / (best.views + second.views);
    const chiSquared = Math.pow(best.conversions - expectedConversionsBest, 2) / expectedConversionsBest;

    // Check significance
    if (chiSquared > 3.84) { // Chi-squared critical value for 95% confidence
      return best;
    }

    return null;
  }

  // ============================================
  // SELECT WINNER
  // ============================================

  async selectWinner(testId: string, variantId: string): Promise<ABTest | null> {
    try {
      const result = await pricingAPI.completeABTest(testId);

      if (result.success && result.data) {
        // Update winner
        result.data.winner = variantId;
        this.activeTests.set(testId, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('[ABTestEngine] Failed to select winner:', error);
      return null;
    }
  }

  // ============================================
  // PAUSE TEST
  // ============================================

  async pauseTest(testId: string): Promise<ABTest | null> {
    try {
      const result = await pricingAPI.pauseABTest(testId);

      if (result.success && result.data) {
        this.activeTests.set(testId, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('[ABTestEngine] Failed to pause test:', error);
      return null;
    }
  }

  // ============================================
  // COMPLETE TEST
  // ============================================

  async completeTest(testId: string): Promise<ABTest | null> {
    try {
      const result = await pricingAPI.completeABTest(testId);

      if (result.success && result.data) {
        this.activeTests.set(testId, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('[ABTestEngine] Failed to complete test:', error);
      return null;
    }
  }

  // ============================================
  // GET TEST RESULTS
  // ============================================

  getTestResults(testId: string): {
    test: ABTest | null;
    winner: ABTestVariant | null;
    statistics: {
      totalViews: number;
      totalConversions: number;
      overallConversionRate: number;
      bestConversionRate: number;
      worstConversionRate: number;
    };
  } {
    const test = this.activeTests.get(testId);
    if (!test) {
      return {
        test: null,
        winner: null,
        statistics: {
          totalViews: 0,
          totalConversions: 0,
          overallConversionRate: 0,
          bestConversionRate: 0,
          worstConversionRate: 0,
        },
      };
    }

    const totalViews = test.variants.reduce((sum, v) => sum + v.views, 0);
    const totalConversions = test.variants.reduce((sum, v) => sum + v.conversions, 0);
    const overallConversionRate = totalViews > 0 ? totalConversions / totalViews : 0;

    const conversionRates = test.variants.map((v) => v.conversionRate);
    const bestConversionRate = Math.max(...conversionRates);
    const worstConversionRate = Math.min(...conversionRates);

    const winner = test.winner ? test.variants.find((v) => v.id === test.winner) || null : null;

    return {
      test,
      winner,
      statistics: {
        totalViews,
        totalConversions,
        overallConversionRate,
        bestConversionRate,
        worstConversionRate,
      },
    };
  }

  // ============================================
  // LOAD TESTS
  // ============================================

  async loadTests(planId: string): Promise<ABTest[]> {
    try {
      const result = await pricingAPI.getABTests(planId);

      if (result.success && result.data) {
        for (const test of result.data) {
          this.activeTests.set(test.id, test);
        }
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('[ABTestEngine] Failed to load tests:', error);
      return [];
    }
  }

  // ============================================
  // UPDATE CONFIG
  // ============================================

  updateConfig(config: Partial<ABTestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // GET ACTIVE TESTS
  // ============================================

  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values()).filter((t) => t.status === 'running');
  }

  // ============================================
  // CLEANUP
  // ============================================

  cleanup(): void {
    this.activeTests.clear();
  }
}

// Export singleton instance
export const abTestEngine = new ABTestEngine();

// ============================================
// REACT HOOK FOR A/B TESTING
// ============================================

import { useState, useCallback, useEffect } from 'react';

export function useABTesting() {
  const [isLoading, setIsLoading] = useState(false);
  const [tests, setTests] = useState<ABTest[]>([]);

  const createTest = useCallback(async (
    planId: string,
    name: string,
    variants: Omit<ABTestVariant, 'id' | 'conversions' | 'views' | 'conversionRate' | 'revenue'>[],
    userId: string
  ) => {
    setIsLoading(true);
    try {
      const test = await abTestEngine.createTest(planId, name, variants, userId);
      if (test) {
        setTests((prev) => [...prev, test]);
      }
      return test;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trackView = useCallback((testId: string, variantId: string) => {
    abTestEngine.trackView(testId, variantId);
  }, []);

  const trackConversion = useCallback((testId: string, variantId: string, revenue: number) => {
    abTestEngine.trackConversion(testId, variantId, revenue);
  }, []);

  const getVariantForUser = useCallback((testId: string, userId: string) => {
    return abTestEngine.getVariantForUser(testId, userId);
  }, []);

  const pauseTest = useCallback(async (testId: string) => {
    setIsLoading(true);
    try {
      const test = await abTestEngine.pauseTest(testId);
      if (test) {
        setTests((prev) => prev.map((t) => (t.id === testId ? test : t)));
      }
      return test;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeTest = useCallback(async (testId: string) => {
    setIsLoading(true);
    try {
      const test = await abTestEngine.completeTest(testId);
      if (test) {
        setTests((prev) => prev.map((t) => (t.id === testId ? test : t)));
      }
      return test;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectWinner = useCallback(async (testId: string, variantId: string) => {
    setIsLoading(true);
    try {
      const test = await abTestEngine.selectWinner(testId, variantId);
      if (test) {
        setTests((prev) => prev.map((t) => (t.id === testId ? test : t)));
      }
      return test;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTests = useCallback(async (planId: string) => {
    setIsLoading(true);
    try {
      const loadedTests = await abTestEngine.loadTests(planId);
      setTests(loadedTests);
      return loadedTests;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTestResults = useCallback((testId: string) => {
    return abTestEngine.getTestResults(testId);
  }, []);

  const checkForWinner = useCallback((test: ABTest) => {
    return abTestEngine.checkForWinner(test);
  }, []);

  const getActiveTests = useCallback(() => {
    return abTestEngine.getActiveTests();
  }, []);

  return {
    isLoading,
    tests,
    createTest,
    trackView,
    trackConversion,
    getVariantForUser,
    pauseTest,
    completeTest,
    selectWinner,
    loadTests,
    getTestResults,
    checkForWinner,
    getActiveTests,
  };
}
