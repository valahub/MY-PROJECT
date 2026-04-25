// Subscription Actions
// Pause, resume, cancel, change plan - sync with provider

import type { Subscription, SubscriptionStatus, BillingCycle } from './subscription-types';
import { subscriptionStateMachine } from './subscription-state-machine';

// ============================================
// SUBSCRIPTION ACTION RESULT
// ============================================

export interface SubscriptionActionResult {
  success: boolean;
  subscription: Subscription | null;
  error?: string;
  timestamp: string;
}

// ============================================
// SUBSCRIPTION ACTIONS MANAGER
// ============================================

export class SubscriptionActionsManager {
  private subscriptions: Map<string, Subscription> = new Map();

  // ============================================
  // PAUSE SUBSCRIPTION
  // ============================================

  async pauseSubscription(subscription: Subscription, userId: string): Promise<SubscriptionActionResult> {
    try {
      // Check if can be paused
      if (!subscriptionStateMachine.canBePaused(subscription.status)) {
        return {
          success: false,
          subscription: null,
          error: `Cannot pause subscription with status: ${subscription.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Transition to paused
      const newStatus = subscriptionStateMachine.transition(subscription.status, 'paused');
      subscription.status = newStatus;
      subscription.updatedAt = new Date().toISOString();

      // Sync with provider (placeholder - in production, call Stripe/Razorpay API)
      await this.syncPauseWithProvider(subscription);

      console.log(`[SubscriptionActions] Paused subscription ${subscription.id}`);

      return {
        success: true,
        subscription,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : 'Failed to pause subscription',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // RESUME SUBSCRIPTION
  // ============================================

  async resumeSubscription(subscription: Subscription, userId: string): Promise<SubscriptionActionResult> {
    try {
      // Check if can be resumed
      if (!subscriptionStateMachine.canBeResumed(subscription.status)) {
        return {
          success: false,
          subscription: null,
          error: `Cannot resume subscription with status: ${subscription.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Transition to active
      const newStatus = subscriptionStateMachine.transition(subscription.status, 'active');
      subscription.status = newStatus;
      subscription.updatedAt = new Date().toISOString();

      // Sync with provider (placeholder - in production, call Stripe/Razorpay API)
      await this.syncResumeWithProvider(subscription);

      console.log(`[SubscriptionActions] Resumed subscription ${subscription.id}`);

      return {
        success: true,
        subscription,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : 'Failed to resume subscription',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // CANCEL SUBSCRIPTION
  // ============================================

  async cancelSubscription(subscription: Subscription, cancelAtPeriodEnd: boolean, userId: string): Promise<SubscriptionActionResult> {
    try {
      // Check if can be canceled
      if (!subscriptionStateMachine.canBeCanceled(subscription.status)) {
        return {
          success: false,
          subscription: null,
          error: `Cannot cancel subscription with status: ${subscription.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      if (cancelAtPeriodEnd) {
        // Set cancel_at_period_end flag
        subscription.cancelAtPeriodEnd = true;
        subscription.updatedAt = new Date().toISOString();

        // Sync with provider
        await this.syncCancelAtPeriodEndWithProvider(subscription);

        console.log(`[SubscriptionActions] Set cancel_at_period_end for subscription ${subscription.id}`);
      } else {
        // Immediate cancel
        const newStatus = subscriptionStateMachine.transition(subscription.status, 'canceled');
        subscription.status = newStatus;
        subscription.cancelAtPeriodEnd = false;
        subscription.updatedAt = new Date().toISOString();

        // Sync with provider
        await this.syncCancelWithProvider(subscription);

        console.log(`[SubscriptionActions] Canceled subscription ${subscription.id}`);
      }

      return {
        success: true,
        subscription,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // CHANGE PLAN
  // ============================================

  async changePlan(
    subscription: Subscription,
    newPricingId: string,
    newPlanNameSnapshot: string,
    newMRR: number,
    newBillingCycle: BillingCycle,
    userId: string
  ): Promise<SubscriptionActionResult> {
    try {
      // Update subscription
      subscription.pricingId = newPricingId;
      subscription.planNameSnapshot = newPlanNameSnapshot;
      subscription.mrr = newMRR;
      subscription.billingCycle = newBillingCycle;
      subscription.updatedAt = new Date().toISOString();

      // Sync with provider (placeholder - in production, call Stripe/Razorpay API)
      await this.syncPlanChangeWithProvider(subscription);

      console.log(`[SubscriptionActions] Changed plan for subscription ${subscription.id}`);

      return {
        success: true,
        subscription,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : 'Failed to change plan',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // REACTIVATE SUBSCRIPTION
  // ============================================

  async reactivateSubscription(subscription: Subscription, userId: string): Promise<SubscriptionActionResult> {
    try {
      // Check if can be reactivated
      if (!subscriptionStateMachine.canBeReactivated(subscription.status)) {
        return {
          success: false,
          subscription: null,
          error: `Cannot reactivate subscription with status: ${subscription.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Transition to active
      const newStatus = subscriptionStateMachine.transition(subscription.status, 'active');
      subscription.status = newStatus;
      subscription.updatedAt = new Date().toISOString();

      // Sync with provider
      await this.syncReactivateWithProvider(subscription);

      console.log(`[SubscriptionActions] Reactivated subscription ${subscription.id}`);

      return {
        success: true,
        subscription,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // SYNC PAUSE WITH PROVIDER
  // ============================================

  private async syncPauseWithProvider(subscription: Subscription): Promise<void> {
    // In production, call Stripe/Razorpay API to pause subscription
    console.log(`[SubscriptionActions] Syncing pause with provider for ${subscription.provider}`);
  }

  // ============================================
  // SYNC RESUME WITH PROVIDER
  // ============================================

  private async syncResumeWithProvider(subscription: Subscription): Promise<void> {
    // In production, call Stripe/Razorpay API to resume subscription
    console.log(`[SubscriptionActions] Syncing resume with provider for ${subscription.provider}`);
  }

  // ============================================
  // SYNC CANCEL WITH PROVIDER
  // ============================================

  private async syncCancelWithProvider(subscription: Subscription): Promise<void> {
    // In production, call Stripe/Razorpay API to cancel subscription
    console.log(`[SubscriptionActions] Syncing cancel with provider for ${subscription.provider}`);
  }

  // ============================================
  // SYNC CANCEL AT PERIOD END WITH PROVIDER
  // ============================================

  private async syncCancelAtPeriodEndWithProvider(subscription: Subscription): Promise<void> {
    // In production, call Stripe/Razorpay API to set cancel_at_period_end
    console.log(`[SubscriptionActions] Syncing cancel_at_period_end with provider for ${subscription.provider}`);
  }

  // ============================================
  // SYNC PLAN CHANGE WITH PROVIDER
  // ============================================

  private async syncPlanChangeWithProvider(subscription: Subscription): Promise<void> {
    // In production, call Stripe/Razorpay API to change plan
    console.log(`[SubscriptionActions] Syncing plan change with provider for ${subscription.provider}`);
  }

  // ============================================
  // SYNC REACTIVATE WITH PROVIDER
  // ============================================

  private async syncReactivateWithProvider(subscription: Subscription): Promise<void> {
    // In production, call Stripe/Razorpay API to reactivate subscription
    console.log(`[SubscriptionActions] Syncing reactivate with provider for ${subscription.provider}`);
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

  // ============================================
  // GET ALL SUBSCRIPTIONS
  // ============================================

  getAllSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }
}

// Export singleton instance
export const subscriptionActionsManager = new SubscriptionActionsManager();

// ============================================
// REACT HOOK FOR SUBSCRIPTION ACTIONS
// ============================================

import { useState, useCallback } from 'react';

export function useSubscriptionActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pauseSubscription = useCallback(async (subscription: Subscription, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await subscriptionActionsManager.pauseSubscription(subscription, userId);
      if (!result.success) {
        setError(result.error || 'Failed to pause subscription');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause subscription';
      setError(errorMessage);
      return {
        success: false,
        subscription: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resumeSubscription = useCallback(async (subscription: Subscription, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await subscriptionActionsManager.resumeSubscription(subscription, userId);
      if (!result.success) {
        setError(result.error || 'Failed to resume subscription');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume subscription';
      setError(errorMessage);
      return {
        success: false,
        subscription: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (subscription: Subscription, cancelAtPeriodEnd: boolean, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await subscriptionActionsManager.cancelSubscription(subscription, cancelAtPeriodEnd, userId);
      if (!result.success) {
        setError(result.error || 'Failed to cancel subscription');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      setError(errorMessage);
      return {
        success: false,
        subscription: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const changePlan = useCallback(async (
    subscription: Subscription,
    newPricingId: string,
    newPlanNameSnapshot: string,
    newMRR: number,
    newBillingCycle: BillingCycle,
    userId: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await subscriptionActionsManager.changePlan(
        subscription,
        newPricingId,
        newPlanNameSnapshot,
        newMRR,
        newBillingCycle,
        userId
      );
      if (!result.success) {
        setError(result.error || 'Failed to change plan');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change plan';
      setError(errorMessage);
      return {
        success: false,
        subscription: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reactivateSubscription = useCallback(async (subscription: Subscription, userId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await subscriptionActionsManager.reactivateSubscription(subscription, userId);
      if (!result.success) {
        setError(result.error || 'Failed to reactivate subscription');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate subscription';
      setError(errorMessage);
      return {
        success: false,
        subscription: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    changePlan,
    reactivateSubscription,
    clearError,
  };
}
