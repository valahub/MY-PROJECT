// Dunning Engine
// Auto revenue recovery with retry schedule (1d, 3d, 5d, suspend)

import type { Invoice, DunningLog, DunningConfig, DunningRetryResult, DunningTimeline, DunningAction, DunningStatus } from './invoice-types';
import { invoiceService } from './invoice-service';

// ============================================
// DEFAULT DUNNING CONFIG
// ============================================

const DEFAULT_DUNNING_CONFIG: DunningConfig = {
  maxRetries: 4,
  retrySchedule: [1, 3, 5, 7], // days between retries
  actions: {
    1: 'email', // Attempt 1: Send email
    2: 'retry', // Attempt 2: Retry payment
    3: 'retry', // Attempt 3: Retry payment
    4: 'suspend', // Attempt 4: Suspend subscription
  },
  suspendAfterAttempts: 4,
};

// ============================================
// DUNNING ENGINE
// ============================================

export class DunningEngine {
  private config: DunningConfig;
  private dunningLogs: Map<string, DunningLog[]> = new Map();

  constructor(config: Partial<DunningConfig> = {}) {
    this.config = { ...DEFAULT_DUNNING_CONFIG, ...config };
  }

  // ============================================
  // PROCESS FAILED PAYMENT
  // ============================================

  async processFailedPayment(invoiceId: string, customerId: string): Promise<DunningRetryResult> {
    const invoice = await invoiceService.getInvoice(invoiceId);
    if (!invoice) {
      return {
        success: false,
        invoiceId,
        attemptNumber: 0,
        action: 'email',
        status: 'failed',
        timestamp: new Date().toISOString(),
        errorMessage: 'Invoice not found',
      };
    }

    // Increment retry count
    const updatedInvoice = await invoiceService.incrementRetryCount(invoiceId);
    const currentAttempt = (updatedInvoice?.retryCount || 0) + 1;

    // Determine action based on attempt number
    const action = this.config.actions[currentAttempt] || 'suspend';

    // Execute action
    const result = await this.executeAction(invoice, currentAttempt, action, customerId);

    // Log the dunning attempt
    this.logDunningAttempt(invoiceId, customerId, currentAttempt, action, result.status, result.errorMessage);

    return result;
  }

  // ============================================
  // EXECUTE DUNNING ACTION
  // ============================================

