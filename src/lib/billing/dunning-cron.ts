// Dunning Cron Job
// Auto retry failed payments every 6 hours

import { dunningEngine } from './dunning-engine';
import { billingEventEmitter, billingEventBus } from './billing-events';
import { invoiceService } from './invoice-service';

// ============================================
// CRON JOB CONFIG
// ============================================

export interface DunningCronConfig {
  intervalMs: number; // milliseconds between runs
  maxRetriesPerRun: number;
  enabled: boolean;
}

const DEFAULT_DUNNING_CRON_CONFIG: DunningCronConfig = {
  intervalMs: 6 * 60 * 60 * 1000, // 6 hours
  maxRetriesPerRun: 100,
  enabled: true,
};

// ============================================
// CRON JOB RESULT
// ============================================

export interface CronJobResult {
  success: boolean;
  processed: number;
  recovered: number;
  failed: number;
  skipped: number;
  errors: string[];
  timestamp: string;
  duration: number; // in milliseconds
}

// ============================================
// DUNNING CRON MANAGER
// ============================================

export class DunningCronManager {
  private config: DunningCronConfig;
  private intervalId: number | null = null;
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private jobHistory: CronJobResult[] = [];
  private maxHistorySize: number = 100;

  constructor(config: Partial<DunningCronConfig> = {}) {
    this.config = { ...DEFAULT_DUNNING_CRON_CONFIG, ...config };
  }

  // ============================================
  // START CRON JOB
  // ============================================

  start(tenantId: string): void {
    if (this.intervalId) {
      console.log('[DunningCron] Cron job already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('[DunningCron] Cron job is disabled');
      return;
    }

    console.log(`[DunningCron] Starting cron job (interval: ${this.config.intervalMs}ms)`);

    this.intervalId = setInterval(async () => {
      await this.runJob(tenantId);
    }, this.config.intervalMs);

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
      console.log('[DunningCron] Cron job stopped');
    }
  }

  // ============================================
  // RUN JOB MANUALLY
  // ============================================

