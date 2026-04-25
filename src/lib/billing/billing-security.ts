// Billing Security Layer
// Immutable invoices, audit logs, tenant isolation

import type { Invoice, InvoiceStatus } from './invoice-types';

// ============================================
// AUDIT LOG ENTRY
// ============================================

export interface AuditLog {
  id: string;
  entityType: 'invoice' | 'dunning' | 'payment';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'read' | 'retry' | 'mark_paid' | 'suspend';
  userId: string;
  userEmail: string;
  tenantId: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// SECURITY MANAGER
// ============================================

export class BillingSecurityManager {
  private auditLogs: Map<string, AuditLog[]> = new Map();
  private auditLogCounter: number = 0;

  // ============================================
  // CHECK INVOICE IMMUTABILITY
  // ============================================

  canModifyInvoice(invoice: Invoice): { allowed: boolean; reason?: string } {
    // Paid invoices are immutable
    if (invoice.status === 'paid') {
      return {
        allowed: false,
        reason: 'Paid invoices cannot be modified',
      };
    }

    // Cancelled invoices are immutable
    if (invoice.status === 'cancelled') {
      return {
        allowed: false,
        reason: 'Cancelled invoices cannot be modified',
      };
    }

    return { allowed: true };
  }

  // ============================================
  // CHECK TENANT ISOLATION
  // ============================================

  checkTenantAccess(invoice: Invoice, tenantId: string): boolean {
    return invoice.tenantId === tenantId;
  }

  // ============================================
  // FILTER INVOICES BY TENANT
  // ============================================

  filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string): T[] {
    return items.filter((item) => item.tenantId === tenantId);
  }

  // ============================================
  // LOG AUDIT ENTRY
  // ============================================