  private async executeAction(
    invoice: Invoice,
    attemptNumber: number,
    action: DunningAction,
    customerId: string
  ): Promise<DunningRetryResult> {
    const timestamp = new Date().toISOString();

    try {
      switch (action) {
        case 'email':
          return await this.sendReminderEmail(invoice, customerId, attemptNumber);
        case 'retry':
          return await this.retryPayment(invoice, customerId, attemptNumber);
        case 'suspend':
          return await this.suspendSubscription(invoice, customerId, attemptNumber);
        case 'downgrade':
          return await this.downgradePlan(invoice, customerId, attemptNumber);
        case 'cancel':
          return await this.cancelSubscription(invoice, customerId, attemptNumber);
        default:
          return {
            success: false,
            invoiceId: invoice.id,
            attemptNumber,
            action,
            status: 'failed',
            timestamp,
            errorMessage: 'Unknown action',
          };
      }
    } catch (error) {
      return {
        success: false,
        invoiceId: invoice.id,
        attemptNumber,
        action,
        status: 'failed',
        timestamp,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // SEND REMINDER EMAIL
  // ============================================

  private async sendReminderEmail(
    invoice: Invoice,
    customerId: string,
    attemptNumber: number
  ): Promise<DunningRetryResult> {
    const timestamp = new Date().toISOString();

    try {
      // In production, call email service
      console.log(`[DunningEngine] Sending reminder email for invoice ${invoice.invoiceNumber} (attempt ${attemptNumber})`);

      return {
        success: true,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'email',
        status: 'success',
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'email',
        status: 'failed',
        timestamp,
        errorMessage: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  // ============================================
  // RETRY PAYMENT
  // ============================================

  private async retryPayment(
    invoice: Invoice,
    customerId: string,
    attemptNumber: number
  ): Promise<DunningRetryResult> {
    const timestamp = new Date().toISOString();

    try {
      // In production, call payment gateway to retry
      console.log(`[DunningEngine] Retrying payment for invoice ${invoice.invoiceNumber} (attempt ${attemptNumber})`);

      // Simulate payment retry
      const paymentSuccess = Math.random() > 0.5; // 50% success rate for demo

      if (paymentSuccess) {
        await invoiceService.markAsPaid(invoice.id);
        return {
          success: true,
          invoiceId: invoice.id,
          attemptNumber,
          action: 'retry',
          status: 'success',
          timestamp,
        };
      } else {
        return {
          success: false,
          invoiceId: invoice.id,
          attemptNumber,
          action: 'retry',
          status: 'failed',
          timestamp,
          errorMessage: 'Payment retry failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'retry',
        status: 'failed',
        timestamp,
        errorMessage: error instanceof Error ? error.message : 'Payment retry error',
      };
    }
  }

  // ============================================
  // SUSPEND SUBSCRIPTION
  // ============================================

  private async suspendSubscription(
    invoice: Invoice,
    customerId: string,
    attemptNumber: number
  ): Promise<DunningRetryResult> {
    const timestamp = new Date().toISOString();

    try {
      // In production, call subscription service to suspend
      console.log(`[DunningEngine] Suspending subscription for invoice ${invoice.invoiceNumber} (attempt ${attemptNumber})`);

      await invoiceService.markAsOverdue(invoice.id);

      return {
        success: true,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'suspend',
        status: 'success',
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'suspend',
        status: 'failed',
        timestamp,
        errorMessage: error instanceof Error ? error.message : 'Failed to suspend subscription',
      };
    }
  }

  // ============================================
  // DOWNGRADE PLAN
  // ============================================

  private async downgradePlan(
    invoice: Invoice,
    customerId: string,
    attemptNumber: number
  ): Promise<DunningRetryResult> {
    const timestamp = new Date().toISOString();

    try {
      // In production, call subscription service to downgrade
      console.log(`[DunningEngine] Downgrading plan for invoice ${invoice.invoiceNumber} (attempt ${attemptNumber})`);

      return {
        success: true,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'downgrade',
        status: 'success',
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'downgrade',
        status: 'failed',
        timestamp,
        errorMessage: error instanceof Error ? error.message : 'Failed to downgrade plan',
      };
    }
  }

  // ============================================
  // CANCEL SUBSCRIPTION
  // ============================================

  private async cancelSubscription(
    invoice: Invoice,
    customerId: string,
    attemptNumber: number
  ): Promise<DunningRetryResult> {
    const timestamp = new Date().toISOString();

    try {
      // In production, call subscription service to cancel
      console.log(`[DunningEngine] Canceling subscription for invoice ${invoice.invoiceNumber} (attempt ${attemptNumber})`);

      return {
        success: true,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'cancel',
        status: 'success',
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        invoiceId: invoice.id,
        attemptNumber,
        action: 'cancel',
        status: 'failed',
        timestamp,
        errorMessage: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }

  // ============================================
  // LOG DUNNING ATTEMPT
  // ============================================

  private logDunningAttempt(
    invoiceId: string,
    customerId: string,
    attemptNumber: number,
    action: DunningAction,
    status: DunningStatus,
    errorMessage?: string | null
  ): void {
    const log: DunningLog = {
      id: `dun_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceId,
      customerId,
      attemptNumber,
      action,
      status,
      timestamp: new Date().toISOString(),
      errorMessage,
    };

    if (!this.dunningLogs.has(invoiceId)) {
      this.dunningLogs.set(invoiceId, []);
    }

    this.dunningLogs.get(invoiceId)!.push(log);

    // In production, save to database
    console.log(`[DunningEngine] Logged dunning attempt:`, log);
  }

  // ============================================
  // GET DUNNING TIMELINE
  // ============================================

  async getDunningTimeline(invoiceId: string): Promise<DunningTimeline | null> {
    const invoice = await invoiceService.getInvoice(invoiceId);
    if (!invoice) return null;

    const logs = this.dunningLogs.get(invoiceId) || [];
    const currentAttempt = logs.length > 0 ? logs[logs.length - 1].attemptNumber : 0;

    // Calculate next action
    let nextAction: DunningAction | undefined;
    let nextActionAt: string | undefined;

    if (currentAttempt < this.config.maxRetries) {
      nextAction = this.config.actions[currentAttempt + 1];
      const daysUntilNext = this.config.retrySchedule[currentAttempt];
      nextActionAt = new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000).toISOString();
    }

    return {
      invoiceId,
      customerId: invoice.customerId,
      logs,
      currentAttempt,
      nextAction,
      nextActionAt,
      estimatedRecoveryDate: nextActionAt,
    };
  }

  // ============================================
  // PROCESS OVERDUE INVOICES (CRON JOB)
  // ============================================

  async processOverdueInvoices(tenantId: string): Promise<{ processed: number; recovered: number; failed: number }> {
    const overdueInvoices = await invoiceService.getOverdueInvoices(tenantId);
    
    let processed = 0;
    let recovered = 0;
    let failed = 0;

    for (const invoice of overdueInvoices) {
      const result = await this.processFailedPayment(invoice.id, invoice.customerId);
      processed++;

      if (result.success && result.action === 'retry' && result.status === 'success') {
        recovered++;
      } else if (!result.success) {
        failed++;
      }
    }

    return { processed, recovered, failed };
  }

  // ============================================
  // UPDATE CONFIG
  // ============================================

  updateConfig(config: Partial<DunningConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================
  // GET DUNNING LOGS
  // ============================================

  getDunningLogs(invoiceId: string): DunningLog[] {
    return this.dunningLogs.get(invoiceId) || [];
  }

  // ============================================
  // CLEAR LOGS
  // ============================================

  clearLogs(invoiceId: string): void {
    this.dunningLogs.delete(invoiceId);
  }

  clearAllLogs(): void {
    this.dunningLogs.clear();
  }
}

// Export singleton instance
export const dunningEngine = new DunningEngine();
