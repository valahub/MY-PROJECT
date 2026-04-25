// Subscription Self-Healing Engine
// Auto-fix next_billing_at, sync with provider, orphan detection, trial expiry

import type { Subscription, SubscriptionStatus } from './subscription-types';
import { subscriptionStateMachine } from './subscription-state-machine';

// ============================================
// SELF-HEAL RESULT
// ============================================

export interface SelfHealResult {
  success: boolean;
  subscription: Subscription;
  fixes: string[];
  issues: string[];
  timestamp: string;
}

// ============================================
// SUBSCRIPTION SELF-HEALING ENGINE
// ============================================

export class SubscriptionSelfHealingEngine {
  private subscriptions: Map<string, Subscription> = new Map();

  // ============================================
  // HEAL SUBSCRIPTION
  // ============================================

  async healSubscription(subscription: Subscription): Promise<SelfHealResult> {
    const fixes: string[] = [];
    const issues: string[] = [];
    const healedSubscription = { ...subscription };

    // 1. Fix missing next_billing_at
    if (!healedSubscription.nextBillingAt || healedSubscription.nextBillingAt === '') {
      healedSubscription.nextBillingAt = this.calculateNextBilling(healedSubscription);
      fixes.push('Fixed missing next_billing_at');
    }

    // 2. Fix trial expiry
    if (healedSubscription.status === 'trialing' && healedSubscription.trialEnd) {
      const trialEndDate = new Date(healedSubscription.trialEnd);
      const now = new Date();

      if (trialEndDate < now) {
        try {
          const newStatus = subscriptionStateMachine.transition('trialing', 'active');
          healedSubscription.status = newStatus;
          fixes.push('Trial expired - converted to active');
        } catch {
          issues.push('Trial expired but cannot transition to active');
        }
      }
    }

    // 3. Fix expired past_due subscriptions
    if (healedSubscription.status === 'past_due') {
      const daysSincePastDue = this.getDaysSince(healedSubscription.currentPeriodEnd);
      if (daysSincePastDue > 30) {
        try {
          const newStatus = subscriptionStateMachine.transition('past_due', 'canceled');
          healedSubscription.status = newStatus;
          fixes.push('Past due for 30+ days - auto-canceled');
        } catch {
          issues.push('Past due for 30+ days but cannot cancel');
        }
      }
    }

    // 4. Fix cancel_at_period_end for canceled subscriptions
    if (healedSubscription.status === 'canceled' && healedSubscription.cancelAtPeriodEnd) {
      healedSubscription.cancelAtPeriodEnd = false;
      fixes.push('Removed cancel_at_period_end flag for canceled subscription');
    }

    // 5. Sync with provider (placeholder - in production, fetch from Stripe/Razorpay)
    const providerSyncResult = await this.syncWithProvider(healedSubscription);
    if (providerSyncResult.synced) {
      fixes.push('Synced with payment provider');
    } else if (providerSyncResult.error) {
      issues.push(`Provider sync failed: ${providerSyncResult.error}`);
    }

    healedSubscription.updatedAt = new Date().toISOString();

    const success = fixes.length > 0 || issues.length === 0;

    console.log(`[SubscriptionSelfHeal] Healed subscription ${subscription.id}: ${fixes.join(', ')}`);

    return {
      success,
      subscription: healedSubscription,
      fixes,
      issues,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BATCH HEAL SUBSCRIPTIONS
  // ============================================

  async batchHealSubscriptions(subscriptions: Subscription[]): Promise<Map<string, SelfHealResult>> {
    const results = new Map<string, SelfHealResult>();

    for (const subscription of subscriptions) {
      const result = await this.healSubscription(subscription);
      results.set(subscription.id, result);
    }

    return results;
  }

  // ============================================
  // CALCULATE NEXT BILLING
  // ============================================

  private calculateNextBilling(subscription: Subscription): string {
    const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
    const months = subscription.billingCycle === 'yearly' ? 12 : 1;
    const nextBilling = new Date(currentPeriodEnd);
    nextBilling.setMonth(nextBilling.getMonth() + months);
    return nextBilling.toISOString();
  }

  // ============================================
  // GET DAYS SINCE
  // ============================================

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // ============================================
  // SYNC WITH PROVIDER
  // ============================================

  private async syncWithProvider(subscription: Subscription): Promise<{
    synced: boolean;
    error?: string;
  }> {
    // In production, this would fetch from Stripe/Razorpay API
    // For now, return a placeholder result
    return { synced: false, error: 'Provider sync not implemented' };
  }

  // ============================================
  // DETECT ORPHAN SUBSCRIPTIONS
  // ============================================

  detectOrphanSubscriptions(subscriptions: Subscription[], customerIds: Set<string>): Subscription[] {
    return subscriptions.filter((sub) => !customerIds.has(sub.customerId));
  }

  // ============================================
  // DETECT INCONSISTENCIES
  // ============================================

  detectInconsistencies(subscription: Subscription): string[] {
    const issues: string[] = [];

    // Check next_billing_at
    if (!subscription.nextBillingAt || subscription.nextBillingAt === '') {
      issues.push('Missing next_billing_at');
    }

    // Check trial expiry
    if (subscription.status === 'trialing' && subscription.trialEnd) {
      const trialEndDate = new Date(subscription.trialEnd);
      const now = new Date();
      if (trialEndDate < now) {
        issues.push('Trial expired but status still trialing');
      }
    }

    // Check cancel_at_period_end
    if (subscription.status === 'canceled' && subscription.cancelAtPeriodEnd) {
      issues.push('Canceled subscription has cancel_at_period_end flag');
    }

    // Check period dates
    if (new Date(subscription.currentPeriodEnd) < new Date(subscription.currentPeriodStart)) {
      issues.push('Period end date is before period start date');
    }

    return issues;
  }

  // ============================================
  // GET HEALTH SUMMARY
  // ============================================

  getHealthSummary(subscriptions: Subscription[]): {
    totalSubscriptions: number;
    healthySubscriptions: number;
    subscriptionsWithIssues: number;
    issues: Map<string, string[]>;
  } {
    const issues = new Map<string, string[]>();
    let subscriptionsWithIssues = 0;

    for (const subscription of subscriptions) {
      const subscriptionIssues = this.detectInconsistencies(subscription);
      if (subscriptionIssues.length > 0) {
        issues.set(subscription.id, subscriptionIssues);
        subscriptionsWithIssues++;
      }
    }

    const healthySubscriptions = subscriptions.length - subscriptionsWithIssues;

    return {
      totalSubscriptions: subscriptions.length,
      healthySubscriptions,
      subscriptionsWithIssues,
      issues,
    };
  }

  // ============================================
  // AUTO-FIX EXPIRED TRIALS
  // ============================================

  async autoFixExpiredTrials(subscriptions: Subscription[]): Promise<Subscription[]> {
    const fixedSubscriptions: Subscription[] = [];

    for (const subscription of subscriptions) {
      if (subscription.status === 'trialing' && subscription.trialEnd) {
        const trialEndDate = new Date(subscription.trialEnd);
        const now = new Date();

        if (trialEndDate < now) {
          try {
            const newStatus = subscriptionStateMachine.transition('trialing', 'active');
            subscription.status = newStatus;
            subscription.updatedAt = new Date().toISOString();
            fixedSubscriptions.push(subscription);
            console.log(`[SubscriptionSelfHeal] Auto-fixed expired trial for subscription ${subscription.id}`);
          } catch {
            console.error(`[SubscriptionSelfHeal] Failed to auto-fix trial for subscription ${subscription.id}`);
          }
        }
      }
    }

    return fixedSubscriptions;
  }

  // ============================================
  // SYNC ALL WITH PROVIDER
  // ============================================

  async syncAllWithProvider(subscriptions: Subscription[]): Promise<Subscription[]> {
    const syncedSubscriptions: Subscription[] = [];

    for (const subscription of subscriptions) {
      const result = await this.syncWithProvider(subscription);
      if (result.synced) {
        subscription.updatedAt = new Date().toISOString();
        syncedSubscriptions.push(subscription);
      }
    }

    return syncedSubscriptions;
  }

  // ============================================
  // RUN FULL HEAL
  // ============================================

  async runFullHeal(subscriptions: Subscription[]): Promise<{
    expiredTrialsFixed: number;
    nextBillingFixed: number;
    providerSyncs: number;
    pastDueCanceled: number;
  }> {
    const expiredTrialsFixed = (await this.autoFixExpiredTrials(subscriptions)).length;
    const providerSyncs = (await this.syncAllWithProvider(subscriptions)).length;

    let nextBillingFixed = 0;
    let pastDueCanceled = 0;

    for (const subscription of subscriptions) {
      const result = await this.healSubscription(subscription);
      if (result.fixes.includes('Fixed missing next_billing_at')) {
        nextBillingFixed++;
      }
      if (result.fixes.includes('Past due for 30+ days - auto-canceled')) {
        pastDueCanceled++;
      }
    }

    return {
      expiredTrialsFixed,
      nextBillingFixed,
      providerSyncs,
      pastDueCanceled,
    };
  }

  // ============================================
  // REGISTER SUBSCRIPTION
  // ============================================

  registerSubscription(subscription: Subscription): void {
    this.subscriptions.set(subscription.id, subscription);
  }

  // ============================================
  // UNREGISTER SUBSCRIPTION
  // ============================================

  unregisterSubscription(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  // ============================================
  // GET SUBSCRIPTION
  // ============================================

  getSubscription(subscriptionId: string): Subscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }
}

// Export singleton instance
export const subscriptionSelfHealingEngine = new SubscriptionSelfHealingEngine();

// ============================================
// REACT HOOK FOR SELF-HEALING
// ============================================

import { useState, useCallback } from 'react';

export function useSubscriptionSelfHealing() {
  const [isHealing, setIsHealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const healSubscription = useCallback(async (subscription: Subscription) => {
    setIsHealing(true);
    setError(null);

    try {
      const result = await subscriptionSelfHealingEngine.healSubscription(subscription);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to heal subscription';
      setError(errorMessage);
      return {
        success: false,
        subscription,
        fixes: [],
        issues: [errorMessage],
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsHealing(false);
    }
  }, []);

  const runFullHeal = useCallback(async (subscriptions: Subscription[]) => {
    setIsHealing(true);
    setError(null);

    try {
      const result = await subscriptionSelfHealingEngine.runFullHeal(subscriptions);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to run full heal';
      setError(errorMessage);
      return {
        expiredTrialsFixed: 0,
        nextBillingFixed: 0,
        providerSyncs: 0,
        pastDueCanceled: 0,
      };
    } finally {
      setIsHealing(false);
    }
  }, []);

  const getHealthSummary = useCallback((subscriptions: Subscription[]) => {
    return subscriptionSelfHealingEngine.getHealthSummary(subscriptions);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isHealing,
    error,
    healSubscription,
    runFullHeal,
    getHealthSummary,
    clearError,
  };
}
