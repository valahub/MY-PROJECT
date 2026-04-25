// Subscription Next Billing Engine
// Daily cron, trigger invoices, payment attempt

import type { Subscription } from './subscription-types';

// ============================================
// BILLING CRON JOB RESULT
// ============================================

export interface BillingCronJobResult {
  success: boolean;
  processed: number;
  invoicesGenerated: number;
  paymentAttempts: number;
  errors: string[];
  timestamp: string;
  duration: number;
}

// ============================================
// BILLING SCHEDULER MANAGER
// ============================================

export class BillingSchedulerManager {
  private intervalMs: number = 24 * 60 * 60 * 1000; // 24 hours
  private intervalId: number | null = null;
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private jobHistory: BillingCronJobResult[] = [];
  private maxHistorySize: number = 30;
  private subscriptions: Map<string, Subscription> = new Map();

  // ============================================
  // START CRON JOB
  // ============================================

  start(tenantId: string): void {
    if (this.intervalId) {
      console.log('[BillingScheduler] Job already running');
      return;
    }

    console.log(`[BillingScheduler] Starting job (interval: ${this.intervalMs}ms)`);

    this.intervalId = setInterval(async () => {
      await this.runJob(tenantId);
    }, this.intervalMs) as unknown as number;

    // Run immediately on start
    this.runJob(tenantId);
  }

