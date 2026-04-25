// Pricing API Client with Zod Validation
// Strict API response format with validation

import { z } from 'zod';
import type {
  PricingPlan,
  PlanChangeRequest,
  DependencyCheckResult,
  PricingAuditLog,
  PricingAnalytics,
  PricingSuggestion,
  ABTest,
  ValidationResult,
  PricingStatus,
  BillingCycle,
} from './pricing-types';

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

// API Response Schema
export const ApiResponseSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().nullable().optional(),
    meta: z
      .object({
        timestamp: z.string().optional(),
        requestId: z.string().optional(),
      })
      .optional(),
  });

// Pricing Plan Schema
const PlanVersionSchema = z.object({
  version: z.string(),
  price: z.number().positive(),
  trialDays: z.number().nonnegative(),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly', 'quarterly']),
  createdAt: z.string(),
  createdBy: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const PricingPlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['Active', 'Draft', 'Archived']),
  currentVersion: z.string(),
  versions: z.array(PlanVersionSchema),
  features: z.array(z.string()),
  limits: z.record(z.number()).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  merchantId: z.string(),
});

// Plan Change Request Schema
export const PlanChangeRequestSchema = z.object({
  planId: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['Active', 'Draft', 'Archived']).optional(),
  price: z.number().positive().optional(),
  trialDays: z.number().nonnegative().optional(),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly', 'quarterly']).optional(),
  features: z.array(z.string()).optional(),
  limits: z.record(z.number()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Dependency Check Result Schema
export const DependencyCheckResultSchema = z.object({
  canDelete: z.boolean(),
  canEdit: z.boolean(),
  hasActiveSubscriptions: z.boolean(),
  activeSubscriptionCount: z.number(),
  hasPendingInvoices: z.boolean(),
  pendingInvoiceCount: z.number(),
  hasTrialUsers: z.boolean(),
  trialUserCount: z.number(),
  blockingReason: z.string().optional(),
});

// Audit Log Schema
export const PricingAuditLogSchema = z.object({
  id: z.string(),
  planId: z.string(),
  action: z.enum(['created', 'updated', 'archived', 'restored', 'version_created']),
  userId: z.string(),
  userEmail: z.string(),
  oldValues: z.record(z.unknown()).optional(),
  newValues: z.record(z.unknown()).optional(),
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

// Analytics Schema
export const PricingAnalyticsSchema = z.object({
  planId: z.string(),
  conversionRate: z.number(),
  churnRate: z.number(),
  revenuePerPlan: z.number(),
  activeSubscriptions: z.number(),
  trialConversions: z.number(),
  averageLifetimeValue: z.number(),
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

// Pricing Suggestion Schema
export const PricingSuggestionSchema = z.object({
  type: z.enum(['price_increase', 'price_decrease', 'trial_extension', 'trial_reduction', 'feature_addition']),
  planId: z.string(),
  currentValue: z.number(),
  suggestedValue: z.number(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  expectedImpact: z.object({
    revenueChange: z.number(),
    conversionChange: z.number(),
  }),
});

// A/B Test Schema
const ABTestVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  trialDays: z.number().nonnegative(),
  trafficAllocation: z.number().min(0).max(1),
  conversions: z.number(),
  views: z.number(),
  conversionRate: z.number(),
  revenue: z.number(),
});

export const ABTestSchema = z.object({
  id: z.string(),
  planId: z.string(),
  name: z.string(),
  status: z.enum(['running', 'paused', 'completed']),
  variants: z.array(ABTestVariantSchema),
  startDate: z.string(),
  endDate: z.string().optional(),
  winner: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string(),
});

// Validation Result Schema
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      code: z.string(),
    })
  ),
  warnings: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      code: z.string(),
    })
  ),
});

// ============================================
// API CLIENT CLASS
// ============================================

