// Merchant Pricing System Types
// MERCHANT DASHBOARD CONTEXT - Merchant-Scoped Pricing Control
// STRICT: merchant_id is MANDATORY for all operations

// ============================================
// MERCHANT ROLE
// ============================================

export type MerchantRole = 'owner' | 'manager' | 'staff';

// ============================================
// CURRENCY
// ============================================

export type MerchantCurrency = 'INR' | 'USD' | 'EUR';

// ============================================
// PRICING INTERVAL
// ============================================

export type PricingInterval = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

// ============================================
// PRICING STATUS
// ============================================

export type PricingStatus = 'active' | 'archived' | 'draft';

// ============================================
// MERCHANT PRICING PLAN
// ============================================

export interface MerchantPricingPlan {
  id: string;
  merchantId: string; // MANDATORY - Strict tenant isolation
  name: string;
  description: string;
  amount: number;
  currency: MerchantCurrency;
  interval: PricingInterval;
  status: PricingStatus;
  trialDays?: number;
  features: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

// ============================================
// CREATE MERCHANT PRICING REQUEST
// ============================================

export interface CreateMerchantPricingRequest {
  merchantId: string; // MANDATORY
  name: string;
  description: string;
  amount: number;
  currency: MerchantCurrency;
  interval: PricingInterval;
  trialDays?: number;
  features: string[];
  metadata?: Record<string, unknown>;
  userId: string; // Who is creating
  userRole: MerchantRole;
}

// ============================================
// UPDATE MERCHANT PRICING REQUEST
// ============================================

export interface UpdateMerchantPricingRequest {
  merchantId: string; // MANDATORY
  pricingPlanId: string;
  name?: string;
  description?: string;
  amount?: number;
  currency?: MerchantCurrency;
  interval?: PricingInterval;
  trialDays?: number;
  features?: string[];
  metadata?: Record<string, unknown>;
  userId: string;
  userRole: MerchantRole;
}

// ============================================
// ARCHIVE MERCHANT PRICING REQUEST
// ============================================

export interface ArchiveMerchantPricingRequest {
  merchantId: string; // MANDATORY
  pricingPlanId: string;
  userId: string;
  userRole: MerchantRole;
}

// ============================================
// MERCHANT PRICING ANALYTICS
// ============================================

export interface MerchantPricingAnalytics {
  merchantId: string;
  totalPlans: number;
  activePlans: number;
  archivedPlans: number;
  draftPlans: number;
  planWiseRevenue: Array<{
    planId: string;
    planName: string;
    revenue: number;
    currency: MerchantCurrency;
  }>;
  planConversionRate: Array<{
    planId: string;
    planName: string;
    conversionRate: number;
  }>;
  churnPerPlan: Array<{
    planId: string;
    planName: string;
    churnRate: number;
  }>;
  totalMRR: number;
  totalARR: number;
  currency: MerchantCurrency;
}

// ============================================
// MERCHANT BILLING CONFIG
// ============================================

export interface MerchantBillingConfig {
  merchantId: string;
  currency: MerchantCurrency;
  paymentGateway: 'stripe' | 'razorpay' | 'paypal';
  gatewayConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MERCHANT PRICING EVENT TYPE
// ============================================

export type MerchantPricingEventType =
  | 'merchant.pricing.created'
  | 'merchant.pricing.updated'
  | 'merchant.pricing.archived'
  | 'merchant.pricing.reactivated'
  | 'merchant.dashboard.refresh';

// ============================================
// MERCHANT PRICING EVENT
// ============================================

export interface MerchantPricingEvent {
  type: MerchantPricingEventType;
  merchantId: string; // MANDATORY
  data: {
    pricingPlanId?: string;
    pricingPlanName?: string;
    userId?: string;
    userRole?: MerchantRole;
    trigger?: string;
    [key: string]: unknown;
  };
  timestamp: string;
}

// ============================================
// MERCHANT PRICING SEARCH FILTERS
// ============================================

export interface MerchantPricingSearchFilters {
  merchantId: string; // MANDATORY
  status?: PricingStatus;
  currency?: MerchantCurrency;
  interval?: PricingInterval;
  query?: string;
  sortBy?: 'createdAt' | 'amount' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// MERCHANT PRICING SEARCH RESULT
// ============================================

export interface MerchantPricingSearchResult {
  plans: MerchantPricingPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// MERCHANT PRICING PERMISSION CHECK
// ============================================

export interface MerchantPricingPermissionCheck {
  canCreate: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canView: boolean;
  reason?: string;
}

// ============================================
// MERCHANT CONFIG VALIDATION RESULT
// ============================================

export interface MerchantConfigValidationResult {
  isValid: boolean;
  hasCurrency: boolean;
  hasGateway: boolean;
  hasBillingAccount: boolean;
  errors: string[];
  warnings: string[];
}
