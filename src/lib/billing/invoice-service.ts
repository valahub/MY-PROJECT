// Invoice Generation Service
// Auto-generate invoices on billing cycle events

import type { Invoice, CreateInvoiceRequest, InvoiceStatus } from './invoice-types';

// ============================================
// INVOICE SERVICE
// ============================================

export class InvoiceService {
  private invoiceCounter: number = 0;

  // ============================================
  // GENERATE INVOICE NUMBER
  // ============================================

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = String(this.invoiceCounter++).padStart(6, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  // ============================================
  // CREATE INVOICE
  // ============================================

  async createInvoice(request: CreateInvoiceRequest, tenantId: string): Promise<Invoice | null> {
    try {
      const now = new Date().toISOString();
      const invoice: Invoice = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber: this.generateInvoiceNumber(),
        customerId: request.customerId,
        subscriptionId: request.subscriptionId,
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        dueDate: request.dueDate,
        issuedAt: now,
        paidAt: null,
        retryCount: 0,
        lastRetryAt: null,
        tenantId,
        metadata: request.metadata,
        createdAt: now,
        updatedAt: now,
      };

      // In production, save to database
      console.log(`[InvoiceService] Created invoice: ${invoice.invoiceNumber}`, invoice);

      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Failed to create invoice:', error);
      return null;
    }
  }

  // ============================================
  // AUTO GENERATE FROM SUBSCRIPTION
  // ============================================

  async generateFromSubscription(
    subscriptionId: string,
    customerId: string,
    amount: number,
    currency: string,
    tenantId: string
  ): Promise<Invoice | null> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    const request: CreateInvoiceRequest = {
      customerId,
      subscriptionId,
      amount,
      currency,
      dueDate: dueDate.toISOString(),
      description: `Subscription billing for ${subscriptionId}`,
    };

