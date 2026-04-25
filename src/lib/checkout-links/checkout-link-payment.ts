// Checkout Link Payment Integration
// Stripe/Razorpay integration

import type { CheckoutLink } from './checkout-link-types';

// ============================================
// PAYMENT PROVIDER
// ============================================

export type PaymentProvider = 'stripe' | 'razorpay';

// ============================================
// PAYMENT SESSION
// ============================================

export interface PaymentSession {
  sessionId: string;
  checkoutUrl: string;
  provider: PaymentProvider;
  checkoutLinkId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  expiresAt: string;
}

// ============================================
// PAYMENT RESULT
// ============================================

export interface PaymentResult {
  success: boolean;
  paymentSession: PaymentSession | null;
  error?: string;
  timestamp: string;
}

// ============================================
// PAYMENT INTEGRATION ENGINE
// ============================================

export class PaymentIntegrationEngine {
  private paymentSessions: Map<string, PaymentSession> = new Map();

  // ============================================
  // CREATE PAYMENT SESSION
  // ============================================

  async createPaymentSession(
    checkoutLink: CheckoutLink,
    amount: number,
    currency: string = 'USD',
    provider: PaymentProvider = 'stripe'
  ): Promise<PaymentResult> {
    try {
      console.log(`[PaymentIntegration] Creating payment session for checkout link ${checkoutLink.id} using ${provider}`);

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const checkoutUrl = await this.generateCheckoutUrl(checkoutLink, amount, currency, provider, sessionId);

      const paymentSession: PaymentSession = {
        sessionId,
        checkoutUrl,
        provider,
        checkoutLinkId: checkoutLink.id,
        amount,
        currency,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };

      this.paymentSessions.set(sessionId, paymentSession);

      return {
        success: true,
        paymentSession,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        paymentSession: null,
        error: error instanceof Error ? error.message : 'Failed to create payment session',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // GENERATE CHECKOUT URL
  // ============================================

  private async generateCheckoutUrl(
    checkoutLink: CheckoutLink,
    amount: number,
    currency: string,
    provider: PaymentProvider,
    sessionId: string
  ): Promise<string> {
    // In production, call Stripe/Razorpay API to create checkout session
    // For now, return placeholder URL
    if (provider === 'stripe') {
      return `https://checkout.stripe.com/pay/${sessionId}`;
    } else if (provider === 'razorpay') {
      return `https://razorpay.com/payment/${sessionId}`;
    }
    return `https://checkout.example.com/${sessionId}`;
  }

  // ============================================
  // PROCESS WEBHOOK
  // ============================================

  async processWebhook(event: {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
  }): Promise<PaymentResult> {
    try {
      const sessionId = event.data.session_id as string;
      const paymentSession = this.paymentSessions.get(sessionId);

      if (!paymentSession) {
        return {
          success: false,
          paymentSession: null,
          error: 'Payment session not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Update payment session status based on webhook event
      if (event.type === 'payment.success' || event.type === 'checkout.session.completed') {
        paymentSession.status = 'completed';
      } else if (event.type === 'payment.failed' || event.type === 'checkout.session.expired') {
        paymentSession.status = 'failed';
      }

      console.log(`[PaymentIntegration] Processed webhook ${event.type} for session ${sessionId}`);

      return {
        success: true,
        paymentSession,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        paymentSession: null,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // GET PAYMENT SESSION
  // ============================================

  getPaymentSession(sessionId: string): PaymentSession | null {
    return this.paymentSessions.get(sessionId) || null;
  }

  // ============================================
  // GET PAYMENT SESSIONS BY CHECKOUT LINK
  // ============================================

  getPaymentSessionsByCheckoutLink(checkoutLinkId: string): PaymentSession[] {
    const sessions: PaymentSession[] = [];

    for (const session of this.paymentSessions.values()) {
      if (session.checkoutLinkId === checkoutLinkId) {
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ============================================
  // CANCEL PAYMENT SESSION
  // ============================================

  cancelPaymentSession(sessionId: string): PaymentSession | null {
    const paymentSession = this.paymentSessions.get(sessionId);

    if (paymentSession) {
      paymentSession.status = 'failed';
      console.log(`[PaymentIntegration] Cancelled payment session ${sessionId}`);
      return paymentSession;
    }

    return null;
  }

  // ============================================
  // CLEANUP EXPIRED SESSIONS
  // ============================================

  cleanupExpiredSessions(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, session] of this.paymentSessions.entries()) {
      const expiryTime = new Date(session.expiresAt).getTime();
      if (now > expiryTime) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.paymentSessions.delete(key);
    }

    return keysToDelete.length;
  }

  // ============================================
  // GET PAYMENT STATISTICS
  // ============================================

  getPaymentStatistics(checkoutLinkId?: string): {
    totalSessions: number;
    completedSessions: number;
    failedSessions: number;
    pendingSessions: number;
    totalAmount: number;
  } {
    let sessions = Array.from(this.paymentSessions.values());

    if (checkoutLinkId) {
      sessions = sessions.filter((s) => s.checkoutLinkId === checkoutLinkId);
    }

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const failedSessions = sessions.filter((s) => s.status === 'failed').length;
    const pendingSessions = sessions.filter((s) => s.status === 'pending').length;
    const totalAmount = sessions
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      totalSessions,
      completedSessions,
      failedSessions,
      pendingSessions,
      totalAmount,
    };
  }
}

// Export singleton instance
export const paymentIntegrationEngine = new PaymentIntegrationEngine();

// ============================================
// REACT HOOK FOR PAYMENT INTEGRATION
// ============================================

import { useState, useCallback } from 'react';

export function usePaymentIntegration() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentSession = useCallback((
    checkoutLink: CheckoutLink,
    amount: number,
    currency?: string,
    provider?: PaymentProvider
  ) => {
    setIsProcessing(true);
    setError(null);

    return paymentIntegrationEngine.createPaymentSession(checkoutLink, amount, currency, provider)
      .then((result) => {
        if (!result.success) {
          setError(result.error || 'Failed to create payment session');
        }
        return result;
      })
      .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create payment session';
        setError(errorMessage);
        return {
          success: false,
          paymentSession: null,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }, []);

  const processWebhook = useCallback((event: {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
  }) => {
    setIsProcessing(true);
    setError(null);

    return paymentIntegrationEngine.processWebhook(event)
      .then((result) => {
        if (!result.success) {
          setError(result.error || 'Failed to process webhook');
        }
        return result;
      })
      .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process webhook';
        setError(errorMessage);
        return {
          success: false,
          paymentSession: null,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }, []);

  const getPaymentSession = useCallback((sessionId: string) => {
    return paymentIntegrationEngine.getPaymentSession(sessionId);
  }, []);

  const getPaymentStatistics = useCallback((checkoutLinkId?: string) => {
    return paymentIntegrationEngine.getPaymentStatistics(checkoutLinkId);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    createPaymentSession,
    processWebhook,
    getPaymentSession,
    getPaymentStatistics,
    clearError,
  };
}