export class PricingAPIClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api/pricing') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = localStorage.getItem('auth_token');
    return token
      ? {
          ...this.defaultHeaders,
          Authorization: `Bearer ${token}`,
        }
      : this.defaultHeaders;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: await this.getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  // ============================================
  // PLAN OPERATIONS
  // ============================================

  async getPlans(): Promise<{ success: boolean; data: PricingPlan[]; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans`);
      const validated = ApiResponseSchema(z.array(PricingPlanSchema)).parse(response);
      return {
        success: validated.success,
        data: validated.data || [],
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch plans',
      };
    }
  }

  async getPlan(planId: string): Promise<{ success: boolean; data: PricingPlan | null; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}`);
      const validated = ApiResponseSchema(PricingPlanSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch plan',
      };
    }
  }

  async createPlan(request: PlanChangeRequest): Promise<{ success: boolean; data: PricingPlan | null; error: string | null }> {
    try {
      const validatedRequest = PlanChangeRequestSchema.parse(request);
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/create`, {
        method: 'POST',
        body: JSON.stringify(validatedRequest),
      });
      const validated = ApiResponseSchema(PricingPlanSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create plan',
      };
    }
  }

  async updatePlan(planId: string, request: PlanChangeRequest): Promise<{ success: boolean; data: PricingPlan | null; error: string | null }> {
    try {
      const validatedRequest = PlanChangeRequestSchema.parse(request);
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}/update`, {
        method: 'PUT',
        body: JSON.stringify(validatedRequest),
      });
      const validated = ApiResponseSchema(PricingPlanSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update plan',
      };
    }
  }

  async archivePlan(planId: string): Promise<{ success: boolean; data: PricingPlan | null; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}/archive`, {
        method: 'POST',
      });
      const validated = ApiResponseSchema(PricingPlanSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to archive plan',
      };
    }
  }

  async restorePlan(planId: string): Promise<{ success: boolean; data: PricingPlan | null; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}/restore`, {
        method: 'POST',
      });
      const validated = ApiResponseSchema(PricingPlanSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to restore plan',
      };
    }
  }

  // ============================================
  // DEPENDENCY CHECK
  // ============================================

  async checkDependencies(planId: string): Promise<{ success: boolean; data: DependencyCheckResult | null; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}/check-dependencies`);
      const validated = ApiResponseSchema(DependencyCheckResultSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to check dependencies',
      };
    }
  }

  // ============================================
  // VALIDATION
  // ============================================

  async validatePlan(request: PlanChangeRequest): Promise<{ success: boolean; data: ValidationResult | null; error: string | null }> {
    try {
      const validatedRequest = PlanChangeRequestSchema.parse(request);
      const response = await this.fetchWithRetry(`${this.baseUrl}/validate`, {
        method: 'POST',
        body: JSON.stringify(validatedRequest),
      });
      const validated = ApiResponseSchema(ValidationResultSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to validate plan',
      };
    }
  }

  // ============================================
  // AUDIT LOG
  // ============================================

  async getAuditLogs(planId: string): Promise<{ success: boolean; data: PricingAuditLog[]; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}/audit-logs`);
      const validated = ApiResponseSchema(z.array(PricingAuditLogSchema)).parse(response);
      return {
        success: validated.success,
        data: validated.data || [],
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch audit logs',
      };
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getAnalytics(planId: string, period?: { start: string; end: string }): Promise<{ success: boolean; data: PricingAnalytics | null; error: string | null }> {
    try {
      const url = period
        ? `${this.baseUrl}/plans/${planId}/analytics?start=${period.start}&end=${period.end}`
        : `${this.baseUrl}/plans/${planId}/analytics`;
      const response = await this.fetchWithRetry(url);
      const validated = ApiResponseSchema(PricingAnalyticsSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      };
    }
  }

  async getPricingSuggestions(planId: string): Promise<{ success: boolean; data: PricingSuggestion[]; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}/suggestions`);
      const validated = ApiResponseSchema(z.array(PricingSuggestionSchema)).parse(response);
      return {
        success: validated.success,
        data: validated.data || [],
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch suggestions',
      };
    }
  }

  // ============================================
  // A/B TESTING
  // ============================================

  async getABTests(planId: string): Promise<{ success: boolean; data: ABTest[]; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}/ab-tests`);
      const validated = ApiResponseSchema(z.array(ABTestSchema)).parse(response);
      return {
        success: validated.success,
        data: validated.data || [],
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch A/B tests',
      };
    }
  }

  async createABTest(planId: string, test: Partial<ABTest>): Promise<{ success: boolean; data: ABTest | null; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/plans/${planId}/ab-tests`, {
        method: 'POST',
        body: JSON.stringify(test),
      });
      const validated = ApiResponseSchema(ABTestSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create A/B test',
      };
    }
  }

  async pauseABTest(testId: string): Promise<{ success: boolean; data: ABTest | null; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/ab-tests/${testId}/pause`, {
        method: 'POST',
      });
      const validated = ApiResponseSchema(ABTestSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to pause A/B test',
      };
    }
  }

  async completeABTest(testId: string): Promise<{ success: boolean; data: ABTest | null; error: string | null }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/ab-tests/${testId}/complete`, {
        method: 'POST',
      });
      const validated = ApiResponseSchema(ABTestSchema).parse(response);
      return {
        success: validated.success,
        data: validated.data || null,
        error: validated.error || null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to complete A/B test',
      };
    }
  }
}

// Export singleton instance
export const pricingAPI = new PricingAPIClient();

// ============================================
// MOCK DATA FOR DEVELOPMENT
// ============================================

export function generateMockPlans(count: number = 5): PricingPlan[] {
  const plans: PricingPlan[] = [];

  for (let i = 0; i < count; i++) {
    const status: PricingStatus = i === 0 ? 'Active' : i === 1 ? 'Draft' : 'Archived';
    const billingCycle: BillingCycle = ['monthly', 'yearly', 'weekly'][i % 3] as BillingCycle;

    plans.push({
      id: `plan_${i + 1}`,
      name: `Plan ${i + 1}`,
      description: `Description for plan ${i + 1}`,
      status,
      currentVersion: 'v1',
      versions: [
        {
          version: 'v1',
          price: (i + 1) * 10,
          trialDays: i * 7,
          billingCycle,
          createdAt: new Date().toISOString(),
          createdBy: 'admin',
        },
      ],
      features: [`Feature ${i + 1}`, `Feature ${i + 2}`],
      limits: {
        users: (i + 1) * 10,
        storage: (i + 1) * 100,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
      merchantId: 'merchant_1',
    });
  }

  return plans;
}
