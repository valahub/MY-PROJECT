// Customer Actions
// Block, reset password, refund, send email

import type { Customer } from './customer-types';
import { customerSecurityManager } from './customer-security';
import { customerEventEmitter } from './customer-events';
import { activityTrackingEngine } from './customer-activity';

// ============================================
// CUSTOMER ACTION RESULT
// ============================================

export interface CustomerActionResult {
  success: boolean;
  customer: Customer | null;
  error?: string;
  timestamp: string;
}

// ============================================
// CUSTOMER ACTIONS MANAGER
// ============================================

export class CustomerActionsManager {
  // ============================================
  // BLOCK CUSTOMER
  // ============================================

  async blockCustomer(
    customer: Customer,
    userId: string,
    userEmail: string,
    reason?: string
  ): Promise<CustomerActionResult> {
    try {
      // Validate permissions
      const permissionResult = customerSecurityManager.validateUpdatePermissions(
        customer,
        userId,
        customer.tenantId
      );

      if (!permissionResult.success) {
        return {
          success: false,
          customer: null,
          error: permissionResult.error,
          timestamp: new Date().toISOString(),
        };
      }

      // Block customer
      const updatedCustomer: Customer = {
        ...customer,
        status: 'blocked',
        updatedAt: new Date().toISOString(),
      };

      // Log audit
      customerSecurityManager.auditLog('customer.blocked', customer.id, userId, { reason });

      // Emit event
      await customerEventEmitter.emitCustomerBlocked(updatedCustomer, userId);

      // Log activity
      activityTrackingEngine.logProfileUpdate(customer.id, ['status'], customer.tenantId);

      console.log(`[CustomerActions] Blocked customer ${customer.id}`);

      return {
        success: true,
        customer: updatedCustomer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        error: error instanceof Error ? error.message : 'Failed to block customer',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // UNBLOCK CUSTOMER
  // ============================================

  async unblockCustomer(
    customer: Customer,
    userId: string,
    userEmail: string
  ): Promise<CustomerActionResult> {
    try {
      // Validate permissions
      const permissionResult = customerSecurityManager.validateUpdatePermissions(
        customer,
        userId,
        customer.tenantId
      );

      if (!permissionResult.success) {
        return {
          success: false,
          customer: null,
          error: permissionResult.error,
          timestamp: new Date().toISOString(),
        };
      }

      // Unblock customer
      const updatedCustomer: Customer = {
        ...customer,
        status: 'active',
        updatedAt: new Date().toISOString(),
      };

      // Log audit
      customerSecurityManager.auditLog('customer.unblocked', customer.id, userId);

      // Emit event
      await customerEventEmitter.emitCustomerUnblocked(updatedCustomer, userId);

      // Log activity
      activityTrackingEngine.logProfileUpdate(customer.id, ['status'], customer.tenantId);

      console.log(`[CustomerActions] Unblocked customer ${customer.id}`);

      return {
        success: true,
        customer: updatedCustomer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        error: error instanceof Error ? error.message : 'Failed to unblock customer',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // RESET PASSWORD
  // ============================================

  async resetPassword(
    customer: Customer,
    userId: string,
    userEmail: string
  ): Promise<CustomerActionResult> {
    try {
      // Validate permissions
      const permissionResult = customerSecurityManager.validateUpdatePermissions(
        customer,
        userId,
        customer.tenantId
      );

      if (!permissionResult.success) {
        return {
          success: false,
          customer: null,
          error: permissionResult.error,
          timestamp: new Date().toISOString(),
        };
      }

      // In production, send password reset email
      console.log(`[CustomerActions] Password reset initiated for customer ${customer.id}`);

      // Log audit
      customerSecurityManager.auditLog('customer.password_reset', customer.id, userId);

      // Log activity
      activityTrackingEngine.logPasswordReset(customer.id, customer.tenantId);

      return {
        success: true,
        customer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        error: error instanceof Error ? error.message : 'Failed to reset password',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // REFUND
  // ============================================

  async refund(
    customer: Customer,
    transactionId: string,
    amount: number,
    userId: string,
    userEmail: string,
    reason?: string
  ): Promise<CustomerActionResult> {
    try {
      // Validate permissions
      const permissionResult = customerSecurityManager.validateUpdatePermissions(
        customer,
        userId,
        customer.tenantId
      );

      if (!permissionResult.success) {
        return {
          success: false,
          customer: null,
          error: permissionResult.error,
          timestamp: new Date().toISOString(),
        };
      }

      // In production, process refund through payment gateway
      console.log(`[CustomerActions] Refund initiated: transaction=${transactionId}, amount=${amount}`);

      // Update customer LTV
      const updatedCustomer: Customer = {
        ...customer,
        ltv: Math.max(0, customer.ltv - amount),
        totalSpent: Math.max(0, customer.totalSpent - amount),
        updatedAt: new Date().toISOString(),
      };

      // Log audit
      customerSecurityManager.auditLog('customer.refund', customer.id, userId, {
        transactionId,
        amount,
        reason,
      });

      // Log activity
      activityTrackingEngine.logPayment(
        customer.id,
        -amount,
        'USD',
        'refunded',
        customer.tenantId
      );

      return {
        success: true,
        customer: updatedCustomer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        error: error instanceof Error ? error.message : 'Failed to process refund',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // SEND EMAIL
  // ============================================

  async sendEmail(
    customer: Customer,
    template: string,
    subject: string,
    variables: Record<string, unknown>,
    userId: string,
    userEmail: string
  ): Promise<CustomerActionResult> {
    try {
      // In production, send email through email service
      console.log(`[CustomerActions] Email sent: template=${template}, to=${customer.email}, subject=${subject}`);

      // Log audit
      customerSecurityManager.auditLog('customer.email_sent', customer.id, userId, {
        template,
        subject,
      });

      return {
        success: true,
        customer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        error: error instanceof Error ? error.message : 'Failed to send email',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // VIEW ACTIVITY
  // ============================================

  viewActivity(customer: Customer, limit?: number) {
    const activityLogs = activityTrackingEngine.getActivityLogs(customer.id, limit);
    return activityLogs;
  }

  // ============================================
  // DELETE CUSTOMER
  // ============================================

  async deleteCustomer(
    customer: Customer,
    userId: string,
    userEmail: string
  ): Promise<CustomerActionResult> {
    try {
      // Validate permissions
      const permissionResult = customerSecurityManager.validateDeletePermissions(
        customer,
        userId,
        user: string
      );

      if (!permissionResult.success) {
        return {
          success: false,
          customer: null,
          error: permissionResult.error,
          timestamp: new Date().toISOString(),
        };
      }

      // Log audit
      customerSecurityManager.auditLog('customer.deleted', customer.id, userId);

      // Emit event
      await customerEventEmitter.emitCustomerDeleted(customer.id, customer.email, customer.tenantId, userId);

      // Unregister email
      customerSecurityManager.unregisterEmail(customer.id);

      console.log(`[CustomerActions] Deleted customer ${customer.id}`);

      return {
        success: true,
        customer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        error: error instanceof Error ? error.message : 'Failed to delete customer',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // UPDATE CUSTOMER
  // ============================================

  async updateCustomer(
    customer: Customer,
    updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'tenantId'>>,
    userId: string,
    userEmail: string
  ): Promise<CustomerActionResult> {
    try {
      // Validate permissions
      const permissionResult = customerSecurityManager.validateUpdatePermissions(
        customer,
        userId,
        customer.tenantId
      );

      if (!permissionResult.success) {
        return {
          success: false,
          customer: null,
          error: permissionResult.error,
          timestamp: new Date().toISOString(),
        };
      }

      // Update customer
      const updatedCustomer: Customer = {
        ...customer,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Log audit
      customerSecurityManager.auditLog('customer.updated', customer.id, userId, {
        updates: Object.keys(updates),
      });

      // Emit event
      await customerEventEmitter.emitCustomerUpdated(updatedCustomer, userId, updates);

      // Log activity
      activityTrackingEngine.logProfileUpdate(customer.id, Object.keys(updates), customer.tenantId);

      console.log(`[CustomerActions] Updated customer ${customer.id}`);

      return {
        success: true,
        customer: updatedCustomer,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        error: error instanceof Error ? error.message : 'Failed to update customer',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const customerActionsManager = new CustomerActionsManager();

// ============================================
// REACT HOOK FOR CUSTOMER ACTIONS
// ============================================

import { useState, useCallback } from 'react';

export function useCustomerActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockCustomer = useCallback(async (
    customer: Customer,
    userId: string,
    userEmail: string,
    reason?: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await customerActionsManager.blockCustomer(customer, userId, userEmail, reason);
      if (!result.success) {
        setError(result.error || 'Failed to block customer');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to block customer';
      setError(errorMessage);
      return {
        success: false,
        customer: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const unblockCustomer = useCallback(async (customer: Customer, userId: string, userEmail: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await customerActionsManager.unblockCustomer(customer, userId, userEmail);
      if (!result.success) {
        setError(result.error || 'Failed to unblock customer');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unblock customer';
      setError(errorMessage);
      return {
        success: false,
        customer: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetPassword = useCallback(async (customer: Customer, userId: string, userEmail: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await customerActionsManager.resetPassword(customer, userId, userEmail);
      if (!result.success) {
        setError(result.error || 'Failed to reset password');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setError(errorMessage);
      return {
        success: false,
        customer: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const refund = useCallback(async (
    customer: Customer,
    transactionId: string,
    amount: number,
    userId: string,
    userEmail: string,
    reason?: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await customerActionsManager.refund(customer, transactionId, amount, userId, userEmail, reason);
      if (!result.success) {
        setError(result.error || 'Failed to process refund');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process refund';
      setError(errorMessage);
      return {
        success: false,
        customer: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const sendEmail = useCallback(async (
    customer: Customer,
    template: string,
    subject: string,
    variables: Record<string, unknown>,
    userId: string,
    userEmail: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await customerActionsManager.sendEmail(customer, template, subject, variables, userId, userEmail);
      if (!result.success) {
        setError(result.error || 'Failed to send email');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      setError(errorMessage);
      return {
        success: false,
        customer: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const viewActivity = useCallback((customer: Customer, limit?: number) => {
    return customerActionsManager.viewActivity(customer, limit);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    blockCustomer,
    unblockCustomer,
    resetPassword,
    refund,
    sendEmail,
    viewActivity,
    clearError,
  };
}
