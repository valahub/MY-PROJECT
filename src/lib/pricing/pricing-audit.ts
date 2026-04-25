// Pricing Audit Log System
// Track who changed price, old vs new value, timestamp

import type { PricingPlan, PricingAuditLog, AuditAction } from './pricing-types';

// ============================================
// AUDIT LOG STORAGE
// ============================================

class AuditLogStorage {
  private logs: Map<string, PricingAuditLog[]> = new Map();
  private globalLogs: PricingAuditLog[] = [];
  private maxLogsPerPlan: number = 100;
  private maxGlobalLogs: number = 1000;

  addLog(log: PricingAuditLog): void {
    // Add to plan-specific logs
    if (!this.logs.has(log.planId)) {
      this.logs.set(log.planId, []);
    }

    const planLogs = this.logs.get(log.planId)!;
    planLogs.push(log);

    // Limit plan logs
    if (planLogs.length > this.maxLogsPerPlan) {
      planLogs.shift();
    }

    // Add to global logs
    this.globalLogs.push(log);

    // Limit global logs
    if (this.globalLogs.length > this.maxGlobalLogs) {
      this.globalLogs.shift();
    }
  }

  getLogs(planId: string): PricingAuditLog[] {
    return this.logs.get(planId) || [];
  }

  getGlobalLogs(limit?: number): PricingAuditLog[] {
    if (limit) {
      return this.globalLogs.slice(-limit);
    }
    return [...this.globalLogs];
  }

  clearLogs(planId: string): void {
    this.logs.delete(planId);
  }

  clearAll(): void {
    this.logs.clear();
    this.globalLogs = [];
  }
}

// ============================================
// AUDIT LOG MANAGER
// ============================================

export class PricingAuditManager {
  private storage: AuditLogStorage;

  constructor() {
    this.storage = new AuditLogStorage();
  }

  // ============================================
  // LOG AUDIT ENTRY
  // ============================================

  logChange(
    action: AuditAction,
    planId: string,
    userId: string,
    userEmail: string,
    oldPlan?: PricingPlan,
    newPlan?: PricingPlan,
    metadata?: Record<string, unknown>
  ): PricingAuditLog {
    const logId = this.generateLogId();
    const timestamp = new Date().toISOString();

    // Extract changed fields
    const oldValues = oldPlan ? this.extractChangedFields(oldPlan, newPlan) : undefined;
    const newValues = newPlan ? this.extractChangedFields(oldPlan, newPlan) : undefined;

    const auditLog: PricingAuditLog = {
      id: logId,
      planId,
      action,
      userId,
      userEmail,
      oldValues,
      newValues,
      timestamp,
      metadata,
    };

    this.storage.addLog(auditLog);

    // Also log to the system logger
    this.logToSystem(auditLog);

    return auditLog;
  }

  // ============================================
  // EXTRACT CHANGED FIELDS
  // ============================================

  private extractChangedFields(oldPlan?: PricingPlan, newPlan?: PricingPlan): Partial<PricingPlan> | undefined {
    if (!oldPlan || !newPlan) return undefined;

    const changes: Partial<PricingPlan> = {};

    // Compare fields
    if (oldPlan.name !== newPlan.name) changes.name = newPlan.name;
    if (oldPlan.description !== newPlan.description) changes.description = newPlan.description;
    if (oldPlan.status !== newPlan.status) changes.status = newPlan.status;
    if (oldPlan.currentVersion !== newPlan.currentVersion) changes.currentVersion = newPlan.currentVersion;

    // Compare features
    if (JSON.stringify(oldPlan.features) !== JSON.stringify(newPlan.features)) {
      changes.features = newPlan.features;
    }

    // Compare limits
    if (JSON.stringify(oldPlan.limits) !== JSON.stringify(newPlan.limits)) {
      changes.limits = newPlan.limits;
    }

    // Compare pricing versions
    if (JSON.stringify(oldPlan.versions) !== JSON.stringify(newPlan.versions)) {
      changes.versions = newPlan.versions;
    }

    return Object.keys(changes).length > 0 ? changes : undefined;
  }

  // ============================================
  // GENERATE LOG ID
  // ============================================

  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // LOG TO SYSTEM
  // ============================================

