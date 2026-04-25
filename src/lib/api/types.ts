// Core API types shared across all modules

export type Role = "admin" | "merchant" | "customer" | "support";

export type UserStatus = "active" | "suspended" | "pending";
export type ProductStatus = "draft" | "active" | "archived";
export type ProductType = "subscription" | "one_time" | "license";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "paused" | "canceled";
export type OrderStatus = "pending" | "processing" | "completed" | "refunded" | "failed";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type PricingInterval = "monthly" | "yearly";
export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "activated"
  | "deactivated"
  | "expired"
  | "tampered"
  | "refunded"
  | "chargeback"
  | "invoice_created"
  | "invoice_paid"
  | "invoice_voided"
  | "retry_attempted"
  | "recovered"
  | "auto_canceled"
  | "proration_calculated"
  | "proration_overridden"
  | "feature_flag_toggled"
  | "entitlement_granted"
  | "entitlement_revoked"
  | "limit_changed"
  | "plan_changed"
  | "canceled"
  | "rate_updated"
  | "rate_override"
  | "base_currency_changed"
  | "fx_adjusted"
  | "pricing_rule_created"
  | "pricing_rule_updated"
  | "pricing_rule_deleted"
  | "multiplier_changed"
  | "tax_config_changed"
  | "customer_created"
  | "customer_updated"
  | "customer_suspended"
  | "customer_blocked"
  | "customer_activated"
  | "session_revoked"
  | "password_reset"
  | "marketplace_item_created"
  | "marketplace_item_approved"
  | "marketplace_item_rejected"
  | "marketplace_item_hidden"
  | "author_verified"
  | "author_banned"
  | "payout_processed"
  | "report_resolved"
  | "marketplace_refund"
  | "marketplace_order_created"
  | "featured_slot_created"
  | "featured_slot_removed"
  | "dmca_approved"
  | "dmca_rejected"
  | "author_level_changed"
  | "quality_scan_completed"
  | "review_approved"
  | "review_soft_rejected"
  | "review_rejected";

