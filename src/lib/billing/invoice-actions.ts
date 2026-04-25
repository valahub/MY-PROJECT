// Invoice Actions
// Retry payment, mark paid, download PDF

import type { Invoice } from './invoice-types';
import { invoiceService } from './invoice-service';
import { dunningEngine } from './dunning-engine';
import { billingEventEmitter } from './billing-events';
import { billingSecurityManager } from './billing-security';
import { invoiceAPI } from './invoice-api';

// ============================================
// INVOICE ACTION RESULT
// ============================================

export interface InvoiceActionResult {
  success: boolean;
  invoice: Invoice | null;
  error: string | null;
  timestamp: string;
}

// ============================================
// INVOICE ACTIONS MANAGER
// ============================================

export class InvoiceActionsManager {
  // ============================================
  // RETRY PAYMENT
  // ============================================

  async retryPayment(
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string
  ): Promise<InvoiceActionResult> {
    try {
      // Get invoice
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return {
          success: false,
          invoice: null,
          error: 'Invoice not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Check security
      const securityCheck = billingSecurityManager.canModifyInvoice(invoice);
      if (!securityCheck.allowed) {
        return {
          success: false,
          invoice: null,
          error: securityCheck.reason || 'Cannot modify invoice',
          timestamp: new Date().toISOString(),
        };
      }

      // Check tenant access
      if (!billingSecurityManager.checkTenantAccess(invoice, tenantId)) {
        return {
          success: false,
          invoice: null,
          error: 'Access denied',
          timestamp: new Date().toISOString(),
        };
      }

      // Log audit
      billingSecurityManager.logAudit(
        'invoice',
        invoiceId,
        'retry',
        userId,
        userEmail,
        tenantId,
        invoice.status,
        invoice.status
      );

      // Increment retry count
      await invoiceService.incrementRetryCount(invoiceId);

      // Trigger dunning process
      const dunningResult = await dunningEngine.processFailedPayment(invoiceId, invoice.customerId);

      // Emit event
      await billingEventEmitter.emitDunningAttempt(
        invoiceId,
        invoice.customerId,
        invoice.retryCount + 1,
        dunningResult.action
      );

      // Get updated invoice
      const updatedInvoice = await invoiceService.getInvoice(invoiceId);

      return {
        success: dunningResult.success,
        invoice: updatedInvoice,
        error: dunningResult.errorMessage || null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        invoice: null,
        error: error instanceof Error ? error.message : 'Failed to retry payment',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // MARK AS PAID
  // ============================================

  async markAsPaid(
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string,
    paymentDate?: string
  ): Promise<InvoiceActionResult> {
    try {
      // Get invoice
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return {
          success: false,
          invoice: null,
          error: 'Invoice not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Check security
      const securityCheck = billingSecurityManager.canModifyInvoice(invoice);
      if (!securityCheck.allowed) {
        return {
          success: false,
          invoice: null,
          error: securityCheck.reason || 'Cannot modify invoice',
          timestamp: new Date().toISOString(),
        };
      }

      // Check tenant access
      if (!billingSecurityManager.checkTenantAccess(invoice, tenantId)) {
        return {
          success: false,
          invoice: null,
          error: 'Access denied',
          timestamp: new Date().toISOString(),
        };
      }

      // Validate status transition
      const isValidTransition = billingSecurityManager.validateStatusTransition(invoice.status, 'paid');
      if (!isValidTransition) {
        return {
          success: false,
          invoice: null,
          error: 'Invalid status transition',
          timestamp: new Date().toISOString(),
        };
      }

      // Log audit
      billingSecurityManager.logAudit(
        'invoice',
        invoiceId,
        'mark_paid',
        userId,
        userEmail,
        tenantId,
        invoice.status,
        'paid'
      );

      // Mark as paid
      const updatedInvoice = await invoiceService.markAsPaid(invoiceId, paymentDate);

      // Emit event
      if (updatedInvoice) {
        await billingEventEmitter.emitInvoicePaid(updatedInvoice);
      }

      return {
        success: !!updatedInvoice,
        invoice: updatedInvoice,
        error: updatedInvoice ? null : 'Failed to mark invoice as paid',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        invoice: null,
        error: error instanceof Error ? error.message : 'Failed to mark invoice as paid',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // DOWNLOAD PDF
  // ============================================

  async downloadPDF(
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string
  ): Promise<{ success: boolean; blob: Blob | null; error: string | null }> {
    try {
      // Get invoice
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return {
          success: false,
          blob: null,
          error: 'Invoice not found',
        };
      }

      // Check tenant access
      if (!billingSecurityManager.checkTenantAccess(invoice, tenantId)) {
        return {
          success: false,
          blob: null,
          error: 'Access denied',
        };
      }

      // Log audit
      billingSecurityManager.logAudit(
        'invoice',
        invoiceId,
        'read',
        userId,
        userEmail,
        tenantId,
        null,
        null
      );

      // Download PDF from API
      const result = await invoiceAPI.downloadInvoicePDF(invoiceId);

      return {
        success: result.success,
        blob: result.data,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        blob: null,
        error: error instanceof Error ? error.message : 'Failed to download PDF',
      };
    }
  }

  // ============================================
  // CANCEL INVOICE
  // ============================================

  async cancelInvoice(
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string
  ): Promise<InvoiceActionResult> {
    try {
      // Get invoice
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return {
          success: false,
          invoice: null,
          error: 'Invoice not found',
          timestamp: new Date().toISOString(),
        };
      }

      // Check security
      const securityCheck = billingSecurityManager.canModifyInvoice(invoice);
      if (!securityCheck.allowed) {
        return {
          success: false,
          invoice: null,
          error: securityCheck.reason || 'Cannot modify invoice',
          timestamp: new Date().toISOString(),
        };
      }

      // Check tenant access
      if (!billingSecurityManager.checkTenantAccess(invoice, tenantId)) {
        return {
          success: false,
          invoice: null,
          error: 'Access denied',
          timestamp: new Date().toISOString(),
        };
      }

      // Validate status transition
      const isValidTransition = billingSecurityManager.validateStatusTransition(invoice.status, 'cancelled');
      if (!isValidTransition) {
        return {
          success: false,
          invoice: null,
          error: 'Invalid status transition',
          timestamp: new Date().toISOString(),
        };
      }

      // Log audit
      billingSecurityManager.logAudit(
        'invoice',
        invoiceId,
        'delete',
        userId,
        userEmail,
        tenantId,
        invoice.status,
        'cancelled'
      );

      // Update invoice status to cancelled
      const result = await invoiceAPI.updateInvoice(invoiceId, { status: 'cancelled' });

      return {
        success: result.success,
        invoice: result.data,
        error: result.error,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        invoice: null,
        error: error instanceof Error ? error.message : 'Failed to cancel invoice',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // SEND REMINDER EMAIL
  // ============================================

  async sendReminderEmail(
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string,
    customerEmail: string,
    customerName: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get invoice
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found',
        };
      }

      // Check tenant access
      if (!billingSecurityManager.checkTenantAccess(invoice, tenantId)) {
        return {
          success: false,
          error: 'Access denied',
        };
      }

      // Log audit
      billingSecurityManager.logAudit(
        'invoice',
        invoiceId,
        'update',
        userId,
        userEmail,
        tenantId,
        null,
        { action: 'send_reminder_email' }
      );

      // Send email using email template manager
      const { emailTemplateManager } = await import('./email-templates');
      
      const emailResult = await emailTemplateManager.sendPaymentFailedEmail(
        invoice,
        customerName,
        customerEmail
      );

      return {
        success: emailResult.success,
        error: emailResult.errorMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reminder email',
      };
    }
  }

  // ============================================
  // BULK RETRY PAYMENTS
  // ============================================

  async bulkRetryPayments(
    invoiceIds: string[],
    userId: string,
    userEmail: string,
    tenantId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const invoiceId of invoiceIds) {
      const result = await this.retryPayment(invoiceId, userId, userEmail, tenantId);

      if (result.success) {
        success++;
      } else {
        failed++;
        if (result.error) {
          errors.push(`${invoiceId}: ${result.error}`);
        }
      }
    }

    return { success, failed, errors };
  }
}

// Export singleton instance
export const invoiceActionsManager = new InvoiceActionsManager();

// ============================================
// REACT HOOK FOR INVOICE ACTIONS
// ============================================

import { useCallback } from 'react';

export function useInvoiceActions() {
  const retryPayment = useCallback((
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string
  ) => {
    return invoiceActionsManager.retryPayment(invoiceId, userId, userEmail, tenantId);
  }, []);

  const markAsPaid = useCallback((
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string,
    paymentDate?: string
  ) => {
    return invoiceActionsManager.markAsPaid(invoiceId, userId, userEmail, tenantId, paymentDate);
  }, []);

  const downloadPDF = useCallback((
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string
  ) => {
    return invoiceActionsManager.downloadPDF(invoiceId, userId, userEmail, tenantId);
  }, []);

  const cancelInvoice = useCallback((
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string
  ) => {
    return invoiceActionsManager.cancelInvoice(invoiceId, userId, userEmail, tenantId);
  }, []);

  const sendReminderEmail = useCallback((
    invoiceId: string,
    userId: string,
    userEmail: string,
    tenantId: string,
    customerEmail: string,
    customerName: string
  ) => {
    return invoiceActionsManager.sendReminderEmail(
      invoiceId,
      userId,
      userEmail,
      tenantId,
      customerEmail,
      customerName
    );
  }, []);

  const bulkRetryPayments = useCallback((
    invoiceIds: string[],
    userId: string,
    userEmail: string,
    tenantId: string
  ) => {
    return invoiceActionsManager.bulkRetryPayments(invoiceIds, userId, userEmail, tenantId);
  }, []);

  return {
    retryPayment,
    markAsPaid,
    downloadPDF,
    cancelInvoice,
    sendReminderEmail,
    bulkRetryPayments,
  };
}
