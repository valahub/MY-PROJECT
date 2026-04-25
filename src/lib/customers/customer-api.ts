// Customer API Client with Zod Validation
// Strict API contracts for customer operations

import { z } from 'zod';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerSearchFilters, CustomerSearchResult, CustomerAnalytics } from './customer-types';

// ============================================
// ZOD SCHEMAS
// ============================================

const CustomerStatusSchema = z.enum(['active', 'inactive', 'blocked']);

const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  country: z.string(),
  status: CustomerStatusSchema,
  totalSpent: z.number(),
  ltv: z.number(),
  activeSubscriptions: z.number(),
  churnRiskScore: z.number().min(0).max(100),
  fraudRiskScore: z.number().min(0).max(100),
  lastActiveAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tenantId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const CreateCustomerRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.string(),
  tenantId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const UpdateCustomerRequestSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  status: CustomerStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

const CustomerSearchFiltersSchema = z.object({
  query: z.string().optional(),
  status: CustomerStatusSchema.optional(),
  country: z.string().optional(),
  minLTV: z.number().optional(),
  maxLTV: z.number().optional(),
  minChurnRisk: z.number().min(0).max(100).optional(),
  maxChurnRisk: z.number().min(0).max(100).optional(),
  minFraudRisk: z.number().min(0).max(100).optional(),
  maxFraudRisk: z.number().min(0).max(100).optional(),
  sortBy: z.enum(['name', 'email', 'ltv', 'churn_risk', 'fraud_risk', 'created_at', 'last_active']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

const CustomerAnalyticsSchema = z.object({
  totalCustomers: z.number(),
  activeCustomers: z.number(),
  inactiveCustomers: z.number(),
  blockedCustomers: z.number(),
  averageLTV: z.number(),
  totalRevenue: z.number(),
  churnRate: z.number(),
  newCustomersThisMonth: z.number(),
  churnedCustomersThisMonth: z.number(),
});

const ApiResponseSchema = <T>(dataSchema: z.ZodType<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.string().optional(),
});

// ============================================
// CUSTOMER API CLIENT
// ============================================

export class CustomerAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/customers') {
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
  // GET CUSTOMER BY ID
  // ============================================

  async getCustomer(customerId: string): Promise<{ success: boolean; data: Customer | null; error: string | null }> {
    return this.fetchWithRetry(`/customers/${customerId}`, {}, CustomerSchema);
  }

  // ============================================
  // GET CUSTOMER BY EMAIL
  // ============================================

  async getCustomerByEmail(email: string, tenantId: string): Promise<{ success: boolean; data: Customer | null; error: string | null }> {
    return this.fetchWithRetry(`/customers/by-email?email=${encodeURIComponent(email)}&tenantId=${tenantId}`, {}, CustomerSchema);
  }

  // ============================================
  // GET ALL CUSTOMERS
  // ============================================

  async getAllCustomers(tenantId: string): Promise<{ success: boolean; data: Customer[] | null; error: string | null }> {
    return this.fetchWithRetry(`/customers?tenantId=${tenantId}`, {}, z.array(CustomerSchema));
  }

  // ============================================
  // SEARCH CUSTOMERS
  // ============================================

  async searchCustomers(filters: CustomerSearchFilters, tenantId: string): Promise<{ success: boolean; data: CustomerSearchResult | null; error: string | null }> {
    const validatedFilters = CustomerSearchFiltersSchema.parse(filters);

    const queryParams = new URLSearchParams({
      tenantId,
      ...(validatedFilters.query && { q: validatedFilters.query }),
      ...(validatedFilters.status && { status: validatedFilters.status }),
      ...(validatedFilters.country && { country: validatedFilters.country }),
      ...(validatedFilters.minLTV !== undefined && { minLTV: validatedFilters.minLTV.toString() }),
      ...(validatedFilters.maxLTV !== undefined && { maxLTV: validatedFilters.maxLTV.toString() }),
      ...(validatedFilters.minChurnRisk !== undefined && { minChurnRisk: validatedFilters.minChurnRisk.toString() }),
      ...(validatedFilters.maxChurnRisk !== undefined && { maxChurnRisk: validatedFilters.maxChurnRisk.toString() }),
      ...(validatedFilters.minFraudRisk !== undefined && { minFraudRisk: validatedFilters.minFraudRisk.toString() }),
      ...(validatedFilters.maxFraudRisk !== undefined && { maxFraudRisk: validatedFilters.maxFraudRisk.toString() }),
      ...(validatedFilters.sortBy && { sortBy: validatedFilters.sortBy }),
      ...(validatedFilters.sortOrder && { sortOrder: validatedFilters.sortOrder }),
      ...(validatedFilters.page !== undefined && { page: validatedFilters.page.toString() }),
      ...(validatedFilters.limit !== undefined && { limit: validatedFilters.limit.toString() }),
    });

    return this.fetchWithRetry(`/customers/search?${queryParams}`, {}, z.object({
      customers: z.array(CustomerSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }));
  }

  // ============================================
  // CREATE CUSTOMER
  // ============================================

  async createCustomer(request: CreateCustomerRequest): Promise<{ success: boolean; data: Customer | null; error: string | null }> {
    const validatedRequest = CreateCustomerRequestSchema.parse(request);

    return this.fetchWithRetry(
      '/customers/create',
      {
        method: 'POST',
        body: JSON.stringify(validatedRequest),
      },
      CustomerSchema
    );
  }

  // ============================================
  // UPDATE CUSTOMER
  // ============================================

  async updateCustomer(customerId: string, request: UpdateCustomerRequest): Promise<{ success: boolean; data: Customer | null; error: string | null }> {
    const validatedRequest = UpdateCustomerRequestSchema.parse(request);

    return this.fetchWithRetry(
      `/customers/${customerId}/update`,
      {
        method: 'POST',
        body: JSON.stringify(validatedRequest),
      },
      CustomerSchema
    );
  }

  // ============================================
  // DELETE CUSTOMER
  // ============================================

  async deleteCustomer(customerId: string): Promise<{ success: boolean; data: Customer | null; error: string | null }> {
    return this.fetchWithRetry(
      `/customers/${customerId}/delete`,
      {
        method: 'POST',
      },
      CustomerSchema
    );
  }

  // ============================================
  // BLOCK CUSTOMER
  // ============================================

  async blockCustomer(customerId: string): Promise<{ success: boolean; data: Customer | null; error: string | null }> {
    return this.fetchWithRetry(
      `/customers/${customerId}/block`,
      {
        method: 'POST',
      },
      CustomerSchema
    );
  }

  // ============================================
  // UNBLOCK CUSTOMER
  // ============================================

  async unblockCustomer(customerId: string): Promise<{ success: boolean; data: Customer | null; error: string | null }> {
    return this.fetchWithRetry(
      `/customers/${customerId}/unblock`,
      {
        method: 'POST',
      },
      CustomerSchema
    );
  }

  // ============================================
  // GET CUSTOMER ANALYTICS
  // ============================================

  async getCustomerAnalytics(tenantId: string): Promise<{ success: boolean; data: CustomerAnalytics | null; error: string | null }> {
    return this.fetchWithRetry(`/customers/analytics?tenantId=${tenantId}`, {}, CustomerAnalyticsSchema);
  }

  // ============================================
  // GET CUSTOMER RELATIONS
  // ============================================

  async getCustomerRelations(customerId: string): Promise<{ success: boolean; data: any | null; error: string | null }> {
    return this.fetchWithRetry(`/customers/${customerId}/relations`, {}, z.object({
      subscriptions: z.array(z.object({
        id: z.string(),
        plan: z.string(),
        status: z.string(),
        amount: z.number(),
        createdAt: z.string(),
      })),
      transactions: z.array(z.object({
        id: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        createdAt: z.string(),
      })),
      licenses: z.array(z.object({
        id: z.string(),
        product: z.string(),
        status: z.string(),
        expiresAt: z.string().nullable(),
      })),
    }));
  }
}

// Export singleton instance
export const customerAPI = new CustomerAPIClient();

// ============================================
// MOCK DATA GENERATION
// ============================================

export function generateMockCustomers(count: number): Customer[] {
  const customers: Customer[] = [];
  const statuses: Customer['status'][] = ['active', 'inactive', 'blocked'];
  const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP'];

  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length];
    const country = countries[i % countries.length];
    const ltv = 50 + (i * 25);
    const activeSubs = status === 'active' ? (i % 3) + 1 : 0;

    customers.push({
      id: `cust_${i}`,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      phone: `+123456789${i}`,
      country,
      status,
      totalSpent: ltv,
      ltv,
      activeSubscriptions: activeSubs,
      churnRiskScore: status === 'inactive' ? 70 + (i % 20) : 10 + (i % 30),
      fraudRiskScore: Math.random() * 20,
      lastActiveAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      createdAt: new Date(Date.now() - (i * 86400000 * 7)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      tenantId: 'tenant_123',
      metadata: {},
    });
  }

  return customers;
}
