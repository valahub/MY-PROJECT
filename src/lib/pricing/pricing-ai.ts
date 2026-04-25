// Dynamic Pricing AI
// Analyze conversion, churn, revenue per plan and suggest optimizations

import type { PricingPlan, PricingAnalytics, PricingSuggestion, SuggestionType } from './pricing-types';
import { pricingAPI } from './pricing-api';

// ============================================
// AI ANALYSIS RESULT
// ============================================

export interface PricingAIAnalysis {
  planId: string;
  planName: string;
  analytics: PricingAnalytics;
  suggestions: PricingSuggestion[];
  confidence: number;
  analysisDate: string;
}

// ============================================
// DYNAMIC PRICING AI ENGINE
// ============================================

export class DynamicPricingAI {
  // ============================================
  // ANALYZE PLAN PERFORMANCE
  // ============================================

  async analyzePlan(planId: string): Promise<PricingAIAnalysis | null> {
    try {
      // Fetch analytics for the plan
      const analyticsResult = await pricingAPI.getAnalytics(planId);

      if (!analyticsResult.success || !analyticsResult.data) {
        console.error(`[DynamicPricingAI] Failed to fetch analytics for plan ${planId}`);
        return null;
      }

      const analytics = analyticsResult.data;
      const suggestions = this.generateSuggestions(analytics);
      const confidence = this.calculateConfidence(analytics, suggestions);

      // Get plan name
      const planResult = await pricingAPI.getPlan(planId);
      const planName = planResult.success && planResult.data ? planResult.data.name : 'Unknown Plan';

      return {
        planId,
        planName,
        analytics,
        suggestions,
        confidence,
        analysisDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[DynamicPricingAI] Error analyzing plan ${planId}:`, error);
      return null;
    }
  }

  // ============================================
  // ANALYZE MULTIPLE PLANS
  // ============================================

  async analyzePlans(planIds: string[]): Promise<PricingAIAnalysis[]> {
    const analyses: PricingAIAnalysis[] = [];

    for (const planId of planIds) {
      const analysis = await this.analyzePlan(planId);
      if (analysis) {
        analyses.push(analysis);
      }
    }

    return analyses;
  }

  // ============================================
  // GENERATE SUGGESTIONS
  // ============================================

  private generateSuggestions(analytics: PricingAnalytics): PricingSuggestion[] {
    const suggestions: PricingSuggestion[] = [];

    // Analyze conversion rate
    if (analytics.conversionRate < 0.02) {
      // Low conversion - suggest price decrease
      const suggestedPrice = analytics.revenuePerPlan / (analytics.activeSubscriptions || 1) * 0.8;
      suggestions.push({
        type: 'price_decrease',
        planId: analytics.planId,
        currentValue: analytics.revenuePerPlan / (analytics.activeSubscriptions || 1),
        suggestedValue: Math.max(suggestedPrice, 5),
        confidence: 0.7,
        reason: 'Low conversion rate suggests price may be too high',
        expectedImpact: {
          revenueChange: 0.1,
          conversionChange: 0.15,
        },
      });
    } else if (analytics.conversionRate > 0.1) {
      // High conversion - suggest price increase
      const suggestedPrice = analytics.revenuePerPlan / (analytics.activeSubscriptions || 1) * 1.15;
      suggestions.push({
        type: 'price_increase',
        planId: analytics.planId,
        currentValue: analytics.revenuePerPlan / (analytics.activeSubscriptions || 1),
        suggestedValue: suggestedPrice,
        confidence: 0.65,
        reason: 'High conversion rate suggests room for price increase',
        expectedImpact: {
          revenueChange: 0.12,
          conversionChange: -0.05,
        },
      });
    }

    // Analyze churn rate
    if (analytics.churnRate > 0.05) {
      // High churn - suggest trial extension
      suggestions.push({
        type: 'trial_extension',
        planId: analytics.planId,
        currentValue: 7,
        suggestedValue: 14,
        confidence: 0.6,
        reason: 'High churn rate suggests users need longer trial period',
        expectedImpact: {
          revenueChange: 0.05,
          conversionChange: 0.08,
        },
      });
    } else if (analytics.churnRate < 0.01 && analytics.trialConversions > 0.5) {
      // Low churn with high trial conversion - suggest trial reduction
      suggestions.push({
        type: 'trial_reduction',
        planId: analytics.planId,
        currentValue: 14,
        suggestedValue: 7,
        confidence: 0.55,
        reason: 'Low churn with high trial conversion suggests trial can be shortened',
        expectedImpact: {
          revenueChange: 0.03,
          conversionChange: -0.02,
        },
      });
    }

    // Analyze revenue per plan
    const avgRevenue = analytics.revenuePerPlan / (analytics.activeSubscriptions || 1);
    if (avgRevenue > 100 && analytics.conversionRate < 0.05) {
      suggestions.push({
        type: 'feature_addition',
        planId: analytics.planId,
        currentValue: 0,
        suggestedValue: 1,
        confidence: 0.5,
        reason: 'High price with low conversion suggests adding more value through features',
        expectedImpact: {
          revenueChange: 0.08,
          conversionChange: 0.1,
        },
      });
    }

    return suggestions;
  }

  // ============================================
  // CALCULATE CONFIDENCE
  // ============================================

  private calculateConfidence(analytics: PricingAnalytics, suggestions: PricingSuggestion[]): number {
    // Base confidence on data quality
    let confidence = 0.5;

    // More active subscriptions = higher confidence
    if (analytics.activeSubscriptions > 100) confidence += 0.2;
    else if (analytics.activeSubscriptions > 50) confidence += 0.1;
    else if (analytics.activeSubscriptions > 10) confidence += 0.05;

    // More trial conversions = higher confidence
    if (analytics.trialConversions > 50) confidence += 0.15;
    else if (analytics.trialConversions > 20) confidence += 0.1;

    // Higher LTV = higher confidence
    if (analytics.averageLifetimeValue > 500) confidence += 0.1;
    else if (analytics.averageLifetimeValue > 200) confidence += 0.05;

    // More suggestions = lower confidence (spread thin)
    confidence -= suggestions.length * 0.05;

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  // ============================================
  // GET PRICING RECOMMENDATION
  // ============================================

  getTopSuggestion(analysis: PricingAIAnalysis): PricingSuggestion | null {
    if (analysis.suggestions.length === 0) return null;

    // Sort by confidence and expected revenue impact
    const sorted = [...analysis.suggestions].sort((a, b) => {
      const scoreA = a.confidence + a.expectedImpact.revenueChange;
      const scoreB = b.confidence + b.expectedImpact.revenueChange;
      return scoreB - scoreA;
    });

    return sorted[0];
  }

  // ============================================
  // SIMULATE PRICE CHANGE IMPACT
  // ============================================

  simulatePriceChange(
    currentPrice: number,
    suggestedPrice: number,
    currentConversion: number,
    currentSubscriptions: number
  ): {
    projectedRevenue: number;
    projectedSubscriptions: number;
    revenueChange: number;
    subscriptionChange: number;
  } {
    const priceChangePercent = (suggestedPrice - currentPrice) / currentPrice;
    
    // Estimate conversion change based on price elasticity
    const conversionElasticity = -1.5; // 1% price increase = 1.5% conversion decrease
    const projectedConversion = currentConversion * (1 + priceChangePercent * conversionElasticity);
    
    // Clamp conversion
    const clampedConversion = Math.max(0.01, Math.min(1, projectedConversion));
    
    const projectedSubscriptions = currentSubscriptions * (clampedConversion / currentConversion);
    const projectedRevenue = projectedSubscriptions * suggestedPrice;
    const currentRevenue = currentSubscriptions * currentPrice;

    return {
      projectedRevenue,
      projectedSubscriptions,
      revenueChange: (projectedRevenue - currentRevenue) / currentRevenue,
      subscriptionChange: (projectedSubscriptions - currentSubscriptions) / currentSubscriptions,
    };
  }

  // ============================================
  // COMPARE PLANS
  // ============================================

  comparePlans(analyses: PricingAIAnalysis[]): {
    bestPerformer: PricingAIAnalysis | null;
    worstPerformer: PricingAIAnalysis | null;
    averageConversion: number;
    averageChurn: number;
    recommendations: string[];
  } {
    if (analyses.length === 0) {
      return {
        bestPerformer: null,
        worstPerformer: null,
        averageConversion: 0,
        averageChurn: 0,
        recommendations: [],
      };
    }

    // Sort by revenue
    const sortedByRevenue = [...analyses].sort((a, b) => b.analytics.revenuePerPlan - a.analytics.revenuePerPlan);

    const bestPerformer = sortedByRevenue[0];
    const worstPerformer = sortedByRevenue[sortedByRevenue.length - 1];

    const averageConversion = analyses.reduce((sum, a) => sum + a.analytics.conversionRate, 0) / analyses.length;
    const averageChurn = analyses.reduce((sum, a) => sum + a.analytics.churnRate, 0) / analyses.length;

    const recommendations: string[] = [];

    // Generate recommendations
    if (bestPerformer && worstPerformer) {
      const conversionDiff = bestPerformer.analytics.conversionRate - worstPerformer.analytics.conversionRate;
      if (conversionDiff > 0.05) {
        recommendations.push(`Consider adopting pricing strategy from "${bestPerformer.planName}" to improve conversion`);
      }

      const churnDiff = worstPerformer.analytics.churnRate - bestPerformer.analytics.churnRate;
      if (churnDiff > 0.02) {
        recommendations.push(`Review "${worstPerformer.planName}" for churn reduction opportunities`);
      }
    }

    if (averageConversion < 0.05) {
      recommendations.push('Overall conversion rate is low - consider pricing review');
    }

    if (averageChurn > 0.03) {
      recommendations.push('Overall churn rate is high - consider trial optimization');
    }

    return {
      bestPerformer,
      worstPerformer,
      averageConversion,
      averageChurn,
      recommendations,
    };
  }
}

// Export singleton instance
export const dynamicPricingAI = new DynamicPricingAI();

// ============================================
// REACT HOOK FOR PRICING AI
// ============================================

import { useState, useCallback } from 'react';

export function useDynamicPricingAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<PricingAIAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzePlan = useCallback(async (planId: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await dynamicPricingAI.analyzePlan(planId);
      
      if (analysis) {
        setAnalyses((prev) => [...prev.filter((a) => a.planId !== planId), analysis]);
      }

      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze plan';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzePlans = useCallback(async (planIds: string[]) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const results = await dynamicPricingAI.analyzePlans(planIds);
      setAnalyses(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze plans';
      setError(errorMessage);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getTopSuggestion = useCallback((planId: string) => {
    const analysis = analyses.find((a) => a.planId === planId);
    if (!analysis) return null;
    return dynamicPricingAI.getTopSuggestion(analysis);
  }, [analyses]);

  const simulatePriceChange = useCallback(
    (currentPrice: number, suggestedPrice: number, currentConversion: number, currentSubscriptions: number) => {
      return dynamicPricingAI.simulatePriceChange(currentPrice, suggestedPrice, currentConversion, currentSubscriptions);
    },
    []
  );

  const comparePlans = useCallback(() => {
    return dynamicPricingAI.comparePlans(analyses);
  }, [analyses]);

  const clearAnalyses = useCallback(() => {
    setAnalyses([]);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    analyses,
    error,
    analyzePlan,
    analyzePlans,
    getTopSuggestion,
    simulatePriceChange,
    comparePlans,
    clearAnalyses,
  };
}
