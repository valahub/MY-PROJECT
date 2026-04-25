// Subscription Dunning System
// Retry 3 times, notify customer, mark past_due, cancel if unpaid

import type { Subscription, SubscriptionStatus } from './subscription-types';
import { subscriptionStateMachine } from './subscription-state-machine';

// ============================================
// DUNNING RESULT
// ============================================

export interface DunningResult {
  success: boolean;
  subscription: Subscription | null;
  action: 'retry' | 'notify' | 'mark_past_due' | 'cancel' | 'none';
  retryCount: number;
  error?: string;
  timestamp: string;
}

// ============================================
// DUNNING CONFIG
// ============================================

export interface DunningConfig {
  maxRetries: number;
  retryIntervalDays: number;
  pastDueDaysBeforeCancel: number;
  enableNotifications: boolean;
}

// ============================================
// DUNNING MANAGER
// ============================================

export class DunningManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private retryCounts: Map<string, number> = new Map();
  private config: DunningConfig = {
    maxRetries: 3,
    retryIntervalDays: 3,
    pastDueDaysBeforeCancel: 30,
    enableNotifications: true,
  };

  // ============================================
  // PROCESS PAYMENT FAILURE
  // ============================================

  async processPaymentFailure(subscription: Subscription): Promise<DunningResult> {
    const retryCount = this.retryCounts.get(subscription.id) || 0;

    try {
      console.log(`[Dunning] Processing payment failure for subscription ${subscription.id}, retry count: ${retryCount}`);

      // Check if max retries reached
      if (retryCount >= this.config.maxRetries) {
        // Max retries reached - mark as past_due
        if (subscription.status === 'active') {
          const newStatus = subscriptionStateMachine.transition(subscription.status, 'past_due');
          subscription.status = newStatus;
          subscription.updatedAt = new Date().toISOString();

          console.log(`[Dunning] Max retries reached - marked subscription ${subscription.id} as past_due`);
        }

        // Check if should cancel
        const daysSinceLastPayment = this.getDaysSince(subscription.currentPeriodEnd);
        if (daysSinceLastPayment >= this.config.pastDueDaysBeforeCancel) {
          const newStatus = subscriptionStateMachine.transition(subscription.status, 'canceled');
          subscription.status = newStatus;
          subscription.updatedAt = new Date().toISOString();

          console.log(`[Dunning] Past due for ${daysSinceLastPayment} days - canceled subscription ${subscription.id}`);

          return {
            success: true,
            subscription,
            action: 'cancel',
            retryCount,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          subscription,
          action: 'mark_past_due',
          retryCount,
          timestamp: new Date().toISOString(),
        };
      }

      // Increment retry count
      this.retryCounts.set(subscription.id, retryCount + 1);

      // Retry payment
      const retrySuccess = await this.retryPayment(subscription);

      if (retrySuccess) {
        // Payment succeeded - reset retry count
        this.retryCounts.set(subscription.id, 0);

        // Mark as active if past_due
        if (subscription.status === 'past_due') {
          const newStatus = subscriptionStateMachine.transition(subscription.status, 'active');
          subscription.status = newStatus;
          subscription.updatedAt = new Date().toISOString();
        }

        console.log(`[Dunning] Payment retry succeeded for subscription ${subscription.id}`);

        return {
          success: true,
          subscription,
          action: 'retry',
          retryCount: retryCount + 1,
          timestamp: new Date().toISOString(),
        };
      }

      // Payment failed - notify customer
      if (this.config.enableNotifications) {
        await this.notifyCustomer(subscription, retryCount + 1);
      }

      return {
        success: true,
        subscription,
        action: 'notify',
        retryCount: retryCount + 1,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        subscription: null,
        action: 'none',
        retryCount,
        error: error instanceof Error ? error.message : 'Failed to process payment failure',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // RETRY PAYMENT
  // ============================================

  private async retryPayment(subscription: Subscription): Promise<boolean> {
    // In production, call Stripe/Razorpay API to retry payment
    console.log(`[Dunning] Retrying payment for subscription ${subscription.id} (${subscription.provider})`);
    return false; // Placeholder - return false to simulate failure
  }

  // ============================================
  // NOTIFY CUSTOMER
  // ============================================

  private async notifyCustomer(subscription: Subscription, retryCount: number): Promise<void> {
    // In production, send email/notification to customer
    console.log(`[Dunning] Notifying customer for subscription ${subscription.id}, retry count: ${retryCount}`);
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
  // PROCESS ALL PAST DUE SUBSCRIPTIONS
  // ============================================

  async processAllPastDueSubscriptions(): Promise<Map<string, DunningResult>> {
    const results = new Map<string, DunningResult>();

    for (const subscription of this.subscriptions.values()) {
      if (subscription.status === 'past_due') {
        const result = await this.processPaymentFailure(subscription);
        results.set(subscription.id, result);
      }
    }

    return results;
  }

  // ============================================
  // GET DUNNING STATUS
  // ============================================

  getDunningStatus(subscriptionId: string): {
    retryCount: number;
    maxRetries: number;
    canRetry: boolean;
    shouldCancel: boolean;
  } {
    const retryCount = this.retryCounts.get(subscriptionId) || 0;
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      return {
        retryCount,
        maxRetries: this.config.maxRetries,
        canRetry: false,
        shouldCancel: false,
      };
    }

    const canRetry = retryCount < this.config.maxRetries;
    const daysSinceLastPayment = this.getDaysSince(subscription.currentPeriodEnd);
    const shouldCancel = daysSinceLastPayment >= this.config.pastDueDaysBeforeCancel;

    return {
      retryCount,
      maxRetries: this.config.maxRetries,
      canRetry,
      shouldCancel,
    };
  }

  // ============================================
  // RESET RETRY COUNT
  // ============================================

  resetRetryCount(subscriptionId: string): void {
    this.retryCounts.set(subscriptionId, 0);
  }

  // ============================================
  // UPDATE CONFIG
  // ============================================

  updateConfig(config: Partial<DunningConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // GET CONFIG
  // ============================================

  getConfig(): DunningConfig {
    return { ...this.config };
  }

  // ============================================
  // GET DUNNING SUMMARY
  // ============================================

  getDunningSummary(): {
    totalSubscriptions: number;
    pastDueSubscriptions: number;
    inRetry: number;
    maxRetriesReached: number;
    readyForCancel: number;
  } {
    const pastDueSubscriptions = Array.from(this.subscriptions.values()).filter(
      (s) => s.status === 'past_due'
    ).length;

    let inRetry = 0;
    let maxRetriesReached = 0;
    let readyForCancel = 0;

    for (const subscription of this.subscriptions.values()) {
      const retryCount = this.retryCounts.get(subscription.id) || 0;

      if (retryCount > 0 && retryCount < this.config.maxRetries) {
        inRetry++;
      }

      if (retryCount >= this.config.maxRetries) {
        maxRetriesReached++;
      }

      if (subscription.status === 'past_due') {
        const daysSinceLastPayment = this.getDaysSince(subscription.currentPeriodEnd);
        if (daysSinceLastPayment >= this.config.pastDueDaysBeforeCancel) {
          readyForCancel++;
        }
      }
    }

    return {
      totalSubscriptions: this.subscriptions.size,
      pastDueSubscriptions,
      inRetry,
      maxRetriesReached,
      readyForCancel,
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
    this.retryCounts.delete(subscriptionId);
  }

  // ============================================
  // GET SUBSCRIPTION
  // ============================================

  getSubscription(subscriptionId: string): Subscription | null {
    return this.subscriptions.get(subscriptionId) || null;
  }
}

// Export singleton instance
export const dunningManager = new DunningManager();

// ============================================
// REACT HOOK FOR DUNNING
// ============================================

import { useState, useCallback } from 'react';

export function useDunning() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPaymentFailure = useCallback(async (subscription: Subscription) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await dunningManager.processPaymentFailure(subscription);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment failure';
      setError(errorMessage);
      return {
        success: false,
        subscription: null,
        action: 'none',
        retryCount: 0,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processAllPastDueSubscriptions = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await dunningManager.processAllPastDueSubscriptions();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process past due subscriptions';
      setError(errorMessage);
      return new Map();
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getDunningStatus = useCallback((subscriptionId: string) => {
    return dunningManager.getDunningStatus(subscriptionId);
  }, []);

  const resetRetryCount = useCallback((subscriptionId: string) => {
    dunningManager.resetRetryCount(subscriptionId);
  }, []);

  const getDunningSummary = useCallback(() => {
    return dunningManager.getDunningSummary();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    processPaymentFailure,
    processAllPastDueSubscriptions,
    getDunningStatus,
    resetRetryCount,
    getDunningSummary,
    clearError,
  };
}