    return this.createInvoice(request, tenantId);
  }

  // ============================================
  // MARK AS PAID
  // ============================================

  async markAsPaid(invoiceId: string, paymentDate?: string): Promise<Invoice | null> {
    try {
      // In production, fetch from database and update
      const invoice: Invoice = {
        id: invoiceId,
        invoiceNumber: 'INV-202604-000001',
        customerId: 'cust_123',
        subscriptionId: 'sub_123',
        amount: 100,
        currency: 'USD',
        status: 'paid',
        dueDate: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
        paidAt: paymentDate || new Date().toISOString(),
        retryCount: 0,
        lastRetryAt: null,
        tenantId: 'tenant_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(`[InvoiceService] Marked invoice ${invoiceId} as paid`);
      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Failed to mark invoice as paid:', error);
      return null;
    }
  }

  // ============================================
  // MARK AS FAILED
  // ============================================

  async markAsFailed(invoiceId: string, errorMessage?: string): Promise<Invoice | null> {
    try {
      // In production, fetch from database and update
      const invoice: Invoice = {
        id: invoiceId,
        invoiceNumber: 'INV-202604-000001',
        customerId: 'cust_123',
        subscriptionId: 'sub_123',
        amount: 100,
        currency: 'USD',
        status: 'failed',
        dueDate: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
        paidAt: null,
        retryCount: 1,
        lastRetryAt: new Date().toISOString(),
        tenantId: 'tenant_123',
        metadata: { errorMessage },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(`[InvoiceService] Marked invoice ${invoiceId} as failed`);
      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Failed to mark invoice as failed:', error);
      return null;
    }
  }

  // ============================================
  // MARK AS OVERDUE
  // ============================================

  async markAsOverdue(invoiceId: string): Promise<Invoice | null> {
    try {
      // In production, fetch from database and update
      const invoice: Invoice = {
        id: invoiceId,
        invoiceNumber: 'INV-202604-000001',
        customerId: 'cust_123',
        subscriptionId: 'sub_123',
        amount: 100,
        currency: 'USD',
        status: 'overdue',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        issuedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        paidAt: null,
        retryCount: 2,
        lastRetryAt: new Date().toISOString(),
        tenantId: 'tenant_123',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(`[InvoiceService] Marked invoice ${invoiceId} as overdue`);
      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Failed to mark invoice as overdue:', error);
      return null;
    }
  }

  // ============================================
  // INCREMENT RETRY COUNT
  // ============================================

  async incrementRetryCount(invoiceId: string): Promise<Invoice | null> {
    try {
      // In production, fetch from database and update
      const invoice: Invoice = {
        id: invoiceId,
        invoiceNumber: 'INV-202604-000001',
        customerId: 'cust_123',
        subscriptionId: 'sub_123',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
        paidAt: null,
        retryCount: 1,
        lastRetryAt: new Date().toISOString(),
        tenantId: 'tenant_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log(`[InvoiceService] Incremented retry count for invoice ${invoiceId}`);
      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Failed to increment retry count:', error);
      return null;
    }
  }

  // ============================================
  // GET INVOICE BY ID
  // ============================================

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      // In production, fetch from database
      const invoice: Invoice = {
        id: invoiceId,
        invoiceNumber: 'INV-202604-000001',
        customerId: 'cust_123',
        subscriptionId: 'sub_123',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
        issuedAt: new Date().toISOString(),
        paidAt: null,
        retryCount: 0,
        lastRetryAt: null,
        tenantId: 'tenant_123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Failed to get invoice:', error);
      return null;
    }
  }

  // ============================================
  // GET INVOICES BY CUSTOMER
  // ============================================

  async getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    try {
      // In production, fetch from database
      const invoices: Invoice[] = [
        {
          id: 'inv_1',
          invoiceNumber: 'INV-202604-000001',
          customerId,
          subscriptionId: 'sub_123',
          amount: 100,
          currency: 'USD',
          status: 'paid',
          dueDate: new Date(Date.now() - 86400000).toISOString(),
          issuedAt: new Date(Date.now() - 172800000).toISOString(),
          paidAt: new Date(Date.now() - 86400000).toISOString(),
          retryCount: 0,
          lastRetryAt: null,
          tenantId: 'tenant_123',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      return invoices;
    } catch (error) {
      console.error('[InvoiceService] Failed to get customer invoices:', error);
      return [];
    }
  }

  // ============================================
  // GET OVERDUE INVOICES
  // ============================================

  async getOverdueInvoices(tenantId: string): Promise<Invoice[]> {
    try {
      // In production, fetch from database where dueDate < now AND status != paid
      const invoices: Invoice[] = [
        {
          id: 'inv_2',
          invoiceNumber: 'INV-202604-000002',
          customerId: 'cust_456',
          subscriptionId: 'sub_456',
          amount: 150,
          currency: 'USD',
          status: 'overdue',
          dueDate: new Date(Date.now() - 86400000).toISOString(),
          issuedAt: new Date(Date.now() - 172800000).toISOString(),
          paidAt: null,
          retryCount: 2,
          lastRetryAt: new Date().toISOString(),
          tenantId,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      return invoices;
    } catch (error) {
      console.error('[InvoiceService] Failed to get overdue invoices:', error);
      return [];
    }
  }

  // ============================================
  // GET FAILED INVOICES
  // ============================================

  async getFailedInvoices(tenantId: string): Promise<Invoice[]> {
    try {
      // In production, fetch from database where status = failed
      const invoices: Invoice[] = [
        {
          id: 'inv_3',
          invoiceNumber: 'INV-202604-000003',
          customerId: 'cust_789',
          subscriptionId: 'sub_789',
          amount: 200,
          currency: 'USD',
          status: 'failed',
          dueDate: new Date(Date.now() - 259200000).toISOString(),
          issuedAt: new Date(Date.now() - 345600000).toISOString(),
          paidAt: null,
          retryCount: 3,
          lastRetryAt: new Date().toISOString(),
          tenantId,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      return invoices;
    } catch (error) {
      console.error('[InvoiceService] Failed to get failed invoices:', error);
      return [];
    }
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
