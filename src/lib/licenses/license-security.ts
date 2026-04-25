// License Security Layer
// Encrypted keys, rate limit, anti-bruteforce, tenant isolation

import type { License } from './license-types';

// ============================================
// SECURITY RESULT
// ============================================

export interface SecurityResult {
  success: boolean;
  error?: string;
}

// ============================================
// LICENSE SECURITY MANAGER
// ============================================

export class LicenseSecurityManager {
  private encryptedKeys: Map<string, string> = new Map(); // licenseId -> encrypted key
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private bruteForceMap: Map<string, { attempts: number; blockedUntil: number }> = new Map();
  private auditLogs: Array<{
    action: string;
    licenseId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> = [];

  // ============================================
  // ENCRYPT LICENSE KEY
  // ============================================

  encryptLicenseKey(licenseKey: string): string {
    // In production, use AES-256 encryption
    // For now, use base64 encoding as placeholder
    return btoa(licenseKey);
  }

  // ============================================
  // DECRYPT LICENSE KEY
  // ============================================

  decryptLicenseKey(encryptedKey: string): string {
    // In production, use AES-256 decryption
    // For now, use base64 decoding as placeholder
    return atob(encryptedKey);
  }

  // ============================================
  // STORE ENCRYPTED KEY
  // ============================================

  storeEncryptedKey(licenseId: string, licenseKey: string): void {
    const encrypted = this.encryptLicenseKey(licenseKey);
    this.encryptedKeys.set(licenseId, encrypted);
  }

  // ============================================
  // GET ENCRYPTED KEY
  // ============================================

  getEncryptedKey(licenseId: string): string | null {
    return this.encryptedKeys.get(licenseId) || null;
  }

  // ============================================
  // REMOVE ENCRYPTED KEY
  // ============================================

  removeEncryptedKey(licenseId: string): void {
    this.encryptedKeys.delete(licenseId);
  }

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

  clearRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }

  // ============================================
  // CHECK BRUTE FORCE PROTECTION
  // ============================================

  checkBruteForce(identifier: string, maxAttempts: number = 5, blockDurationMs: number = 900000): SecurityResult {
    const now = Date.now();
    const entry = this.bruteForceMap.get(identifier);

    if (!entry) {
      this.bruteForceMap.set(identifier, {
        attempts: 1,
        blockedUntil: 0,
      });
      return { success: true };
    }

    if (now < entry.blockedUntil) {
      return {
        success: false,
        error: 'Blocked due to too many failed attempts',
      };
    }

    entry.attempts++;

    if (entry.attempts >= maxAttempts) {
      entry.blockedUntil = now + blockDurationMs;
      return {
        success: false,
        error: 'Too many failed attempts - temporarily blocked',
      };
    }

    return { success: true };
  }

  // ============================================
  // RESET BRUTE FORCE
  // ============================================

  resetBruteForce(identifier: string): void {
    this.bruteForceMap.delete(identifier);
  }

  // ============================================
  // VALIDATE TENANT ISOLATION
  // ============================================

  validateTenantIsolation(license: License, tenantId: string): SecurityResult {
    if (license.tenantId !== tenantId) {
      return {
        success: false,
        error: 'License does not belong to this tenant',
      };
    }

    return { success: true };
  }

  // ============================================
  // AUDIT LOG
  // ============================================

  auditLog(action: string, licenseId: string, userId: string, metadata?: Record<string, unknown>): void {
    const logEntry = {
      action,
      licenseId,
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

  getAuditLog(licenseId?: string, limit?: number): Array<{
    action: string;
    licenseId: string;
    userId: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> {
    let logs = this.auditLogs;

    if (licenseId) {
      logs = logs.filter((log) => log.licenseId === licenseId);
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
  // SANITIZE LICENSE DATA FOR LOGGING
  // ============================================

  sanitizeLicenseForLogging(license: License): Record<string, unknown> {
    return {
      id: license.id,
      status: license.status,
      productId: license.productId,
      customerId: license.customerId,
      activationCount: license.activationCount,
      activationLimit: license.activationLimit,
      expiresAt: license.expiresAt,
      // License key omitted for security
    };
  }

  // ============================================
  // VALIDATE LICENSE UPDATE PERMISSIONS
  // ============================================

  validateUpdatePermissions(
    license: License,
    userId: string,
    userTenantId: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can update any license
    if (isSystemAdmin) {
      return { success: true };
    }

    // Users can only update licenses in their tenant
    if (license.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Insufficient permissions: tenant mismatch',
      };
    }

    return { success: true };
  }

  // ============================================
  // VALIDATE LICENSE DELETE PERMISSIONS
  // ============================================

  validateDeletePermissions(
    license: License,
    userId: string,
    userTenantId: string,
    isSystemAdmin: boolean = false
  ): SecurityResult {
    // System admins can delete any license
    if (isSystemAdmin) {
      return { success: true };
    }

    // Users can only delete licenses in their tenant
    if (license.tenantId !== userTenantId) {
      return {
        success: false,
        error: 'Insufficient permissions: tenant mismatch',
      };
    }

    return { success: true };
  }

  // ============================================
  // GET SECURITY SUMMARY
  // ============================================

  getSecuritySummary(): {
    encryptedKeysCount: number;
    activeRateLimits: number;
    activeBruteForceBlocks: number;
    auditLogEntries: number;
  } {
    const now = Date.now();
    const activeBruteForceBlocks = Array.from(this.bruteForceMap.values()).filter(
      (entry) => now < entry.blockedUntil
    ).length;

    return {
      encryptedKeysCount: this.encryptedKeys.size,
      activeRateLimits: this.rateLimitMap.size,
      activeBruteForceBlocks,
      auditLogEntries: this.auditLog.length,
    };
  }
}

// Export singleton instance
export const licenseSecurityManager = new LicenseSecurityManager();

// ============================================
// REACT HOOK FOR LICENSE SECURITY
// ============================================

import { useCallback } from 'react';

export function useLicenseSecurity() {
  const checkRateLimit = useCallback((identifier: string, limit?: number, windowMs?: number) => {
    return licenseSecurityManager.checkRateLimit(identifier, limit, windowMs);
  }, []);

  const checkBruteForce = useCallback((identifier: string, maxAttempts?: number, blockDurationMs?: number) => {
    return licenseSecurityManager.checkBruteForce(identifier, maxAttempts, blockDurationMs);
  }, []);

  const validateTenantIsolation = useCallback((license: License, tenantId: string) => {
    return licenseSecurityManager.validateTenantIsolation(license, tenantId);
  }, []);

  const validateUpdatePermissions = useCallback((
    license: License,
    userId: string,
    userTenantId: string,
    isSystemAdmin?: boolean
  ) => {
    return licenseSecurityManager.validateUpdatePermissions(license, userId, userTenantId, isSystemAdmin);
  }, []);

  const validateDeletePermissions = useCallback((
    license: License,
    userId: string,
    userTenantId: string,
    isSystemAdmin?: boolean
  ) => {
    return licenseSecurityManager.validateDeletePermissions(license, userId, userTenantId, isSystemAdmin);
  }, []);

  const sanitizeLicenseForLogging = useCallback((license: License) => {
    return licenseSecurityManager.sanitizeLicenseForLogging(license);
  }, []);

  return {
    checkRateLimit,
    checkBruteForce,
    validateTenantIsolation,
    validateUpdatePermissions,
    validateDeletePermissions,
    sanitizeLicenseForLogging,
  };
}
