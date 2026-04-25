// Checkout Link Webhook Handler
// Increment conversions, create subscription

import type { CheckoutLink } from './checkout-link-types';
import { conversionTrackingEngine } from './checkout-link-conversion-tracking';

// ============================================
// WEBHOOK HANDLER RESULT
// ============================================

export interface WebhookHandlerResult {
  success: boolean;
  checkoutLink: CheckoutLink | null;
  subscriptionId?: string;
  error?: string;
  timestamp: string;
}

// ============================================
// CHECKOUT LINK WEBHOOK HANDLER
// ============================================

export class CheckoutLinkWebhookHandler {
  private checkoutLinks: Map<string, CheckoutLink> = new Map();

  // ============================================
  // PROCESS PAYMENT SUCCESS WEBHOOK
  // ============================================

  async processPaymentSuccess(event: {
    checkoutLinkId: string;
    sessionId: string;
    amount: number;
    customerId: string;
    timestamp: string;
  }): Promise<WebhookHandlerResult> {
    try {
      const checkoutLink = this.checkoutLinks.get(event.checkoutLinkId);

      if (!checkoutLink) {
        return {
          success: false,
          checkoutLink: null,
          error: 'Checkout link not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Increment conversion count
      conversionTrackingEngine.trackConversion(event.checkoutLinkId, {
        sessionId: event.sessionId,
        amount: event.amount,
        customerId: event.customerId,
      });

      // Create subscription (in production, call subscription service)
      const subscriptionId = await this.createSubscription(
        checkoutLink,
        event.customerId,
        event.amount
      );

      console.log(`[WebhookHandler] Payment success processed for checkout link ${event.checkoutLinkId}`);

      return {
        success: true,
        checkoutLink,
        subscriptionId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        checkoutLink: this.checkoutLinks.get(event.checkoutLinkId) || null,
        error: error instanceof Error ? error.message : 'Failed to process payment success',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // PROCESS PAYMENT FAILED WEBHOOK
  // ============================================

  async processPaymentFailed(event: {
    checkoutLinkId: string;
    sessionId: string;
    reason: string;
    timestamp: string;
  }): Promise<WebhookHandlerResult> {
    try {
      const checkoutLink = this.checkoutLinks.get(event.checkoutLinkId);

      if (!checkoutLink) {
        return {
          success: false,
          checkoutLink: null,
          error: 'Checkout link not found',
          timestamp: new Date().toISOString(),
        };
      }

      console.log(`[WebhookHandler] Payment failed for checkout link ${event.checkoutLinkId}: ${event.reason}`);

      return {
        success: true,
        checkoutLink,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        checkoutLink: this.checkoutLinks.get(event.checkoutLinkId) || null,
        error: error instanceof Error ? error.message : 'Failed to process payment failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // PROCESS CHECKOUT VIEWED WEBHOOK
  // ============================================

  async processCheckoutViewed(event: {
    checkoutLinkId: string;
    sessionId: string;
    timestamp: string;
  }): Promise<WebhookHandlerResult> {
    try {
      const checkoutLink = this.checkoutLinks.get(event.checkoutLinkId);

      if (!checkoutLink) {
        return {
          success: false,
          checkoutLink: null,
          error: 'Checkout link not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Track view
      conversionTrackingEngine.trackView(event.checkoutLinkId, {
        sessionId: event.sessionId,
      });

      console.log(`[WebhookHandler] Checkout viewed for checkout link ${event.checkoutLinkId}`);

      return {
        success: true,
        checkoutLink,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        checkoutLink: this.checkoutLinks.get(event.checkoutLinkId) || null,
        error: error instanceof Error ? error.message : 'Failed to process checkout viewed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // CREATE SUBSCRIPTION
  // ============================================

  private async createSubscription(
    checkoutLink: CheckoutLink,
    customerId: string,
    amount: number
  ): Promise<string> {
    // In production, call subscription service to create subscription
    // For now, return placeholder subscription ID
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[WebhookHandler] Created subscription ${subscriptionId} for customer ${customerId}`);
    return subscriptionId;
  }

  // ============================================
  // SEND INVOICE
  // ============================================

  private async sendInvoice(subscriptionId: string, customerId: string): Promise<void> {
    // In production, send invoice to customer
    console.log(`[WebhookHandler] Sent invoice for subscription ${subscriptionId} to customer ${customerId}`);
  }

  // ============================================
  // PROCESS GENERIC WEBHOOK
  // ============================================

  async processWebhook(event: {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
  }): Promise<WebhookHandlerResult> {
    try {
      switch (event.type) {
        case 'payment.success':
        case 'checkout.session.completed':
          return await this.processPaymentSuccess({
            checkoutLinkId: event.data.checkoutLinkId as string,
            sessionId: event.data.sessionId as string,
            amount: event.data.amount as number,
            customerId: event.data.customerId as string,
            timestamp: event.timestamp,
          });

        case 'payment.failed':
        case 'checkout.session.failed':
          return await this.processPaymentFailed({
            checkoutLinkId: event.data.checkoutLinkId as string,
            sessionId: event.data.sessionId as string,
            reason: event.data.reason as string,
            timestamp: event.timestamp,
          });

        case 'checkout.viewed':
          return await this.processCheckoutViewed({
            checkoutLinkId: event.data.checkoutLinkId as string,
            sessionId: event.data.sessionId as string,
            timestamp: event.timestamp,
          });

        default:
          return {
            success: false,
            checkoutLink: null,
            error: 'Unsupported webhook event type',
            timestamp: new Date().toISOString(),
          };
      }
    } catch (error) {
      return {
        success: false,
        checkoutLink: null,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // REGISTER CHECKOUT LINK
  // ============================================

  registerCheckoutLink(checkoutLink: CheckoutLink): void {
    this.checkoutLinks.set(checkoutLink.id, checkoutLink);
    conversionTrackingEngine.registerCheckoutLink(checkoutLink);
  }

  // ============================================
  // UNREGISTER CHECKOUT LINK
  // ============================================

  unregisterCheckoutLink(checkoutLinkId: string): void {
    this.checkoutLinks.delete(checkoutLinkId);
  }

  // ============================================
  // GET CHECKOUT LINK
  // ============================================

  getCheckoutLink(checkoutLinkId: string): CheckoutLink | null {
    return this.checkoutLinks.get(checkoutLinkId) || null;
  }

  // ============================================
  // GET ALL CHECKOUT LINKS
  // ============================================

  getAllCheckoutLinks(): CheckoutLink[] {
    return Array.from(this.checkoutLinks.values());
  }
}

// Export singleton instance
export const checkoutLinkWebhookHandler = new CheckoutLinkWebhookHandler();

// ============================================
// REACT HOOK FOR WEBHOOK HANDLER
// ============================================

import { useState, useCallback } from 'react';

export function useCheckoutLinkWebhookHandler() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPaymentSuccess = useCallback(async (event: {
    checkoutLinkId: string;
    sessionId: string;
    amount: number;
    customerId: string;
    timestamp: string;
  }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await checkoutLinkWebhookHandler.processPaymentSuccess(event);
      if (!result.success) {
        setError(result.error || 'Failed to process payment success');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment success';
      setError(errorMessage);
      return {
        success: false,
        checkoutLink: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processPaymentFailed = useCallback(async (event: {
    checkoutLinkId: string;
    sessionId: string;
    reason: string;
    timestamp: string;
  }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await checkoutLinkWebhookHandler.processPaymentFailed(event);
      if (!result.success) {
        setError(result.error || 'Failed to process payment failed');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment failed';
      setError(errorMessage);
      return {
        success: false,
        checkoutLink: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processCheckoutViewed = useCallback(async (event: {
    checkoutLinkId: string;
    sessionId: string;
    timestamp: string;
  }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await checkoutLinkWebhookHandler.processCheckoutViewed(event);
      if (!result.success) {
        setError(result.error || 'Failed to process checkout viewed');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process checkout viewed';
      setError(errorMessage);
      return {
        success: false,
        checkoutLink: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processWebhook = useCallback(async (event: {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
  }) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await checkoutLinkWebhookHandler.processWebhook(event);
      if (!result.success) {
        setError(result.error || 'Failed to process webhook');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process webhook';
      setError(errorMessage);
      return {
        success: false,
        checkoutLink: null,
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
    processPaymentSuccess,
    processPaymentFailed,
    processCheckoutViewed,
    processWebhook,
    clearError,
  };
}
