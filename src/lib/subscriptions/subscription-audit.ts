// Subscription Audit Log
// Track plan change, cancel, pause, resume

import type { Subscription } from './subscription-types';

// ============================================
// AUDIT LOG ENTRY
// ============================================

export interface AuditLogEntry {
  id: string;
  subscriptionId: string;
  customerId: string;
  action: 'plan_change' | 'cancel' | 'pause' | 'resume' | 'create' | 'delete' | 'payment_failed' | 'payment_succeeded';
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  userId: string;
  tenantId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// AUDIT LOG MANAGER
// ============================================

export class AuditLogManager {
  private auditLogs: Map<string, AuditLogEntry> = new Map();
  private maxLogSize: number = 10000;

  // ============================================
  // LOG ACTION
  // ============================================

  logAction(
    subscriptionId: string,
    customerId: string,
    action: AuditLogEntry['action'],
    userId: string,
    tenantId: string,
    previousValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subscriptionId,
      customerId,
      action,
      previousValue,
      newValue,
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.auditLogs.set(entry.id, entry);

    // Prune if exceeding max size
    if (this.auditLogs.size > this.maxLogSize) {
      const keys = Array.from(this.auditLogs.keys());
      const oldestKey = keys[0];
      this.auditLogs.delete(oldestKey);
    }

    console.log(`[AuditLog] Logged action ${action} for subscription ${subscriptionId}`);

    return entry;
  }

  // ============================================
  // LOG PLAN CHANGE
  // ============================================

  logPlanChange(
    subscription: Subscription,
    previousPricingId: string,
    newPricingId: string,
    userId: string
  ): AuditLogEntry {
    return this.logAction(
      subscription.id,
      subscription.customerId,
      'plan_change',
      userId,
      subscription.tenantId,
      { pricingId: previousPricingId },
      { pricingId: newPricingId },
      { planNameSnapshot: subscription.planNameSnapshot }
    );
  }

  // ============================================
  // LOG CANCEL
  // ============================================

  logCancel(subscription: Subscription, cancelAtPeriodEnd: boolean, userId: string): AuditLogEntry {
    return this.logAction(
      subscription.id,
      subscription.customerId,
      'cancel',
      userId,
      subscription.tenantId,
      { status: subscription.status },
      { cancelAtPeriodEnd },
      { provider: subscription.provider }
    );
  }

  // ============================================
  // LOG PAUSE
  // ============================================

  logPause(subscription: Subscription, userId: string): AuditLogEntry {
    return this.logAction(
      subscription.id,
      subscription.customerId,
      'pause',
      userId,
      subscription.tenantId,
      { status: subscription.status },
      { status: 'paused' },
      { provider: subscription.provider }
    );
  }

  // ============================================
  // LOG RESUME
  // ============================================

  logResume(subscription: Subscription, userId: string): AuditLogEntry {
    return this.logAction(
      subscription.id,
      subscription.customerId,
      'resume',
      userId,
      subscription.tenantId,
      { status: subscription.status },
      { status: 'active' },
      { provider: subscription.provider }
    );
  }

  // ============================================
  // LOG CREATE
  // ============================================

  logCreate(subscription: Subscription, userId: string): AuditLogEntry {
    return this.logAction(
      subscription.id,
      subscription.customerId,
      'create',
      userId,
      subscription.tenantId,
      undefined,
      {
        pricingId: subscription.pricingId,
        mrr: subscription.mrr,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
      },
      { provider: subscription.provider }
    );
  }

  // ============================================
  // LOG DELETE
  // ============================================

  logDelete(subscription: Subscription, userId: string): AuditLogEntry {
    return this.logAction(
      subscription.id,
      subscription.customerId,
      'delete',
      userId,
      subscription.tenantId,
      {
        pricingId: subscription.pricingId,
        mrr: subscription.mrr,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
      },
      undefined,
      { provider: subscription.provider }
    );
  }

  // ============================================
  // LOG PAYMENT FAILED
  // ============================================

  logPaymentFailed(subscription: Subscription, metadata?: Record<string, unknown>): AuditLogEntry {
    return this.logAction(
      subscription.id,
      subscription.customerId,
      'payment_failed',
      'system',
      subscription.tenantId,
      undefined,
      undefined,
      metadata
    );
  }

  // ============================================
  // LOG PAYMENT SUCCEEDED
  // ============================================

  logPaymentSucceeded(subscription: Subscription, metadata?: Record<string, unknown>): AuditLogEntry {
    return this.logAction(
      subscription.id,
      subscription.customerId,
      'payment_succeeded',
      'system',
      subscription.tenantId,
      undefined,
      undefined,
      metadata
    );
  }

  // ============================================
  // GET AUDIT LOGS FOR SUBSCRIPTION
  // ============================================

  getAuditLogsForSubscription(subscriptionId: string, limit?: number): AuditLogEntry[] {
    const logs = Array.from(this.auditLogs.values())
      .filter((log) => log.subscriptionId === subscriptionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      return logs.slice(0, limit);
    }

    return logs;
  }

