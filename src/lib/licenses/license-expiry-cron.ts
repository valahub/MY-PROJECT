// License Expiry Cron Job
// Runs daily to mark expired licenses

import type { License } from './license-types';
import { licenseEventEmitter } from './license-events';

// ============================================
// EXPIRY CRON JOB RESULT
// ============================================

export interface ExpiryCronJobResult {
  success: boolean;
  processed: number;
  expiredCount: number;
  errors: string[];
  timestamp: string;
  duration: number;
}

// ============================================
// LICENSE EXPIRY CRON JOB MANAGER
// ============================================

export class LicenseExpiryCronJobManager {
  private intervalMs: number = 24 * 60 * 60 * 1000; // 24 hours
  private intervalId: number | null = null;
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private jobHistory: ExpiryCronJobResult[] = [];
  private maxHistorySize: number = 30;

  // ============================================
  // START CRON JOB
  // ============================================

  start(tenantId: string): void {
    if (this.intervalId) {
      console.log('[LicenseExpiryCron] Job already running');
      return;
    }

    console.log(`[LicenseExpiryCron] Starting job (interval: ${this.intervalMs}ms)`);

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
      console.log('[LicenseExpiryCron] Job stopped');
    }
  }

  // ============================================
  // RUN JOB MANUALLY
  // ============================================

  async runJob(tenantId: string): Promise<ExpiryCronJobResult> {
    if (this.isRunning) {
      console.log('[LicenseExpiryCron] Job already running, skipping');
      return {
        success: false,
        processed: 0,
        expiredCount: 0,
        errors: ['Job already running'],
        timestamp: new Date().toISOString(),
        duration: 0,
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    let expiredCount = 0;

    try {
      console.log(`[LicenseExpiryCron] Running job for tenant ${tenantId}`);

      // In production, fetch licenses from database
      const licenses: License[] = []; // Placeholder

      // Process each license
      for (const license of licenses) {
        if (license.tenantId !== tenantId) continue;

        processed++;

        try {
          // Check if license is expired but still marked as active
          if (license.status === 'active' && new Date(license.expiresAt) < new Date()) {
            license.status = 'expired';
            license.lastCheckAt = new Date().toISOString();
            expiredCount++;

            // Emit event
            await licenseEventEmitter.emitLicenseExpired(license);

            console.log(`[LicenseExpiryCron] Marked license ${license.id} as expired`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${license.id}: ${errorMessage}`);
          console.error(`[LicenseExpiryCron] Error processing license ${license.id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      const result: ExpiryCronJobResult = {
        success: true,
        processed,
        expiredCount,
        errors,
        timestamp: new Date().toISOString(),
        duration,
      };

      this.jobHistory.push(result);
      if (this.jobHistory.length > this.maxHistorySize) {
        this.jobHistory.shift();
      }

      this.lastRun = new Date();

      console.log(`[LicenseExpiryCron] Job completed: processed=${processed}, expired=${expiredCount}, duration=${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        processed,
        expiredCount,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date().toISOString(),
        duration,
      };
    } finally {
      this.isRunning = false;
    }
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

  getHistory(limit?: number): ExpiryCronJobResult[] {
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
      console.log('[LicenseExpiryCron] Interval updated, will apply on next run');
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
    totalExpired: number;
    averageDuration: number;
  } {
    const totalRuns = this.jobHistory.length;
    const successfulRuns = this.jobHistory.filter((r) => r.success).length;
    const failedRuns = this.jobHistory.filter((r) => !r.success).length;
    const totalProcessed = this.jobHistory.reduce((sum, r) => sum + r.processed, 0);
    const totalExpired = this.jobHistory.reduce((sum, r) => sum + r.expiredCount, 0);
    const averageDuration = totalRuns > 0 ? this.jobHistory.reduce((sum, r) => sum + r.duration, 0) / totalRuns : 0;

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      totalProcessed,
      totalExpired,
      averageDuration,
    };
  }

  // ============================================
  // GET EXPIRING SOON COUNT
  // ============================================

  getExpiringSoonCount(licenses: License[], days: number = 7): number {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return licenses.filter((license) => {
      const expiresAt = new Date(license.expiresAt);
      return license.status === 'active' && expiresAt <= cutoff && expiresAt > now;
    }).length;
  }
}

// Export singleton instance
export const licenseExpiryCronJobManager = new LicenseExpiryCronJobManager();

// ============================================
// REACT HOOK FOR EXPIRY CRON JOB
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useLicenseExpiryCronJob() {
  const [status, setStatus] = useState(licenseExpiryCronJobManager.getStatus());
  const [history, setHistory] = useState(licenseExpiryCronJobManager.getHistory(10));

  const startJob = useCallback((tenantId: string) => {
    licenseExpiryCronJobManager.start(tenantId);
    setStatus(licenseExpiryCronJobManager.getStatus());
  }, []);

  const stopJob = useCallback(() => {
    licenseExpiryCronJobManager.stop();
    setStatus(licenseExpiryCronJobManager.getStatus());
  }, []);

  const runJob = useCallback(async (tenantId: string) => {
    const result = await licenseExpiryCronJobManager.runJob(tenantId);
    setStatus(licenseExpiryCronJobManager.getStatus());
    setHistory(licenseExpiryCronJobManager.getHistory(10));
    return result;
  }, []);

  const refreshStatus = useCallback(() => {
    setStatus(licenseExpiryCronJobManager.getStatus());
    setHistory(licenseExpiryCronJobManager.getHistory(10));
  }, []);

  const setIntervalMs = useCallback((intervalMs: number) => {
    licenseExpiryCronJobManager.setIntervalMs(intervalMs);
    setStatus(licenseExpiryCronJobManager.getStatus());
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
