// Transaction Audit Log
// Track refund created, status changed, manual edits

import type { Transaction } from './transaction-types';

// ============================================
// AUDIT LOG ENTRY
// ============================================

export interface AuditLogEntry {
  id: string;
  transactionId: string;
  customerId: string;
  action: 'refund_created' | 'status_changed' | 'manual_edit' | 'fraud_flagged' | 'fraud_unflagged' | 'transaction_created';
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
    transactionId: string,
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
      transactionId,
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

    console.log(`[AuditLog] Logged action ${action} for transaction ${transactionId}`);

    return entry;
  }

  // ============================================
  // LOG REFUND CREATED
  // ============================================

  logRefundCreated(
    transaction: Transaction,
    refundAmount: number,
    reason: string,
    userId: string
  ): AuditLogEntry {
    return this.logAction(
      transaction.id,
      transaction.customerId,
      'refund_created',
      userId,
      transaction.tenantId,
      { status: transaction.status },
      { refundAmount, reason },
      { provider: transaction.provider }
    );
  }

  // ============================================
  // LOG STATUS CHANGED
  // ============================================

  logStatusChanged(
    transaction: Transaction,
    previousStatus: string,
    newStatus: string,
    userId: string
  ): AuditLogEntry {
    return this.logAction(
      transaction.id,
      transaction.customerId,
      'status_changed',
      userId,
      transaction.tenantId,
      { status: previousStatus },
      { status: newStatus },
      { provider: transaction.provider }
    );
  }

  // ============================================
  // LOG MANUAL EDIT
  // ============================================

  logManualEdit(
    transaction: Transaction,
    field: string,
    previousValue: unknown,
    newValue: unknown,
    userId: string
  ): AuditLogEntry {
    return this.logAction(
      transaction.id,
      transaction.customerId,
      'manual_edit',
      userId,
      transaction.tenantId,
      { [field]: previousValue },
      { [field]: newValue },
      { provider: transaction.provider }
    );
  }

  // ============================================
  // LOG FRAUD FLAGGED
  // ============================================

  logFraudFlagged(
    transaction: Transaction,
    risk: 'low' | 'medium' | 'high',
    reason: string,
    userId: string
  ): AuditLogEntry {
    return this.logAction(
      transaction.id,
      transaction.customerId,
      'fraud_flagged',
      userId,
      transaction.tenantId,
      { fraudRisk: transaction.fraudRisk },
      { fraudRisk: risk, reason },
      { provider: transaction.provider }
    );
  }

  // ============================================
  // LOG FRAUD UNFLAGGED
  // ============================================

  logFraudUnflagged(transaction: Transaction, userId: string): AuditLogEntry {
    return this.logAction(
      transaction.id,
      transaction.customerId,
      'fraud_unflagged',
      userId,
      transaction.tenantId,
      { fraudRisk: transaction.fraudRisk },
      { fraudRisk: 'low' },
      { provider: transaction.provider }
    );
  }

  // ============================================
  // LOG TRANSACTION CREATED
  // ============================================

  logTransactionCreated(transaction: Transaction, userId: string): AuditLogEntry {
    return this.logAction(
      transaction.id,
      transaction.customerId,
      'transaction_created',
      userId,
      transaction.tenantId,
      undefined,
      {
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
      },
      { provider: transaction.provider }
    );
  }

  // ============================================
  // GET AUDIT LOGS FOR TRANSACTION
  // ============================================

  getAuditLogsForTransaction(transactionId: string, limit?: number): AuditLogEntry[] {
    const logs = Array.from(this.auditLogs.values())
      .filter((log) => log.transactionId === transactionId)
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
      refund_created: 0,
      status_changed: 0,
      manual_edit: 0,
      fraud_flagged: 0,
      fraud_unflagged: 0,
      transaction_created: 0,
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

  clearAuditLogs(transactionId?: string): void {
    if (transactionId) {
      const keysToDelete: string[] = [];
      for (const [key, log] of this.auditLogs.entries()) {
        if (log.transactionId === transactionId) {
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

  const getAuditLogsForTransaction = useCallback((transactionId: string, limit?: number) => {
    setIsLoading(true);
    try {
      const logs = auditLogManager.getAuditLogsForTransaction(transactionId, limit);
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

  const clearAuditLogs = useCallback((transactionId?: string) => {
    auditLogManager.clearAuditLogs(transactionId);
  }, []);

  return {
    isLoading,
    getAuditLogsForTransaction,
    getAuditLogsForCustomer,
    getAuditSummary,
    clearAuditLogs,
  };
}
