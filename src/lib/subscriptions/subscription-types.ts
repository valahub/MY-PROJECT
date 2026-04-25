// Subscription Management System Types
// Core Revenue System - Subscription Data Models

// ============================================
// SUBSCRIPTION STATUS
// ============================================

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';

// ============================================
// BILLING CYCLE
// ============================================

export type BillingCycle = 'monthly' | 'yearly';

// ============================================
// PAYMENT PROVIDER
// ============================================

export type PaymentProvider = 'stripe' | 'razorpay';

// ============================================
// SUBSCRIPTION
// ============================================

export interface Subscription {
  id: string;
  customerId: string;
  pricingId: string;
  planNameSnapshot: string;
  status: SubscriptionStatus;
  mrr: number;
  currency: string;
  billingCycle: BillingCycle;
  trialEnd?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt: string;
  cancelAtPeriodEnd: boolean;
  provider: PaymentProvider;
  providerSubId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// SUBSCRIPTION TRANSITION
// ============================================

export interface SubscriptionTransition {
  from: SubscriptionStatus;
  to: SubscriptionStatus;
  allowed: boolean;
  reason?: string;
}

// ============================================
// CREATE SUBSCRIPTION REQUEST
// ============================================

export interface CreateSubscriptionRequest {
  customerId: string;
  pricingId: string;
  planNameSnapshot: string;
  mrr: number;
  currency: string;
  billingCycle: BillingCycle;
  trialDays?: number;
  provider: PaymentProvider;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// UPDATE SUBSCRIPTION REQUEST
// ============================================

export interface UpdateSubscriptionRequest {
  pricingId?: string;
  planNameSnapshot?: string;
  mrr?: number;
  billingCycle?: BillingCycle;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================
// SUBSCRIPTION ANALYTICS
// ============================================

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  canceledSubscriptions: number;
  pausedSubscriptions: number;
  totalMRR: number;
  monthlyMRR: number;
  yearlyMRR: number;
  churnRate: number;
  mrrGrowthRate: number;
}

// ============================================
// SUBSCRIPTION SEARCH FILTERS
// ============================================

export interface SubscriptionSearchFilters {
  query?: string;
  status?: SubscriptionStatus;
  customerId?: string;
  provider?: PaymentProvider;
  billingCycle?: BillingCycle;
  sortBy?: 'createdAt' | 'mrr' | 'nextBillingAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// SUBSCRIPTION SEARCH RESULT
// ============================================

export interface SubscriptionSearchResult {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// SUBSCRIPTION EVENT TYPE
// ============================================

export type SubscriptionEventType =
  | 'subscription.created'
  | 'subscription.trialing'
  | 'subscription.active'
  | 'subscription.past_due'
  | 'subscription.canceled'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.plan_changed'
  | 'subscription.next_billing'
  | 'subscription.payment_failed'
  | 'subscription.updated';

// ============================================
// SUBSCRIPTION EVENT
// ============================================

export interface SubscriptionEvent {
  type: SubscriptionEventType;
  data: {
    subscriptionId: string;
    customerId: string;
    pricingId?: string;
    providerSubId?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

// ============================================
// WEBHOOK EVENT
// ============================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  processed: boolean;
  tenantId: string;
}
