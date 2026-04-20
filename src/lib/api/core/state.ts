import type {
  StoredInvoice,
  StoredOrder,
  StoredPayment,
  StoredProduct,
  StoredWebhookLog,
} from "@/lib/api/store";

export interface ProductVersionRecord {
  id: string;
  productId: string;
  version: string;
  filePath: string;
  checksum: string;
  createdAt: string;
}

export interface ProductApprovalRecord {
  productId: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  status: "none" | "pending" | "approved" | "rejected";
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  orderId: string;
  status: "trial" | "active" | "paused" | "cancelled" | "past_due";
  interval: "monthly" | "yearly";
  startedAt: string;
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  pausedAt?: string;
  cancelledAt?: string;
  graceUntil?: string;
  updatedAt: string;
}

export interface LicenseRecord {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  key: string;
  status: "active" | "revoked" | "expired";
  maxDevices: number;
  boundDevices: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DunningRecord {
  id: string;
  paymentId: string;
  subscriptionId?: string;
  retries: number;
  nextRetryAt?: string;
  status: "scheduled" | "in_progress" | "resolved" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRecord {
  id: string;
  merchantId: string;
  orderId: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  status: "requested" | "processing" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementRecord {
  userId: string;
  features: string[];
  source: "plan" | "license";
  sourceId: string;
  updatedAt: string;
}

export interface AnalyticsAggregate {
  mrr: number;
  arr: number;
  churnCount: number;
  activeSubscriptions: number;
  refundedRevenue: number;
  updatedAt: string;
}

export interface PaymentGatewaySnapshot {
  paymentId: string;
  rawRequest: string;
  rawResponse: string;
  createdAt: string;
}

export interface PriceSnapshot {
  checkoutSessionId: string;
  productId?: string;
  planId?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  country: string;
  createdAt: string;
}

class CoreState {
  productVersions = new Map<string, ProductVersionRecord[]>();
  productApprovals = new Map<string, ProductApprovalRecord>();
  subscriptions = new Map<string, SubscriptionRecord>();
  subscriptionsByOrderId = new Map<string, string[]>();
  licenses = new Map<string, LicenseRecord>();
  licensesByOrderId = new Map<string, string[]>();
  dunning = new Map<string, DunningRecord>();
  payouts = new Map<string, PayoutRecord>();
  entitlements = new Map<string, EntitlementRecord[]>();
  paymentGatewaySnapshots = new Map<string, PaymentGatewaySnapshot>();
  priceSnapshots = new Map<string, PriceSnapshot>();
  licenseActivationLocks = new Set<string>();
  analytics: AnalyticsAggregate = {
    mrr: 0,
    arr: 0,
    churnCount: 0,
    activeSubscriptions: 0,
    refundedRevenue: 0,
    updatedAt: new Date().toISOString(),
  };

  rollbackStoreSnapshots: Array<{
    payments: Map<string, StoredPayment>;
    products: Map<string, StoredProduct>;
    orders: Map<string, StoredOrder>;
    invoices: Map<string, StoredInvoice>;
    webhookLogs: Map<string, StoredWebhookLog>;
    subscriptions: Map<string, SubscriptionRecord>;
    subscriptionsByOrderId: Map<string, string[]>;
    licenses: Map<string, LicenseRecord>;
    licensesByOrderId: Map<string, string[]>;
    dunning: Map<string, DunningRecord>;
    payouts: Map<string, PayoutRecord>;
    entitlements: Map<string, EntitlementRecord[]>;
    paymentGatewaySnapshots: Map<string, PaymentGatewaySnapshot>;
    priceSnapshots: Map<string, PriceSnapshot>;
    analytics: AnalyticsAggregate;
  }> = [];
}

export const coreState = new CoreState();
