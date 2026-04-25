// Pricing Data Models with Versioning
// Core data structures for the self-healing pricing engine

// ============================================
// PRICING STATUS
// ============================================

export type PricingStatus = 'Active' | 'Draft' | 'Archived';

export interface PricingStatusConfig {
  visibleToCheckout: boolean;
  editable: boolean;
  deletable: boolean;
  description: string;
}

export const PRICING_STATUS_CONFIG: Record<PricingStatus, PricingStatusConfig> = {
  Active: {
    visibleToCheckout: true,
    editable: true,
    deletable: false,
    description: 'Plan is active and available for checkout',
  },
  Draft: {
    visibleToCheckout: false,
    editable: true,
    deletable: true,
    description: 'Plan is in draft mode, not visible to users',
  },
  Archived: {
    visibleToCheckout: false,
    editable: false,
    deletable: false,
    description: 'Plan is archived and read-only',
  },
};

// ============================================
// BILLING CYCLE
// ============================================

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

// ============================================
// PLAN VERSION
// ============================================

export interface PlanVersion {
  version: string; // v1, v2, v3
  price: number;
  trialDays: number;
  billingCycle: BillingCycle;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// PRICING PLAN
// ============================================

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  status: PricingStatus;
  currentVersion: string;
  versions: PlanVersion[];
  features: string[];
  limits?: {
    users?: number;
    storage?: number;
    apiCalls?: number;
    [key: string]: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  merchantId: string;
}

// ============================================
// PLAN CHANGE REQUEST
// ============================================

export interface PlanChangeRequest {
  planId?: string;
  name?: string;
  description?: string;
  status?: PricingStatus;
  price?: number;
  trialDays?: number;
  billingCycle?: BillingCycle;
  features?: string[];
  limits?: Record<string, number>;
  metadata?: Record<string, unknown>;
}

// ============================================
// DEPENDENCY CHECK RESULT
// ============================================

export interface DependencyCheckResult {
  canDelete: boolean;
  canEdit: boolean;
  hasActiveSubscriptions: boolean;
  activeSubscriptionCount: number;
  hasPendingInvoices: boolean;
  pendingInvoiceCount: number;
  hasTrialUsers: boolean;
  trialUserCount: number;
  blockingReason?: string;
}

// ============================================
// AUDIT LOG ENTRY
// ============================================

export type AuditAction = 'created' | 'updated' | 'archived' | 'restored' | 'version_created';

export interface PricingAuditLog {
  id: string;
  planId: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  oldValues?: Partial<PricingPlan>;
  newValues?: Partial<PricingPlan>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// PRICING ANALYTICS
// ============================================

export interface PricingAnalytics {
  planId: string;
  conversionRate: number;
  churnRate: number;
  revenuePerPlan: number;
  activeSubscriptions: number;
  trialConversions: number;
  averageLifetimeValue: number;
  period: {
    start: string;
    end: string;
  };
}

// ============================================
// PRICING SUGGESTION
// ============================================

export type SuggestionType = 'price_increase' | 'price_decrease' | 'trial_extension' | 'trial_reduction' | 'feature_addition';

export interface PricingSuggestion {
  type: SuggestionType;
  planId: string;
  currentValue: number;
  suggestedValue: number;
  confidence: number; // 0-1
  reason: string;
  expectedImpact: {
    revenueChange: number;
    conversionChange: number;
  };
}

// ============================================
// A/B TEST VARIANT
// ============================================

export interface ABTestVariant {
  id: string;
  name: string;
  price: number;
  trialDays: number;
  trafficAllocation: number; // 0-1 percentage
  conversions: number;
  views: number;
  conversionRate: number;
  revenue: number;
}

export interface ABTest {
  id: string;
  planId: string;
  name: string;
  status: 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
  startDate: string;
  endDate?: string;
  winner?: string; // variant ID
  createdAt: string;
  createdBy: string;
}

// ============================================
// VALIDATION RESULT
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ============================================
// PRICING EVENT
// ============================================

export type PricingEventType = 'pricing.created' | 'pricing.updated' | 'pricing.archived' | 'pricing.restored' | 'pricing.version_created' | 'pricing.sync.checkout' | 'pricing.sync.subscriptions' | 'pricing.sync.invoices';

export interface PricingEvent {
  type: PricingEventType;
  planId: string;
  data: {
    plan: PricingPlan;
    oldPlan?: PricingPlan;
  };
  timestamp: string;
  userId: string;
}