  private logToSystem(auditLog: PricingAuditLog): void {
    console.log(`[PricingAudit] ${auditLog.action.toUpperCase()}`, {
      planId: auditLog.planId,
      userId: auditLog.userId,
      timestamp: auditLog.timestamp,
    });

    // In production, send to logging API
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'pricing_audit',
        auditLog,
      }),
    }).catch((error) => {
      console.error('[PricingAudit] Failed to log to system:', error);
    });
  }

  // ============================================
  // GET AUDIT LOGS
  // ============================================

  getAuditLogs(planId: string): PricingAuditLog[] {
    return this.storage.getLogs(planId);
  }

  getGlobalAuditLogs(limit?: number): PricingAuditLog[] {
    return this.storage.getGlobalLogs(limit);
  }

  // ============================================
  // GET AUDIT LOGS BY ACTION
  // ============================================

  getAuditLogsByAction(planId: string, action: AuditAction): PricingAuditLog[] {
    const logs = this.storage.getLogs(planId);
    return logs.filter((log) => log.action === action);
  }

  // ============================================
  // GET AUDIT LOGS BY USER
  // ============================================

  getAuditLogsByUser(userId: string): PricingAuditLog[] {
    const logs = this.storage.getGlobalLogs();
    return logs.filter((log) => log.userId === userId);
  }

  // ============================================
  // GET AUDIT LOGS BY TIME RANGE
  // ============================================

  getAuditLogsByTimeRange(startDate: Date, endDate: Date): PricingAuditLog[] {
    const logs = this.storage.getGlobalLogs();
    const start = startDate.getTime();
    const end = endDate.getTime();

    return logs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= start && logTime <= end;
    });
  }

  // ============================================
  // GET AUDIT SUMMARY
  // ============================================

  getAuditSummary(planId: string): {
    totalChanges: number;
    byAction: Record<AuditAction, number>;
    lastChange: PricingAuditLog | null;
    lastChangeBy: string | null;
  } {
    const logs = this.storage.getLogs(planId);
    const byAction: Record<AuditAction, number> = {
      created: 0,
      updated: 0,
      archived: 0,
      restored: 0,
      version_created: 0,
    };

    for (const log of logs) {
      byAction[log.action]++;
    }

    const lastChange = logs.length > 0 ? logs[logs.length - 1] : null;

    return {
      totalChanges: logs.length,
      byAction,
      lastChange,
      lastChangeBy: lastChange?.userEmail || null,
    };
  }

  // ============================================
  // CLEAR AUDIT LOGS
  // ============================================

  clearAuditLogs(planId: string): void {
    this.storage.clearLogs(planId);
  }

  clearAllAuditLogs(): void {
    this.storage.clearAll();
  }
}

// Export singleton instance
export const pricingAuditManager = new PricingAuditManager();

// ============================================
// REACT HOOK FOR AUDIT LOGS
// ============================================

import { useState, useCallback } from 'react';

export function usePricingAudit() {
  const [isLoading, setIsLoading] = useState(false);

  const logChange = useCallback(
    (
      action: AuditAction,
      planId: string,
      userId: string,
      userEmail: string,
      oldPlan?: PricingPlan,
      newPlan?: PricingPlan,
      metadata?: Record<string, unknown>
    ) => {
      return pricingAuditManager.logChange(action, planId, userId, userEmail, oldPlan, newPlan, metadata);
    },
    []
  );

  const getAuditLogs = useCallback((planId: string) => {
    return pricingAuditManager.getAuditLogs(planId);
  }, []);

  const getGlobalAuditLogs = useCallback((limit?: number) => {
    return pricingAuditManager.getGlobalAuditLogs(limit);
  }, []);

  const getAuditLogsByAction = useCallback((planId: string, action: AuditAction) => {
    return pricingAuditManager.getAuditLogsByAction(planId, action);
  }, []);

  const getAuditLogsByUser = useCallback((userId: string) => {
    return pricingAuditManager.getAuditLogsByUser(userId);
  }, []);

  const getAuditLogsByTimeRange = useCallback((startDate: Date, endDate: Date) => {
    return pricingAuditManager.getAuditLogsByTimeRange(startDate, endDate);
  }, []);

  const getAuditSummary = useCallback((planId: string) => {
    return pricingAuditManager.getAuditSummary(planId);
  }, []);

  const clearAuditLogs = useCallback((planId: string) => {
    pricingAuditManager.clearAuditLogs(planId);
  }, []);

  return {
    isLoading,
    logChange,
    getAuditLogs,
    getGlobalAuditLogs,
    getAuditLogsByAction,
    getAuditLogsByUser,
    getAuditLogsByTimeRange,
    getAuditSummary,
    clearAuditLogs,
  };
}

// ============================================
// AUTO-LOGGING WRAPPER
// ============================================

export function withAuditLogging<T extends (...args: any[]) => Promise<any>>(
  action: AuditAction,
  fn: T
): T {
  return (async (...args: any[]) => {
    // Extract plan info from args
    const planId = args[0];
    const userId = args[args.length - 1]; // Assuming userId is last arg
    const userEmail = args[args.length - 2] || userId; // Assuming userEmail is second to last

    // Get old plan if updating
    let oldPlan: PricingPlan | undefined;
    if (action === 'updated' || action === 'archived' || action === 'restored') {
      // In production, fetch old plan from store
    }

    // Execute function
    const result = await fn(...args);

    // Log the change
    if (result.success && result.data) {
      pricingAuditManager.logChange(
        action,
        planId,
        userId,
        userEmail,
        oldPlan,
        result.data
      );
    }

    return result;
  }) as T;
}