  // ============================================
  // STOP CRON JOB
  // ============================================

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('[BillingScheduler] Job stopped');
    }
  }

  // ============================================
  // RUN JOB MANUALLY
  // ============================================

  async runJob(tenantId: string): Promise<BillingCronJobResult> {
    if (this.isRunning) {
      console.log('[BillingScheduler] Job already running, skipping');
      return {
        success: false,
        processed: 0,
        invoicesGenerated: 0,
        paymentAttempts: 0,
        errors: ['Job already running'],
        timestamp: new Date().toISOString(),
        duration: 0,
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    let invoicesGenerated = 0;
    let paymentAttempts = 0;

    try {
      console.log(`[BillingScheduler] Running job for tenant ${tenantId}`);

      const now = new Date();
      const subscriptions = Array.from(this.subscriptions.values()).filter(
        (sub) => sub.tenantId === tenantId && sub.status === 'active'
      );

      // Process each subscription
      for (const subscription of subscriptions) {
        processed++;

        try {
          const nextBilling = new Date(subscription.nextBillingAt);

          // Check if billing is due (within next 24 hours)
          const timeUntilBilling = nextBilling.getTime() - now.getTime();
          const hoursUntilBilling = timeUntilBilling / (1000 * 60 * 60);

          if (hoursUntilBilling <= 24 && hoursUntilBilling > 0) {
            // Generate invoice
            const invoiceGenerated = await this.generateInvoice(subscription);
            if (invoiceGenerated) {
              invoicesGenerated++;
              console.log(`[BillingScheduler] Generated invoice for subscription ${subscription.id}`);
            }

            // Attempt payment
            const paymentAttempted = await this.attemptPayment(subscription);
            if (paymentAttempted) {
              paymentAttempts++;
              console.log(`[BillingScheduler] Attempted payment for subscription ${subscription.id}`);
            }

            // Update next billing date
            const months = subscription.billingCycle === 'yearly' ? 12 : 1;
            const newNextBilling = new Date(nextBilling);
            newNextBilling.setMonth(newNextBilling.getMonth() + months);
            subscription.nextBillingAt = newNextBilling.toISOString();
            subscription.updatedAt = new Date().toISOString();
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${subscription.id}: ${errorMessage}`);
          console.error(`[BillingScheduler] Error processing subscription ${subscription.id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      const result: BillingCronJobResult = {
        success: true,
        processed,
        invoicesGenerated,
        paymentAttempts,
        errors,
        timestamp: new Date().toISOString(),
        duration,
      };

      this.jobHistory.push(result);
      if (this.jobHistory.length > this.maxHistorySize) {
        this.jobHistory.shift();
      }

      this.lastRun = new Date();

      console.log(`[BillingScheduler] Job completed: processed=${processed}, invoices=${invoicesGenerated}, payments=${paymentAttempts}, duration=${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        processed,
        invoicesGenerated,
        paymentAttempts,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        duration,
      };
    } finally {
      this.isRunning = false;
    }
  }

  // ============================================
  // GENERATE INVOICE
  // ============================================

  private async generateInvoice(subscription: Subscription): Promise<boolean> {
    // In production, call Stripe/Razorpay API to generate invoice
    console.log(`[BillingScheduler] Generating invoice for subscription ${subscription.id} (${subscription.provider})`);
    return true;
  }

  // ============================================
  // ATTEMPT PAYMENT
  // ============================================

  private async attemptPayment(subscription: Subscription): Promise<boolean> {
    // In production, call Stripe/Razorpay API to attempt payment
    console.log(`[BillingScheduler] Attempting payment for subscription ${subscription.id} (${subscription.provider})`);
    return true;
  }

  // ============================================
  // GET JOB STATUS
  // ============================================

  getStatus(): {
    isRunning: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
    intervalMs: number;
  } {
    const nextRun = this.lastRun && this.intervalId
      ? new Date(this.lastRun.getTime() + this.intervalMs)
      : null;

    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun,
      intervalMs: this.intervalMs,
    };
  }

  // ============================================
  // GET JOB HISTORY
  // ============================================

  getHistory(limit?: number): BillingCronJobResult[] {
    let history = this.jobHistory;
    if (limit) {
      history = history.slice(-limit);
    }
    return history;
  }

  // ============================================
  // CLEAR HISTORY
  // ============================================

  clearHistory(): void {
    this.jobHistory = [];
  }

  // ============================================
  // UPDATE INTERVAL
  // ============================================

  setIntervalMs(intervalMs: number): void {
    this.intervalMs = intervalMs;

    // Restart if interval changed
    if (this.intervalId) {
      console.log('[BillingScheduler] Interval updated, will apply on next run');
    }
  }

  // ============================================
  // GET JOB SUMMARY
  // ============================================

  getSummary(): {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    totalProcessed: number;
    totalInvoicesGenerated: number;
    totalPaymentAttempts: number;
    averageDuration: number;
  } {
    const totalRuns = this.jobHistory.length;
    const successfulRuns = this.jobHistory.filter((r) => r.success).length;
    const failedRuns = this.jobHistory.filter((r) => !r.success).length;
    const totalProcessed = this.jobHistory.reduce((sum, r) => sum + r.processed, 0);
    const totalInvoicesGenerated = this.jobHistory.reduce((sum, r) => sum + r.invoicesGenerated, 0);
    const totalPaymentAttempts = this.jobHistory.reduce((sum, r) => sum + r.paymentAttempts, 0);
    const averageDuration = totalRuns > 0 ? this.jobHistory.reduce((sum, r) => sum + r.duration, 0) / totalRuns : 0;

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      totalProcessed,
      totalInvoicesGenerated,
      totalPaymentAttempts,
      averageDuration,
    };
  }

  // ============================================
  // GET BILLING DUE SOON
  // ============================================

  getBillingDueSoon(days: number = 7): Subscription[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.subscriptions.values()).filter((subscription) => {
      const nextBilling = new Date(subscription.nextBillingAt);
      return subscription.status === 'active' && nextBilling <= cutoff && nextBilling > now;
    });
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
export const billingSchedulerManager = new BillingSchedulerManager();

// ============================================
// REACT HOOK FOR BILLING SCHEDULER
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useBillingScheduler() {
  const [status, setStatus] = useState(billingSchedulerManager.getStatus());
  const [history, setHistory] = useState(billingSchedulerManager.getHistory(10));

  const startJob = useCallback((tenantId: string) => {
    billingSchedulerManager.start(tenantId);
    setStatus(billingSchedulerManager.getStatus());
  }, []);

  const stopJob = useCallback(() => {
    billingSchedulerManager.stop();
    setStatus(billingSchedulerManager.getStatus());
  }, []);

  const runJob = useCallback(async (tenantId: string) => {
    const result = await billingSchedulerManager.runJob(tenantId);
    setStatus(billingSchedulerManager.getStatus());
    setHistory(billingSchedulerManager.getHistory(10));
    return result;
  }, []);

  const refreshStatus = useCallback(() => {
    setStatus(billingSchedulerManager.getStatus());
    setHistory(billingSchedulerManager.getHistory(10));
  }, []);

  const setIntervalMs = useCallback((intervalMs: number) => {
    billingSchedulerManager.setIntervalMs(intervalMs);
    setStatus(billingSchedulerManager.getStatus());
  }, []);

  // Refresh status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    status,
    history,
    startJob,
    stopJob,
    runJob,
    refreshStatus,
    setIntervalMs,
  };
}
