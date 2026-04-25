// Customer Security Layer
// Email unique, PII encrypted, tenant isolation

import type { Customer } from './customer-types';

// ============================================
// SECURITY RESULT
// ============================================

export interface SecurityResult {
  success: boolean;
  error?: string;
}

// ============================================
// CUSTOMER SECURITY MANAGER
// ============================================

export class CustomerSecurityManager {
  private emailMap: Map<string, string> = new Map(); // customerId -> email
  private encryptedPII: Map<string, string> = new Map();

  // ============================================
  // VALIDATE EMAIL UNIQUENESS
  // ============================================

  validateEmailUniqueness(email: string, excludeCustomerId?: string): SecurityResult {
    const normalizedEmail = email.toLowerCase();

    // Check if email exists for any customer
    for (const [customerId, existingEmail] of this.emailMap) {
      if (existingEmail === normalizedEmail) {
        // If excluding a customer ID, check if the email belongs to that customer
        if (excludeCustomerId && customerId === excludeCustomerId) {
          return { success: true };
        }

        return {
          success: false,
          error: 'Email already exists',
        };
      }
    }

    return { success: true };
  }

  // ============================================
  // REGISTER EMAIL
  // ============================================

  registerEmail(customerId: string, email: string): void {
    const normalizedEmail = email.toLowerCase();
    this.emailMap.set(customerId, normalizedEmail);
  }

  // ============================================
  // UNREGISTER EMAIL
  // ============================================

  unregisterEmail(customerId: string): void {
    this.emailMap.delete(customerId);
  }

  // ============================================
  // GET EMAIL BY CUSTOMER ID
  // ============================================

  getEmailByCustomerId(customerId: string): string | undefined {
    return this.emailMap.get(customerId);
  }

  // ============================================
  // ENCRYPT PII
  // ============================================

  encryptPII(data: string): string {
    // In production, use proper encryption (e.g., AES-256)
    // For now, use base64 encoding as a placeholder
    return btoa(data);
  }

  // ============================================
  // DECRYPT PII
  // ============================================

  decryptPII(encryptedData: string): string {
    // In production, use proper decryption
    // For now, use base64 decoding as a placeholder
    return atob(encryptedData);
  }

  // ============================================
  // ENCRYPT CUSTOMER PII
  // ============================================

  encryptCustomerPII(customer: Customer): Customer {
    const encrypted: Customer = {
      ...customer,
      email: this.encryptPII(customer.email),
      phone: customer.phone ? this.encryptPII(customer.phone) : null,
      name: this.encryptPII(customer.name),
    };

    this.encryptedPII.set(customer.id, JSON.stringify(encrypted));

    return encrypted;
  }

  // ============================================
  // DECRYPT CUSTOMER PII
  // ============================================

  decryptCustomerPII(customer: Customer): Customer {
    const decrypted: Customer = {
      ...customer,
      email: this.decryptPII(customer.email),
      phone: customer.phone ? this.decryptPII(customer.phone) : null,
      name: this.decryptPII(customer.name),
    };

    return decrypted;
  }

  // ============================================
  // VALIDATE TENANT ISOLATION
  // ============================================

  validateTenantIsolation(customer: Customer, tenantId: string): SecurityResult {
    if (customer.tenantId !== tenantId) {
      return {
        success: false,
        error: 'Customer does not belong to this tenant',
      };
    }

    return { success: true };
  }

  // ============================================
  // VALIDATE TENANT ISOLATION FOR LIST
  // ============================================

  validateTenantIsolationForList(customers: Customer[], tenantId: string): {
    valid: Customer[];
    invalid: Customer[];
  } {
    const valid: Customer[] = [];
    const invalid: Customer[] = [];

    for (const customer of customers) {
      const result = this.validateTenantIsolation(customer, tenantId);
      if (result.success) {
        valid.push(customer);
      } else {
        invalid.push(customer);
      }
    }

    return { valid, invalid };
  }

  // ============================================
  // SANITIZE CUSTOMER DATA FOR LOGGING
  // ============================================

  sanitizeCustomerForLogging(customer: Customer): Record<string, unknown> {
    return {
      id: customer.id,
      status: customer.status,
      ltv: customer.ltv,
      activeSubscriptions: customer.activeSubscriptions,
      churnRiskScore: customer.churnRiskScore,
      fraudRiskScore: customer.fraudRiskScore,
      country: customer.country,
      // PII fields omitted
    };
  }

  // ============================================
  // VALIDATE CUSTOMER UPDATE PERMISSIONS
  // ============================================

