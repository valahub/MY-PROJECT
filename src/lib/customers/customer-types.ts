// Customer Management System Types
// SaaS Core Brain - Customer Data Models

// ============================================
// CUSTOMER STATUS
// ============================================

export type CustomerStatus = 'active' | 'inactive' | 'blocked';

// ============================================
// ACTIVITY LOG TYPE
// ============================================

export type ActivityType = 'login' | 'api_usage' | 'payment' | 'subscription' | 'license' | 'profile_update' | 'password_reset';

// ============================================
// CUSTOMER SEGMENT
// ============================================

export type CustomerSegment = 'high_ltv' | 'at_risk' | 'new_user' | 'churned' | 'vip';

// ============================================
// CUSTOMER
// ============================================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  country: string;
  status: CustomerStatus;
  totalSpent: number;
  ltv: number;
  activeSubscriptions: number;
  churnRiskScore: number; // 0-100
  fraudRiskScore: number; // 0-100
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// ACTIVITY LOG
// ============================================

export interface ActivityLog {
  id: string;
  customerId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  tenantId: string;
}

// ============================================
// CUSTOMER RELATIONS
// ============================================

export interface CustomerRelations {
  subscriptions: Array<{
    id: string;
    plan: string;
    status: string;
    amount: number;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  licenses: Array<{
    id: string;
    product: string;
    status: string;
    expiresAt: string | null;
  }>;
}

// ============================================
// CUSTOMER ANALYTICS
// ============================================

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  blockedCustomers: number;
  averageLTV: number;
  totalRevenue: number;
  churnRate: number;
  newCustomersThisMonth: number;
  churnedCustomersThisMonth: number;
}

// ============================================
// CUSTOMER SEGMENT DATA
// ============================================

export interface CustomerSegmentData {
  segment: CustomerSegment;
  count: number;
  averageLTV: number;
  customers: Customer[];
}

// ============================================
// CHURN PREDICTION
// ============================================

export interface ChurnPrediction {
  customerId: string;
  churnProbability: number; // 0-100
  riskFactors: {
    paymentHistory: number;
    loginFrequency: number;
    supportTickets: number;
    featureUsage: number;
  };
  predictedChurnDate?: string;
  recommendedAction: string;
  timestamp: string;
}

// ============================================
// UPSELL PREDICTION
// ============================================

export interface UpsellPrediction {
  customerId: string;
  upsellProbability: number; // 0-100
  recommendedProducts: Array<{
    productId: string;
    productName: string;
    probability: number;
    expectedRevenue: number;
  }>;
  timestamp: string;
}

// ============================================
// FRAUD RISK ASSESSMENT
// ============================================

export interface FraudRiskAssessment {
  customerId: string;
  fraudRiskScore: number; // 0-100
  riskFactors: {
    multipleCards: boolean;
    unusualCountrySwitch: boolean;
    rapidPayments: boolean;
    suspiciousIP: boolean;
  };
  flaggedTransactions: string[];
  timestamp: string;
}

// ============================================
// CUSTOMER CREATE REQUEST
// ============================================

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  country: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// CUSTOMER UPDATE REQUEST
// ============================================

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  country?: string;
  status?: CustomerStatus;
  metadata?: Record<string, unknown>;
}

// ============================================
// CUSTOMER SEARCH FILTERS
// ============================================

export interface CustomerSearchFilters {
  query?: string;
  status?: CustomerStatus;
  country?: string;
  segment?: CustomerSegment;
  minLTV?: number;
  maxLTV?: number;
  minChurnRisk?: number;
  maxChurnRisk?: number;
  minFraudRisk?: number;
  maxFraudRisk?: number;
  sortBy?: 'name' | 'email' | 'ltv' | 'churn_risk' | 'fraud_risk' | 'created_at' | 'last_active';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// CUSTOMER SEARCH RESULT
// ============================================

export interface CustomerSearchResult {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
