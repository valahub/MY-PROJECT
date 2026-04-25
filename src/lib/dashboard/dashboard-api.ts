// Dashboard API Layer - Strict Response Format
// All API responses follow this format:
// { success: true, data: {}, meta: {}, error: null }

import { z } from 'zod';

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

export const DashboardMetricsSchema = z.object({
  mrr: z.number(),
  arr: z.number(),
  activeSubscriptions: z.number(),
  churnRate: z.number(),
  revenue: z.number(),
  refunds: z.number(),
  netRevenue: z.number(),
  ltv: z.number(),
  cac: z.number(),
  ltvCacRatio: z.number(),
});

export const RevenueDataSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  refunds: z.number(),
  netRevenue: z.number(),
});

export const SubscriptionDataSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  plan: z.string(),
  status: z.enum(['active', 'canceled', 'past_due']),
  amount: z.number(),
  currency: z.string(),
  startDate: z.string(),
  nextBillingDate: z.string(),
});

export const AlertSchema = z.object({
  id: z.string(),
  type: z.enum(['revenue', 'churn', 'payment', 'system']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  message: z.string(),
  timestamp: z.string(),
  actionRequired: z.boolean(),
  actionUrl: z.string().optional(),
});

// Strict API Response Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string(),
    cached: z.boolean().optional(),
  }),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }).nullable(),
});

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    cached?: boolean;
  };
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
}

export interface DashboardMetricsResponse extends ApiResponse {
  data: z.infer<typeof DashboardMetricsSchema>;
}

export interface RevenueDataResponse extends ApiResponse {
  data: z.infer<typeof RevenueDataSchema>[];
}

export interface SubscriptionDataResponse extends ApiResponse {
  data: z.infer<typeof SubscriptionDataSchema>[];
}

export interface AlertsResponse extends ApiResponse {
  data: z.infer<typeof AlertSchema>[];
}

// ============================================
// API CLIENT WITH RETRY AND SELF-HEALING
// ============================================

class DashboardAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private retryConfig: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };

  constructor() {
    this.baseURL = '/api/dashboard';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    };
  }

  // Generic fetch with retry and error handling
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.retryConfig.maxRetries) {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            ...this.defaultHeaders,
            ...options.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();

        // Validate response structure
        const validatedResponse = ApiResponseSchema.parse(json);

        // Validate data if schema provided
        if (schema && validatedResponse.data) {
          validatedResponse.data = schema.parse(validatedResponse.data);
        }

        return validatedResponse as ApiResponse<T>;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt < this.retryConfig.maxRetries) {
          // Exponential backoff
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - return error response
    return {
      success: false,
      data: null as T,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      },
      error: {
        code: 'FETCH_ERROR',
        message: lastError?.message || 'Unknown error',
        details: { attempts: attempt },
      },
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // DASHBOARD METRICS API
  // ============================================

  async getMetrics(): Promise<DashboardMetricsResponse> {
    return this.fetchWithRetry<z.infer<typeof DashboardMetricsSchema>>(
      '/metrics',
      { method: 'GET' },
      DashboardMetricsSchema
    );
  }

  // ============================================
  // REVENUE DATA API
  // ============================================

  async getRevenue(params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'daily' | 'weekly' | 'monthly';
  }): Promise<RevenueDataResponse> {
    const queryString = params
      ? `?${new URLSearchParams(params as Record<string, string>)}`
      : '';
    return this.fetchWithRetry<z.infer<typeof RevenueDataSchema>[]>(
      `/revenue${queryString}`,
      { method: 'GET' },
      z.array(RevenueDataSchema)
    );
  }

  // ============================================
  // SUBSCRIPTIONS API
  // ============================================

  async getSubscriptions(params?: {
    status?: 'active' | 'canceled' | 'past_due';
    limit?: number;
    offset?: number;
  }): Promise<SubscriptionDataResponse> {
    const queryString = params
      ? `?${new URLSearchParams(params as Record<string, string>)}`
      : '';
    return this.fetchWithRetry<z.infer<typeof SubscriptionDataSchema>[]>(
      `/subscriptions${queryString}`,
      { method: 'GET' },
      z.array(SubscriptionDataSchema)
    );
  }

  // ============================================
  // ALERTS API
  // ============================================

  async getAlerts(params?: {
    type?: 'revenue' | 'churn' | 'payment' | 'system';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
  }): Promise<AlertsResponse> {
    const queryString = params
      ? `?${new URLSearchParams(params as Record<string, string>)}`
      : '';
    return this.fetchWithRetry<z.infer<typeof AlertSchema>[]>(
      `/alerts${queryString}`,
      { method: 'GET' },
      z.array(AlertSchema)
    );
  }

  // ============================================
  // MOCK DATA GENERATION (FOR DEVELOPMENT)
  // ============================================

  private generateMockMetrics() {
    return {
      mrr: 125000,
      arr: 1500000,
      activeSubscriptions: 842,
      churnRate: 0.025,
      revenue: 145000,
      refunds: 3200,
      netRevenue: 141800,
      ltv: 4800,
      cac: 1200,
      ltvCacRatio: 4.0,
    };
  }

  private generateMockRevenueData() {
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const revenue = 4000 + Math.random() * 2000;
      const refunds = revenue * 0.02 + Math.random() * 100;
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(revenue),
        refunds: Math.round(refunds),
        netRevenue: Math.round(revenue - refunds),
      });
    }
    return data;
  }

  private generateMockSubscriptions() {
    const statuses = ['active', 'active', 'active', 'canceled', 'past_due'] as const;
    const plans = ['Basic', 'Pro', 'Enterprise'];
    const data = [];
    for (let i = 0; i < 10; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90));
      const nextBilling = new Date(startDate);
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      data.push({
        id: `sub_${i}`,
        customerName: `Customer ${i + 1}`,
        plan,
        status,
        amount: plan === 'Basic' ? 29 : plan === 'Pro' ? 99 : 299,
        currency: 'USD',
        startDate: startDate.toISOString(),
        nextBillingDate: nextBilling.toISOString(),
      });
    }
    return data;
  }

  private generateMockAlerts() {
    const types = ['revenue', 'churn', 'payment', 'system'] as const;
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    const data = [];
    for (let i = 0; i < 5; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      data.push({
        id: `alert_${i}`,
        type,
        severity,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Alert ${i + 1}`,
        message: `This is a ${severity} ${type} alert that requires attention.`,
        timestamp: new Date().toISOString(),
        actionRequired: severity === 'high' || severity === 'critical',
        actionUrl: severity === 'high' || severity === 'critical' ? `/dashboard/alerts/${i}` : undefined,
      });
    }
    return data;
  }

  // Mock API methods (use when backend is not available)
  async getMetricsMock(): Promise<DashboardMetricsResponse> {
    return {
      success: true,
      data: this.generateMockMetrics(),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        cached: false,
      },
      error: null,
    };
  }

  async getRevenueMock(): Promise<RevenueDataResponse> {
    return {
      success: true,
      data: this.generateMockRevenueData(),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        cached: false,
      },
      error: null,
    };
  }

  async getSubscriptionsMock(): Promise<SubscriptionDataResponse> {
    return {
      success: true,
      data: this.generateMockSubscriptions(),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        cached: false,
      },
      error: null,
    };
  }

  async getAlertsMock(): Promise<AlertsResponse> {
    return {
      success: true,
      data: this.generateMockAlerts(),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        cached: false,
      },
      error: null,
    };
  }
}

// Export singleton instance
export const dashboardAPI = new DashboardAPIClient();
