// Customer Real-Time Activity Tracking
// Track login, API usage, payments

import type { ActivityLog, ActivityType } from './customer-types';

// ============================================
// ACTIVITY TRACKING ENGINE
// ============================================

export class ActivityTrackingEngine {
  private activityLogs: Map<string, ActivityLog[]> = new Map();
  private activityCounter: number = 0;
  private maxLogsPerCustomer: number = 1000;

  // ============================================
  // LOG ACTIVITY
  // ============================================

  logActivity(
    customerId: string,
    type: ActivityType,
    description: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ): ActivityLog {
    const log: ActivityLog = {
      id: `act_${Date.now()}_${this.activityCounter++}`,
      customerId,
      type,
      description,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      tenantId,
    };

    if (!this.activityLogs.has(customerId)) {
      this.activityLogs.set(customerId, []);
    }

    const logs = this.activityLogs.get(customerId)!;
    logs.push(log);

    // Trim if exceeds max
    if (logs.length > this.maxLogsPerCustomer) {
      logs.shift();
    }

    // In production, save to database
    console.log(`[ActivityTracking] Logged ${type} for customer ${customerId}: ${description}`);

    return log;
  }

  // ============================================
  // LOG LOGIN
  // ============================================

  logLogin(customerId: string, tenantId: string, ipAddress?: string, userAgent?: string): ActivityLog {
    return this.logActivity(
      customerId,
      'login',
      'Customer logged in',
      tenantId,
      ipAddress,
      userAgent
    );
  }

  // ============================================
  // LOG API USAGE
  // ============================================

  logAPIUsage(
    customerId: string,
    endpoint: string,
    method: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string
  ): ActivityLog {
    return this.logActivity(
      customerId,
      'api_usage',
      `API call: ${method} ${endpoint}`,
      tenantId,
      ipAddress,
      userAgent,
      { endpoint, method }
    );
  }

  // ============================================
  // LOG PAYMENT
  // ============================================

  logPayment(
    customerId: string,
    amount: number,
    currency: string,
    status: string,
    tenantId: string,
    ipAddress?: string
  ): ActivityLog {
    return this.logActivity(
      customerId,
      'payment',
      `Payment ${status}: ${amount} ${currency}`,
      tenantId,
      ipAddress,
      undefined,
      { amount, currency, status }
    );
  }

  // ============================================
  // LOG SUBSCRIPTION
  // ============================================

  logSubscription(
    customerId: string,
    action: 'created' | 'updated' | 'cancelled',
    plan: string,
    tenantId: string
  ): ActivityLog {
    return this.logActivity(
      customerId,
      'subscription',
      `Subscription ${action}: ${plan}`,
      tenantId,
      undefined,
      undefined,
      { action, plan }
    );
  }

  // ============================================
  // LOG LICENSE
  // ============================================

  logLicense(
    customerId: string,
    action: 'issued' | 'revoked' | 'renewed',
    product: string,
    tenantId: string
  ): ActivityLog {
    return this.logActivity(
      customerId,
      'license',
      `License ${action}: ${product}`,
      tenantId,
      undefined,
      undefined,
      { action, product }
    );
  }

  // ============================================
  // LOG PROFILE UPDATE
  // ============================================

  logProfileUpdate(
    customerId: string,
    fields: string[],
    tenantId: string
  ): ActivityLog {
    return this.logActivity(
      customerId,
      'profile_update',
      `Profile updated: ${fields.join(', ')}`,
      tenantId,
      undefined,
      undefined,
      { fields }
    );
  }

  // ============================================
  // LOG PASSWORD RESET
  // ============================================

  logPasswordReset(customerId: string, tenantId: string, ipAddress?: string): ActivityLog {
    return this.logActivity(
      customerId,
      'password_reset',
      'Password reset requested',
      tenantId,
      ipAddress,
      undefined
    );
  }

  // ============================================
  // GET CUSTOMER ACTIVITY LOGS
  // ============================================

  getActivityLogs(customerId: string, limit?: number): ActivityLog[] {
    const logs = this.activityLogs.get(customerId) || [];

    if (limit) {
      return logs.slice(-limit);
    }

    return logs;
  }

  // ============================================
  // GET ACTIVITY LOGS BY TYPE
  // ============================================

  getActivityLogsByType(customerId: string, type: ActivityType, limit?: number): ActivityLog[] {
    const logs = this.activityLogs.get(customerId) || [];
    const filtered = logs.filter((log) => log.type === type);

    if (limit) {
      return filtered.slice(-limit);
    }

    return filtered;
  }

  // ============================================
  // GET ACTIVITY LOGS BY DATE RANGE
  // ============================================