  async runJob(tenantId: string): Promise<CronJobResult> {
    if (this.isRunning) {
      console.log('[DunningCron] Job already running, skipping');
      return {
        success: false,
        processed: 0,
        recovered: 0,
        failed: 0,
        skipped: 0,
        errors: ['Job already running'],
        timestamp: new Date().toISOString(),
        duration: 0,
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    let recovered = 0;
    let failed = 0;
    let skipped = 0;

    try {
      console.log(`[DunningCron] Running dunning job for tenant ${tenantId}`);

      // Get overdue invoices
      const overdueInvoices = await invoiceService.getOverdueInvoices(tenantId);
      console.log(`[DunningCron] Found ${overdueInvoices.length} overdue invoices`);

      // Process each invoice
      for (const invoice of overdueInvoices) {
        if (processed >= this.config.maxRetriesPerRun) {
          console.log(`[DunningCron] Reached max retries per run (${this.config.maxRetriesPerRun})`);
          skipped += overdueInvoices.length - processed;
          break;
        }

        try {
          // Check if invoice should be retried based on schedule
          const shouldRetry = await this.shouldRetryInvoice(invoice);

          if (!shouldRetry) {
            skipped++;
            continue;
          }

          // Process dunning
          const result = await dunningEngine.processFailedPayment(
            invoice.id,
            invoice.customerId
          );

          processed++;

          if (result.success && result.action === 'retry' && result.status === 'success') {
            recovered++;
            console.log(`[DunningCron] Recovered invoice ${invoice.invoiceNumber}`);
          } else if (!result.success) {
            failed++;
            errors.push(`${invoice.invoiceNumber}: ${result.errorMessage}`);
            console.error(`[DunningCron] Failed to process invoice ${invoice.invoiceNumber}:`, result.errorMessage);
          } else {
            console.log(`[DunningCron] Processed invoice ${invoice.invoiceNumber} (action: ${result.action}, status: ${result.status})`);
          }
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${invoice.invoiceNumber}: ${errorMessage}`);
          console.error(`[DunningCron] Error processing invoice ${invoice.invoiceNumber}:`, error);
        }
      }

      // Emit event for cron job completion
      await billingEventBus.emit({
        type: 'dunning.attempt',
        data: {
          tenantId,
          processed,
          recovered,
          failed,
          skipped,
        },
        timestamp: new Date().toISOString(),
      });

      const duration = Date.now() - startTime;
      const result: CronJobResult = {
        success: true,
        processed,
        recovered,
        failed,
        skipped,
        errors,
        timestamp: new Date().toISOString(),
        duration,
      };

      this.jobHistory.push(result);
      if (this.jobHistory.length > this.maxHistorySize) {
        this.jobHistory.shift();
      }

      this.lastRun = new Date();

      console.log(`[DunningCron] Job completed: processed=${processed}, recovered=${recovered}, failed=${failed}, skipped=${skipped}, duration=${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const result: CronJobResult = {
        success: false,
        processed,
        recovered,
        failed,
        skipped,
        errors: [errorMessage],
        timestamp: new Date().toISOString(),
        duration,
      };

      this.jobHistory.push(result);
      if (this.jobHistory.length > this.maxHistorySize) {
        this.jobHistory.shift();
      }

      console.error('[DunningCron] Job failed:', error);

      return result;
    } finally {
      this.isRunning = false;
    }
  }

  // ============================================
  // SHOULD RETRY INVOICE
  // ============================================

  private async shouldRetryInvoice(invoice: any): Promise<boolean> {
    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return false;
    }

    // Check if invoice is cancelled
    if (invoice.status === 'cancelled') {
      return false;
    }

    // Check retry schedule
    const retrySchedule = [1, 3, 5, 7]; // days
    const currentRetryCount = invoice.retryCount || 0;

    if (currentRetryCount >= retrySchedule.length) {
      return false;
    }

    // Check if enough time has passed since last retry
    if (invoice.lastRetryAt) {
      const lastRetry = new Date(invoice.lastRetryAt).getTime();
      const now = Date.now();
      const daysSinceLastRetry = (now - lastRetry) / (1000 * 60 * 60 * 24);

      const requiredDays = retrySchedule[currentRetryCount];

      if (daysSinceLastRetry < requiredDays) {
        return false;
      }
    }

    return true;
  }

  // ============================================
  // GET JOB STATUS
  // ============================================

  getStatus(): {
    isRunning: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
    config: DunningCronConfig;
  } {
    const nextRun = this.lastRun && this.intervalId
      ? new Date(this.lastRun.getTime() + this.config.intervalMs)
      : null;

    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun,
      config: this.config,
    };
  }

  // ============================================
  // GET JOB HISTORY
  // ============================================

  getHistory(limit?: number): CronJobResult[] {
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
  // UPDATE CONFIG
  // ============================================

  updateConfig(config: Partial<DunningCronConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart if interval changed
    if (config.intervalMs && this.intervalId) {
      // This would require the tenantId, so we'll just update the config
      // The next run will use the new interval
      console.log('[DunningCron] Config updated, will apply on next run');
    }
  }

  // ============================================
  // ENABLE/DISABLE
  // ============================================

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (!enabled && this.intervalId) {
      this.stop();
    }

    console.log(`[DunningCron] Cron job ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const dunningCronManager = new DunningCronManager();

// ============================================
// REACT HOOK FOR DUNNING CRON
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useDunningCron() {
  const [status, setStatus] = useState(dunningCronManager.getStatus());
  const [history, setHistory] = useState(dunningCronManager.getHistory(10));

  const startCron = useCallback((tenantId: string) => {
    dunningCronManager.start(tenantId);
    setStatus(dunningCronManager.getStatus());
  }, []);

  const stopCron = useCallback(() => {
    dunningCronManager.stop();
    setStatus(dunningCronManager.getStatus());
  }, []);

  const runJob = useCallback(async (tenantId: string) => {
    const result = await dunningCronManager.runJob(tenantId);
    setStatus(dunningCronManager.getStatus());
    setHistory(dunningCronManager.getHistory(10));
    return result;
  }, []);

  const refreshStatus = useCallback(() => {
    setStatus(dunningCronManager.getStatus());
    setHistory(dunningCronManager.getHistory(10));
  }, []);

  const updateConfig = useCallback((config: Partial<DunningCronConfig>) => {
    dunningCronManager.updateConfig(config);
    setStatus(dunningCronManager.getStatus());
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    dunningCronManager.setEnabled(enabled);
    setStatus(dunningCronManager.getStatus());
  }, []);

  // Refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    status,
    history,
    startCron,
    stopCron,
    runJob,
    refreshStatus,
    updateConfig,
    setEnabled,
  };
}
