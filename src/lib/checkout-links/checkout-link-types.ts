// Checkout Link Management System Types
// Revenue Link System - Checkout Link Data Models

// ============================================
// CHECKOUT LINK STATUS
// ============================================

export type CheckoutLinkStatus = 'active' | 'inactive' | 'expired';

// ============================================
// CHECKOUT LINK
// ============================================

export interface CheckoutLink {
  id: string;
  name: string;
  productId: string;
  pricingId: string;
  slug: string;
  status: CheckoutLinkStatus;
  viewCount: number;
  conversionCount: number;
  successUrl: string;
  cancelUrl: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  metadata: Record<string, unknown>;
}

// ============================================
// CREATE CHECKOUT LINK REQUEST
// ============================================

export interface CreateCheckoutLinkRequest {
  name: string;
  productId: string;
  pricingId: string;
  slug?: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  tenantId: string;
}

// ============================================
// UPDATE CHECKOUT LINK REQUEST
// ============================================

export interface UpdateCheckoutLinkRequest {
  name?: string;
  productId?: string;
  pricingId?: string;
  status?: CheckoutLinkStatus;
  successUrl?: string;
  cancelUrl?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// CHECKOUT LINK ANALYTICS
// ============================================

export interface CheckoutLinkAnalytics {
  totalLinks: number;
  activeLinks: number;
  inactiveLinks: number;
  expiredLinks: number;
  totalViews: number;
  totalConversions: number;
  averageConversionRate: number;
  bestPerformingLink: CheckoutLink | null;
}

// ============================================
// CHECKOUT LINK SEARCH FILTERS
// ============================================

export interface CheckoutLinkSearchFilters {
  query?: string;
  status?: CheckoutLinkStatus;
  productId?: string;
  pricingId?: string;
  sortBy?: 'createdAt' | 'viewCount' | 'conversionCount' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// CHECKOUT LINK SEARCH RESULT
// ============================================

export interface CheckoutLinkSearchResult {
  links: CheckoutLink[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// CHECKOUT LINK EVENT TYPE
// ============================================

export type CheckoutLinkEventType =
  | 'checkout_link.created'
  | 'checkout_link.updated'
  | 'checkout_link.activated'
  | 'checkout_link.deactivated'
  | 'checkout_link.expired'
  | 'checkout_link.viewed'
  | 'checkout_link.converted';

// ============================================
// CHECKOUT LINK EVENT
// ============================================

export interface CheckoutLinkEvent {
  type: CheckoutLinkEventType;
  data: {
    checkoutLinkId: string;
    slug: string;
    productId?: string;
    pricingId?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

// ============================================
// BULK OPERATION TYPE
// ============================================

export type BulkOperationType = 'activate' | 'deactivate' | 'delete';

// ============================================
// BULK OPERATION RESULT
// ============================================

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ checkoutLinkId: string; error: string }>;
  timestamp: string;
}