  getActivityLogsByDateRange(
    customerId: string,
    startDate: Date,
    endDate: Date
  ): ActivityLog[] {
    const logs = this.activityLogs.get(customerId) || [];

    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  // ============================================
  // GET RECENT ACTIVITY
  // ============================================

  getRecentActivity(customerId: string, hours: number = 24): ActivityLog[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = this.activityLogs.get(customerId) || [];

    return logs.filter((log) => new Date(log.timestamp) >= cutoff);
  }

  // ============================================
  // GET ACTIVITY SUMMARY
  // ============================================

  getActivitySummary(customerId: string, days: number = 30): {
    totalActivities: number;
    loginCount: number;
    apiUsageCount: number;
    paymentCount: number;
    subscriptionCount: number;
    licenseCount: number;
    profileUpdateCount: number;
    lastActivity: string | null;
  } {
    const logs = this.activityLogs.get(customerId) || [];
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recentLogs = logs.filter((log) => new Date(log.timestamp) >= cutoff);

    const summary = {
      totalActivities: recentLogs.length,
      loginCount: recentLogs.filter((log) => log.type === 'login').length,
      apiUsageCount: recentLogs.filter((log) => log.type === 'api_usage').length,
      paymentCount: recentLogs.filter((log) => log.type === 'payment').length,
      subscriptionCount: recentLogs.filter((log) => log.type === 'subscription').length,
      licenseCount: recentLogs.filter((log) => log.type === 'license').length,
      profileUpdateCount: recentLogs.filter((log) => log.type === 'profile_update').length,
      lastActivity: recentLogs.length > 0 ? recentLogs[recentLogs.length - 1].timestamp : null,
    };

    return summary;
  }

  // ============================================
  // CLEAR ACTIVITY LOGS
  // ============================================

  clearActivityLogs(customerId?: string): void {
    if (customerId) {
      this.activityLogs.delete(customerId);
    } else {
      this.activityLogs.clear();
    }
  }

  // ============================================
  // GET ALL ACTIVITY LOGS (ADMIN)
  // ============================================

  getAllActivityLogs(tenantId: string, limit?: number): ActivityLog[] {
    const allLogs: ActivityLog[] = [];

    for (const logs of this.activityLogs.values()) {
      for (const log of logs) {
        if (log.tenantId === tenantId) {
          allLogs.push(log);
        }
      }
    }

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      return allLogs.slice(0, limit);
    }

    return allLogs;
  }

  // ============================================
  // GET SUSPICIOUS ACTIVITY
  // ============================================

  getSuspiciousActivity(customerId: string, tenantId: string): ActivityLog[] {
    const logs = this.activityLogs.get(customerId) || [];
    const suspicious: ActivityLog[] = [];

    // Check for multiple logins from different IPs
    const loginIPs = new Map<string, number>();
    for (const log of logs) {
      if (log.type === 'login' && log.ipAddress) {
        loginIPs.set(log.ipAddress, (loginIPs.get(log.ipAddress) || 0) + 1);
      }
    }

    // Flag if more than 5 different IPs
    if (loginIPs.size > 5) {
      const logins = logs.filter((log) => log.type === 'login');
      suspicious.push(...logins);
    }

    // Check for rapid API usage
    const apiLogs = logs.filter((log) => log.type === 'api_usage');
    for (let i = 0; i < apiLogs.length - 10; i++) {
      const timeDiff = new Date(apiLogs[i + 10].timestamp).getTime() - 
                     new Date(apiLogs[i].timestamp).getTime();
      
      // If 10 API calls within 1 minute
      if (timeDiff < 60000) {
        suspicious.push(...apiLogs.slice(i, i + 10));
      }
    }

    return suspicious;
  }
}

// Export singleton instance
export const activityTrackingEngine = new ActivityTrackingEngine();

// ============================================
// REACT HOOK FOR ACTIVITY TRACKING
// ============================================

import { useState, useCallback } from 'react';

export function useActivityTracking() {
  const logActivity = useCallback((
    customerId: string,
    type: ActivityType,
    description: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ) => {
    return activityTrackingEngine.logActivity(
      customerId,
      type,
      description,
      tenantId,
      ipAddress,
      userAgent,
      metadata
    );
  }, []);

  const logLogin = useCallback((customerId: string, tenantId: string, ipAddress?: string, userAgent?: string) => {
    return activityTrackingEngine.logLogin(customerId, tenantId, ipAddress, userAgent);
  }, []);

  const logAPIUsage = useCallback((
    customerId: string,
    endpoint: string,
    method: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string
  ) => {
    return activityTrackingEngine.logAPIUsage(customerId, endpoint, method, tenantId, ipAddress, userAgent);
  }, []);

  const logPayment = useCallback((
    customerId: string,
    amount: number,
    currency: string,
    status: string,
    tenantId: string,
    ipAddress?: string
  ) => {
    return activityTrackingEngine.logPayment(customerId, amount, currency, status, tenantId, ipAddress);
  }, []);

  const getActivityLogs = useCallback((customerId: string, limit?: number) => {
    return activityTrackingEngine.getActivityLogs(customerId, limit);
  }, []);

  const getActivitySummary = useCallback((customerId: string, days?: number) => {
    return activityTrackingEngine.getActivitySummary(customerId, days);
  }, []);

  const getSuspiciousActivity = useCallback((customerId: string, tenantId: string) => {
    return activityTrackingEngine.getSuspiciousActivity(customerId, tenantId);
  }, []);

  return {
    logActivity,
    logLogin,
    logAPIUsage,
    logPayment,
    getActivityLogs,
    getActivitySummary,
    getSuspiciousActivity,
  };
}