  validateUpdatePermissions(
    customer: Customer,
    userId: string,
    userTenantId: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can update any customer
    if (isSystemAdmin) {
      return { success: true };
    }

    // Users can only update customers in their tenant
    if (customer.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Insufficient permissions: tenant mismatch',
      };
    }

    return { success: true };
  }

  // ============================================
  // VALIDATE CUSTOMER DELETE PERMISSIONS
  // ============================================

  validateDeletePermissions(
    customer: Customer,
    userId: string,
    userTenantId: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can delete any customer
    if (isSystemAdmin) {
      return { success: true };
    }

    // Users can only delete customers in their tenant
    if (customer.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Insufficient permissions: tenant mismatch',
      };
    }

    // Additional checks could be added here (e.g., customer must not have active subscriptions)

    return { success: true };
  }

  // ============================================
  // AUDIT LOG ENTRY
  // ============================================

  auditLog(action: string, customerId: string, userId: string, metadata?: Record<string, unknown>): void {
    const logEntry = {
      action,
      customerId,
      userId,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    console.log('[Security Audit]', logEntry);

    // In production, save to audit log database
  }

  // ============================================
  // RATE LIMIT CHECK
  // ============================================

  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  checkRateLimit(userId: string, action: string, limit: number = 100, windowMs: number = 60000): SecurityResult {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { success: true };
    }

    if (entry.count >= limit) {
      return {
        success: false,
        error: 'Rate limit exceeded',
      };
    }

    entry.count++;
    return { success: true };
  }

  // ============================================
  // CLEAR RATE LIMIT
  // ============================================

  clearRateLimit(userId: string, action: string): void {
    const key = `${userId}:${action}`;
    this.rateLimitMap.delete(key);
  }

  // ============================================
  // VALIDATE DATA INTEGRITY
  // ============================================

  validateDataIntegrity(customer: Customer): SecurityResult {
    // Check required fields
    if (!customer.id || !customer.email || !customer.name) {
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Check status
    const validStatuses = ['active', 'inactive', 'blocked'];
    if (!validStatuses.includes(customer.status)) {
      return {
        success: false,
        error: 'Invalid status',
      };
    }

    // Check LTV is non-negative
    if (customer.ltv < 0) {
      return {
        success: false,
        error: 'LTV cannot be negative',
      };
    }

    return { success: true };
  }

  // ============================================
  // GET SECURITY SUMMARY
  // ============================================

  getSecuritySummary(): {
    registeredEmails: number;
    encryptedRecords: number;
    activeRateLimits: number;
  } {
    return {
      registeredEmails: this.emailMap.size,
      encryptedRecords: this.encryptedPII.size,
      activeRateLimits: this.rateLimitMap.size,
    };
  }
}

// Export singleton instance
export const customerSecurityManager = new CustomerSecurityManager();

// ============================================
// REACT HOOK FOR CUSTOMER SECURITY
// ============================================

import { useCallback } from 'react';

export function useCustomerSecurity() {
  const validateEmailUniqueness = useCallback((email: string, excludeCustomerId?: string) => {
    return customerSecurityManager.validateEmailUniqueness(email, excludeCustomerId);
  }, []);

  const validateTenantIsolation = useCallback((customer: Customer, tenantId: string) => {
    return customerSecurityManager.validateTenantIsolation(customer, tenantId);
  }, []);

  const validateUpdatePermissions = useCallback((
    customer: Customer,
    userId: string,
    userTenantId: string,
    isSystemAdmin?: boolean
  ) => {
    return customerSecurityManager.validateUpdatePermissions(customer, userId, userTenantId, isSystemAdmin);
  }, []);

  const validateDeletePermissions = useCallback((
    customer: Customer,
    userId: string,
    userTenantId: string,
    isSystemAdmin?: boolean
  ) => {
    return customerSecurityManager.validateDeletePermissions(customer, userId, userTenantId, isSystemAdmin);
  }, []);

  const sanitizeCustomerForLogging = useCallback((customer: Customer) => {
    return customerSecurityManager.sanitizeCustomerForLogging(customer);
  }, []);

  const auditLog = useCallback((action: string, customerId: string, userId: string, metadata?: Record<string, unknown>) => {
    customerSecurityManager.auditLog(action, customerId, userId, metadata);
  }, []);

  const checkRateLimit = useCallback((userId: string, action: string, limit?: number, windowMs?: number) => {
    return customerSecurityManager.checkRateLimit(userId, action, limit, windowMs);
  }, []);

  return {
    validateEmailUniqueness,
    validateTenantIsolation,
    validateUpdatePermissions,
    validateDeletePermissions,
    sanitizeCustomerForLogging,
    auditLog,
    checkRateLimit,
  };
}