  // ============================================
  // GET AUDIT LOGS FOR CUSTOMER
  // ============================================

  getAuditLogsForCustomer(customerId: string, limit?: number): AuditLogEntry[] {
    const logs = Array.from(this.auditLogs.values())
      .filter((log) => log.customerId === customerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      return logs.slice(0, limit);
    }

    return logs;
  }

  // ============================================
  // GET AUDIT LOGS FOR TENANT
  // ============================================

  getAuditLogsForTenant(tenantId: string, limit?: number): AuditLogEntry[] {
    const logs = Array.from(this.auditLogs.values())
      .filter((log) => log.tenantId === tenantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      return logs.slice(0, limit);
    }

    return logs;
  }

  // ============================================
  // GET AUDIT LOGS BY ACTION
  // ============================================

  getAuditLogsByAction(action: AuditLogEntry['action'], limit?: number): AuditLogEntry[] {
    const logs = Array.from(this.auditLogs.values())
      .filter((log) => log.action === action)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      return logs.slice(0, limit);
    }

    return logs;
  }

  // ============================================
  // GET AUDIT LOGS BY USER
  // ============================================

  getAuditLogsByUser(userId: string, limit?: number): AuditLogEntry[] {
    const logs = Array.from(this.auditLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      return logs.slice(0, limit);
    }

    return logs;
  }

  // ============================================
  // GET AUDIT LOG
  // ============================================

  getAuditLog(auditLogId: string): AuditLogEntry | null {
    return this.auditLogs.get(auditLogId) || null;
  }

  // ============================================
  // GET ALL AUDIT LOGS
  // ============================================

  getAllAuditLogs(limit?: number): AuditLogEntry[] {
    const logs = Array.from(this.auditLogs.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (limit) {
      return logs.slice(0, limit);
    }

    return logs;
  }

  // ============================================
  // GET AUDIT SUMMARY
  // ============================================

  getAuditSummary(tenantId?: string): {
    totalLogs: number;
    actionCounts: Record<AuditLogEntry['action'], number>;
    recentLogs: AuditLogEntry[];
  } {
    const logs = tenantId
      ? Array.from(this.auditLogs.values()).filter((log) => log.tenantId === tenantId)
      : Array.from(this.auditLogs.values());

    const actionCounts: Record<AuditLogEntry['action'], number> = {
      plan_change: 0,
      cancel: 0,
      pause: 0,
      resume: 0,
      create: 0,
      delete: 0,
      payment_failed: 0,
      payment_succeeded: 0,
    };

    for (const log of logs) {
      actionCounts[log.action]++;
    }

    const recentLogs = logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalLogs: logs.length,
      actionCounts,
      recentLogs,
    };
  }

  // ============================================
  // CLEAR AUDIT LOGS
  // ============================================

  clearAuditLogs(subscriptionId?: string): void {
    if (subscriptionId) {
      const keysToDelete: string[] = [];
      for (const [key, log] of this.auditLogs.entries()) {
        if (log.subscriptionId === subscriptionId) {
          keysToDelete.push(key);
        }
      }
      for (const key of keysToDelete) {
        this.auditLogs.delete(key);
      }
    } else {
      this.auditLogs.clear();
    }
  }

  // ============================================
  // DELETE AUDIT LOG
  // ============================================

  deleteAuditLog(auditLogId: string): void {
    this.auditLogs.delete(auditLogId);
  }

  // ============================================
  // SET MAX LOG SIZE
  // ============================================

  setMaxLogSize(size: number): void {
    this.maxLogSize = size;

    // Prune if exceeding new max size
    while (this.auditLogs.size > this.maxLogSize) {
      const keys = Array.from(this.auditLogs.keys());
      const oldestKey = keys[0];
      this.auditLogs.delete(oldestKey);
    }
  }
}

// Export singleton instance
export const auditLogManager = new AuditLogManager();

// ============================================
// REACT HOOK FOR AUDIT LOG
// ============================================

import { useState, useCallback } from 'react';

export function useAuditLog() {
  const [isLoading, setIsLoading] = useState(false);

  const getAuditLogsForSubscription = useCallback((subscriptionId: string, limit?: number) => {
    setIsLoading(true);
    try {
      const logs = auditLogManager.getAuditLogsForSubscription(subscriptionId, limit);
      return logs;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAuditLogsForCustomer = useCallback((customerId: string, limit?: number) => {
    setIsLoading(true);
    try {
      const logs = auditLogManager.getAuditLogsForCustomer(customerId, limit);
      return logs;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAuditSummary = useCallback((tenantId?: string) => {
    return auditLogManager.getAuditSummary(tenantId);
  }, []);

  const clearAuditLogs = useCallback((subscriptionId?: string) => {
    auditLogManager.clearAuditLogs(subscriptionId);
  }, []);

  return {
    isLoading,
    getAuditLogsForSubscription,
    getAuditLogsForCustomer,
    getAuditSummary,
    clearAuditLogs,
  };
}
