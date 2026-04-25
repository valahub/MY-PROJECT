// Customer Data Consistency Job
// Runs every hour to fix LTV, subs, status

import type { Customer } from './customer-types';
import { customerRelationsEngine } from './customer-relations';
import { customerSelfHealEngine } from './customer-self-heal';
import { churnDetectionEngine } from './customer-churn-detection';
import { fraudDetectionEngine } from './customer-fraud-detection';

// ============================================
// DATA CONSISTENCY JOB RESULT
// ============================================

export interface DataConsistencyJobResult {
  success: boolean;
  processed: number;
  fixed: {
    ltv: number;
    activeSubscriptions: number;
    status: number;
    lastActiveDate: number;
    churnScore: number;
    fraudScore: number;
  };
  errors: string[];
  timestamp: string;
  duration: number; // in milliseconds
}

// ============================================
// DATA CONSISTENCY JOB MANAGER
// ============================================

export class DataConsistencyJobManager {
  private intervalMs: number = 60 * 60 * 1000; // 1 hour
  private intervalId: number | null = null;
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private jobHistory: DataConsistencyJobResult[] = [];
  private maxHistorySize: number = 100;

  // ============================================
  // START CRON JOB
  // ============================================

  start(tenantId: string): void {
    if (this.intervalId) {
      console.log('[DataConsistency] Job already running');
      return;
    }

    console.log(`[DataConsistency] Starting job (interval: ${this.intervalMs}ms)`);

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
      console.log('[DataConsistency] Job stopped');
    }
  }

  // ============================================
  // RUN JOB MANUALLY
  // ============================================

  async runJob(tenantId: string): Promise<DataConsistencyJobResult> {
    if (this.isRunning) {
      console.log('[DataConsistency] Job already running, skipping');
      return {
        success: false,
        processed: 0,
        fixed: {
          ltv: 0,
          activeSubscriptions: 0,
          status: 0,
          lastActiveDate: 0,
          churnScore: 0,
          fraudScore: 0,
        },
        errors: ['Job already running'],
        timestamp: new Date().toISOString(),
        duration: 0,
      };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    const fixed = {
      ltv: 0,
      activeSubscriptions: 0,
      status: 0,
      lastActiveDate: 0,
      churnScore: 0,
      fraudScore: 0,
    };

    try {
      console.log(`[DataConsistency] Running job for tenant ${tenantId}`);

      // In production, fetch customers from database
      const customers: Customer[] = []; // Placeholder

      // Process each customer
      for (const customer of customers) {
        if (customer.tenantId !== tenantId) continue;

        processed++;

        try {
          // 1. Heal customer (fix LTV, active subs, status)
          const healResult = await customerSelfHealEngine.healCustomer(customer);

          if (healResult.success) {
            if (healResult.fixes.some((f) => f.includes('LTV'))) fixed.ltv++;
            if (healResult.fixes.some((f) => f.includes('active subscriptions'))) fixed.activeSubscriptions++;
            if (healResult.fixes.some((f) => f.includes('status'))) fixed.status++;
            if (healResult.fixes.some((f) => f.includes('last active'))) fixed.lastActiveDate++;
          } else {
            errors.push(`${customer.id}: ${healResult.issues.join(', ')}`);
          }

          // 2. Update churn score
          const churnResult = await churnDetectionEngine.detectChurn(customer);
          if (churnResult.churnRiskScore !== customer.churnRiskScore) {
            fixed.churnScore++;
          }

          // 3. Update fraud score
          const fraudResult = await fraudDetectionEngine.detectFraud(customer);
          if (fraudResult.fraudRiskScore !== customer.fraudRiskScore) {
            fixed.fraudScore++;
          }

          console.log(`[DataConsistency] Processed customer ${customer.id}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${customer.id}: ${errorMessage}`);
          console.error(`[DataConsistency] Error processing customer ${customer.id}:`, error);
        }
      }
    }

    const duration = Date.now() - startTime;
    const result: DataConsistencyJobResult = {
      success: true,
      processed,
      fixed,
      errors,
      timestamp: new Date().toISOString(),
      duration,
    };

    this.jobHistory.push(result);
    if (this.jobHistory.length > this.maxHistorySize) {
      this.jobHistory.shift();
    }

    this.lastRun = new Date();

    console.log(`[DataConsistency] Job completed: processed=${processed}, fixed=${Object.values(fixed).reduce((a, b) => a + b, 0)}, duration=${duration}ms`);

    return result;
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

  getHistory(limit?: number): DataConsistencyJobResult[] {
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
      // This would require the tenantId, so we'll just update the config
      console.log('[DataConsistency] Interval updated, will apply on next run');
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
    totalFixed: number;
    averageDuration: number;
  } {
    const totalRuns = this.jobHistory.length;
    const successfulRuns = this.jobHistory.filter((r) => r.success).length;
    const failedRuns = this.jobHistory.filter((r) => !r.success).length;
    const totalProcessed = this.jobHistory.reduce((sum, r) => sum + r.processed, 0);
    const totalFixed = this.jobHistory.reduce((sum, r) => sum + Object.values(r.fixed).reduce((a, b) => a + b, 0), 0);
    const averageDuration = totalRuns > 0 ? this.jobHistory.reduce((sum, r) => sum + r.duration, 0) / totalRuns : 0;

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      totalProcessed,
      totalFixed,
      averageDuration,
    };
  }
}

// Export singleton instance
export const dataConsistencyJobManager = new DataConsistencyJobManager();

// ============================================
// REACT HOOK FOR DATA CONSISTENCY JOB
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useDataConsistencyJob() {
  const [status, setStatus] = useState(dataConsistencyJobManager.getStatus());
  const [history, setHistory] = useState(dataConsistencyJobManager.getHistory(10));

  const startJob = useCallback((tenantId: string) => {
    dataConsistencyJobManager.start(tenantId);
    setStatus(dataConsistencyJobManager.getStatus());
  }, []);

  const stopJob = useCallback(() => {
    dataConsistencyJobManager.stop();
    setStatus(dataConsistencyJobManager.getStatus());
  }, []);

  const runJob = useCallback(async (tenantId: string) => {
    const result = await dataConsistencyJobManager.runJob(tenantId);
    setStatus(dataConsistencyJobManager.getStatus());
    setHistory(dataConsistencyJobManager.getHistory(10));
    return result;
  }, []);

  const refreshStatus = useCallback(() => {
    setStatus(dataConsistencyJobManager.getStatus());
    setHistory(dataConsistencyJobManager.getHistory(10));
  }, []);

  const setIntervalMs = useCallback((intervalMs: number) => {
    dataConsistencyJobManager.setIntervalMs(intervalMs);
    setStatus(dataConsistencyJobManager.getStatus());
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
    startJob,
    stopJob,
    runJob,
    refreshStatus,
    setIntervalMs,
  };
}
