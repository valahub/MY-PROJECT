// Subscription Webhook Sync Engine
// invoice.paid → active, invoice.failed → past_due, customer.subscription.deleted → canceled

import type { Subscription, SubscriptionStatus, WebhookEvent } from './subscription-types';
import { subscriptionStateMachine } from './subscription-state-machine';

// ============================================
// WEBHOOK SYNC RESULT
// ============================================

export interface WebhookSyncResult {
  success: boolean;
  subscription: Subscription | null;
  error?: string;
  timestamp: string;
}

// ============================================
// WEBHOOK SYNC ENGINE
// ============================================

export class SubscriptionWebhookSyncEngine {
  private subscriptions: Map<string, Subscription> = new Map();

  // ============================================
  // PROCESS WEBHOOK EVENT
  // ============================================

  async processWebhookEvent(event: WebhookEvent): Promise<WebhookSyncResult> {
    try {
      console.log(`[WebhookSync] Processing event ${event.type}`);

      let subscription: Subscription | null = null;

      switch (event.type) {
        case 'invoice.paid':
          subscription = await this.handleInvoicePaid(event);
          break;
        case 'invoice.failed':
          subscription = await this.handleInvoiceFailed(event);
          break;
        case 'customer.subscription.deleted':
          subscription = await this.handleSubscriptionDeleted(event);
          break;
        case 'trial_end':
          subscription = await this.handleTrialEnd(event);
          break;
        case 'customer.subscription.updated':
          subscription = await this.handleSubscriptionUpdated(event);
          break;
        default:
          console.log(`[WebhookSync] Unsupported event type: ${event.type}`);
          return {
            success: false,
            subscription: null,
            error: 'Unsupported event type',
            timestamp: new Date().toISOString(),
          };
      }

      if (subscription) {
        this.subscriptions.set(subscription.id, subscription);
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
        error: error instanceof Error ? error.message : 'Failed to process webhook event',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // HANDLE INVOICE PAID
  // ============================================

  private async handleInvoicePaid(event: WebhookEvent): Promise<Subscription | null> {
    const providerSubId = event.data.subscription_id as string;
    const subscription = this.findSubscriptionByProviderId(providerSubId);

    if (!subscription) {
      console.log(`[WebhookSync] Subscription not found for provider_sub_id: ${providerSubId}`);
      return null;
    }

    // Transition to active if currently trialing or past_due
    if (subscription.status === 'trialing' || subscription.status === 'past_due') {
      const newStatus = subscriptionStateMachine.transition(subscription.status, 'active');
      subscription.status = newStatus;
      subscription.updatedAt = new Date().toISOString();

      console.log(`[WebhookSync] Invoice paid - subscription ${subscription.id} transitioned to active`);
    }

    return subscription;
  }

  // ============================================
  // HANDLE INVOICE FAILED
  // ============================================

  private async handleInvoiceFailed(event: WebhookEvent): Promise<Subscription | null> {
    const providerSubId = event.data.subscription_id as string;
    const subscription = this.findSubscriptionByProviderId(providerSubId);

    if (!subscription) {
      console.log(`[WebhookSync] Subscription not found for provider_sub_id: ${providerSubId}`);
      return null;
    }

    // Transition to past_due if currently active
    if (subscription.status === 'active') {
      const newStatus = subscriptionStateMachine.transition(subscription.status, 'past_due');
      subscription.status = newStatus;
      subscription.updatedAt = new Date().toISOString();

      console.log(`[WebhookSync] Invoice failed - subscription ${subscription.id} transitioned to past_due`);
    }

    return subscription;
  }

  // ============================================
  // HANDLE SUBSCRIPTION DELETED
  // ============================================

  private async handleSubscriptionDeleted(event: WebhookEvent): Promise<Subscription | null> {
    const providerSubId = event.data.subscription_id as string;
    const subscription = this.findSubscriptionByProviderId(providerSubId);

    if (!subscription) {
      console.log(`[WebhookSync] Subscription not found for provider_sub_id: ${providerSubId}`);
      return null;
    }

    // Transition to canceled
    const newStatus = subscriptionStateMachine.transition(subscription.status, 'canceled');
    subscription.status = newStatus;
    subscription.updatedAt = new Date().toISOString();

    console.log(`[WebhookSync] Subscription deleted - subscription ${subscription.id} transitioned to canceled`);

    return subscription;
  }

  // ============================================
  // HANDLE TRIAL END
  // ============================================

  private async handleTrialEnd(event: WebhookEvent): Promise<Subscription | null> {
    const providerSubId = event.data.subscription_id as string;
    const subscription = this.findSubscriptionByProviderId(providerSubId);

    if (!subscription) {
      console.log(`[WebhookSync] Subscription not found for provider_sub_id: ${providerSubId}`);
      return null;
    }

    // Transition from trialing to active
    if (subscription.status === 'trialing') {
      const newStatus = subscriptionStateMachine.transition(subscription.status, 'active');
      subscription.status = newStatus;
      subscription.updatedAt = new Date().toISOString();

      console.log(`[WebhookSync] Trial ended - subscription ${subscription.id} transitioned to active`);
    }

    return subscription;
  }

  // ============================================
  // HANDLE SUBSCRIPTION UPDATED
  // ============================================

  private async handleSubscriptionUpdated(event: WebhookEvent): Promise<Subscription | null> {
    const providerSubId = event.data.subscription_id as string;
    const subscription = this.findSubscriptionByProviderId(providerSubId);

    if (!subscription) {
      console.log(`[WebhookSync] Subscription not found for provider_sub_id: ${providerSubId}`);
      return null;
    }

    // Update subscription fields from provider
    if (event.data.status) {
      const newStatus = event.data.status as SubscriptionStatus;
      try {
        subscriptionStateMachine.transition(subscription.status, newStatus);
        subscription.status = newStatus;
      } catch (error) {
        console.error(`[WebhookSync] Invalid status transition: ${subscription.status} -> ${newStatus}`);
      }
    }

    if (event.data.current_period_end) {
      subscription.currentPeriodEnd = event.data.current_period_end as string;
      subscription.nextBillingAt = event.data.current_period_end as string;
    }

    if (event.data.cancel_at_period_end !== undefined) {
      subscription.cancelAtPeriodEnd = event.data.cancel_at_period_end as boolean;
    }

    subscription.updatedAt = new Date().toISOString();

    console.log(`[WebhookSync] Subscription updated - subscription ${subscription.id}`);

    return subscription;
  }

  // ============================================
  // FIND SUBSCRIPTION BY PROVIDER ID
  // ============================================

  private findSubscriptionByProviderId(providerSubId: string): Subscription | null {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.providerSubId === providerSubId) {
        return subscription;
      }
    }
    return null;
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
export const subscriptionWebhookSyncEngine = new SubscriptionWebhookSyncEngine();

// ============================================
// REACT HOOK FOR WEBHOOK SYNC
// ============================================

import { useState, useCallback } from 'react';

export function useWebhookSync() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processWebhookEvent = useCallback(async (event: WebhookEvent) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await subscriptionWebhookSyncEngine.processWebhookEvent(event);
      if (!result.success) {
        setError(result.error || 'Failed to process webhook event');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process webhook event';
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
    processWebhookEvent,
    clearError,
  };
}
