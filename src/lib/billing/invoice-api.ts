// Invoice API Client with Zod Validation
// Strict API contracts for invoice and dunning operations

import { z } from 'zod';
import type { Invoice, CreateInvoiceRequest, UpdateInvoiceRequest, InvoiceAnalytics, DunningTimeline, DunningRetryResult } from './invoice-types';

// ============================================
// ZOD SCHEMAS
// ============================================

const InvoiceStatusSchema = z.enum(['paid', 'pending', 'failed', 'overdue', 'cancelled']);

const InvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerId: z.string(),
  subscriptionId: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: InvoiceStatusSchema,
  dueDate: z.string(),
  issuedAt: z.string(),
  paidAt: z.string().nullable(),
  retryCount: z.number(),
  lastRetryAt: z.string().nullable(),
  tenantId: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateInvoiceRequestSchema = z.object({
  customerId: z.string(),
  subscriptionId: z.string().nullable(),
  amount: z.number().positive(),
  currency: z.string(),
  dueDate: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const UpdateInvoiceRequestSchema = z.object({
  status: InvoiceStatusSchema.optional(),
  paidAt: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const InvoiceAnalyticsSchema = z.object({
  totalInvoices: z.number(),
  paidInvoices: z.number(),
  failedInvoices: z.number(),
  overdueInvoices: z.number(),
  pendingInvoices: z.number(),
  totalRevenue: z.number(),
  recoveredRevenue: z.number(),
  lostRevenue: z.number(),
  recoveryRate: z.number(),
  averagePaymentTime: z.number(),
});

const DunningTimelineSchema = z.object({
  invoiceId: z.string(),
  customerId: z.string(),
  logs: z.array(z.object({
    id: z.string(),
    invoiceId: z.string(),
    customerId: z.string(),
    attemptNumber: z.number(),
    action: z.enum(['email', 'retry', 'suspend', 'downgrade', 'cancel']),
    status: z.enum(['success', 'failed', 'pending', 'skipped']),
    timestamp: z.string(),
    errorMessage: z.string().nullable(),
    metadata: z.record(z.unknown()).optional(),
  })),
  currentAttempt: z.number(),
  nextAction: z.enum(['email', 'retry', 'suspend', 'downgrade', 'cancel']).optional(),
  nextActionAt: z.string().optional(),
  estimatedRecoveryDate: z.string().optional(),
});

const ApiResponseSchema = <T>(dataSchema: z.ZodType<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.string().optional(),
});

// ============================================
// INVOICE API CLIENT
// ============================================

export class InvoiceAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/billing') {
    this.baseUrl = baseUrl;
  }

  // ============================================
  // FETCH WITH RETRY
  // ============================================

  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    schema: z.ZodType<T>,
    maxRetries: number = 3
  ): Promise<{ success: boolean; data: T | null; error: string | null }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        const data = await response.json();

        // Validate with Zod
        const validatedData = ApiResponseSchema(schema).parse(data);

        if (validatedData.success && validatedData.data) {
          return {
            success: true,
            data: validatedData.data,
            error: null,
          };
        } else {
          return {
            success: false,
            data: null,
            error: validatedData.error || 'Request failed',
          };
        }
      } catch (error) {
        lastError = error as Error;
        
        // Exponential backoff
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    return {
      success: false,
      data: null,
      error: lastError?.message || 'Request failed after retries',
    };
  }

  // ============================================
  // GET INVOICE
  // ============================================

  async getInvoice(invoiceId: string): Promise<{ success: boolean; data: Invoice | null; error: string | null }> {
    return this.fetchWithRetry(`/invoices/${invoiceId}`, {}, InvoiceSchema);
  }

  // ============================================
  // GET INVOICES BY CUSTOMER
  // ============================================

  async getInvoicesByCustomer(customerId: string): Promise<{ success: boolean; data: Invoice[] | null; error: string | null }> {
    return this.fetchWithRetry(`/invoices/customer/${customerId}`, {}, z.array(InvoiceSchema));
  }

  // ============================================
  // GET OVERDUE INVOICES
  // ============================================

  async getOverdueInvoices(tenantId: string): Promise<{ success: boolean; data: Invoice[] | null; error: string | null }> {
    return this.fetchWithRetry(`/invoices/overdue?tenantId=${tenantId}`, {}, z.array(InvoiceSchema));
  }

  // ============================================
  // GET FAILED INVOICES
  // ============================================

  async getFailedInvoices(tenantId: string): Promise<{ success: boolean; data: Invoice[] | null; error: string | null }> {
    return this.fetchWithRetry(`/invoices/failed?tenantId=${tenantId}`, {}, z.array(InvoiceSchema));
  }

  // ============================================
  // GET ALL INVOICES
  // ============================================

  async getAllInvoices(tenantId: string): Promise<{ success: boolean; data: Invoice[] | null; error: string | null }> {
    return this.fetchWithRetry(`/invoices?tenantId=${tenantId}`, {}, z.array(InvoiceSchema));
  }

  // ============================================
  // CREATE INVOICE
  // ============================================

  async createInvoice(request: CreateInvoiceRequest, tenantId: string): Promise<{ success: boolean; data: Invoice | null; error: string | null }> {
    const validatedRequest = CreateInvoiceRequestSchema.parse(request);

    return this.fetchWithRetry(
      '/invoices/create',
      {
        method: 'POST',
        body: JSON.stringify({ ...validatedRequest, tenantId }),
      },
      InvoiceSchema
    );
  }

  // ============================================
  // UPDATE INVOICE
  // ============================================

  async updateInvoice(invoiceId: string, request: UpdateInvoiceRequest): Promise<{ success: boolean; data: Invoice | null; error: string | null }> {
    const validatedRequest = UpdateInvoiceRequestSchema.parse(request);

    return this.fetchWithRetry(
      `/invoices/${invoiceId}/update`,
      {
        method: 'POST',
        body: JSON.stringify(validatedRequest),
      },
      InvoiceSchema
    );
  }

  // ============================================
  // MARK INVOICE AS PAID
  // ============================================

  async markInvoiceAsPaid(invoiceId: string, paymentDate?: string): Promise<{ success: boolean; data: Invoice | null; error: string | null }> {
    return this.fetchWithRetry(
      `/invoices/${invoiceId}/mark-paid`,
      {
        method: 'POST',
        body: JSON.stringify({ paidAt: paymentDate || new Date().toISOString() }),
      },
      InvoiceSchema
    );
  }

  // ============================================
  // RETRY PAYMENT
  // ============================================

  async retryPayment(invoiceId: string): Promise<{ success: boolean; data: Invoice | null; error: string | null }> {
    return this.fetchWithRetry(
      `/invoices/${invoiceId}/retry`,
      {
        method: 'POST',
      },
      InvoiceSchema
    );
  }

  // ============================================
  // GET DUNNING TIMELINE
  // ============================================

  async getDunningTimeline(invoiceId: string): Promise<{ success: boolean; data: DunningTimeline | null; error: string | null }> {
    return this.fetchWithRetry(`/dunning/timeline/${invoiceId}`, {}, DunningTimelineSchema);
  }

  // ============================================
  // GET INVOICE ANALYTICS
  // ============================================

  async getInvoiceAnalytics(tenantId: string): Promise<{ success: boolean; data: InvoiceAnalytics | null; error: string | null }> {
    return this.fetchWithRetry(`/invoices/analytics?tenantId=${tenantId}`, {}, InvoiceAnalyticsSchema);
  }

  // ============================================
  // PROCESS DUNNING (CRON)
  // ============================================

  async processDunning(tenantId: string): Promise<{ success: boolean; data: { processed: number; recovered: number; failed: number } | null; error: string | null }> {
    return this.fetchWithRetry(
      `/dunning/process?tenantId=${tenantId}`,
      {
        method: 'POST',
      },
      z.object({
        processed: z.number(),
        recovered: z.number(),
        failed: z.number(),
      })
    );
  }

  // ============================================
  // DOWNLOAD INVOICE PDF
  // ============================================

  async downloadInvoicePDF(invoiceId: string): Promise<{ success: boolean; data: Blob | null; error: string | null }> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices/${invoiceId}/pdf`);

      if (!response.ok) {
        return {
          success: false,
          data: null,
          error: `Failed to download PDF: ${response.statusText}`,
        };
      }

      const blob = await response.blob();

      return {
        success: true,
        data: blob,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to download PDF',
      };
    }
  }
}

// Export singleton instance
export const invoiceAPI = new InvoiceAPIClient();

// ============================================
// MOCK DATA GENERATION
// ============================================

export function generateMockInvoices(count: number): Invoice[] {
  const invoices: Invoice[] = [];
  const statuses: Invoice['status'][] = ['paid', 'pending', 'failed', 'overdue'];

  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length];
    const now = new Date();
    const issuedAt = new Date(now.getTime() - (i * 86400000)).toISOString();
    const dueDate = new Date(now.getTime() - (i * 86400000) + 604800000).toISOString();

    invoices.push({
      id: `inv_${i}`,
      invoiceNumber: `INV-202604-${String(i + 1).padStart(6, '0')}`,
      customerId: `cust_${(i % 3) + 1}`,
      subscriptionId: `sub_${i}`,
      amount: 50 + (i * 25),
      currency: 'USD',
      status,
      dueDate,
      issuedAt,
      paidAt: status === 'paid' ? new Date(now.getTime() - (i * 86400000) + 172800000).toISOString() : null,
      retryCount: status === 'failed' ? i + 1 : 0,
      lastRetryAt: status === 'failed' ? new Date().toISOString() : null,
      tenantId: 'tenant_123',
      metadata: {},
      createdAt: issuedAt,
      updatedAt: new Date().toISOString(),
    });
  }

  return invoices;
}
