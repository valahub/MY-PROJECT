// Transaction Security Layer
// Merchant only, block cross-tenant access

import type { Transaction } from './transaction-types';

// ============================================
// SECURITY RESULT
// ============================================

export interface SecurityResult {
  success: boolean;
  error?: string;
  timestamp: string;
}

// ============================================
// TRANSACTION SECURITY MANAGER
// ============================================

export class TransactionSecurityManager {
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private auditLogs: Array<{
    action: string;
    transactionId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> = [];

  // ============================================
  // CHECK RATE LIMIT
  // ============================================

  checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): SecurityResult {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { success: true, timestamp: new Date().toISOString() };
    }

    if (entry.count >= limit) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        timestamp: new Date().toISOString(),
      };
    }

    entry.count++;
    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // CLEAR RATE LIMIT
  // ============================================

  clearRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }

  // ============================================
  // VALIDATE MERCHANT ACCESS
  // ============================================

  validateMerchantAccess(userRole: string): SecurityResult {
    if (userRole !== 'merchant' && userRole !== 'admin') {
      return {
        success: false,
        error: 'Access denied: merchant role required',
        timestamp: new Date().toISOString(),
      };
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // VALIDATE TENANT ACCESS
  // ============================================

  validateTenantAccess(transaction: Transaction, userTenantId: string): SecurityResult {
    if (transaction.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Access denied: transaction does not belong to this tenant',
        timestamp: new Date().toISOString(),
      };
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // AUDIT LOG
  // ============================================

  auditLog(action: string, transactionId: string, userId: string, metadata?: Record<string, unknown>): void {
    const logEntry = {
      action,
      transactionId,
      userId,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    this.auditLogs.push(logEntry);
    console.log('[Security Audit]', logEntry);
  }

  // ============================================
  // GET AUDIT LOG
  // ============================================

  getAuditLog(transactionId?: string, limit?: number): Array<{
    action: string;
    transactionId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> {
    let logs = this.auditLogs;

    if (transactionId) {
      logs = logs.filter((log) => log.transactionId === transactionId);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  // ============================================
  // CLEAR AUDIT LOG
  // ============================================

  clearAuditLog(): void {
    this.auditLogs = [];
  }

  // ============================================
  // SANITIZE TRANSACTION DATA FOR LOGGING
  // ============================================

  sanitizeTransactionForLogging(transaction: Transaction): Record<string, unknown> {
    return {
      id: transaction.id,
      customerId: transaction.customerId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      provider: transaction.provider,
      providerTxnId: transaction.providerTxnId,
      tenantId: transaction.tenantId,
    };
  }

  // ============================================
  // VALIDATE UPDATE PERMISSIONS
  // ============================================

  validateUpdatePermissions(
    transaction: Transaction,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can update any transaction
    if (isSystemAdmin) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    // Check merchant access
    const merchantAccess = this.validateMerchantAccess(userRole);
    if (!merchantAccess.success) {
      return merchantAccess;
    }

    // Check tenant access
    const tenantAccess = this.validateTenantAccess(transaction, userTenantId);
    if (!tenantAccess.success) {
      return tenantAccess;
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // VALIDATE DELETE PERMISSIONS
  // ============================================

  validateDeletePermissions(
    transaction: Transaction,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can delete any transaction
    if (isSystemAdmin) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    // Check merchant access
    const merchantAccess = this.validateMerchantAccess(userRole);
    if (!merchantAccess.success) {
      return merchantAccess;
    }

    // Check tenant access
    const tenantAccess = this.validateTenantAccess(transaction, userTenantId);
    if (!tenantAccess.success) {
      return tenantAccess;
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // VALIDATE REFUND PERMISSIONS
  // ============================================

  validateRefundPermissions(
    transaction: Transaction,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can refund any transaction
    if (isSystemAdmin) {
      return { success: true, timestamp: new Date().toISOString() };
    }

    // Check merchant access
    const merchantAccess = this.validateMerchantAccess(userRole);
    if (!merchantAccess.success) {
      return merchantAccess;
    }

    // Check tenant access
    const tenantAccess = this.validateTenantAccess(transaction, userTenantId);
    if (!tenantAccess.success) {
      return tenantAccess;
    }

    return { success: true, timestamp: new Date().toISOString() };
  }

  // ============================================
  // GET SECURITY SUMMARY
  // ============================================

  getSecuritySummary(): {
    activeRateLimits: number;
    auditLogEntries: number;
  } {
    return {
      activeRateLimits: this.rateLimitMap.size,
      auditLogEntries: this.auditLogs.length,
    };
  }

  // ============================================
  // LOG SECURITY VIOLATION
  // ============================================

  logSecurityViolation(
    violationType: string,
    transactionId: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    console.error(
      `[Security Violation] ${violationType} - User ${userId} attempted to access transaction ${transactionId}`,
      metadata
    );

    this.auditLog(
      `security_violation_${violationType}`,
      transactionId,
      userId,
      metadata
    );
  }
}

// Export singleton instance
export const transactionSecurityManager = new TransactionSecurityManager();

// ============================================
// REACT HOOK FOR TRANSACTION SECURITY
// ============================================

import { useCallback } from 'react';

export function useTransactionSecurity() {
  const checkRateLimit = useCallback((identifier: string, limit?: number, windowMs?: number) => {
    return transactionSecurityManager.checkRateLimit(identifier, limit, windowMs);
  }, []);

  const validateMerchantAccess = useCallback((userRole: string) => {
    return transactionSecurityManager.validateMerchantAccess(userRole);
  }, []);

  const validateTenantAccess = useCallback((transaction: Transaction, userTenantId: string) => {
    return transactionSecurityManager.validateTenantAccess(transaction, userTenantId);
  }, []);

  const validateUpdatePermissions = useCallback((
    transaction: Transaction,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin?: boolean
  ) => {
    return transactionSecurityManager.validateUpdatePermissions(
      transaction,
      userId,
      userTenantId,
      userRole,
      isSystemAdmin
    );
  }, []);

  const validateDeletePermissions = useCallback((
    transaction: Transaction,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin?: boolean
  ) => {
    return transactionSecurityManager.validateDeletePermissions(
      transaction,
      userId,
      userTenantId,
      userRole,
      isSystemAdmin
    );
  }, []);

  const validateRefundPermissions = useCallback((
    transaction: Transaction,
    userId: string,
    userTenantId: string,
    userRole: string,
    isSystemAdmin?: boolean
  ) => {
    return transactionSecurityManager.validateRefundPermissions(
      transaction,
      userId,
      userTenantId,
      userRole,
      isSystemAdmin
    );
  }, []);

  const sanitizeTransactionForLogging = useCallback((transaction: Transaction) => {
    return transactionSecurityManager.sanitizeTransactionForLogging(transaction);
  }, []);

  return {
    checkRateLimit,
    validateMerchantAccess,
    validateTenantAccess,
    validateUpdatePermissions,
    validateDeletePermissions,
    validateRefundPermissions,
    sanitizeTransactionForLogging,
  };
}