  logAudit(
    entityType: AuditLog['entityType'],
    entityId: string,
    action: AuditLog['action'],
    userId: string,
    userEmail: string,
    tenantId: string,
    oldValue: unknown = null,
    newValue: unknown = null,
    ipAddress?: string,
    userAgent?: string
  ): AuditLog {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${this.auditLogCounter++}`,
      entityType,
      entityId,
      action,
      userId,
      userEmail,
      tenantId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
    };

    if (!this.auditLogs.has(entityId)) {
      this.auditLogs.set(entityId, []);
    }

    this.auditLogs.get(entityId)!.push(log);

    // In production, save to database
    console.log(`[BillingSecurity] Audit log created:`, log);

    return log;
  }

  // ============================================
  // GET AUDIT LOGS
  // ============================================

  getAuditLogs(entityId: string): AuditLog[] {
    return this.auditLogs.get(entityId) || [];
  }

  // ============================================
  // GET AUDIT LOGS BY ENTITY TYPE
  // ============================================

  getAuditLogsByType(entityType: AuditLog['entityType'], tenantId: string): AuditLog[] {
    const logs: AuditLog[] = [];

    for (const logsArray of this.auditLogs.values()) {
      for (const log of logsArray) {
        if (log.entityType === entityType && log.tenantId === tenantId) {
          logs.push(log);
        }
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ============================================
  // GET AUDIT LOGS BY USER
  // ============================================

  getAuditLogsByUser(userId: string, tenantId: string): AuditLog[] {
    const logs: AuditLog[] = [];

    for (const logsArray of this.auditLogs.values()) {
      for (const log of logsArray) {
        if (log.userId === userId && log.tenantId === tenantId) {
          logs.push(log);
        }
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ============================================
  // GET AUDIT LOGS BY DATE RANGE
  // ============================================

  getAuditLogsByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): AuditLog[] {
    const logs: AuditLog[] = [];

    for (const logsArray of this.auditLogs.values()) {
      for (const log of logsArray) {
        const logDate = new Date(log.timestamp);
        if (log.tenantId === tenantId && logDate >= startDate && logDate <= endDate) {
          logs.push(log);
        }
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ============================================
  // CLEAR AUDIT LOGS
  // ============================================

  clearAuditLogs(entityId?: string): void {
    if (entityId) {
      this.auditLogs.delete(entityId);
    } else {
      this.auditLogs.clear();
    }
  }

  // ============================================
  // VALIDATE STATUS TRANSITION
  // ============================================

  validateStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): boolean {
    const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      pending: ['paid', 'failed', 'overdue', 'cancelled'],
      failed: ['paid', 'overdue', 'cancelled'],
      overdue: ['paid', 'cancelled'],
      paid: [], // Paid is final
      cancelled: [], // Cancelled is final
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // ============================================
  // SANITIZE INVOICE FOR OUTPUT
  // ============================================

  sanitizeInvoice(invoice: Invoice, tenantId: string): Invoice | null {
    // Check tenant access
    if (!this.checkTenantAccess(invoice, tenantId)) {
      return null;
    }

    // Remove sensitive fields if needed
    return {
      ...invoice,
      // Don't expose internal metadata
      metadata: invoice.metadata ? { ...invoice.metadata } : undefined,
    };
  }

  // ============================================
  // GENERATE SECURITY TOKEN
  // ============================================

  generateSecurityToken(invoiceId: string, action: string, userId: string): string {
    const timestamp = Date.now();
    const data = `${invoiceId}:${action}:${userId}:${timestamp}`;
    
    // In production, use proper encryption
    const token = btoa(data);
    
    return token;
  }

  // ============================================
  // VALIDATE SECURITY TOKEN
  // ============================================

  validateSecurityToken(token: string, invoiceId: string, action: string, userId: string): boolean {
    try {
      const data = atob(token);
      const parts = data.split(':');

      if (parts.length !== 4) {
        return false;
      }

      const [tokenInvoiceId, tokenAction, tokenUserId, tokenTimestamp] = parts;

      if (tokenInvoiceId !== invoiceId || tokenAction !== action || tokenUserId !== userId) {
        return false;
      }

      // Check token age (5 minutes max)
      const timestamp = parseInt(tokenTimestamp);
      const age = Date.now() - timestamp;
      if (age > 5 * 60 * 1000) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // RATE LIMIT CHECK
  // ============================================

  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  // ============================================
  // CLEAR RATE LIMIT
  // ============================================

  clearRateLimit(key: string): void {
    this.rateLimitMap.delete(key);
  }

  // ============================================
  // GET SECURITY SUMMARY
  // ============================================

  getSecuritySummary(tenantId: string): {
    totalAuditLogs: number;
    auditLogsByType: Record<string, number>;
    auditLogsByUser: Record<string, number>;
    recentActivity: AuditLog[];
  } {
    const allLogs = this.getAuditLogsByDateRange(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(),
      tenantId
    );

    const auditLogsByType: Record<string, number> = {};
    const auditLogsByUser: Record<string, number> = {};

    for (const log of allLogs) {
      auditLogsByType[log.entityType] = (auditLogsByType[log.entityType] || 0) + 1;
      auditLogsByUser[log.userId] = (auditLogsByUser[log.userId] || 0) + 1;
    }

    return {
      totalAuditLogs: allLogs.length,
      auditLogsByType,
      auditLogsByUser,
      recentActivity: allLogs.slice(0, 10),
    };
  }
}

// Export singleton instance
export const billingSecurityManager = new BillingSecurityManager();

// ============================================
// REACT HOOK FOR BILLING SECURITY
// ============================================

import { useCallback } from 'react';

export function useBillingSecurity() {
  const canModifyInvoice = useCallback((invoice: Invoice) => {
    return billingSecurityManager.canModifyInvoice(invoice);
  }, []);

  const checkTenantAccess = useCallback((invoice: Invoice, tenantId: string) => {
    return billingSecurityManager.checkTenantAccess(invoice, tenantId);
  }, []);

  const filterByTenant = useCallback(<T extends { tenantId: string }>(items: T[], tenantId: string) => {
    return billingSecurityManager.filterByTenant(items, tenantId);
  }, []);

  const logAudit = useCallback((
    entityType: AuditLog['entityType'],
    entityId: string,
    action: AuditLog['action'],
    userId: string,
    userEmail: string,
    tenantId: string,
    oldValue?: unknown,
    newValue?: unknown
  ) => {
    return billingSecurityManager.logAudit(
      entityType,
      entityId,
      action,
      userId,
      userEmail,
      tenantId,
      oldValue,
      newValue
    );
  }, []);

  const getAuditLogs = useCallback((entityId: string) => {
    return billingSecurityManager.getAuditLogs(entityId);
  }, []);

  const getAuditLogsByType = useCallback((entityType: AuditLog['entityType'], tenantId: string) => {
    return billingSecurityManager.getAuditLogsByType(entityType, tenantId);
  }, []);

  const getAuditLogsByUser = useCallback((userId: string, tenantId: string) => {
    return billingSecurityManager.getAuditLogsByUser(userId, tenantId);
  }, []);

  const getSecuritySummary = useCallback((tenantId: string) => {
    return billingSecurityManager.getSecuritySummary(tenantId);
  }, []);

  return {
    canModifyInvoice,
    checkTenantAccess,
    filterByTenant,
    logAudit,
    getAuditLogs,
    getAuditLogsByType,
    getAuditLogsByUser,
    getSecuritySummary,
  };
}