export interface ApiUser {
  id: string;
  email: string;
  role: Role;
  merchantId?: string;
  name?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface AuthContext {
  user: ApiUser;
  tokenId: string;
}

export interface RequestContext {
  auth?: AuthContext;
  requestId: string;
  ip: string;
  userAgent: string;
  startTime: number;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  merchantId: string;
  merchantName?: string;
  type: ProductType;
  status: ProductStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Computed fields
  price?: string;
  customerCount?: number;
  pricingPlans?: PricingPlan[];
}

export interface ProductCreateInput {
  name: string;
  merchantId: string;
  type: ProductType;
  description?: string;
  status?: ProductStatus;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  status?: ProductStatus;
}

// Pricing Types
export interface PricingPlan {
  id: string;
  productId: string;
  name: string;
  amount: number;
  currency: string;
  interval?: PricingInterval;
  intervalCount?: number;
  trialPeriodDays?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingPlanCreateInput {
  productId: string;
  name: string;
  amount: number;
  currency: string;
  interval?: PricingInterval;
  intervalCount?: number;
  trialPeriodDays?: number;
  isDefault?: boolean;
}

export interface PricingPlanUpdateInput {
  name?: string;
  amount?: number;
  currency?: string;
  interval?: PricingInterval;
  intervalCount?: number;
  trialPeriodDays?: number;
  isDefault?: boolean;
}

// Merchant Types
export interface Merchant {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// Customer Types
export interface Customer {
  id: string;
  email: string;
  name?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// Subscription Types
export interface Subscription {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  productId: string;
  productName?: string;
  pricingPlanId: string;
  pricingPlanName?: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  interval?: PricingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  trialStart?: string;
  trialEnd?: string;
  canceledAt?: string;
  cancelAtPeriodEnd?: boolean;
  pauseStartDate?: string;
  pauseEndDate?: string;
  started?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  billingHistory?: BillingRecord[];
  invoices?: Invoice[];
}

export interface SubscriptionCreateInput {
  customerId: string;
  productId: string;
  pricingPlanId: string;
  trialPeriodDays?: number;
}

export interface SubscriptionUpdateInput {
  pricingPlanId?: string;
  cancelAtPeriodEnd?: boolean;
  pauseStartDate?: string;
  pauseEndDate?: string;
}

export interface SubscriptionStatusTransition {
  from: SubscriptionStatus;
  to: SubscriptionStatus;
  reason?: string;
}

// Transaction Types (Legacy - kept for compatibility)
export interface LegacyTransaction {
  id: string;
  customerId: string;
  productId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethodId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Billing Types
export interface BillingRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  attemptDate: string;
  nextRetryDate?: string;
  retryCount: number;
  failureReason?: string;
}

// License Types
export type LicenseStatus = "active" | "expired" | "disabled" | "revoked";
export type TransactionType = "payment" | "refund" | "chargeback";
export type TransactionStatus = "completed" | "pending" | "failed" | "refunded";
export type PaymentMethod = "card" | "paypal" | "bank_transfer" | "crypto";

export interface License {
  id: string;
  key: string;
  keyEncrypted: string;
  customerId: string;
  customerName?: string;
  productId: string;
  productName?: string;
  merchantId: string;
  merchantName?: string;
  status: LicenseStatus;
  maxDevices: number;
  boundDevices: DeviceBinding[];
  expiresAt?: string;
  lastActivatedAt?: string;
  lastValidatedAt?: string;
  tamperDetected: boolean;
  offlineGracePeriodDays: number;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  deviceUsage: number;
  activationHistory?: Activation[];
}

export interface LicenseCreateInput {
  customerId: string;
  productId: string;
  maxDevices?: number;
  expiresAt?: string;
  offlineGracePeriodDays?: number;
}

export interface LicenseUpdateInput {
  status?: LicenseStatus;
  maxDevices?: number;
  expiresAt?: string;
  offlineGracePeriodDays?: number;
}

export interface DeviceBinding {
  deviceId: string;
  deviceFingerprint: string;
  deviceName?: string;
  activatedAt: string;
  lastSeenAt: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface Activation {
  id: string;
  licenseId: string;
  deviceId: string;
  deviceFingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
  failureReason?: string;
  timestamp: string;
}

export interface ActivationInput {
  licenseKey: string;
  deviceId: string;
  deviceFingerprint: string;
  ipAddress?: string;
  userAgent?: string;
}

// Enhanced Transaction Types
export interface Transaction {
  id: string;
  customerId: string;
  customerName?: string;
  productId?: string;
  productName?: string;
  subscriptionId?: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentMethodId?: string;
  paymentMethodMasked?: string; // e.g., "**** 4242"
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, unknown>;
  fraudScore?: number;
  fraudFlags?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  refundedAt?: string;
  // Computed fields
  refundableAmount?: number;
  chargebackDetails?: ChargebackDetails;
}

export interface TransactionCreateInput {
  customerId: string;
  productId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentMethodId?: string;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface RefundInput {
  transactionId: string;
  amount: number;
  reason?: string;
  partial?: boolean;
}

export interface ChargebackDetails {
  disputeId: string;
  reason: string;
  status: "open" | "under_review" | "won" | "lost";
  evidenceDeadline?: string;
  evidenceSubmitted?: boolean;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseFilters {
  status?: LicenseStatus;
  productId?: string;
  merchantId?: string;
  customerId?: string;
  search?: string;
  expiryFrom?: string;
  expiryTo?: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  customerId?: string;
  productId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface LicenseKPI {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  disabledLicenses: number;
  revokedLicenses: number;
  totalActivations: number;
  activeDevices: number;
}

export interface TransactionKPI {
  totalTransactions: number;
  totalRevenue: number;
  totalRefunds: number;
  totalChargebacks: number;
  pendingTransactions: number;
  failedTransactions: number;
  netRevenue: number;
}

// Billing & Invoice Types
export type InvoiceStatus = "draft" | "issued" | "paid" | "pending" | "past_due" | "failed" | "void";
export type DunningStage = "retry_day_1" | "retry_day_3" | "retry_day_7" | "grace_period" | "auto_cancel";
export type DunningStatus = "pending" | "past_due" | "recovered" | "canceled";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  merchantId: string;
  merchantName?: string;
  subscriptionId?: string;
  productId?: string;
  productName?: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  originalAmount?: number;
  originalCurrency?: string;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  voidedAt?: string;
  items: InvoiceItem[];
  paymentMethod?: string;
  paymentMethodMasked?: string;
  transactionId?: string;
  retryCount: number;
  nextRetryDate?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCreateInput {
  customerId: string;
  merchantId?: string;
  subscriptionId?: string;
  productId?: string;
  items: Omit<InvoiceItem, "id" | "amount" | "taxAmount">[];
  dueDate: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceUpdateInput {
  status?: InvoiceStatus;
  dueDate?: string;
  paidAt?: string;
  nextRetryDate?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  customerId?: string;
  merchantId?: string;
  subscriptionId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
}

export interface InvoiceKPI {
  revenueMTD: number;
  invoicesIssued: number;
  pendingPayments: number;
  pendingAmount: number;
  retryQueueCount: number;
  retryQueueAmount: number;
}

// Dunning & Retry Queue Types
export interface RetryQueue {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  attemptCount: number;
  maxAttempts: number;
  stage: DunningStage;
  status: DunningStatus;
  nextRetryDate: string;
  lastRetryDate?: string;
  lastRetryError?: string;
  gracePeriodEndsAt?: string;
  autoCancelAt?: string;
  recoveredAt?: string;
  canceledAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DunningConfig {
  id: string;
  merchantId?: string;
  retrySchedule: {
    day1: boolean;
    day3: boolean;
    day7: boolean;
  };
  maxAttempts: number;
  gracePeriodDays: number;
  autoCancelAfterGrace: boolean;
  notificationEnabled: boolean;
  emailTemplates: {
    retryReminder?: string;
    finalWarning?: string;
    cancellationNotice?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DunningConfigUpdateInput {
  retrySchedule?: {
    day1: boolean;
    day3: boolean;
    day7: boolean;
  };
  maxAttempts?: number;
  gracePeriodDays?: number;
  autoCancelAfterGrace?: boolean;
  notificationEnabled?: boolean;
}

export interface RetryQueueFilters {
  stage?: DunningStage;
  status?: DunningStatus;
  customerId?: string;
  subscriptionId?: string;
  attemptCount?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface DunningKPI {
  inRetryCount: number;
  inRetryAmount: number;
  gracePeriodCount: number;
  gracePeriodAmount: number;
  recovered30d: number;
  autoCanceledCount: number;
  autoCanceledAmount: number;
}

export interface TaxCalculation {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
}

export interface CurrencyConversion {
  from: string;
  to: string;
  rate: number;
  originalAmount: number;
  convertedAmount: number;
  convertedAt: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  entityType: "product" | "subscription" | "pricing" | "merchant" | "customer" | "license" | "transaction" | "invoice" | "dunning" | "proration" | "entitlement" | "currency" | "local_pricing" | "customer_profile" | "marketplace";
  entityId: string;
  action: AuditAction;
  userId: string;
  userEmail?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogCreateInput {
  entityType: AuditLog["entityType"];
  entityId: string;
  action: AuditAction;
  userId: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

// Filter Types
export interface ProductFilters {
  type?: ProductType;
  status?: ProductStatus;
  merchantId?: string;
  search?: string;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  productId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Proration Types
export type ProrationType = "upgrade" | "downgrade" | "cycle_change";

export interface ProrationCalculation {
  oldPlanAmount: number;
  newPlanAmount: number;
  remainingDays: number;
  billingCycleDays: number;
  creditAmount: number;
  chargeAmount: number;
  netAmount: number;
  effectiveDate: string;
  currency: string;
  calculationSeconds: number;
}

export interface ProrationLog {
  id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  fromPlanId: string;
  fromPlanName: string;
  fromPlanAmount: number;
  toPlanId: string;
  toPlanName: string;
  toPlanAmount: number;
  type: ProrationType;
  creditAmount: number;
  chargeAmount: number;
  netAmount: number;
  currency: string;
  effectiveDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  invoiceId?: string;
  invoiceNumber?: string;
  isOverridden: boolean;
  overriddenBy?: string;
  overriddenAt?: string;
  overrideReason?: string;
  calculationBreakdown: {
    oldPlanAmount: number;
    newPlanAmount: number;
    remainingDays: number;
    billingCycleDays: number;
    creditFormula: string;
    chargeFormula: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProrationLogCreateInput {
  subscriptionId: string;
  fromPlanId: string;
  toPlanId: string;
  effectiveDate: string;
  overrideAmount?: number;
  overrideReason?: string;
}

export interface ProrationLogUpdateInput {
  overrideAmount?: number;
  overrideReason?: string;
}

export interface ProrationFilters {
  type?: ProrationType;
  customerId?: string;
  fromPlanId?: string;
  toPlanId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface ProrationKPI {
  adjustments30d: number;
  netUpgradeRevenue: number;
  netDowngradeLoss: number;
  avgCalculationTime: number;
  currency: string;
}

// Feature Flag Types
export type FeatureType = "api" | "ui" | "integration" | "analytics" | "custom";

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: FeatureType;
  enabled: boolean;
  defaultValue: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagCreateInput {
  key: string;
  name: string;
  description?: string;
  type: FeatureType;
  enabled?: boolean;
  defaultValue?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagUpdateInput {
  name?: string;
  description?: string;
  enabled?: boolean;
  defaultValue?: boolean;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagFilters {
  type?: FeatureType;
  enabled?: boolean;
  search?: string;
}

// Entitlement Types
export type LimitType = "count" | "storage" | "api_calls" | "users" | "custom";
export type LimitEnforcement = "hard" | "soft" | "none";

export interface Entitlement {
  id: string;
  featureFlagId: string;
  featureFlagKey: string;
  featureFlagName: string;
  planId: string;
  planName: string;
  enabled: boolean;
  limitType?: LimitType;
  limitValue?: number;
  limitUnit?: string;
  enforcement?: LimitEnforcement;
  priority: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementCreateInput {
  featureFlagId: string;
  planId: string;
  enabled: boolean;
  limitType?: LimitType;
  limitValue?: number;
  limitUnit?: string;
  enforcement?: LimitEnforcement;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface EntitlementUpdateInput {
  enabled?: boolean;
  limitType?: LimitType;
  limitValue?: number;
  limitUnit?: string;
  enforcement?: LimitEnforcement;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface EntitlementFilters {
  featureFlagId?: string;
  planId?: string;
  enabled?: boolean;
  limitType?: LimitType;
  search?: string;
}

// Plan Feature Types
export interface PlanFeature {
  id: string;
  planId: string;
  planName: string;
  featureKey: string;
  featureName: string;
  access: "unlocked" | "locked";
  limit?: number;
  limitUnit?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeatureCreateInput {
  planId: string;
  featureKey: string;
  featureName: string;
  access: "unlocked" | "locked";
  limit?: number;
  limitUnit?: string;
  isDefault?: boolean;
}

export interface PlanFeatureUpdateInput {
  access?: "unlocked" | "locked";
  limit?: number;
  limitUnit?: string;
  isDefault?: boolean;
}

export interface PlanFeatureFilters {
  planId?: string;
  access?: "unlocked" | "locked";
  search?: string;
}

// Entitlement KPI
export interface EntitlementKPI {
  featureFlagsCount: number;
  activePlansCount: number;
  lockedFeaturesCount: number;
  openFeaturesCount: number;
}

// ============================================
// CURRENCY & LOCAL PRICING TYPES
// ============================================

export type RoundingMode = "up" | "down" | "bankers";
export type FXRateStatus = "live" | "stale" | "down";

export interface Currency {
  id: string;
  code: string; // USD, INR, EUR
  name: string; // US Dollar, Indian Rupee, Euro
  symbol: string; // $, ₹, €
  isBase: boolean; // Only one base currency allowed
  isActive: boolean;
  rate: number; // Exchange rate relative to base
  lastUpdated: string;
  adjustment: number; // FX adjustment (markup/fixed)
  finalRate: number; // rate + adjustment
  decimalPlaces: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyCreateInput {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces?: number;
}

export interface CurrencyUpdateInput {
  name?: string;
  symbol?: string;
  isActive?: boolean;
  rate?: number;
  adjustment?: number;
  decimalPlaces?: number;
}

export interface CurrencyFilters {
  isActive?: boolean;
  isBase?: boolean;
  search?: string;
  region?: string;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  status: FXRateStatus;
  lastFetched: string;
  provider: string;
  retryCount: number;
}

export interface FXLog {
  id: string;
  currencyId: string;
  currencyCode: string;
  oldRate: number;
  newRate: number;
  changeType: "api_fetch" | "manual_override" | "base_change" | "adjustment";
  changedBy: string;
  reason?: string;
  timestamp: string;
}

export interface FXLogCreateInput {
  currencyId: string;
  currencyCode: string;
  oldRate: number;
  newRate: number;
  changeType: "api_fetch" | "manual_override" | "base_change" | "adjustment";
  changedBy: string;
  reason?: string;
}

export interface Region {
  id: string;
  name: string; // North America, Europe, Asia
  code: string; // NA, EU, AS
  currencyCode: string;
  countries: string[]; // US, CA, MX
  isActive: boolean;
  defaultPricingRuleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegionCreateInput {
  name: string;
  code: string;
  currencyCode: string;
  countries: string[];
}

export interface RegionUpdateInput {
  name?: string;
  currencyCode?: string;
  countries?: string[];
  isActive?: boolean;
  defaultPricingRuleId?: string;
}

export interface TaxConfig {
  id: string;
  regionId: string;
  type: TaxType;
  rate: number; // 0.1 for 10%
  isIncluded: boolean; // Tax included in price
  name: string; // VAT, GST, Sales Tax
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxConfigCreateInput {
  regionId: string;
  type: TaxType;
  rate: number;
  isIncluded: boolean;
  name: string;
}

export interface TaxConfigUpdateInput {
  type?: TaxType;
  rate?: number;
  isIncluded?: boolean;
  name?: string;
  isActive?: boolean;
}

export interface PricingRule {
  id: string;
  regionId: string;
  regionName: string;
  currencyCode: string;
  multiplier: number; // 0.6 for 60%, 1.0 for 100%
  taxConfigId?: string;
  taxIncluded: boolean;
  taxRate?: number;
  examplePrice: number; // Calculated preview
  isActive: boolean;
  priority: number; // Higher priority wins
  createdAt: string;
  updatedAt: string;
}

export interface PricingRuleCreateInput {
  regionId: string;
  currencyCode: string;
  multiplier: number;
  taxConfigId?: string;
  priority?: number;
}

export interface PricingRuleUpdateInput {
  multiplier?: number;
  taxConfigId?: string;
  isActive?: boolean;
  priority?: number;
}

export interface PricingRuleFilters {
  regionId?: string;
  currencyCode?: string;
  taxIncluded?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface CurrencyKPI {
  totalCurrencies: number;
  geoRegions: number;
  conversionRateStatus: FXRateStatus;
  fxAdjustments24h: number;
  baseCurrency: string;
  lastRateUpdate: string;
}

export interface ConversionRequest {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  roundingMode?: RoundingMode;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  rate: number;
  timestamp: string;
}

export interface LocalPriceRequest {
  basePrice: number;
  regionId: string;
  currencyCode?: string;
  applyTax?: boolean;
}

export interface LocalPriceResult {
  basePrice: number;
  regionId: string;
  regionName: string;
  currencyCode: string;
  multiplier: number;
  fxRate: number;
  taxRate?: number;
  taxIncluded: boolean;
  finalPrice: number;
  currencySymbol: string;
}

// ============================================
// CUSTOMER MANAGEMENT TYPES
// ============================================

export type CustomerStatus = "active" | "suspended" | "blocked";

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  country: string;
  currency: string;
  status: CustomerStatus;
  subscriptionCount: number;
  totalSpent: number;
  totalSpentCurrency: string;
  joinedDate: string;
  lastActive: string;
  ipAddress?: string;
  deviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreateInput {
  name: string;
  email: string;
  country: string;
  currency?: string;
}

export interface CustomerUpdateInput {
  name?: string;
  country?: string;
  currency?: string;
  status?: CustomerStatus;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  country?: string;
  search?: string;
  highSpenders?: boolean;
  hasSubscription?: boolean;
}

export interface CustomerKPI {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  blockedCustomers: number;
  totalRevenue: number;
  avgSpentPerCustomer: number;
  topCountry: string;
}

export interface CustomerSession {
  id: string;
  customerId: string;
  ipAddress: string;
  device: string;
  userAgent: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
}

// ============================================
// MARKETPLACE MANAGEMENT TYPES
// ============================================

export type MarketplaceItemStatus = "draft" | "pending" | "approved" | "rejected" | "hidden" | "removed";
export type AuthorStatus = "unverified" | "verified" | "banned";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "on_hold";
export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";
export type ReportType = "spam" | "malware" | "policy_violation" | "copyright";
export type RefundStatus = "pending" | "under_review" | "escalated" | "approved" | "denied" | "refunded";
export type TakedownStatus = "pending" | "investigating" | "notice_sent" | "removed" | "rejected" | "counter_claim" | "restored" | "closed";
export type TakedownType = "dmca" | "trademark" | "copyright";

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  authorId: string;
  authorName: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  status: MarketplaceItemStatus;
  totalSales: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  downloads: number;
  version: string;
  createdAt: string;
  updatedAt: string;
  isFeatured: boolean;
  isFlagged: boolean;
  isHot: boolean;
  featuredPriority: number;
  hotPriority: number;
  qualityScan?: QualityScan;
  deletedAt?: string;
  publishedAt?: string;
}

export interface MarketplaceItemCreateInput {
  authorId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
}

export interface MarketplaceItemUpdateInput {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  status?: MarketplaceItemStatus;
  version?: string;
}

export interface MarketplaceItemFilters {
  status?: MarketplaceItemStatus;
  authorId?: string;
  category?: string;
  search?: string;
  reported?: boolean;
}

export interface MarketplaceAuthor {
  id: string;
  name: string;
  email: string;
  status: AuthorStatus;
  itemCount: number;
  totalSales: number;
  totalRevenue: number;
  pendingPayout: number;
  commissionRate: number;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  country?: string;
  tier: "new" | "trusted" | "premium";
  level: number; // 1-10
  riskScore: number; // 0-100
  reputationScore: number; // 0-100
}

export interface MarketplaceAuthorCreateInput {
  name: string;
  email: string;
  commissionRate?: number;
}

export interface MarketplaceAuthorUpdateInput {
  name?: string;
  status?: AuthorStatus;
  commissionRate?: number;
}

export interface MarketplaceAuthorFilters {
  status?: AuthorStatus;
  search?: string;
  hasPendingPayout?: boolean;
}

export interface MarketplaceOrder {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  quantity?: number;
  commission: number;
  authorEarnings: number;
  platformRevenue: number;
  status: "completed" | "refunded" | "pending";
  refundedAt?: string;
  createdAt: string;
}

export interface MarketplaceOrderFilters {
  status?: "completed" | "refunded" | "pending";
  authorId?: string;
  customerId?: string;
  itemId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MarketplacePayout {
  id: string;
  authorId: string;
  authorName: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  orderCount: number;
  periodStart: string;
  periodEnd: string;
  processedAt?: string;
  createdAt: string;
}

export interface MarketplacePayoutCreateInput {
  authorId: string;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export interface MarketplacePayoutFilters {
  status?: PayoutStatus;
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MarketplaceReview {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

export interface MarketplaceReviewFilters {
  status?: "approved" | "pending" | "rejected";
  itemId?: string;
  authorId?: string;
  rating?: number;
}

export interface MarketplaceReport {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  reporterId: string;
  reporterName: string;
  type: ReportType;
  description: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface MarketplaceReportFilters {
  status?: ReportStatus;
  type?: ReportType;
  itemId?: string;
  authorId?: string;
}

export interface MarketplaceKPI {
  gmv: number;
  takeRateRevenue: number;
  activeItems: number;
  activeAuthors: number;
  pendingReviews: number;
  reportedItems: number;
  pendingPayouts: number;
  refundRate: number;
  totalOrders: number;
  totalRefunds: number;
  defaultCommissionRate: number;
}

// ============================================
// MARKETPLACE ADVANCED TYPES
// ============================================

export type AuthorLevel = "bronze" | "silver" | "gold" | "platinum";

export interface AuthorLevelConfig {
  level: AuthorLevel;
  salesThreshold: number;
  commissionRate: number;
  benefits: string[];
  badge: string;
  minEarnings: number;
  isActive: boolean;
}

export interface AuthorBonus {
  id: string;
  authorId: string;
  type: "exclusive_author" | "item_of_the_day" | "annual_quality";
  amount: number;
  currency: string;
  triggeredAt: string;
  description: string;
  appliedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  path: string;
  itemCount: number;
  subcategoryCount: number;
  totalItemCount: number; // Includes nested items
  isActive: boolean;
  isLocked: boolean;
  priority: number;
  metaTitle?: string;
  metaDescription?: string;
  icon?: string;
  image?: string;
  commissionOverride?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateInput {
  name: string;
  parentId?: string;
  metaTitle?: string;
  metaDescription?: string;
  icon?: string;
  commissionOverride?: number;
}

export interface CategoryUpdateInput {
  name?: string;
  parentId?: string;
  isActive?: boolean;
  isLocked?: boolean;
  priority?: number;
  metaTitle?: string;
  metaDescription?: string;
  icon?: string;
  image?: string;
  commissionOverride?: number;
}

export interface MarketplaceFeatureSchedule {
  id: string;
  itemId: string;
  itemType: "featured" | "hot";
  startAt: string;
  endAt: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceFeatureScheduleCreateInput {
  itemId: string;
  itemType: "featured" | "hot";
  startAt: string;
  endAt: string;
  priority?: number;
}

export interface PayoutMethod {
  type: "paypal" | "wire" | "payoneer";
}

export interface Payout {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  method: PayoutMethod;
  amount: number;
  currency: string;
  originalAmount: number;
  originalCurrency: string;
  platformFee: number;
  gatewayFee: number;
  taxDeduction: number;
  netAmount: number;
  periodStart: string;
  periodEnd: string;
  status: PayoutStatus;
  transactionId?: string;
  gatewayTransactionId?: string;
  holdReason?: string;
  requestedAt: string;
  processedAt?: string;
  paidAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutCreateInput {
  authorId: string;
  method: PayoutMethod;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export interface PayoutLedger {
  id: string;
  authorId: string;
  payoutId?: string;
  type: "earnings" | "withdrawal" | "fee" | "tax" | "refund" | "bonus";
  amount: number;
  currency: string;
  balance: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface FeaturedMetrics {
  itemId: string;
  clicks: number;
  impressions: number;
  conversionRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface Refund {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  buyerId: string;
  buyerEmail: string;
  authorId: string;
  authorName: string;
  reason: string;
  amount: number;
  currency: string;
  refundedAmount: number;
  status: RefundStatus;
  isDispute: boolean;
  buyerMessage?: string;
  authorResponse?: string;
  adminDecision?: string;
  fraudFlag: boolean;
  requestedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  deniedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundCreateInput {
  orderId: string;
  itemId: string;
  buyerId: string;
  reason: string;
  amount: number;
  currency: string;
  buyerMessage?: string;
}

export interface Takedown {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  type: TakedownType;
  status: TakedownStatus;
  description: string;
  reporterProof?: string;
  authorResponse?: string;
  authorProof?: string;
  counterClaim: boolean;
  counterClaimStatement?: string;
  counterClaimProof?: string;
  deadline: string;
  takedownReason?: string;
  actionTimestamp?: string;
  restoredAt?: string;
  violationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TakedownCreateInput {
  itemId: string;
  reporterId: string;
  type: TakedownType;
  description: string;
  reporterProof?: string;
}

export interface MarketplaceTopSellingItem {
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  salesCount: number;
  revenue: number;
  rating: number;
  category: string;
  rank: number;
  isTrending: boolean;
  periodStart: string;
  periodEnd: string;
}

export interface ReportSeverity {
  type: "low" | "medium" | "high" | "critical";
}

export type FlagStatus = "open" | "under_review" | "action_taken" | "dismissed" | "escalated" | "awaiting_fix" | "fixed" | "ignored";

export interface ReportFlag {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  severity: ReportSeverity["type"];
  status: FlagStatus;
  reason: string;
  description: string;
  internalNotes?: string;
  evidence?: string[];
  warningCount: number;
  reporterTrustScore: number;
  isSystemGenerated: boolean;
  actionTaken?: string;
  dismissalReason?: string;
  fixDeadline?: string;
  fixRequestedAt?: string;
  fixCompletedAt?: string;
  versionIssue?: string;
  userImpactScore: number;
  priorityScore: number;
  slaDeadline?: string;
  actionLocked: boolean;
  createdAt: string;
  reviewedAt?: string;
  actionedAt?: string;
  dismissedAt?: string;
  updatedAt: string;
}

export interface SecurityIncident {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  severity: "critical";
  vulnerabilityType: "sql_injection" | "xss" | "auth_bypass" | "api_leak" | "other";
  endpoint?: string;
  status: "detected" | "blocked" | "patch_requested" | "patch_submitted" | "retesting" | "resolved" | "force_takedown";
  description: string;
  evidence: {
    requestPayload?: string;
    endpointLogs?: string;
    reproductionSteps?: string;
  };
  patchDeadline: string;
  patchRequestedAt?: string;
  patchSubmittedAt?: string;
  retestResults?: string;
  affectedUsers?: string[];
  globalScanTriggered: boolean;
  developerPenaltyApplied: boolean;
  forensicLog: {
    reportedBy: string;
    reviewedBy: string;
    approvedBy: string;
    timestamps: {
      detected: string;
      blocked: string;
      resolved?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReportFlagCreateInput {
  itemId: string;
  reporterId: string;
  severity: ReportSeverity["type"];
  reason: string;
  description: string;
  evidence?: string[];
}

// ============================================
// TAX & COMMISSION TYPES
// ============================================

export type TaxType = "vat" | "gst" | "sales_tax" | "digital_service_tax";
export type TaxMode = "inclusive" | "exclusive";

export interface MarketplaceTaxRule {
  id: string;
  country: string;
  countryCode: string;
  type: TaxType;
  rate: number;
  reverseCharge: boolean;
  status: "active" | "inactive";
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  roundingRule?: "up" | "down" | "nearest";
  stateTax?: number;
  digitalServiceTax?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceTaxRuleCreateInput {
  country: string;
  countryCode: string;
  type: TaxType;
  rate: number;
  reverseCharge: boolean;
  stateTax?: number;
  digitalServiceTax?: number;
  roundingRule?: MarketplaceTaxRule["roundingRule"];
}

export interface MarketplaceTaxCalculation {
  baseAmount: number;
  countryTax: number;
  stateTax: number;
  digitalServiceTax: number;
  totalTax: number;
  finalAmount: number;
  taxRate: number;
  isReverseCharge: boolean;
  taxMode: TaxMode;
  country: string;
  countryCode: string;
}

export interface MarketplaceTaxValidation {
  isValid: boolean;
  taxId?: string;
  taxType?: string;
  validationMessage?: string;
}

export interface CommissionTier {
  id: string;
  name: "non_exclusive" | "exclusive" | "elite";
  rate: number;
  minSales: number;
  minRevenue: number;
  autoUpgrade: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceCommissionCalculation {
  saleAmount: number;
  taxAmount: number;
  platformFee: number;
  buyerFee: number;
  commissionRate: number;
  commissionAmount: number;
  authorEarnings: number;
  tier: string;
  isLocked: boolean;
}

export interface MarketplaceWithholdingTax {
  id: string;
  country: string;
  treatyRate: number;
  defaultRate: number;
  documentRequired: "w8" | "w9" | "none";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface TaxReport {
  id: string;
  period: string;
  country: string;
  countryCode: string;
  totalSales: number;
  totalTaxCollected: number;
  totalTaxRefunded: number;
  netTax: number;
  transactionCount: number;
  generatedAt: string;
}

// ============================================
// MARKETPLACE SETTINGS TYPES
// ============================================

export interface MarketplaceSettings {
  id: string;
  version: number;
  effectiveFrom: string;
  // Commission & Fees
  defaultCommission: number;
  buyerFee: number;
  extendedLicenseMultiplier: number;
  minimumItemPrice: number;
  refundClearanceWindow: number;
  minWithdrawalThreshold: number;
  // Review Policy
  reviewSLA: number;
  maxSoftRejectCycles: number;
  // Currency
  baseCurrency: string;
  useLiveRates: boolean;
  // Tax
  taxMode: TaxMode;
  applyEU_MOSS: boolean;
  applyWithholdingTax: boolean;
  // Advanced
  safeMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceSettingsUpdateInput {
  defaultCommission?: number;
  buyerFee?: number;
  extendedLicenseMultiplier?: number;
  minimumItemPrice?: number;
  refundClearanceWindow?: number;
  minWithdrawalThreshold?: number;
  reviewSLA?: number;
  maxSoftRejectCycles?: number;
  baseCurrency?: string;
  useLiveRates?: boolean;
  taxMode?: TaxMode;
  applyEU_MOSS?: boolean;
  applyWithholdingTax?: boolean;
  safeMode?: boolean;
}

export interface MarketplaceCategoryCommissionOverride {
  categoryId: string;
  commissionRate: number;
}

export interface MarketplaceAuthorCommissionOverride {
  authorId: string;
  commissionRate: number;
}

export interface SettingsAuditLog {
  id: string;
  settingId: string;
  version: number;
  changedBy: string;
  changes: Record<string, { old: any; new: any }>;
  timestamp: string;
}

// ============================================
// TAX COMPLIANCE TYPES
// ============================================

export type AlertPriority = "low" | "medium" | "high" | "critical";
export type AlertType = "deadline" | "regulation_update" | "filing_reminder" | "risk_detected" | "penalty_warning";
export type AlertStatus = "pending" | "in_review" | "resolved" | "escalated";
export type FilingStatus = "not_filed" | "draft" | "submitted" | "accepted" | "rejected";
export type ComplianceRule = "eu_dac7" | "uk_mtd" | "us_1099k" | "india_gst" | "global_vat";

export interface TaxRegion {
  id: string;
  country: string;
  countryCode: string;
  state?: string;
  stateCode?: string;
  region?: string;
  taxRuleId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  description: string;
  region?: string;
  countryCode?: string;
  dueDate?: string;
  actionRequired: string;
  rule?: ComplianceRule;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  escalatedAt?: string;
  resolvedBy?: string;
}

export interface ComplianceScore {
  id: string;
  overallScore: number;
  taxAccuracy: number;
  filingStatus: number;
  pendingAlerts: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  calculatedAt: string;
  factors: {
    factor: string;
    score: number;
    weight: number;
  }[];
}

export interface TaxDeadline {
  id: string;
  country: string;
  countryCode: string;
  filingType: string;
  dueDate: string;
  status: "upcoming" | "due_soon" | "overdue" | "completed";
  alertSent: boolean;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceReport {
  id: string;
  period: string;
  country: string;
  countryCode: string;
  reportType: "vat" | "gst" | "sales_tax" | "1099";
  totalSales: number;
  totalTaxCollected: number;
  totalTaxRefunded: number;
  netTax: number;
  transactionCount: number;
  filingStatus: FilingStatus;
  filedAt?: string;
  acceptedAt?: string;
  generatedAt: string;
}

export interface ComplianceHistory {
  id: string;
  action: string;
  entityType: "alert" | "report" | "deadline" | "rule";
  entityId: string;
  description: string;
  performedBy: string;
  timestamp: string;
}

export interface TaxExemption {
  id: string;
  userId: string;
  exemptionType: "tax_free" | "verified_business" | "charity" | "government";
  taxId?: string;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StateTaxRule {
  id: string;
  countryCode: string;
  stateCode: string;
  stateName: string;
  taxRate: number;
  zipCodes?: string[];
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// GDPR / CCPA COMPLIANCE TYPES
// ============================================

export type DataRequestType = "access" | "delete" | "export";
export type DataRequestStatus = "pending" | "processing" | "completed" | "rejected" | "overdue";
export type RequestRegion = "eu" | "us_ca" | "us_other" | "global";
export type ConsentType = "marketing" | "data_processing" | "analytics" | "cookies";
export type PolicyDocumentType = "privacy_policy" | "terms_of_service" | "cookie_policy" | "dpa";
export type PolicyStatus = "active" | "archived" | "draft";

export interface DataRequest {
  id: string;
  requestId: string; // REQ-001, REQ-002
  userId: string;
  userEmail: string;
  type: DataRequestType;
  region: RequestRegion;
  status: DataRequestStatus;
  requestedAt: string;
  slaDueAt: string;
  slaDaysLeft: number;
  completedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  dataPackageUrl?: string;
  legalHold: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyVersion {
  id: string;
  documentType: PolicyDocumentType;
  version: string; // v1, v2, v3
  region?: string;
  status: PolicyStatus;
  publishedAt: string;
  keyChanges: string[];
  content: string;
  publishedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string;
  grantedAt: string;
  revokedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalHold {
  id: string;
  userId: string;
  reason: string;
  appliedBy: string;
  appliedAt: string;
  releasedAt?: string;
  releasedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAudit {
  id: string;
  entityType: "data_request" | "policy" | "consent" | "legal_hold";
  entityId: string;
  action: string;
  performedBy: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface DataDiscoveryResult {
  userId: string;
  tables: {
    tableName: string;
    recordCount: number;
    fields: string[];
  }[];
  totalRecords: number;
  discoveredAt: string;
}

// ============================================
// ML FRAUD DETECTION TYPES
// ============================================

export type ModelStatus = "training" | "deployed" | "deprecated" | "failed";
export type PredictionOutcome = "true_positive" | "true_negative" | "false_positive" | "false_negative";
export type FraudReviewStatus = "pending" | "in_review" | "approved" | "blocked" | "escalated";
export type ReviewPriority = "low" | "medium" | "high" | "critical";

export interface MLModel {
  id: string;
  version: string; // v2.4.1
  status: ModelStatus;
  precision: number;
  recall: number;
  f1Score: number;
  threshold: number; // risk cutoff
  deployedAt: string;
  trainedAt: string;
  driftDetected: boolean;
  features: string[];
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ModelPrediction {
  id: string;
  modelVersion: string;
  transactionId: string;
  customerId: string;
  riskScore: number; // 0-100
  signals: {
    feature: string;
    value: number;
    contribution: number;
  }[];
  modelDecision: "approve" | "block" | "review";
  latency: number; // ms
  timestamp: string;
}

export interface ConfusionMatrix {
  id: string;
  modelVersion: string;
  period: string; // 24h, 7d, 30d
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  precision: number;
  recall: number;
  f1Score: number;
  calculatedAt: string;
}

export interface FeatureImportance {
  id: string;
  modelVersion: string;
  features: {
    name: string;
    importance: number;
    trend: "up" | "down" | "stable";
  }[];
  calculatedAt: string;
}

export interface FraudReviewQueueItem {
  id: string;
  transactionId: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  riskScore: number;
  reason: string;
  signals: string[];
  assignedTo?: string;
  assignedAt?: string;
  queuedAt: string;
  slaDueAt: string;
  status: FraudReviewStatus;
  priority: ReviewPriority;
  analystDecision?: "approve" | "block" | "escalate";
  decisionAt?: string;
  decisionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalystPerformance {
  id: string;
  analystId: string;
  period: string;
  totalReviewed: number;
  accuracy: number;
  avgReviewTime: number; // minutes
  falsePositiveRate: number;
  falseNegativeRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModelDriftAlert {
  id: string;
  modelVersion: string;
  driftType: "concept" | "data" | "performance";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  actionTaken?: string;
}

export interface MarketplaceFeaturedSlot {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface MarketplaceFeaturedSlotCreateInput {
  itemId: string;
  priority: number;
  startDate: string;
  endDate: string;
}

export interface DMCARequest {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  requesterName: string;
  requesterEmail: string;
  description: string;
  evidenceUrl?: string;
  status: "pending" | "investigating" | "approved" | "rejected";
  actionTaken?: "item_removed" | "author_warned" | "author_banned" | "none";
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface DMCARequestCreateInput {
  itemId: string;
  requesterName: string;
  requesterEmail: string;
  description: string;
  evidenceUrl?: string;
}

export interface SalesReport {
  id: string;
  periodStart: string;
  periodEnd: string;
  gmv: number;
  aov: number; // Average Order Value
  totalOrders: number;
  totalRefunds: number;
  refundRate: number;
  topItems: Array<{ itemId: string; itemName: string; sales: number; revenue: number }>;
  topAuthors: Array<{ authorId: string; authorName: string; sales: number; revenue: number }>;
  categoryBreakdown: Array<{ category: string; sales: number; revenue: number }>;
  regionBreakdown: Array<{ region: string; sales: number; revenue: number }>;
  generatedAt: string;
}

// ============================================
// REVIEW QUEUE TYPES
// ============================================

export type ReviewStatus = "pending" | "soft_rejected" | "rejected" | "approved";

export type QualityScanStatus = "pending" | "passed" | "warning" | "failed";

export type QualityScanIssue = "code_errors" | "malware" | "missing_files" | "license_invalid" | "large_file" | "invalid_format";

export interface QualityScan {
  id: string;
  itemId: string;
  status: QualityScanStatus;
  issues: QualityScanIssue[];
  scanResult: string;
  scannedAt: string;
  scannedBy: string;
}

export interface ReviewLog {
  id: string;
  itemId: string;
  reviewerId: string;
  reviewerName: string;
  action: "approved" | "soft_rejected" | "rejected";
  notes: string;
  previousStatus: ReviewStatus;
  newStatus: ReviewStatus;
  createdAt: string;
}

export interface ReviewQueueItem {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  category: string;
  price: number;
  currency: string;
  status: ReviewStatus;
  submittedAt: string;
  lastUpdated: string;
  tags: string[];
  qualityScan?: QualityScan;
  reviewLogs: ReviewLog[];
  isSelected: boolean;
}

// ============================================
// CONFIG SYNC TYPES
// ============================================

export type ConfigChangeRisk = "low" | "medium" | "critical";
export type ConfigChangeStatus = "pending" | "validated" | "applied" | "failed" | "rolled_back";
export type NodeStatus = "online" | "offline" | "degraded" | "isolated";
export type SyncStatus = "synced" | "pending" | "failed" | "stale";

export interface ConfigChange {
  id: string;
  version: string;
  previousVersion: string;
  configKey: string;
  configValue: Record<string, unknown>;
  previousValue: Record<string, unknown>;
  affectedServices: string[];
  affectedAPIs: string[];
  riskLevel: ConfigChangeRisk;
  status: ConfigChangeStatus;
  signature: string;
  appliedBy: string;
  appliedAt: string;
  rollbackVersion?: string;
  rollbackAt?: string;
  failureReason?: string;
  propagationStatus: Map<string, SyncStatus>;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigChangeCreateInput {
  configKey: string;
  configValue: Record<string, unknown>;
  appliedBy: string;
}

export interface ConfigVersion {
  id: string;
  version: string;
  config: Record<string, unknown>;
  signature: string;
  createdAt: string;
  createdBy: string;
}

export interface NodeInfo {
  id: string;
  name: string;
  region: string;
  status: NodeStatus;
  currentVersion: string;
  syncStatus: SyncStatus;
  lastSyncAt: string;
  latency: number;
  syncLag: number;
  isolatedAt?: string;
  lastHealthCheck: string;
}

export interface SyncQueueItem {
  id: string;
  nodeId: string;
  configVersion: string;
  status: SyncStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigSyncKPI {
  totalChanges: number;
  pendingChanges: number;
  appliedChanges: number;
  failedChanges: number;
  rolledBackChanges: number;
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  staleNodes: number;
  isolatedNodes: number;
  avgSyncLag: number;
  avgLatency: number;
}

export interface DependencyChain {
  configKey: string;
  dependsOn: string[];
  conflictsWith: string[];
}

// ============================================
// API SELF-TEST TYPES
// ============================================

export type TestStatus = "pending" | "running" | "passed" | "failed" | "skipped";
export type FailureType = "timeout" | "auth_failure" | "db_error" | "dependency_failure" | "validation_error" | "security_issue" | "unknown";
export type FixAction = "restart_service" | "cache_reset" | "retry_request" | "circuit_breaker_reset" | "rollback" | "manual_intervention";

export interface ApiTest {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  region: string;
  testInterval: number; // seconds
  status: TestStatus;
  lastRunAt: string;
  nextRunAt: string;
  expectedStatusCode: number;
  expectedSchema?: Record<string, unknown>;
  maxResponseTime: number; // ms
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTestCreateInput {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  region: string;
  testInterval: number;
  expectedStatusCode: number;
  expectedSchema?: Record<string, unknown>;
  maxResponseTime: number;
}

export interface TestResult {
  id: string;
  testId: string;
  endpoint: string;
  region: string;
  status: TestStatus;
  statusCode: number;
  responseTime: number;
  responseSize: number;
  validationPassed: boolean;
  errorMessage?: string;
  failureType?: FailureType;
  executedAt: string;
}

export interface FailureRecord {
  id: string;
  testId: string;
  endpoint: string;
  region: string;
  failureType: FailureType;
  failureCount: number;
  firstFailureAt: string;
  lastFailureAt: string;
  rootCause?: string;
  linkedConfigChange?: string;
  linkedDeployment?: string;
  fixAction?: FixAction;
  fixAppliedAt?: string;
  fixResult?: "success" | "failed" | "pending";
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DependencyHealth {
  id: string;
  name: string;
  type: "database" | "cache" | "api" | "service";
  status: "healthy" | "degraded" | "down";
  latency: number;
  lastCheckAt: string;
  uptime: number; // percentage
}

export interface PerformanceMetrics {
  id: string;
  endpoint: string;
  region: string;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalRequests: number;
  successRate: number;
  errorRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface ApiSelfTestKPI {
  totalTests: number;
  activeTests: number;
  passedTests: number;
  failedTests: number;
  avgResponseTime: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalFailures: number;
  resolvedFailures: number;
  activeFailures: number;
  healthyDependencies: number;
  degradedDependencies: number;
  downDependencies: number;
}

// ============================================
// MEMORY RECOVERY TYPES
// ============================================

export type SnapshotStatus = "active" | "expired" | "corrupted" | "pending";
export type RecoveryStatus = "full" | "partial" | "failed" | "in_progress";
export type RecoveryFailureType = "oom" | "deadlock" | "network_cascade" | "crash" | "timeout" | "unknown";
export type RecoveryAction = "restore" | "retry" | "manual_intervention" | "auto_fix";

export interface SnapshotConfig {
  id: string;
  service: string;
  frequency: number; // ms
  retentionWindow: number; // seconds
  priority: "low" | "medium" | "high" | "critical";
  adaptive: boolean;
  loadAware: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  service: string;
  version: string;
  createdAt: string;
  size: number; // bytes
  status: SnapshotStatus;
  checksum: string;
  metadata: Record<string, unknown>;
  retentionUntil: string;
}

export interface RecoveryEvent {
  id: string;
  service: string;
  failureType: RecoveryFailureType;
  crashReason: string;
  timestamp: string;
  snapshotId: string;
  snapshotAge: number; // seconds
  recoveryStatus: RecoveryStatus;
  recoveryAction: RecoveryAction;
  rootCause?: string;
  sessionRestored: boolean;
  dataConsistent: boolean;
  retryCount: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RootCauseAnalysis {
  id: string;
  eventId: string;
  failureType: RecoveryFailureType;
  detectedCause: string;
  confidence: number; // 0-1
  evidence: string[];
  suggestedFix: string;
  autoFixApplied: boolean;
  analyzedAt: string;
}

export interface FailurePattern {
  id: string;
  service: string;
  failureType: RecoveryFailureType;
  pattern: string;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  frequency: number; // occurrences per day
  severity: "low" | "medium" | "high" | "critical";
  preventionStrategy: string;
  autoPreventionEnabled: boolean;
}

export interface RecoveryKPI {
  totalSnapshots: number;
  activeSnapshots: number;
  corruptedSnapshots: number;
  totalRecoveryEvents: number;
  fullRecoveries: number;
  partialRecoveries: number;
  failedRecoveries: number;
  avgSnapshotAge: number;
  avgRecoveryTime: number;
  servicesWithCoverage: number;
  servicesWithoutCoverage: number;
  patternsDetected: number;
  autoFixesApplied: number;
}

export interface ConfigDrift {
  id: string;
  nodeId: string;
  configKey: string;
  expectedValue: Record<string, unknown>;
  actualValue: Record<string, unknown>;
  detectedAt: string;
  severity: "low" | "medium" | "high" | "critical";
  autoCorrected: boolean;
  correctedAt?: string;
}

export interface CanaryDeployment {
  id: string;
  configVersion: string;
  targetNodes: string[];
  rolloutPercentage: number;
  status: "pending" | "rolling_out" | "completed" | "rolled_back";
  startedAt: string;
  completedAt?: string;
  rollbackAt?: string;
  successRate: number;
}

export interface ConfigLock {
  id: string;
  configKey: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
  reason: string;
}

// ============================================
// COST GOVERNOR TYPES
// ============================================

export type WasteType = "compute" | "storage" | "network" | "database" | "orphan";
export type WasteSeverity = "low" | "medium" | "critical";
export type WasteAction = "terminate" | "downsize" | "archive" | "release" | "ignore";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "auto_approved";
export type ActionStatus = "pending" | "executing" | "completed" | "failed" | "rolled_back";

export interface WasteItem {
  id: string;
  resourceId: string;
  resourceType: string;
  wasteType: WasteType;
  severity: WasteSeverity;
  monthlyWasteCost: number; // USD
  impactPercentage: number; // % of total cost
  suggestedAction: WasteAction;
  reason: string;
  detectedAt: string;
  lastAccessedAt: string;
  cpuUtilization: number; // %
  memoryUtilization: number; // %
  accessFrequency: number; // requests per day
  dependencies: string[]; // dependent resource IDs
  autoFixEligible: boolean;
  status: "active" | "ignored" | "fixed";
  createdAt: string;
  updatedAt: string;
}

export interface WasteActionRequest {
  id: string;
  wasteItemId: string;
  action: WasteAction;
  requestedBy: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  actionStatus: ActionStatus;
  executedAt?: string;
  rollbackAt?: string;
  savingsBefore: number; // USD
  savingsAfter: number; // USD
  actualSavings: number; // USD
  validationPassed: boolean;
  dependencyCheckPassed: boolean;
  usagePredictionPassed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsForecast {
  id: string;
  period: string; // "month", "quarter", "year"
  projectedSavings: number; // USD
  confidence: number; // 0-1
  basedOnItems: string[]; // waste item IDs
  createdAt: string;
}

export interface CostGovernorKPI {
  totalWasteItems: number;
  totalMonthlyWaste: number;
  computeWaste: number;
  storageWaste: number;
  networkWaste: number;
  databaseWaste: number;
  orphanWaste: number;
  criticalSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  autoFixEligible: number;
  pendingActions: number;
  completedActions: number;
  totalSavings: number;
  projectedSavings: number;
}

export interface DependencyGraph {
  resourceId: string;
  dependsOn: string[]; // resources this depends on
  dependents: string[]; // resources that depend on this
  lastUpdated: string;
}

export interface UsagePrediction {
  resourceId: string;
  predictedUsage: number; // CPU/memory %
  confidence: number; // 0-1
  timeframe: string; // "7d", "30d", "90d"
  reason: string;
}

export interface IgnoreRule {
  id: string;
  resourceId: string;
  reason: string;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// ENHANCED MEMORY RECOVERY TYPES
// ============================================

export interface SnapshotIntegrity {
  snapshotId: string;
  checksumValid: boolean;
  corruptionDetected: boolean;
  validatedAt: string;
}

export interface SnapshotVersion {
  id: string;
  service: string;
  version: string;
  createdAt: string;
  isLatest: boolean;
  isRestorable: boolean;
  restorePointRank: number; // 1 = latest, higher = older
}

export interface MemoryLeakDetection {
  id: string;
  service: string;
  detectedAt: string;
  memoryGrowthRate: number; // MB/hour
  thresholdExceeded: boolean;
  severity: "low" | "medium" | "high" | "critical";
  suggestedAction: string;
  autoFixApplied: boolean;
}

// ============================================
// DIGITAL TWIN TYPES
// ============================================

export type SimulationStatus = "running" | "passed" | "failed" | "blocked";
export type MirrorHealthStatus = "healthy" | "degraded" | "failed";
export type MirrorSyncStatus = "synced" | "syncing" | "out_of_sync" | "failed";

export interface SimulationHistory {
  id: string;
  simulationId: string;
  changeType: string;
  initiatedBy: string;
  timestamp: string;
  duration: number; // ms
  servicesImpacted: string[];
  status: SimulationStatus;
  codeVersion: string;
  rootCause?: string;
  errorLogs?: string[];
  impactedModules?: string[];
  retryCount: number;
  blocked: boolean;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationScore {
  simulationId: string;
  stability: number; // 0-100
  performance: number; // 0-100
  risk: number; // 0-100
  overall: number; // 0-100
  calculatedAt: string;
}

export interface ImpactHeatmap {
  serviceId: string;
  serviceName: string;
  impactLevel: "low" | "medium" | "high" | "critical";
  affectedCount: number;
  lastAffected: string;
}

export interface MirrorHealth {
  id: string;
  serviceId: string;
  serviceName: string;
  syncLag: number; // ms
  lastSync: string;
  healthStatus: MirrorHealthStatus;
  syncStatus: MirrorSyncStatus;
  driftDetected: boolean;
  driftDetails?: string;
  heartbeatStatus: "alive" | "down" | "unresponsive";
  lastHeartbeat: string;
  nodeCount: number;
  healthyNodes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriftDetection {
  id: string;
  serviceId: string;
  detectedAt: string;
  driftType: "data" | "config" | "schema" | "traffic";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  autoFixed: boolean;
  fixedAt?: string;
  affectedModules: string[];
}

export interface SyncValidation {
  id: string;
  serviceId: string;
  validatedAt: string;
  dataIntegrity: boolean;
  configMatch: boolean;
  trafficMatch: boolean;
  snapshotValid: boolean;
  latency: number; // ms
  errors: string[];
  passed: boolean;
}

export interface DigitalTwinKPI {
  totalSimulations: number;
  passedSimulations: number;
  failedSimulations: number;
  blockedSimulations: number;
  avgDuration: number;
  healthyMirrors: number;
  degradedMirrors: number;
  failedMirrors: number;
  avgSyncLag: number;
  driftDetected: number;
  driftAutoFixed: number;
  avgScore: number;
}

export interface SafeConfig {
  id: string;
  serviceId: string;
  configType: string;
  parameters: Record<string, unknown>;
  generatedAt: string;
  safetyScore: number; // 0-100
  recommended: boolean;
}

export interface SecuritySimulationLog {
  id: string;
  simulationId: string;
  attackType: string;
  timestamp: string;
  detected: boolean;
  severity: "low" | "medium" | "high" | "critical";
  response: string;
  mitigated: boolean;
}

// ============================================
// TAX ENGINE TYPES
// ============================================

export type SettingsTaxType = "sales_tax" | "vat" | "gst" | "hst" | "custom";
export type TaxCalculationType = "inclusive" | "exclusive";

export interface TaxRule {
  id: string;
  region: string;
  country: string;
  state?: string;
  taxType: SettingsTaxType;
  percentage: number;
  calculationType: TaxCalculationType;
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  complianceVersion: string;
}

export interface TaxCalculation {
  id: string;
  userId: string;
  country: string;
  state?: string;
  amount: number;
  currency: string;
  taxRules: TaxRule[];
  totalTax: number;
  totalAmount: number;
  breakdown: {
    ruleId: string;
    taxType: SettingsTaxType;
    percentage: number;
    taxAmount: number;
  }[];
  calculatedAt: string;
  validated: boolean;
}

export interface TaxMismatch {
  id: string;
  invoiceId: string;
  expectedTax: number;
  actualTax: number;
  difference: number;
  detectedAt: string;
  autoCorrected: boolean;
  correctedAt?: string;
  reason: string;
}

// ============================================
// EMAIL SYSTEM TYPES
// ============================================

export type EmailTemplateType = "payment_receipt" | "subscription_created" | "subscription_canceled" | "payment_failed" | "license_activated" | "custom";

export type EmailDeliveryStatus = "pending" | "sent" | "delivered" | "failed" | "bounced";
export type EmailProvider = "smtp" | "sendgrid" | "ses" | "mailgun" | "fallback";

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailVariable {
  key: string;
  value: string;
  isSensitive: boolean;
}

export interface EmailDelivery {
  id: string;
  templateId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  provider: EmailProvider;
  status: EmailDeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  fallbackUsed: boolean;
  duplicatesPrevented: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailQueue {
  id: string;
  templateId: string;
  recipientEmail: string;
  recipientName: string;
  variables: Record<string, string>;
  priority: "low" | "medium" | "high" | "urgent";
  scheduledFor?: string;
  status: "queued" | "processing" | "completed" | "failed";
  attempts: number;
  createdAt: string;
}

export interface SettingsKPI {
  totalTaxCalculations: number;
  taxMismatches: number;
  taxAutoCorrections: number;
  totalEmailsSent: number;
  emailsDelivered: number;
  emailsFailed: number;
  emailsRetried: number;
  fallbackDeliveries: number;
  avgDeliveryTime: number;
  activeTaxRules: number;
  activeEmailTemplates: number;
}

// ============================================
// DATA CONSISTENCY TYPES
// ============================================

export type IssueSeverity = "critical" | "blocked" | "pending" | "trailing";
export type IssueType = "order_payment_mismatch" | "subscription_entitlement" | "license_status_conflict" | "invoice_balance_mismatch" | "webhook_delivery_gap" | "custom";
export type IssueStatus = "detected" | "auto_fixed" | "pending" | "manual_required" | "failed" | "resolved";

export interface DataIssue {
  id: string;
  entityId: string;
  entityType: "order" | "subscription" | "license" | "invoice" | "webhook";
  issueType: IssueType;
  severity: IssueSeverity;
  description: string;
  detectedAt: string;
  status: IssueStatus;
  action: string;
  autoFixAttempted: boolean;
  autoFixSuccess: boolean;
  fixAttemptedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  retryCount: number;
  blockedReason?: string;
  dependencyId?: string;
  snapshotBeforeFix?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsistencyScore {
  id: string;
  calculatedAt: string;
  overallScore: number; // 0-100
  orderConsistency: number;
  subscriptionConsistency: number;
  licenseConsistency: number;
  invoiceConsistency: number;
  webhookConsistency: number;
  totalIssues: number;
  criticalIssues: number;
  resolvedIssues: number;
}

export interface PostRestoreReport {
  id: string;
  restoreId: string;
  scannedAt: string;
  issuesDetected: number;
  issuesFixed: number;
  issuesFailed: number;
  criticalBlocked: boolean;
  duration: number;
  status: "completed" | "failed" | "blocked";
}

// ============================================
// GLOBAL SETTINGS TYPES
// ============================================

export type ConfigEnvironment = "development" | "staging" | "production";

export interface GlobalConfig {
  id: string;
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "json";
  category: "platform" | "billing" | "tax" | "email" | "security";
  environment: ConfigEnvironment;
  isSensitive: boolean;
  encrypted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigVersion {
  id: string;
  configId: string;
  version: string;
  value: string;
  changedBy: string;
  changeReason: string;
  createdAt: string;
}

export interface ConfigChange {
  id: string;
  configId: string;
  key: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  environment: ConfigEnvironment;
  rollbackAvailable: boolean;
}

export interface ConfigValidation {
  id: string;
  configId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string;
}

export interface SettingsConfigDrift {
  id: string;
  configId: string;
  expectedValue: string;
  actualValue: string;
  detectedAt: string;
  service: string;
  autoSynced: boolean;
  syncedAt?: string;
}

export interface SettingsConsistencyKPI {
  totalIssues: number;
  criticalIssues: number;
  autoFixedIssues: number;
  manualRequiredIssues: number;
  consistencyScore: number;
  totalConfigs: number;
  configDrifts: number;
  configVersions: number;
  pendingChanges: number;
}

// ============================================
// RECOVERY LOG TYPES
// ============================================

export type RecoveryOutcome = "active" | "blocked" | "failed" | "pending" | "verified";
export type VerifyState = "verified" | "failed" | "retrying";
export type RecoveryLogFailureType = "execution_failure" | "verification_failure" | "timeout" | "dependency_failure";

export interface RecoveryLog {
  id: string;
  policy: string;
  service: string;
  trigger: string;
  action: string;
  outcome: RecoveryOutcome;
  duration: number; // ms
  message: string;
  timestamp: string;
  eventChain: string[]; // Links to related events
  verifyState?: VerifyState;
  verifyAttemptedAt?: string;
  retryCount: number;
  rollbackTriggered: boolean;
  rollbackAt?: string;
  failureType?: RecoveryLogFailureType;
  rootCause?: string;
  dependencyId?: string;
  stuckLoopDetected: boolean;
  escalated: boolean;
  escalatedAt?: string;
  manualOverride: boolean;
  manualOverrideBy?: string;
  immutable: boolean;
  createdAt: string;
}

export interface RecoveryEventChain {
  id: string;
  triggerId: string;
  events: string[]; // RecoveryLog IDs in sequence
  completed: boolean;
  completedAt?: string;
  stuck: boolean;
  stuckAt?: string;
  createdAt: string;
}

export interface RecoveryTrend {
  id: string;
  period: string; // "24h", "7d", "30d"
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  avgRecoveryTime: number;
  successRate: number;
  calculatedAt: string;
}

export interface FailureHeatmap {
  serviceId: string;
  serviceName: string;
  failureCount: number;
  avgRecoveryTime: number;
  lastFailure: string;
  trend: "improving" | "stable" | "degrading";
}

export interface RecoveryKPI {
  totalLogs: number;
  activeRecoveries: number;
  verifiedRecoveries: number;
  failedRecoveries: number;
  blockedRecoveries: number;
  avgRecoveryTime: number;
  successRate: number;
  stuckLoops: number;
  escalations: number;
  manualOverrides: number;
}

// ============================================
// ENHANCED DATA CONSISTENCY TYPES
// ============================================

export interface DataRelation {
  id: string;
  parentEntity: string;
  parentId: string;
  childEntity: string;
  childId: string;
  relationType: "one_to_one" | "one_to_many" | "many_to_many";
  validated: boolean;
  lastValidated: string;
  broken: boolean;
  brokenAt?: string;
}

export interface ConsistencyRule {
  id: string;
  name: string;
  parentEntity: string;
  childEntity: string;
  ruleType: "existence" | "uniqueness" | "value_match" | "reference_integrity";
  isActive: boolean;
  priority: number;
  coverage: string[]; // Modules covered
  createdAt: string;
}

export interface ConsistencyCheck {
  id: string;
  ruleId: string;
  checkedAt: string;
  issuesFound: number;
  issuesFixed: number;
  issuesFailed: number;
  duration: number;
  status: "completed" | "failed" | "partial";
}

export interface DataCoverage {
  module: string;
  totalRecords: number;
  checkedRecords: number;
  coveragePercentage: number;
  lastChecked: string;
  gaps: string[];
}

// ============================================
// CIRCUIT BREAKER EVENT TYPES
// ============================================

export type CircuitState = "closed" | "open" | "half_open" | "paused" | "active";
export type CircuitTransitionReason = "failure_threshold_exceeded" | "latency_spike" | "manual_reset" | "startup_initialization" | "success_probe" | "cooldown_expired" | "custom";

export interface CircuitStateChangeEvent {
  id: string;
  circuitName: string;
  service: string;
  fromState: CircuitState;
  toState: CircuitState;
  reason: CircuitTransitionReason;
  timestamp: string;
  rootCauseLinked: boolean;
  linkedLogIds: string[];
  manualResetBy?: string;
  immutable: boolean;
}

export interface CircuitRecoveryTrace {
  id: string;
  circuitName: string;
  service: string;
  failureTimestamp: string;
  openTimestamp: string;
  halfOpenTimestamp?: string;
  closedTimestamp?: string;
  recoveryDuration?: number;
  status: "in_progress" | "recovered" | "failed";
  probeAttempts: number;
  events: string[]; // CircuitStateChangeEvent IDs
}

export interface CircuitAnalytics {
  circuitName: string;
  service: string;
  stateChangeCount: number;
  failureCount: number;
  recoveryCount: number;
  avgRecoveryTime: number;
  currentState: CircuitState;
  lastStateChange: string;
  failurePattern: "stable" | "degrading" | "improving";
}

// ============================================
// AUTO-FIX RECOVERY ENGINE TYPES
// ============================================

export type RecoveryTrigger = "service_down" | "service_degraded" | "consistency_mismatch" | "security_event" | "config_corrupt" | "custom";
export type AutoFixRecoveryAction = "restart_service" | "failover_db" | "failover_payment" | "reconcile_data" | "block_ip" | "restore_config" | "custom";
export type PolicyState = "active" | "blocked" | "disabled";

export interface RecoveryPolicy {
  id: string;
  name: string;
  trigger: RecoveryTrigger;
  action: AutoFixRecoveryAction;
  cooldown: number; // seconds
  priority: number;
  state: PolicyState;
  lastExecuted?: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  dependencies: string[]; // Other policy IDs to run first
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryExecution {
  id: string;
  policyId: string;
  trigger: RecoveryTrigger;
  action: AutoFixRecoveryAction;
  service: string;
  status: "executing" | "success" | "failed" | "retrying";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  fallbackUsed: boolean;
  fallbackAction?: AutoFixRecoveryAction;
  verified: boolean;
  verificationFailed: boolean;
  manualOverride: boolean;
  manualOverrideBy?: string;
  linkedEventIds: string[]; // Links to circuit events, health logs, etc.
}

export interface RecoveryMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgRecoveryTime: number;
  successRate: number;
  cooldownSkips: number;
  stuckRecoveries: number;
  priorityExecutions: number;
  dependencyAwareExecutions: number;
}

// ============================================
// SYSTEM HEALTH TYPES
// ============================================

export type ServiceStatus = "active" | "degraded" | "down";
export type JobStatus = "pending" | "processing" | "completed" | "failed" | "stuck" | "dead";

export interface ServiceHealth {
  id: string;
  serviceName: string;
  status: ServiceStatus;
  currentLatency: number; // ms
  latencyHistory: number[]; // last 12 checks
  uptime: number; // percentage
  uptimeSince: string;
  failureCount: number;
  lastFailure?: string;
  autoRestartCount: number;
  lastRestart?: string;
  isStuck: boolean;
  stuckDetectedAt?: string;
  dependencyStatus: string[]; // Linked services status
  createdAt: string;
  updatedAt: string;
}

export interface JobQueueHealth {
  id: string;
  queueName: string;
  status: ServiceStatus;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  stuckJobs: number;
  deadJobs: number;
  queueDepth: number;
  workerCount: number;
  maxWorkers: number;
  autoScaled: boolean;
  lastAutoScale?: string;
  jobLossPrevention: boolean;
  avgProcessingTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGatewayHealth {
  id: string;
  gatewayName: string;
  status: ServiceStatus;
  isPrimary: boolean;
  totalRequests: number;
  successfulPayments: number;
  failedPayments: number;
  successRate: number;
  currentLatency: number;
  avgLatency: number;
  lastFailure?: string;
  failoverCount: number;
  lastFailover?: string;
  retryCount: number;
  fallbackUsed: boolean;
  isFastest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SLOValidation {
  id: string;
  serviceName: string;
  latencyThreshold: number; // ms
  uptimeThreshold: number; // percentage
  currentLatency: number;
  currentUptime: number;
  latencyBreach: boolean;
  uptimeBreach: boolean;
  breachDetectedAt?: string;
  lastValidated: string;
}

export interface SystemHealthKPI {
  totalServices: number;
  activeServices: number;
  degradedServices: number;
  downServices: number;
  avgLatency: number;
  avgUptime: number;
  totalJobs: number;
  stuckJobs: number;
  paymentSuccessRate: number;
  autoRecoveryCount: number;
}

// ============================================
// CIRCUIT BREAKER TYPES
// ============================================

export type CircuitBreakerState = "closed" | "open" | "half_open";
export type CircuitBreakerService = "api_gateway" | "database" | "job_queue" | "payment_gateway" | "external_api";

export interface CircuitBreaker {
  id: string;
  name: string;
  service: CircuitBreakerService;
  state: CircuitBreakerState;
  failureThreshold: number;
  currentFailures: number;
  errorRate: number;
  errorRateThreshold: number;
  latencyThreshold: number;
  currentLatency: number;
  totalCalls: number;
  rejectedCalls: number;
  cooldownPeriod: number; // seconds
  lastStateChange: string;
  lastTrip?: string;
  lastRecovery?: string;
  manualResetCount: number;
  lastManualReset?: string;
  isStuck: boolean;
  stuckDetectedAt?: string;
  autoHealScore: number; // 0-100
  dependencyBreakerId?: string; // Upstream breaker
  createdAt: string;
  updatedAt: string;
}

export interface CircuitBreakerConfig {
  id: string;
  breakerId: string;
  failureThreshold: number;
  errorRateThreshold: number;
  latencyThreshold: number;
  cooldownPeriod: number;
  halfOpenMaxCalls: number;
  enabled: boolean;
  updatedAt: string;
}

export interface CircuitBreakerMetrics {
  id: string;
  breakerId: string;
  period: string; // "1h", "24h", "7d"
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  rejectedCalls: number;
  avgLatency: number;
  tripCount: number;
  recoveryCount: number;
  autoHealScore: number;
  calculatedAt: string;
}

// ============================================
// BACKUP HISTORY TYPES
// ============================================

export type BackupType = "full" | "incremental";
export type BackupStatus = "completed" | "failed" | "in_progress";

export interface Backup {
  id: string;
  name: string;
  type: BackupType;
  status: BackupStatus;
  timestamp: string;
  duration: number; // seconds
  size: number; // bytes
  checksum: string;
  isCorrupt: boolean;
  corruptDetectedAt?: string;
  parentBackupId?: string; // For incremental backups
  storageLocation: string;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestoreLog {
  id: string;
  backupId: string;
  restoredBy: string;
  restoredAt: string;
  duration: number;
  status: "success" | "failed" | "rolled_back";
  rollbackTriggered: boolean;
  rollbackAt?: string;
  errorMessage?: string;
  tempSnapshotId?: string;
}

export interface DownloadLog {
  id: string;
  backupId: string;
  downloadedBy: string;
  downloadedAt: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
}

export interface BackupChain {
  fullBackupId: string;
  incrementalBackupIds: string[];
  chainValid: boolean;
  lastValidated: string;
  missingBackups: string[];
}

// ============================================
// INCIDENT MANAGEMENT TYPES
// ============================================

export type IncidentPriority = "critical" | "high" | "normal" | "low";
export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

export interface Incident {
  id: string;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  service: string;
  startedAt: string;
  resolvedAt?: string;
  duration?: number;
  rootCause?: string;
  assignedTo?: string;
  affectedServices: string[];
  autoResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SLO/SLA TYPES
// ============================================

export interface SLO {
  id: string;
  serviceName: string;
  metricName: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string; // "24h", "7d", "30d"
  isBreached: boolean;
  breachDetectedAt?: string;
  lastCalculated: string;
}

export interface SLA {
  id: string;
  customerName: string;
  sloIds: string[];
  overallCompliance: number; // percentage
  isBreached: boolean;
  breachPenalty?: number;
  period: string;
  lastCalculated: string;
}

// ============================================
// ALERT TYPES
// ============================================

export type SystemAlertType = "failure" | "latency_spike" | "slo_breach" | "security" | "custom";
export type SystemAlertStatus = "open" | "acknowledged" | "resolved";
export type AlertChannel = "email" | "webhook" | "slack" | "sms";

export interface SystemAlert {
  id: string;
  type: SystemAlertType;
  title: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  status: SystemAlertStatus;
  service: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  channels: AlertChannel[];
  sentCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationEventType = "merchant_signup" | "payment_dispute" | "subscription_cancel" | "webhook_failed" | "report_generated" | "anomaly_detected" | "system_alert" | "custom";
export type NotificationPriority = "critical" | "high" | "normal" | "low";
export type NotificationStatus = "unread" | "read" | "resolved";

export interface Notification {
  id: string;
  type: NotificationEventType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  timestamp: string;
  userId?: string;
  metadata: Record<string, unknown>;
  groupId?: string; // For grouped events
  linkedLogIds: string[]; // Links to API logs, audit logs
  autoResolved: boolean;
  resolvedAt?: string;
  failureRootCause?: "timeout" | "invalid_payload" | "auth_error" | "unknown";
  retryCount: number;
  escalated: boolean;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationGroup {
  id: string;
  type: NotificationEventType;
  title: string;
  count: number;
  notificationIds: string[];
  earliestTimestamp: string;
  latestTimestamp: string;
  priority: NotificationPriority;
  status: NotificationStatus;
}

export interface NotificationAnalytics {
  totalNotifications: number;
  unreadCount: number;
  criticalCount: number;
  highCount: number;
  normalCount: number;
  lowCount: number;
  eventFrequency: Record<NotificationEventType, number>;
  failureRate: number;
  avgAlertLatency: number;
}

// ============================================
// BACKUP & RESTORE TYPES
// ============================================

export type BackupOperationType = "full" | "incremental" | "manual";
export type BackupOperationStatus = "pending" | "running" | "completed" | "failed" | "partial";
export type RestoreType = "full" | "partial";

export interface BackupOperation {
  id: string;
  type: BackupOperationType;
  status: BackupOperationStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  size: number;
  checksum: string;
  isCorrupt: boolean;
  corruptDetectedAt?: string;
  storageLocation: string;
  encrypted: boolean;
  retryCount: number;
  maxRetries: number;
  fallbackUsed: boolean;
  fallbackLocation?: string;
  snapshotBeforeRestore?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestoreOperation {
  id: string;
  backupOperationId: string;
  type: RestoreType;
  status: BackupOperationStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  modules?: string[]; // For partial restore
  snapshotId: string;
  rollbackTriggered: boolean;
  rollbackAt?: string;
  errorMessage?: string;
  restoredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupSchedule {
  id: string;
  type: BackupOperationType;
  frequency: "daily" | "weekly" | "monthly";
  nextRun: string;
  lastRun?: string;
  enabled: boolean;
  retentionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackupAnalytics {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  partialBackups: number;
  avgBackupTime: number;
  avgBackupSize: number;
  successRate: number;
  storageUsed: number;
  storageCapacity: number;
  retentionCompliance: number;
}

// ============================================
// SECURITY TYPES
// ============================================

export type IPType = "ipv4" | "ipv6";
export type IPStatus = "active" | "blocked" | "pending";

export interface IPAllowlistEntry {
  id: string;
  ipAddress: string;
  type: IPType;
  status: IPStatus;
  userId?: string;
  description?: string;
  addedBy: string;
  addedAt: string;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HMACSecret {
  id: string;
  name: string;
  secret: string; // Encrypted
  algorithm: "sha256" | "sha512";
  isActive: boolean;
  lastRotated: string;
  nextRotation: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HMACSignature {
  id: string;
  payload: string;
  signature: string;
  timestamp: string;
  nonce: string;
  secretId: string;
  verified: boolean;
  createdAt: string;
}

export type FraudRuleType = "transaction_limit" | "rapid_retry" | "geo_mismatch" | "velocity_check" | "custom";
export type FraudAction = "block" | "flag" | "alert" | "challenge";

export interface FraudRule {
  id: string;
  name: string;
  type: FraudRuleType;
  enabled: boolean;
  conditions: Record<string, unknown>;
  action: FraudAction;
  severity: "low" | "medium" | "high" | "critical";
  triggeredCount: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FraudDetection {
  id: string;
  ruleId: string;
  userId?: string;
  transactionId?: string;
  detectedAt: string;
  actionTaken: FraudAction;
  reason: string;
  metadata: Record<string, unknown>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SecurityEvent {
  id: string;
  type: "ip_block" | "hmac_failure" | "fraud_detected" | "brute_force" | "api_abuse" | "token_misuse";
  severity: "low" | "medium" | "high" | "critical";
  sourceIp?: string;
  userId?: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================
// ALERT ORCHESTRATION TYPES
// ============================================

export type AlertChannelType = "email" | "webhook" | "slack";
export type AlertDeliveryPriority = "critical" | "high" | "normal" | "low";
export type AlertDeliveryStatus = "queued" | "sent" | "failed" | "retrying" | "delivered";

export interface AlertEvent {
  id: string;
  eventType: string;
  priority: AlertDeliveryPriority;
  payload: Record<string, unknown>;
  channels: AlertChannelType[];
  scheduledFor?: string;
  createdAt: string;
}

export interface AlertDelivery {
  id: string;
  alertEventId: string;
  channel: AlertChannelType;
  status: AlertDeliveryStatus;
  recipient: string;
  attemptCount: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  errorMessage?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertChannelConfig {
  id: string;
  type: AlertChannelType;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AlertAnalytics {
  totalAlerts: number;
  sentCount: number;
  failedCount: number;
  retryingCount: number;
  deliveredCount: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  channelPerformance: Record<AlertChannelType, { sent: number; failed: number; successRate: number }>;
}

// ============================================
// AUDIT LOG TABLE TYPES
// ============================================

export type ActorType = "user" | "admin" | "system" | "ai";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AuditOrigin = "api" | "ui" | "system" | "webhook";

export interface AuditLogEntry {
  id: string;
  eventId: string;
  traceId: string;
  sessionId: string;
  correlationId: string; // Cross-module link
  action: string;
  entityType: string;
  entityId: string;
  actorType: ActorType;
  actorId: string;
  actorName: string;
  origin: AuditOrigin;
  changes: Record<string, { from: unknown; to: unknown }>;
  versionBefore?: string;
  versionAfter?: string;
  riskLevel: RiskLevel;
  ipAddress?: string;
  deviceFingerprint?: string;
  country?: string;
  region?: string;
  headers?: Record<string, string>;
  payload?: Record<string, unknown>;
  isAnomalous: boolean;
  anomalyReason?: string;
  autoLocked: boolean;
  timestamp: string;
  timezone: string;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
}

export interface AuditLogChain {
  id: string;
  traceId: string;
  entryIds: string[];
  actionSequence: string[];
  startTime: string;
  endTime: string;
  duration: number;
  isComplete: boolean;
  missingActions: string[];
}

export interface AuditLogDiff {
  field: string;
  before: unknown;
  after: unknown;
  changeType: "added" | "removed" | "modified";
}

export interface AuditLogAnalytics {
  totalEntries: number;
  archivedEntries: number;
  activeEntries: number;
  highRiskCount: number;
  anomalousCount: number;
  autoLockedCount: number;
  actorBreakdown: Record<ActorType, number>;
  originBreakdown: Record<AuditOrigin, number>;
  actionFrequency: Record<string, number>;
}

// ============================================
// ENHANCED SECURITY TYPES
// ============================================

export type TwoFactorMethod = "totp" | "email_otp" | "backup_codes";
export type KeyScope = "read" | "write" | "admin";
export type KeyStatus = "active" | "revoked" | "expired" | "leaked";

export interface TwoFactorConfig {
  id: string;
  userId: string;
  enabled: boolean;
  method: TwoFactorMethod;
  secret: string; // Encrypted
  backupCodes: string[]; // Encrypted
  enforced: boolean; // Mandatory for admin
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionId: string;
  ipAddress: string;
  deviceFingerprint: string;
  userAgent: string;
  country?: string;
  region?: string;
  startedAt: string;
  lastActivity: string;
  isActive: boolean;
  revokedAt?: string;
  revokedBy?: string;
  createdAt: string;
}

export interface APIKey {
  id: string;
  name: string;
  key: string; // Encrypted
  keyPrefix: string; // For display (e.g., "sk_live_...")
  userId: string;
  scopes: KeyScope[];
  status: KeyStatus;
  lastUsed?: string;
  expiresAt?: string;
  rotationScheduled?: string;
  leakDetected?: string;
  leakedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityThreat {
  id: string;
  type: "brute_force" | "api_abuse" | "token_misuse" | "key_leak" | "geo_anomaly";
  severity: RiskLevel;
  sourceIp?: string;
  userId?: string;
  description: string;
  actionTaken: "blocked" | "flagged" | "revoked" | "alerted";
  autoResponse: boolean;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface GeoRestriction {
  id: string;
  country: string;
  region?: string;
  allowed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API REQUEST TABLE TYPES
// ============================================

export type HTTPMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
export type HTTPStatus = 200 | 201 | 400 | 401 | 403 | 404 | 422 | 429 | 500 | 502 | 503;
export type RequestStatus = "pending" | "processing" | "completed" | "failed" | "retrying";

export interface APIRequest {
  id: string;
  traceId: string;
  requestId: string;
  userId?: string;
  merchantId?: string;
  method: HTTPMethod;
  endpoint: string;
  path: string;
  headers: Record<string, string>;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  statusCode: HTTPStatus;
  status: RequestStatus;
  latency: number; // ms
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  errorRootCause?: string;
  isSlow: boolean;
  isSuspicious: boolean;
  suspiciousReason?: string;
  retryCount: number;
  maxRetries: number;
  autoRetried: boolean;
  timestamp: string;
  createdAt: string;
}

export interface APIRequestAnalytics {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  avgLatency: number;
  slowRequestCount: number;
  suspiciousRequestCount: number;
  methodBreakdown: Record<HTTPMethod, number>;
  statusBreakdown: Record<HTTPStatus, number>;
}

// ============================================
// SYSTEM AUDIT LOG TYPES
// ============================================

export type SystemAuditAction = "login" | "logout" | "create" | "update" | "delete" | "view" | "export" | "permission_change" | "data_deletion" | "payment_action";
export type AuditRole = "admin" | "manager" | "user" | "system";

export interface SystemAuditLog {
  id: string;
  eventId: string;
  traceId: string;
  sessionId: string;
  action: SystemAuditAction;
  actorId: string;
  actorEmail: string;
  actorRole: AuditRole;
  resource: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, unknown>;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  isCritical: boolean;
  isAnomalous: boolean;
  anomalyReason?: string;
  hash: string; // For tamper protection
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
}

export interface SystemAuditAnalytics {
  totalLogs: number;
  criticalLogs: number;
  anomalousLogs: number;
  archivedLogs: number;
  actionBreakdown: Record<SystemAuditAction, number>;
  roleBreakdown: Record<AuditRole, number>;
  resourceBreakdown: Record<string, number>;
}

// ============================================
// WEBHOOK DELIVERY LOG TYPES
// ============================================

export type DeliveryStatus = "completed" | "failed" | "retrying" | "cancelled" | "queued";
export type FailureReason = "timeout" | "4xx_error" | "5xx_error" | "dns_error" | "network_error" | "invalid_url" | "auth_error";

export interface DeliveryAttempt {
  attemptNumber: number;
  timestamp: string;
  statusCode?: number;
  response?: string;
  error?: string;
  latency: number;
}

export interface WebhookDelivery {
  id: string;
  traceId: string;
  eventId: string;
  webhookUrl: string;
  endpoint: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  status: DeliveryStatus;
  attempts: DeliveryAttempt[];
  maxRetries: number;
  currentRetry: number;
  failureReason?: FailureReason;
  isDegraded: boolean;
  finalStatus?: DeliveryStatus;
  timestamp: string;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryAnalytics {
  totalDeliveries: number;
  completedCount: number;
  failedCount: number;
  retryingCount: number;
  cancelledCount: number;
  avgLatency: number;
  failureRate: number;
  endpointBreakdown: Record<string, { total: number; failed: number; avgLatency: number }>;
}

// ============================================
// API LOGS TYPES
// ============================================

export type APIErrorType = "auth_error" | "validation_error" | "server_error" | "rate_limit" | "timeout" | "network_error";

export interface APILogEntry {
  id: string;
  traceId: string;
  userId?: string;
  merchantId?: string;
  method: HTTPMethod;
  path: string;
  headers: Record<string, string>;
  payload?: Record<string, unknown>;
  response?: Record<string, unknown>;
  statusCode: HTTPStatus;
  latency: number;
  ipAddress: string;
  userAgent?: string;
  errorType?: APIErrorType;
  errorMessage?: string;
  isRetried: boolean;
  retryCount: number;
  isRateLimited: boolean;
  isSuspicious: boolean;
  suspiciousReason?: string;
  timestamp: string;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
}

export interface APILogAnalytics {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  avgLatency: number;
  successRate: number;
  errorBreakdown: Record<APIErrorType, number>;
  endpointBreakdown: Record<string, { total: number; avgLatency: number; failureRate: number }>;
  suspiciousCount: number;
  rateLimitedCount: number;
}

// ============================================
// MODULE LEVEL ACCESS TYPES
// ============================================

export type PermissionAction = "read" | "write" | "delete" | "execute";
export type RoleType = "admin" | "staff" | "support" | "custom";

export interface ModulePermission {
  id: string;
  roleId: string;
  moduleName: string;
  actions: Set<PermissionAction>;
  enabled: boolean;
  hash: string; // For tamper protection
  updatedAt: string;
  createdAt: string;
}

export interface RoleTemplate {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  permissions: Map<string, Set<PermissionAction>>; // moduleName -> actions
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionValidation {
  allowed: boolean;
  reason?: string;
  action: PermissionAction;
  module: string;
  roleId: string;
  timestamp: string;
}

export interface PermissionAnalytics {
  totalValidations: number;
  allowedCount: number;
  deniedCount: number;
  moduleUsage: Record<string, number>;
  actionUsage: Record<PermissionAction, number>;
  deniedReasons: Record<string, number>;
}

// ============================================
// WEBHOOKS TYPES
// ============================================

export type WebhookEventType = "payment.success" | "payment.failed" | "subscription.created" | "subscription.updated" | "subscription.cancelled" | "refund.processed" | "invoice.created";
export type WebhookStatus = "active" | "failed" | "inactive";

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string; // HMAC secret
  events: WebhookEventType[];
  status: WebhookStatus;
  isActive: boolean;
  retryLimit: number;
  retryDelay: number; // seconds
  healthScore: number; // 0-100
  successRate: number;
  avgLatency: number;
  lastDelivery?: string;
  lastFailure?: string;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  timestamp: string;
  processed: boolean;
  endpointIds: string[];
}

// ============================================
// RATE LIMITS & ABUSE CONTROL TYPES
// ============================================

export type PlanType = "free" | "pro" | "enterprise";
export type LimitScope = "ip" | "user" | "api_key" | "device";
export type BlockType = "temporary" | "permanent" | "device";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type SecurityAlertChannel = "email" | "dashboard" | "webhook";

export interface RateLimitConfig {
  id: string;
  scope: LimitScope;
  planType?: PlanType;
  endpoint?: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  priorityUserMultiplier: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RateLimitEntry {
  id: string;
  scope: LimitScope;
  identifier: string; // IP, user ID, API key, device ID
  endpoint?: string;
  requestCount: number;
  burstCount: number;
  windowStart: string;
  lastRequest: string;
  isThrottled: boolean;
  throttleUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbuseDetection {
  id: string;
  type: "brute_force" | "bot" | "velocity" | "behavior" | "geo_anomaly";
  identifier: string;
  severity: AlertSeverity;
  details: Record<string, unknown>;
  detectedAt: string;
  resolvedAt?: string;
  isResolved: boolean;
}

export interface IPBlock {
  id: string;
  ipAddress: string;
  cidr?: string; // For range blocks
  blockType: BlockType;
  reason: string;
  blockedBy: string;
  blockedAt: string;
  expiresAt?: string;
  isWhitelisted: boolean;
  country?: string; // For geo blocks
  createdAt: string;
  updatedAt: string;
}

export interface RateLimitAnalytics {
  totalRequests: number;
  throttledRequests: number;
  blockedRequests: number;
  abuseDetections: number;
  activeBlocks: number;
  topViolators: Array<{ identifier: string; count: number }>;
  endpointBreakdown: Record<string, { total: number; throttled: number }>;
}

// ============================================
// BRUTE FORCE + ALERT SYSTEM TYPES
// ============================================

export interface LoginAttempt {
  id: string;
  ipAddress: string;
  userId?: string;
  deviceFingerprint?: string;
  success: boolean;
  failureReason?: string;
  timestamp: string;
  isSuspicious: boolean;
}

export interface AccountLock {
  id: string;
  userId?: string;
  ipAddress: string;
  failureCount: number;
  lockType: "temporary" | "permanent";
  lockedAt: string;
  expiresAt?: string;
  isLocked: boolean;
  captchaRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityAlert {
  id: string;
  type: "brute_force" | "distributed_attack" | "credential_stuffing" | "abuse" | "geo_anomaly";
  severity: AlertSeverity;
  identifier: string;
  details: Record<string, unknown>;
  channels: SecurityAlertChannel[];
  sentAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface SecurityAnalytics {
  totalLoginAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  activeLocks: number;
  totalAlerts: number;
  acknowledgedAlerts: number;
  criticalAlerts: number;
  topAttackers: Array<{ ipAddress: string; attempts: number }>;
}

// ============================================
// PAYMENTS GOD MODE TYPES
// ============================================

export type PaymentScenario = "subscription" | "one_time" | "low_ticket" | "high_value" | "cross_border";
export type GodModePaymentMethod = "card" | "upi" | "bnpl" | "bank_transfer";
export type GatewayStatus = "active" | "degraded" | "down";

export interface GatewayConfig {
  id: string;
  name: string;
  region: string;
  supportedMethods: GodModePaymentMethod[];
  successRate: number;
  avgLatency: number;
  costPerTransaction: number;
  status: GatewayStatus;
  priority: number;
  isPrimary: boolean;
  isFallback: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingDecision {
  id: string;
  gatewayId: string;
  scenario: PaymentScenario;
  userId: string;
  amount: number;
  currency: string;
  region: string;
  paymentMethod: GodModePaymentMethod;
  blendedScore: number;
  successScore: number;
  speedScore: number;
  costScore: number;
  riskScore: number;
  reason: string;
  timestamp: string;
  executed: boolean;
}

export interface UserPaymentProfile {
  id: string;
  userId: string;
  preferredGatewayId: string;
  preferredMethod: GodModePaymentMethod;
  successHistory: Map<string, number>; // gatewayId -> success count
  failureHistory: Map<string, number>; // gatewayId -> failure count
  lastSuccessGateway?: string;
  region: string;
  fraudRisk: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface FailoverMemory {
  id: string;
  userId: string;
  lastSuccessGateway: string;
  lastSuccessTimestamp: string;
  failedGateways: string[];
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioConfig {
  id: string;
  scenario: PaymentScenario;
  primaryGatewayId: string;
  fallbackGatewayIds: string[];
  minAmount?: number;
  maxAmount?: number;
  regions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGodModeAnalytics {
  totalDecisions: number;
  successfulRoutes: number;
  failedRoutes: number;
  avgBlendedScore: number;
  gatewayUsage: Record<string, number>;
  scenarioSuccess: Record<PaymentScenario, number>;
  costSavings: number;
  avgLatency: number;
  anomalyCount: number;
}

// ============================================
// SERVICE UPTIME + INCIDENT LOG + ALERT POLICIES TYPES
// ============================================

export type UptimeServiceStatus = "active" | "degraded" | "down";
export type UptimeIncidentSeverity = "low" | "medium" | "high" | "critical";
export type UptimeIncidentStatus = "open" | "assigned" | "in_progress" | "resolved" | "closed";
export type UptimeAlertChannel = "email" | "sms" | "slack" | "pagerduty";
export type AlertPolicyStatus = "active" | "inactive" | "test_mode";

export interface ServiceHealth {
  id: string;
  serviceName: string;
  status: UptimeServiceStatus;
  uptime30d: number; // percentage
  p95Latency: number; // ms
  p99Latency: number; // ms
  errorRate: number; // percentage
  region: string;
  lastHeartbeat: string;
  dependencies: string[]; // service IDs
  capacity: {
    cpu: number; // percentage
    ram: number; // percentage
    load: number;
  };
  slaTarget: number; // percentage
  slaBreach: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UptimeIncident {
  id: string;
  serviceId: string;
  serviceName: string;
  severity: UptimeIncidentSeverity;
  title: string;
  description: string;
  startedAt: string;
  resolvedAt?: string;
  duration?: number; // minutes
  status: UptimeIncidentStatus;
  assignedTo?: string;
  escalated: boolean;
  rootCause?: string;
  relatedIncidentIds: string[];
  timeline: UptimeIncidentEvent[];
  postMortem?: string;
  affectedUsers: number;
  createdAt: string;
  updatedAt: string;
}

export interface UptimeIncidentEvent {
  id: string;
  timestamp: string;
  type: "detected" | "assigned" | "escalated" | "updated" | "resolved" | "comment";
  description: string;
  userId?: string;
}

export interface IncidentEvent {
  id: string;
  timestamp: string;
  type: "detected" | "assigned" | "escalated" | "updated" | "resolved" | "comment";
  description: string;
  userId?: string;
}

export interface AlertPolicy {
  id: string;
  name: string;
  serviceId: string;
  serviceName: string;
  rules: AlertRule[];
  channels: AlertChannel[];
  cooldown: number; // minutes
  status: AlertPolicyStatus;
  scheduledHours?: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
  version: number;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  type: "latency" | "error_rate" | "uptime" | "custom";
  threshold: number;
  operator: ">" | "<" | ">=" | "<=" | "==";
  duration: number; // minutes
}

export interface UptimeAlert {
  id: string;
  policyId: string;
  policyName: string;
  serviceId: string;
  serviceName: string;
  severity: UptimeIncidentSeverity;
  message: string;
  channels: UptimeAlertChannel[];
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  incidentId?: string;
  createdAt: string;
}

export interface ServiceUptimeAnalytics {
  totalServices: number;
  activeServices: number;
  degradedServices: number;
  downServices: number;
  avgUptime: number;
  avgLatency: number;
  avgErrorRate: number;
  slaBreaches: number;
  regionHealth: Record<string, { active: number; degraded: number; down: number }>;
}

export interface UptimeIncidentAnalytics {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  avgResolutionTime: number;
  criticalIncidents: number;
  bySeverity: Record<UptimeIncidentSeverity, number>;
  byService: Record<string, number>;
}

export interface UptimeAlertAnalytics {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  byChannel: Record<UptimeAlertChannel, number>;
  byPolicy: Record<string, number>;
  avgResponseTime: number;
}

// ============================================
// SLA MONITORING & ALERTING TYPES
// ============================================

export type SLAAlertPriority = "low" | "medium" | "high" | "critical";
export type SLAIncidentStatus = "open" | "investigating" | "resolved";
export type SLAAlertChannel = "email" | "sms" | "app_notification";

export interface SLAMetric {
  id: string;
  serviceId: string;
  serviceName: string;
  timestamp: string;
  uptime30d: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate24h: number;
  error4xx: number;
  error5xx: number;
  activeIncidents: number;
  region: string;
}

export interface SLAAlert {
  id: string;
  serviceId: string;
  serviceName: string;
  priority: SLAAlertPriority;
  type: "error_spike" | "downtime" | "sla_breach" | "latency_spike";
  message: string;
  channels: SLAAlertChannel[];
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  silenced: boolean;
  silencedUntil?: string;
  escalated: boolean;
  escalatedTo?: string;
  incidentId?: string;
  createdAt: string;
}

export interface SLAIncident {
  id: string;
  serviceId: string;
  serviceName: string;
  status: SLAIncidentStatus;
  title: string;
  description: string;
  startedAt: string;
  resolvedAt?: string;
  duration?: number;
  rootCause?: string;
  assignedTo?: string;
  timeline: SLAIncidentEvent[];
  affectedUsers: number;
  deploymentId?: string;
  thirdPartyService?: string;
  logsAttached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SLAIncidentEvent {
  id: string;
  timestamp: string;
  type: "detected" | "assigned" | "escalated" | "updated" | "resolved" | "comment";
  description: string;
  userId?: string;
}

export interface SLARule {
  id: string;
  name: string;
  metric: "uptime" | "latency" | "error_rate";
  threshold: number;
  operator: ">=" | "<" | ">" | "<=";
  breachAction: "alert" | "incident" | "auto_recovery";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SLABreach {
  id: string;
  ruleId: string;
  ruleName: string;
  serviceId: string;
  serviceName: string;
  metric: string;
  actualValue: number;
  threshold: number;
  breachedAt: string;
  resolvedAt?: string;
  penaltyCost?: number;
  createdAt: string;
}

export interface PerformanceDataPoint {
  timestamp: string;
  latency: number;
  errorRate: number;
  isSpike: boolean;
}

export interface GeoLatency {
  region: string;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
}

export interface ThirdPartyStatus {
  serviceName: string;
  status: "operational" | "degraded" | "outage";
  latency: number;
  lastChecked: string;
}

export interface SLAMonitoringAnalytics {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  avgUptime: number;
  avgLatency: number;
  avgErrorRate: number;
  totalIncidents: number;
  openIncidents: number;
  totalAlerts: number;
  activeAlerts: number;
  slaBreaches: number;
  totalPenaltyCost: number;
}

export interface AutoRecoveryAction {
  id: string;
  serviceId: string;
  serviceName: string;
  action: "restart" | "scale" | "switch_node" | "failover";
  triggeredAt: string;
  executedAt?: string;
  status: "pending" | "executed" | "failed";
  result?: string;
  createdAt: string;
}

// ============================================
// TAX & INVOICE COMPLIANCE + AUDIT REPORTS TYPES
// ============================================

export type TaxSystem = "vat_oss" | "hmrc" | "gst" | "sales_tax" | "none";
export type InvoiceFormat = "en_16931" | "gstin_hsn" | "state_format" | "standard";
export type TaxComplianceRuleStatus = "active" | "pending" | "inactive";
export type AuditReportStatus = "ready" | "pending" | "generating" | "failed";
export type AuditReportType = "compliance" | "tax_remittance" | "data_access_audit" | "consent_logs";

export interface TaxComplianceRule {
  id: string;
  region: string;
  country: string;
  taxSystem: TaxSystem;
  rate: number;
  invoiceFormat: InvoiceFormat;
  autoCalc: boolean;
  status: TaxComplianceRuleStatus;
  digitalGoodsTax: boolean;
  retentionYears: number;
  invoiceNumberPrefix: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxComplianceInvoice {
  id: string;
  invoiceNumber: string;
  region: string;
  taxRuleId: string;
  customerId: string;
  customerTaxId?: string;
  basePrice: number;
  currency: string;
  taxBreakdown: TaxBreakdown[];
  total: number;
  format: InvoiceFormat;
  status: "draft" | "issued" | "paid" | "cancelled";
  pdfUrl?: string;
  validated: boolean;
  validationErrors?: string[];
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxBreakdown {
  taxType: string;
  rate: number;
  amount: number;
}

export interface TaxSubmission {
  id: string;
  region: string;
  period: string;
  format: string;
  data: Record<string, unknown>;
  status: "ready" | "submitted" | "failed";
  submittedAt?: string;
  createdAt: string;
}

export interface AuditReport {
  id: string;
  name: string;
  type: AuditReportType;
  period: string;
  status: AuditReportStatus;
  generatedAt?: string;
  downloadUrl?: string;
  format: "pdf" | "csv";
  createdBy: string;
  scheduled: boolean;
  scheduleFrequency?: "monthly" | "quarterly";
  dataSources: string[];
  auditTrailIds: string[];
  hash: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaxComplianceAnalytics {
  totalRegions: number;
  activeRules: number;
  pendingRules: number;
  totalInvoices: number;
  validatedInvoices: number;
  totalTaxCollected: number;
  reportsGenerated: number;
  failedReports: number;
}

// ============================================
// FRAUD & RISK TYPES
// ============================================

export type FraudType = "velocity_attack" | "card_testing" | "chargeback_pattern" | "multi_account_abuse" | "geo_mismatch" | "amount_anomaly" | "bot_pattern";
export type FraudStatus = "blocked" | "pending" | "approved" | "flagged";
export type FraudPriority = "low" | "medium" | "high" | "critical";
export type FraudDetectionAction = "block" | "allow" | "investigate";

export interface FraudAlert {
  id: string;
  type: FraudType;
  customerId: string;
  customerEmail: string;
  riskScore: number;
  amount: number;
  currency: string;
  country: string;
  ip: string;
  deviceId?: string;
  status: FraudStatus;
  priority: FraudPriority;
  action: FraudDetectionAction;
  reason: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FraudDetectionRule {
  id: string;
  name: string;
  type: FraudType;
  threshold: number;
  action: FraudDetectionAction;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskScore {
  customerId: string;
  score: number;
  factors: RiskFactor[];
  lastUpdated: string;
}

export interface RiskFactor {
  factor: string;
  value: number;
  weight: number;
}

export interface FraudAnalytics {
  totalAlerts: number;
  blockedTransactions: number;
  avgRiskScore: number;
  underReview: number;
  byType: Record<FraudType, number>;
  byStatus: Record<FraudStatus, number>;
}

// ============================================
// BLOCKED IPS + FRAUD EVENTS TYPES
// ============================================

export type BlockDuration = "temporary_24h" | "temporary_7d" | "permanent";
export type BlockReason = "fraud_score" | "repeated_attempts" | "chargeback" | "ip_mismatch" | "proxy_vpn" | "geo_block";

export interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: BlockReason;
  attempts: number;
  blockedAt: string;
  duration: BlockDuration;
  expiresAt?: string;
  blockedBy: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPAttempt {
  id: string;
  ipAddress: string;
  type: "login" | "payment" | "api";
  success: boolean;
  timestamp: string;
  userId?: string;
}

export interface ChargebackEvent {
  id: string;
  customerId: string;
  transactionId: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicatePaymentEvent {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  detectedAt: string;
  status: "blocked" | "refunded" | "cancelled";
  originalTransactionId: string;
  duplicateTransactionId: string;
  createdAt: string;
}

export interface BlockListEntry {
  id: string;
  type: "ip" | "email" | "device";
  value: string;
  reason: string;
  addedAt: string;
  addedBy: string;
  isActive: boolean;
}

export interface WhitelistEntry {
  id: string;
  type: "ip" | "email" | "user";
  value: string;
  addedAt: string;
  addedBy: string;
  isActive: boolean;
}

export interface IPBlockAnalytics {
  totalBlocked: number;
  activeBlocks: number;
  temporaryBlocks: number;
  permanentBlocks: number;
  totalAttempts: number;
  blockedAttempts: number;
  byReason: Record<BlockReason, number>;
}

// ============================================
// LEGAL & COMPLIANCE AUTOMATION TYPES
// ============================================

export type ComplianceRequestType = "access" | "delete" | "export";
export type ComplianceRequestStatus = "pending" | "processing" | "completed" | "rejected" | "overdue";
export type ComplianceConsentType = "marketing" | "data_processing" | "analytics" | "cookies";
export type ComplianceConsentStatus = "granted" | "denied" | "withdrawn";
export type ComplianceRegion = "gdpr_eu" | "ccpa_ca" | "global";
export type CompliancePolicyDocumentType = "privacy_policy" | "terms_of_service" | "cookie_policy" | "dpa";
export type CompliancePolicyStatus = "active" | "archived";

export interface ComplianceDataRequest {
  id: string;
  requestId: string;
  customerId: string;
  customerEmail: string;
  type: ComplianceRequestType;
  region: ComplianceRegion;
  requestedAt: string;
  slaDue: string;
  slaDaysLeft: number;
  completedAt?: string;
  status: ComplianceRequestStatus;
  processedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  dataPackageUrl?: string;
  auditTrailId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceConsentRecord {
  id: string;
  customerId: string;
  consentType: ComplianceConsentType;
  status: ComplianceConsentStatus;
  version: number;
  grantedAt?: string;
  withdrawnAt?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAuditTrail {
  id: string;
  requestId?: string;
  customerId: string;
  action: "data_accessed" | "data_deleted" | "data_exported" | "consent_granted" | "consent_withdrawn";
  performedBy: string;
  performedAt: string;
  details: Record<string, unknown>;
  ipAddress: string;
}

export interface CompliancePolicyVersion {
  id: string;
  documentType: CompliancePolicyDocumentType;
  version: string;
  title: string;
  content: string;
  region: ComplianceRegion;
  status: CompliancePolicyStatus;
  publishedAt: string;
  publishedBy: string;
  keyChanges: string[];
  previousVersionId?: string;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalHold {
  id: string;
  customerId: string;
  reason: string;
  imposedBy: string;
  imposedAt: string;
  expiresAt?: string;
  isActive: boolean;
  preventsDeletion: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAnalytics {
  totalRequests: number;
  pendingRequests: number;
  processingRequests: number;
  completedRequests: number;
  overdueRequests: number;
  exportRequests: number;
  deleteRequests: number;
  accessRequests: number;
  avgSLADays: number;
  complianceScore: number;
  totalConsents: number;
  activeConsents: number;
  withdrawnConsents: number;
  activePolicies: number;
  archivedPolicies: number;
}

// ============================================
// TAX & COMPLIANCE REGULATORY ENGINE TYPES
// ============================================

export type TaxRuleType = "vat" | "gst" | "sales_tax" | "digital_tax" | "eco_tax";
export type TaxRuleStatus = "active" | "inactive" | "pending";
export type TaxAlertType = "deadline" | "regulation_update" | "filing_reminder" | "rate_change" | "missing_filing";
export type TaxAlertPriority = "low" | "medium" | "high" | "critical";
export type TaxAlertStatus = "pending" | "acknowledged" | "resolved" | "escalated";
export type TaxFilingStatus = "not_filed" | "pending" | "filed" | "overdue";

export interface TaxRegionRule {
  id: string;
  country: string;
  countryCode: string;
  state?: string;
  region: string;
  taxType: TaxRuleType;
  rate: number;
  status: TaxRuleStatus;
  includedInPrice: boolean;
  reverseCharge: boolean;
  exemptForB2B: boolean;
  digitalGoodsTax: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  version: number;
  lastUpdated: string;
  updatedBy: string;
  createdAt: string;
}

export interface TaxTracking {
  id: string;
  country: string;
  region: string;
  period: string; // daily, monthly, yearly
  date: string;
  taxCollected: number;
  currency: string;
  orderCount: number;
  refundCount: number;
  refundTaxAmount: number;
  netTaxCollected: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaxComplianceAlert {
  id: string;
  type: TaxAlertType;
  priority: TaxAlertPriority;
  status: TaxAlertStatus;
  country?: string;
  region?: string;
  title: string;
  description: string;
  dueDate?: string;
  filingPeriod?: string;
  actionRequired: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  escalatedTo?: string;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxFiling {
  id: string;
  country: string;
  region: string;
  filingType: string; // VAT, GST, 1099-K, etc.
  period: string;
  dueDate: string;
  filedDate?: string;
  status: TaxFilingStatus;
  taxAmount: number;
  currency: string;
  reportUrl?: string;
  confirmationNumber?: string;
  filedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxComplianceScore {
  id: string;
  country: string;
  region: string;
  period: string;
  score: number;
  taxAccuracy: number;
  filingStatus: number;
  pendingAlerts: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  lastCalculated: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRegulatoryAnalytics {
  totalRegions: number;
  activeRules: number;
  taxCollectedMTD: number;
  taxCollectedYTD: number;
  complianceScore: number;
  pendingAlerts: number;
  criticalAlerts: number;
  overdueFilings: number;
  upcomingDeadlines: number;
  avgTaxAccuracy: number;
  riskRegions: number;
}

// ============================================
// REVIEW POLICY MODERATION ENGINE TYPES
// ============================================

export type ModerationStatus = "pending" | "in_review" | "approved" | "soft_rejected" | "hard_rejected";
export type ModerationPriority = "low" | "normal" | "high" | "urgent";
export type RejectReason = "quality" | "plagiarism" | "malware" | "policy_violation" | "documentation" | "preview_issue";

export interface ReviewSubmission {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  category: string;
  version: number;
  status: ModerationStatus;
  priority: ModerationPriority;
  submittedAt: string;
  assignedTo?: string;
  assignedAt?: string;
  slaDue: string;
  softRejectCount: number;
  lastSoftRejectAt?: string;
  decisionAt?: string;
  decidedBy?: string;
  rejectReason?: RejectReason;
  reviewComments?: string;
  qualityScore?: number;
  livePreviewUrl: string;
  documentationUrl: string;
  previewValid: boolean;
  documentationValid: boolean;
  aiPreScreenPassed: boolean;
  aiPreScreenIssues?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Reviewer {
  id: string;
  name: string;
  email: string;
  expertise: string[]; // categories
  isActive: boolean;
  currentWorkload: number;
  totalReviews: number;
  avgReviewTime: number; // hours
  approvalRate: number; // percentage
  rejectionAccuracy: number; // percentage
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewComment {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ReviewPolicy {
  id: string;
  avgReviewSLA: number; // hours
  maxSoftRejectCycles: number;
  standardRejectionNote: string;
  requireLivePreview: boolean;
  requireDocumentation: boolean;
  autoApprovalEnabled: boolean;
  autoApprovalThreshold: number; // quality score
  aiPreScreenEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewAnalytics {
  totalSubmissions: number;
  pendingSubmissions: number;
  inReviewSubmissions: number;
  approvedSubmissions: number;
  softRejectedSubmissions: number;
  hardRejectedSubmissions: number;
  avgReviewTime: number;
  avgSLACompliance: number;
  activeReviewers: number;
  avgReviewerWorkload: number;
  qualityScoreAvg: number;
}

// ============================================
// DISPLAY & SEO SETTINGS TYPES
// ============================================

export interface DisplaySettings {
  id: string;
  marketplaceName: string;
  defaultCurrency: string;
  itemsPerPage: number;
  featuredSlots: number;
  homepageLayout: "grid" | "list" | "hybrid";
  enableLazyLoad: boolean;
  enableImageOptimization: boolean;
  targetLoadTime: number; // seconds
  enableMobileOptimization: boolean;
  multiLanguageEnabled: boolean;
  defaultLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface SEOMeta {
  id: string;
  entityType: "homepage" | "item" | "category";
  entityId?: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  noIndex: boolean;
  noFollow: boolean;
  hreflangTags: Record<string, string>; // language -> url
  createdAt: string;
  updatedAt: string;
}

export interface URLStructure {
  id: string;
  entityType: "item" | "category";
  entityId: string;
  slug: string;
  fullUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SitemapEntry {
  id: string;
  url: string;
  lastModified: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number; // 0.0 to 1.0
}

export interface RobotsTxtRule {
  id: string;
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
  sitemap?: string;
}

export interface FeaturedItemSlot {
  id: string;
  itemId: string;
  itemName: string;
  position: number;
  priority: number;
  sales: number;
  rating: number;
  adminBoost: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CacheEntry {
  id: string;
  key: string;
  entityType: "homepage" | "listing" | "item" | "category";
  entityId?: string;
  data: unknown;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SEOAnalytics {
  totalPages: number;
  indexedPages: number;
  noIndexPages: number;
  avgPageLoadTime: number;
  sitemapEntries: number;
  featuredSlots: number;
  cacheHitRate: number;
  searchQueries: number;
  organicTraffic: number;
}

// ============================================
// TAX & COMMISSION RULES ENGINE TYPES
// ============================================

export type TaxCalculationMode = "inclusive" | "exclusive";
export type TaxValidationStatus = "valid" | "invalid" | "pending" | "not_required";
export type AuthorCommissionTier = "non_exclusive" | "exclusive" | "elite";
export type WithholdingDocumentType = "w8" | "w9" | "none";
export type WithholdingStatus = "not_required" | "pending" | "validated" | "withholding_applied";

export interface CountryTaxRule {
  id: string;
  country: string;
  countryCode: string;
  taxType: "vat" | "gst" | "sales_tax";
  rate: number;
  reverseChargeEnabled: boolean;
  taxCalculationMode: TaxCalculationMode;
  stateTaxEnabled: boolean;
  digitalServiceTax: number;
  status: "active" | "inactive";
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxCalculation {
  id: string;
  orderId: string;
  buyerCountry: string;
  sellerCountry: string;
  buyerTaxId?: string;
  sellerTaxId?: string;
  isB2B: boolean;
  taxIdValid: boolean;
  basePrice: number;
  currency: string;
  countryTax: number;
  stateTax: number;
  digitalServiceTax: number;
  totalTax: number;
  reverseCharge: boolean;
  taxCalculationMode: TaxCalculationMode;
  finalPrice: number;
  priceIncludesTax: boolean;
  calculatedAt: string;
  ruleVersion: number;
}

export interface TaxValidation {
  id: string;
  orderId: string;
  taxId?: string;
  taxIdType: "vat" | "gst";
  country: string;
  status: TaxValidationStatus;
  validatedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorTierInfo {
  id: string;
  authorId: string;
  authorName: string;
  currentTier: AuthorCommissionTier;
  commissionRate: number; // percentage author keeps
  totalSales: number;
  totalRevenue: number;
  tierUpgradedAt?: string;
  nextTier?: AuthorCommissionTier;
  upgradeThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionCalculation {
  id: string;
  orderId: string;
  authorId: string;
  basePrice: number;
  taxAmount: number;
  buyerFee: number;
  platformCommission: number;
  authorEarnings: number;
  commissionRate: number;
  tier: string;
  isLocked: boolean;
  lockedAt?: string;
  calculatedAt: string;
}

export interface WithholdingTax {
  id: string;
  authorId: string;
  documentType: WithholdingDocumentType;
  documentStatus: WithholdingStatus;
  withholdingRate: number;
  country: string;
  treatyCountry?: string;
  documentUploadedAt?: string;
  validatedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VATReport {
  id: string;
  period: string; // YYYY-Q1, YYYY-Q2, etc.
  country: string;
  countryCode: string;
  totalSales: number;
  totalTaxCollected: number;
  totalReverseCharge: number;
  netTaxPayable: number;
  currency: string;
  generatedAt: string;
  generatedBy: string;
  status: "draft" | "final";
}

export interface TaxCommissionAnalytics {
  totalTaxCollected: number;
  totalCommissionCollected: number;
  totalAuthorPayouts: number;
  totalWithholdingTax: number;
  avgTaxRate: number;
  countriesActive: number;
  authorsByTier: {
    non_exclusive: number;
    exclusive: number;
    elite: number;
  };
  pendingValidations: number;
  withholdingApplied: number;
}

// ============================================
// MARKETPLACE SETTINGS ENGINE TYPES
// ============================================

export interface MarketplaceCommissionSettings {
  id: string;
  defaultPlatformCommission: number; // percentage
  buyerFee: number; // percentage
  extendedLicenseMultiplier: number;
  minimumItemPrice: number;
  refundClearanceWindow: number; // days
  minWithdrawalThreshold: number;
  currency: string;
  buyerFeeIncluded: boolean;
  version: number;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCommissionOverride {
  id: string;
  categoryId: string;
  categoryName: string;
  commissionRate: number; // percentage
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorCommissionOverride {
  id: string;
  authorId: string;
  authorName: string;
  commissionRate: number; // percentage
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceCalculation {
  id: string;
  itemId: string;
  basePrice: number;
  buyerFee: number;
  taxAmount: number;
  finalPrice: number;
  authorEarnings: number;
  platformCommission: number;
  currency: string;
  isExtendedLicense: boolean;
  licenseMultiplier: number;
  calculatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  authorId: string;
  authorName: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "rejected";
  requestedAt: string;
  processedAt?: string;
  rejectedReason?: string;
  kycVerified: boolean;
  pendingRefunds: number;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  buyerId: string;
  itemId: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "processed";
  requestedAt: string;
  decisionAt?: string;
  processedAt?: string;
  withinWindow: boolean;
  taxReversed: boolean;
  commissionReversed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceSettingsVersion {
  id: string;
  version: number;
  settings: MarketplaceCommissionSettings;
  changedBy: string;
  changeReason: string;
  createdAt: string;
}

export interface MarketplaceSettingsAnalytics {
  totalCommissionCollected: number;
  totalBuyerFees: number;
  totalAuthorPayouts: number;
  pendingWithdrawals: number;
  pendingRefunds: number;
  avgCommissionRate: number;
  activeOverrides: number;
  settingsVersion: number;
}

// ============================================
// REPORT ITEM CARD ENGINE TYPES
// ============================================

export type ItemReportSeverity = "low" | "medium" | "high" | "critical";
export type ItemReportStatus = "pending" | "awaiting_fix" | "fixed" | "ignored" | "dismissed" | "closed";
export type ReportAction = "take_down" | "warn_author" | "dismiss" | "request_fix" | "temporary_hide";
export type FixStatus = "awaiting_fix" | "fixed" | "ignored";

export interface ItemReport {
  id: string;
  itemId: string;
  itemName: string;
  severity: ItemReportSeverity;
  reason: string;
  reporterId: string;
  reporterName: string;
  description: string;
  internalNotes?: string;
  status: ItemReportStatus;
  actionTaken?: ReportAction;
  actionTakenAt?: string;
  actionTakenBy?: string;
  groupId?: string;
  versionCheck?: {
    supportedVersions: string[];
    currentVersion: string;
    isCompatible: boolean;
    isRealIssue: boolean;
  };
  authorResponse?: {
    requestedAt: string;
    deadline: string;
    status: FixStatus;
    fixedAt?: string;
  };
  temporaryAction?: {
    type: "soft_warning" | "temporary_hidden";
    appliedAt: string;
    expiresAt?: string;
  };
  retestResult?: {
    testedAt: string;
    passed: boolean;
    details?: string;
  };
  userImpact: {
    refundImpact: number;
    complaints: number;
  };
  slaDeadline: string;
  slaExceeded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportGroup {
  id: string;
  itemId: string;
  itemName: string;
  totalReports: number;
  uniqueReporters: number;
  severity: ItemReportSeverity;
  oldestReport: string;
  latestReport: string;
  status: ItemReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InternalNote {
  id: string;
  reportId: string;
  note: string;
  addedBy: string;
  addedAt: string;
  isImmutable: boolean;
}

export interface AuthorPenalty {
  id: string;
  authorId: string;
  authorName: string;
  penaltyType: "ranking_reduction" | "visibility_lower" | "suspension";
  reason: string;
  severity: number;
  appliedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface ReportAnalytics {
  totalReports: number;
  bySeverity: Record<ItemReportSeverity, number>;
  byStatus: Record<ItemReportStatus, number>;
  avgResolutionTime: number;
  autoClosed: number;
  manuallyClosed: number;
  escalatedReports: number;
  authorPenalties: number;
}

// ============================================
// CRITICAL SECURITY REPORT ENGINE TYPES
// ============================================

export type CriticalSecuritySeverity = "critical";
export type CriticalSecurityStatus = "detected" | "disabled" | "patch_requested" | "patched" | "retest_failed" | "permanently_removed";
export type CriticalSecurityAction = "auto_disable" | "temp_block" | "request_patch" | "restore" | "force_takedown";

export interface CriticalSecurityIncident {
  id: string;
  itemId: string;
  itemName: string;
  severity: CriticalSecuritySeverity;
  vulnerabilityType: "sql_injection" | "xss" | "auth_bypass" | "api_leak" | "other";
  affectedEndpoint?: string;
  description: string;
  status: CriticalSecurityStatus;
  actionTaken: CriticalSecurityAction;
  actionTakenAt: string;
  actionTakenBy: string;
  patchRequest?: {
    sentAt: string;
    deadline: string;
    vulnerabilityDetails: string;
    acknowledgedAt?: string;
  };
  tempBlock?: {
    blockedAt: string;
    reason: string;
  };
  retestResult?: {
    testedAt: string;
    passed: boolean;
    details: string;
  };
  evidence: {
    requestPayload?: string;
    endpointLogs?: string;
    reproductionSteps?: string;
    isImmutable: boolean;
  };
  userImpact: {
    affectedUsers: number;
    transactionsBlocked: number;
    notifiedAt?: string;
  };
  globalScanTriggered: boolean;
  developerPenalty?: {
    trustScoreReduction: number;
    rankingReduction: number;
    possibleSuspension: boolean;
  };
  slaResponse: string;
  slaFix: string;
  createdAt: string;
  updatedAt: string;
}

export interface CriticalSecurityAlert {
  id: string;
  incidentId: string;
  severity: CriticalSecuritySeverity;
  sentTo: string[];
  sentAt: string;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface CriticalSecurityAnalytics {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  avgResponseTime: number;
  avgFixTime: number;
  byVulnerabilityType: Record<string, number>;
  developerPenalties: number;
  globalScansTriggered: number;
}

// ============================================
// TOP SELLING ITEMS RANKING ENGINE TYPES
// ============================================

export type TimeFilter = "today" | "this_week" | "this_month" | "custom_range";
export type TrendStatus = "trending" | "fast_growing" | "stable" | "declining";

export interface TopSellingItem {
  rank: number;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  salesCount: number;
  revenue: number;
  rating: number;
  latestSaleAt: string;
  trendStatus: TrendStatus;
  refundRate: number;
  conversionRate: number;
  isFlagged: boolean;
}

export interface ItemDrillDown {
  itemId: string;
  itemName: string;
  salesTrend: {
    date: string;
    sales: number;
    revenue: number;
  }[];
  buyersList: {
    buyerId: string;
    buyerName: string;
    purchaseDate: string;
    amount: number;
  }[];
  refundRate: number;
  conversionRate: number;
  totalRefunds: number;
  totalSales: number;
  avgOrderValue: number;
}

export interface AuthorPerformance {
  authorId: string;
  authorName: string;
  totalEarnings: number;
  totalItems: number;
  totalSales: number;
  performanceScore: number;
  avgRating: number;
  topSellingItemId?: string;
  topSellingItemName?: string;
}

export interface CategoryRanking {
  categoryId: string;
  categoryName: string;
  topItems: TopSellingItem[];
  totalSales: number;
  totalRevenue: number;
}

export interface RankingAnalytics {
  totalSales: number;
  totalRevenue: number;
  avgRefundRate: number;
  avgConversionRate: number;
  trendingItems: number;
  fastGrowingItems: number;
  flaggedItems: number;
  topCategory: string;
}

// ============================================
// REPORTS & FLAGS MODERATION ENGINE TYPES
// ============================================

export type ModerationSeverity = "LOW" | "MEDIUM" | "HIGH";
export type ModerationReportStatus = "open" | "under_review" | "action_taken" | "dismissed" | "escalated";
export type ModerationAction = "take_down" | "warn_author" | "dismiss" | "escalate" | "no_action";
export type ModerationReportType = "copyright" | "illegal" | "malware" | "misleading" | "policy_violation" | "minor_issue" | "suspicious_activity";

export interface ModerationReport {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  severity: ModerationSeverity;
  status: ModerationReportStatus;
  reportType: ModerationReportType;
  reason: string;
  reporterId: string;
  reporterName: string;
  description: string;
  internalNotes?: string;
  actionTaken?: ModerationAction;
  actionTakenAt?: string;
  actionTakenBy?: string;
  warningCount?: number;
  dismissedReason?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  evidence?: {
    screenshots?: string[];
    logs?: string[];
    files?: string[];
  };
  isDuplicate: boolean;
  duplicateOf?: string;
  reporterTrustScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReporterTrust {
  reporterId: string;
  reporterName: string;
  validReports: number;
  falseReports: number;
  trustScore: number;
  isBlocked: boolean;
  lastReportAt: string;
}

export interface AuthorWarning {
  id: string;
  authorId: string;
  authorName: string;
  warningCount: number;
  lastWarningAt: string;
  isSuspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
}

export interface AutoFlag {
  id: string;
  itemId: string;
  itemName: string;
  flagType: "high_refund_rate" | "abnormal_sales" | "suspicious_activity";
  severity: ModerationSeverity;
  reason: string;
  autoGenerated: boolean;
  createdAt: string;
  reviewed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ItemReportHistory {
  itemId: string;
  itemName: string;
  totalReports: number;
  reports: ModerationReport[];
  pastViolations: number;
  actionsTaken: number;
  warningsIssued: number;
  takedowns: number;
}

export interface ModerationAnalytics {
  totalReports: number;
  bySeverity: Record<ModerationSeverity, number>;
  byStatus: Record<ModerationReportStatus, number>;
  byType: Record<ModerationReportType, number>;
  avgResolutionTime: number;
  autoFlags: number;
  reporterTrustScores: number;
  authorWarnings: number;
  authorSuspensions: number;
  duplicateReports: number;
  falseReports: number;
}

// ============================================
// REFUNDS MANAGEMENT ENGINE TYPES
// ============================================

export type RefundManagementStatus = "pending" | "under_review" | "escalated" | "approved" | "denied" | "refunded";
export type RefundManagementAction = "approve" | "deny" | "escalate" | "process_refund";
export type RefundManagementType = "full" | "partial";

export interface RefundManagementRequest {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  buyerId: string;
  buyerName: string;
  authorId: string;
  authorName: string;
  refundType: RefundManagementType;
  requestedAmount: number;
  refundedAmount?: number;
  remainingAmount?: number;
  reason: string;
  status: RefundManagementStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  deniedAt?: string;
  deniedBy?: string;
  deniedReason?: string;
  escalatedAt?: string;
  escalatedBy?: string;
  refundedAt?: string;
  refundTransactionId?: string;
  isDispute: boolean;
  disputeMessage?: string;
  authorResponse?: string;
  attachments?: string[];
  fraudFlagged: boolean;
  autoApproved: boolean;
  autoDenied: boolean;
}

export interface RefundMetrics {
  pending: number;
  escalated: number;
  approved30d: number;
  refundVolume: number;
  totalRefunds: number;
  avgRefundAmount: number;
  fraudFlags: number;
  disputes: number;
}

export interface DisputeCase {
  id: string;
  refundId: string;
  buyerMessage: string;
  authorResponse: string;
  attachments: string[];
  adminDecision?: "buyer" | "author" | "partial";
  decisionReason?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRule {
  id: string;
  name: string;
  condition: string;
  action: "auto_approve" | "auto_deny" | "manual_review";
  amountThreshold?: number;
  daysThreshold?: number;
  isActive: boolean;
}

export interface FinancialReconciliation {
  refundId: string;
  refundAmount: number;
  gatewayTransactionId?: string;
  gatewayStatus: "pending" | "success" | "failed";
  reconciled: boolean;
  reconciledAt?: string;
  mismatchReason?: string;
}

// ============================================
// DMCA & TAKEDOWNS ENGINE TYPES
// ============================================

export type DMCAStatus = "pending" | "investigating" | "notice_sent" | "removed" | "rejected" | "counter_claim" | "restored" | "closed";
export type DMCAType = "DMCA" | "Trademark" | "Copyright";
export type DMCAAction = "take_down" | "notify_author" | "reject" | "restore" | "close";

export interface DMCACase {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  type: DMCAType;
  status: DMCAStatus;
  filedDate: string;
  deadline: string;
  takedownReason: string;
  actionTaken?: DMCAAction;
  actionTakenAt?: string;
  actionTakenBy?: string;
  noticeSentAt?: string;
  noticeSentBy?: string;
  counterClaim?: {
    submittedAt: string;
    legalStatement: string;
    proofDocuments: string[];
    reviewedAt?: string;
    reviewedBy?: string;
    valid: boolean;
  };
  evidence: {
    reporterProof: string[];
    authorResponse: string[];
    attachments: string[];
  };
  isDuplicate: boolean;
  duplicateOf?: string;
  violationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DMCAMetrics {
  activeCases: number;
  dmcasFiled30d: number;
  itemsRemoved: number;
  counterClaims: number;
  totalCases: number;
  avgResolutionTime: number;
  overdueCases: number;
}

export interface LegalComplianceLog {
  id: string;
  caseId: string;
  action: string;
  timestamp: string;
  performedBy: string;
  details: string;
  ipAddress?: string;
}

export interface RepeatViolation {
  authorId: string;
  authorName: string;
  violationCount: number;
  lastViolationAt: string;
  isSuspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
}

// ============================================
// FEATURED / HOT ITEMS ENGINE TYPES
// ============================================

export type FeaturedStatus = "featured" | "hot" | "both" | "none";
export type AuthorPayoutStatus = "pending" | "processing" | "paid" | "failed" | "on_hold";
export type AuthorPayoutMethod = "PayPal" | "Wire" | "Payoneer";

export interface FeaturedItem {
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  isFeatured: boolean;
  isHot: boolean;
  featuredPriority: number; // 1-8
  hotPriority: number; // 1-6
  salesCount: number;
  rating: number;
  status: FeaturedStatus;
  schedule?: {
    startAt: string;
    endAt: string;
    autoActivate: boolean;
  };
  performanceMetrics: {
    clicks: number;
    impressions: number;
    conversionRate: number;
  };
  featuredAt?: string;
  hotAt?: string;
  updatedAt: string;
}

export interface FeaturedMetrics {
  featuredCount: number;
  hotCount: number;
  maxFeatured: number;
  maxHot: number;
  totalClicks: number;
  totalImpressions: number;
  avgConversionRate: number;
}

export interface FeatureSchedule {
  id: string;
  itemId: string;
  startAt: string;
  endAt: string;
  type: "featured" | "hot";
  autoActivate: boolean;
  status: "scheduled" | "active" | "expired" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

// Advanced Featured Items Types
export interface FeaturedABTest {
  id: string;
  name: string;
  itemAId: string;
  itemBId: string;
  itemAName: string;
  itemBName: string;
  startDate: string;
  endDate?: string;
  trafficSplit: number; // 0-100, percentage for item A
  status: "active" | "paused" | "completed";
  metricsA: {
    clicks: number;
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
  metricsB: {
    clicks: number;
    impressions: number;
    conversions: number;
    conversionRate: number;
  };
  winner?: "A" | "B" | "tie";
  statisticalSignificance: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFeaturedItem {
  categoryId: string;
  categoryName: string;
  itemId: string;
  itemName: string;
  priority: number;
  isFeatured: boolean;
  featuredAt: string;
  performanceMetrics: {
    clicks: number;
    impressions: number;
    conversionRate: number;
  };
}

export interface GeoFeaturedItem {
  itemId: string;
  itemName: string;
  countryCode: string;
  countryName: string;
  region?: string;
  priority: number;
  isFeatured: boolean;
  featuredAt: string;
  performanceMetrics: {
    clicks: number;
    impressions: number;
    conversionRate: number;
  };
}

export interface TrendingMetrics {
  itemId: string;
  itemName: string;
  salesVelocity: number; // sales per day
  engagementScore: number; // 0-100
  ratingTrend: number; // positive/negative
  socialSignals: number; // mentions, shares, etc.
  aiScore: number; // 0-100 AI predicted trending
  predictedHot: boolean;
  confidence: number; // 0-100
  lastUpdated: string;
}

// ============================================
// AUTHOR PAYOUTS ENGINE TYPES
// ============================================

export interface PayoutRequest {
  id: string;
  authorId: string;
  authorName: string;
  method: AuthorPayoutMethod;
  amount: number;
  currency: string;
  baseCurrencyAmount: number;
  period: string;
  status: AuthorPayoutStatus;
  requestedAt: string;
  processedAt?: string;
  paidAt?: string;
  transactionId?: string;
  gatewayTransactionId?: string;
  holdReason?: string;
  failureReason?: string;
  fees: {
    platformCommission: number;
    gatewayFee: number;
    taxDeduction: number;
    totalFees: number;
  };
  netAmount: number;
  payoutLock: boolean;
  fraudFlagged: boolean;
  kycVerified: boolean;
  authorActive: boolean;
}

export interface PayoutMetrics {
  totalPending: number;
  totalProcessed: number;
  authorsPaidYTD: number;
  avgPayout: number;
  totalPaid: number;
  failedCount: number;
  onHoldCount: number;
}

export interface WalletLedger {
  id: string;
  authorId: string;
  type: "earnings" | "withdrawal" | "refund" | "fee";
  amount: number;
  balance: number;
  currency: string;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface PayoutReconciliation {
  id: string;
  payoutId: string;
  internalAmount: number;
  gatewayAmount: number;
  gatewayStatus: "matched" | "mismatch" | "pending" | "failed";
  mismatchReason?: string;
  reconciledAt?: string;
  reconciledBy?: string;
}

export interface PayoutSnapshot {
  id: string;
  name: string;
  totalPending: number;
  totalProcessed: number;
  totalPaid: number;
  payoutCount: number;
  createdAt: string;
  createdBy: string;
}

// ============================================
// MARKETPLACE COLLECTIONS ENGINE TYPES
// ============================================

export type CollectionStatus = "live" | "scheduled" | "ended";
export type CollectionVisibility = "visible" | "hidden";

export interface MarketplaceCollection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  startDate: string;
  endDate?: string; // null = always
  status: CollectionStatus;
  visibility: CollectionVisibility;
  curatedBy: string;
  curatedByName: string;
  updatedBy?: string;
  updatedByName?: string;
  itemCount: number;
  priority: number;
  isLocked: boolean; // prevent delete
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  itemId: string;
  itemName: string;
  order: number;
  addedAt: string;
  addedBy: string;
}

export interface HomepageSlot {
  id: string;
  slotNumber: number; // 1, 2, 3
  collectionId: string;
  collectionName: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionMetrics {
  id: string;
  collectionId: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  avgRevenuePerClick: number;
  period: string;
  startDate: string;
  endDate: string;
}

export interface AutoCollectionRule {
  id: string;
  name: string;
  type: "trending" | "top_selling" | "high_rating" | "low_refund";
  categoryIds?: string[];
  timeWindow: number; // days
  itemLimit: number;
  autoUpdate: boolean;
  lastUpdatedAt?: string;
  createdAt: string;
}

export interface CollectionABTest {
  id: string;
  name: string;
  collectionAId: string;
  collectionBId: string;
  startDate: string;
  endDate?: string;
  trafficSplit: number; // percentage for A
  metricsA: { clicks: number; conversions: number; revenue: number };
  metricsB: { clicks: number; conversions: number; revenue: number };
  winner?: "A" | "B" | "inconclusive";
  status: "active" | "completed" | "paused";
  createdAt: string;
}

// ============================================
// MARKETPLACE CATEGORIES ENGINE TYPES
// ============================================

export type CategoryStatus = "active" | "hidden" | "locked";

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  level: number;
  path: string; // e.g., "root/child/subchild"
  itemCount: number;
  subcategoryCount: number;
  description?: string;
  icon?: string;
  imageUrl?: string;
  bannerUrl?: string;
  status: CategoryStatus;
  priority: number;
  commissionOverride?: number; // percentage
  seoTitle?: string;
  seoDescription?: string;
  isLocked: boolean; // prevent delete
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree {
  category: MarketplaceCategory;
  children: CategoryTree[];
  isExpanded: boolean;
}

export interface CategoryMetrics {
  id: string;
  categoryId: string;
  totalItems: number;
  totalSubcategories: number;
  views: number;
  clicks: number;
  conversionRate: number;
  avgPrice: number;
  lastUpdated: string;
}

// ============================================
// MARKETPLACE AUTHOR LEVELS ENGINE TYPES
// ============================================

export type MarketplaceAuthorLevelType = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7" | "Elite" | "PowerElite";

export interface MarketplaceAuthorLevelConfig {
  id: string;
  level: MarketplaceAuthorLevelType;
  name: string;
  minEarnings: number; // USD
  commissionPercent: number; // 0-100
  badge: string;
  isActive: boolean;
  priority: number; // For ordering
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceAuthorLevel {
  id: string;
  authorId: string;
  authorName: string;
  currentLevel: MarketplaceAuthorLevelType;
  totalEarnings: number; // USD
  commissionPercent: number;
  badge: string;
  isExclusiveAuthor: boolean;
  exclusiveAuthorBonus: number; // 5% extra
  levelHistory: MarketplaceAuthorLevelHistoryEntry[];
  bonuses: MarketplaceAuthorBonus[];
  lastLevelChange: string;
  lastEarningsUpdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceAuthorLevelHistoryEntry {
  level: MarketplaceAuthorLevelType;
  changedAt: string;
  earningsAtChange: number;
  reason: "sale" | "refund" | "payout" | "admin_edit" | "self_heal";
  changedBy: string;
}

export interface MarketplaceAuthorBonus {
  id: string;
  authorId: string;
  authorName: string;
  type: "exclusive_author" | "item_of_day" | "annual_quality" | "performance" | "custom";
  amount: number;
  currency: string;
  description: string;
  triggeredAt: string;
  appliedAt?: string;
  status: "pending" | "applied" | "failed";
  metadata?: {
    itemId?: string;
    itemName?: string;
    period?: string;
    approvalRatio?: number;
    salesConsistency?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ItemOfTheDay {
  id: string;
  itemId: string;
  itemName: string;
  authorId: string;
  authorName: string;
  featuredDate: string;
  bonusAmount: number;
  performanceScore: number;
  clicks: number;
  sales: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnnualQualityBonus {
  id: string;
  authorId: string;
  authorName: string;
  year: number;
  hasZeroRejections: boolean;
  hasZeroFraud: boolean;
  approvalRatio: number;
  totalSales: number;
  totalRevenue: number;
  bonusAmount: number;
  status: "pending" | "calculated" | "applied";
  calculatedAt: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LevelMetrics {
  totalAuthors: number;
  authorsByLevel: Record<MarketplaceAuthorLevelType, number>;
  totalCommissionsPaid: number;
  totalBonusesPaid: number;
  avgEarningsPerLevel: Record<MarketplaceAuthorLevelType, number>;
  levelUpgradesThisMonth: number;
  levelDowngradesThisMonth: number;
}

// ============================================
// MARKETPLACE ITEMS ENGINE TYPES
// ============================================

export type ItemStatus = "draft" | "pending" | "active" | "disabled" | "rejected" | "deleted";
export type QualityStatus = "pass" | "warning" | "fail" | "not_scanned";
export type AuthorTier = "NEW" | "TRUSTED" | "PREMIUM";
export type MarketplaceAuthorStatus = "active" | "restricted" | "banned";

export interface MarketplaceItemRecord {
  id: string;
  itemName: string;
  slug: string;
  description: string;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  basePrice: number;
  currency: string;
  localPrice?: number;
  salesCount: number;
  rating: number;
  reviewCount: number;
  status: ItemStatus;
  qualityStatus: QualityStatus;
  isFeatured: boolean;
  isFlagged: boolean;
  flagReason?: string;
  screenshots: string[];
  files: ItemFile[];
  version: string;
  versionHistory: ItemVersion[];
  changelog: string;
  riskScore: number;
  reputationScore: number;
  publishedAt?: string;
  lastSaleAt?: string;
  lastQualityScan?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ItemFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  integrityHash: string;
  isMalwareScanned: boolean;
  scanResult?: "clean" | "malware" | "suspicious";
  uploadedAt: string;
}

export interface ItemVersion {
  version: string;
  changelog: string;
  releasedAt: string;
  fileCount: number;
}

export interface ItemQualityScan {
  id: string;
  itemId: string;
  itemName: string;
  scanDate: string;
  fileIntegrity: boolean;
  malwareDetected: boolean;
  missingAssets: boolean;
  codeIssues: boolean;
  issues: string[];
  result: QualityStatus;
  scannedBy: string;
}

export interface ItemMetrics {
  itemId: string;
  totalSales: number;
  totalRevenue: number;
  totalRefunds: number;
  refundRate: number;
  avgRating: number;
  totalReviews: number;
  conversionRate: number;
  views: number;
  lastUpdated: string;
}

// ============================================
// MARKETPLACE AUTHORS ENGINE TYPES
// ============================================

export interface MarketplaceAuthorRecord {
  id: string;
  authorName: string;
  email: string;
  country: string;
  tier: AuthorTier;
  level: MarketplaceAuthorLevelType;
  itemsCount: number;
  salesCount: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  riskScore: number;
  reputationScore: number;
  status: MarketplaceAuthorStatus;
  isVerified: boolean;
  kycVerified: boolean;
  fraudFlags: number;
  violationCount: number;
  lastSaleAt?: string;
  lastPayoutAt?: string;
  createdAt: string;
  updatedAt: string;
  bannedAt?: string;
  restrictedAt?: string;
}

export interface AuthorProfileRecord {
  authorId: string;
  authorName: string;
  email: string;
  country: string;
  bio?: string;
  avatar?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  tier: AuthorTier;
  level: MarketplaceAuthorLevelType;
  isVerified: boolean;
  kycVerified: boolean;
  joinedAt: string;
}

export interface AuthorPerformanceRecord {
  authorId: string;
  totalSales: number;
  totalRevenue: number;
  totalRefunds: number;
  refundRate: number;
  avgRating: number;
  totalReviews: number;
  approvalRate: number;
  deliveryQuality: number;
  responseTime: number;
  period: string;
}

export interface AuthorRiskRecord {
  authorId: string;
  riskScore: number;
  riskFactors: {
    refundRate: number;
    chargebackRate: number;
    fraudSignals: number;
    violationCount: number;
  };
  lastCalculated: string;
  recommendedAction: "none" | "monitor" | "restrict" | "ban";
}

export interface AuthorReputationRecord {
  authorId: string;
  reputationScore: number;
  factors: {
    avgRating: number;
    reviewCount: number;
    deliveryQuality: number;
    complianceScore: number;
  };
  lastCalculated: string;
}

export interface AuthorMetricsRecord {
  totalAuthors: number;
  authorsByTier: Record<AuthorTier, number>;
  authorsByLevel: Record<MarketplaceAuthorLevelType, number>;
  activeAuthors: number;
  newAuthorsThisMonth: number;
  avgEarningsPerAuthor: number;
  totalEarnings: number;
  period: string;
}

// ============================================
// CUSTOMERS MANAGEMENT TYPES
// ============================================

export type AdminCustomerStatus = "active" | "suspended" | "blocked";
export type AdminSubscriptionStatus = "active" | "paused" | "cancelled" | "expired" | "pending";
export type SubscriptionPlan = "free" | "basic" | "pro" | "enterprise";

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  country: string;
  countryCode: string;
  defaultCurrency: string;
  status: AdminCustomerStatus;
  subscriptionCount: number;
  totalSpent: number;
  joinedAt: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomerCreateInput {
  name: string;
  email: string;
  country: string;
  countryCode: string;
  defaultCurrency: string;
}

export interface AdminCustomerUpdateInput {
  name?: string;
  country?: string;
  countryCode?: string;
  defaultCurrency?: string;
  status?: AdminCustomerStatus;
}

export interface AdminCustomerProfile {
  id: string;
  customerId: string;
  avatar?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: boolean;
    marketingEmails: boolean;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomerProfileUpdateInput {
  avatar?: string;
  phone?: string;
  address?: AdminCustomerProfile["address"];
  preferences?: Partial<AdminCustomerProfile["preferences"]>;
  metadata?: Record<string, unknown>;
}

export interface AdminSubscription {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  plan: SubscriptionPlan;
  status: AdminSubscriptionStatus;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  autoRenew: boolean;
  cancelledAt?: string;
  pausedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionCreateInput {
  customerId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  autoRenew: boolean;
}

export interface AdminSubscriptionUpdateInput {
  plan?: SubscriptionPlan;
  status?: AdminSubscriptionStatus;
  autoRenew?: boolean;
  endDate?: string;
}

export interface PaymentHistory {
  id: string;
  customerId: string;
  subscriptionId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  transactionId?: string;
  description: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLicense {
  id: string;
  customerId: string;
  itemId?: string;
  licenseKey: string;
  type: "regular" | "extended" | "commercial";
  status: "active" | "expired" | "revoked";
  expiresAt?: string;
  usageLimit: number;
  usageCount: number;
  domains: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  customerId: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  os: string;
  browser: string;
  ipAddress: string;
  lastActive: string;
  isActive: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  customerId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CustomerFilters {
  status?: AdminCustomerStatus;
  country?: string;
  hasSubscription?: boolean;
  subscriptionStatus?: AdminSubscriptionStatus;
  minSpent?: number;
  maxSpent?: number;
  search?: string;
  joinedAfter?: string;
  joinedBefore?: string;
}

export interface CustomerKPI {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  blockedCustomers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  avgSpentPerCustomer: number;
  newCustomersThisMonth: number;
  churnRate: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
}

export interface CustomerAuditLog {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  action: string;
  changedBy: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  timestamp: string;
}

export interface FraudFlag {
  id: string;
  customerId: string;
  type: "suspicious_activity" | "chargeback" | "payment_dispute" | "account_takeover";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence?: string[];
  status: "open" | "investigating" | "resolved" | "dismissed";
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}
