import { AUTHORS, ITEMS, SUBMISSIONS, type MarketItem } from "@/lib/marketplace-data";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "paused";

export type MarketplaceLicense = "regular" | "extended";

export interface MarketplaceCartItem {
  itemId: string;
  slug: string;
  title: string;
  author: string;
  price: number;
  license: MarketplaceLicense;
}

export interface MarketplacePurchaseItem extends MarketplaceCartItem {
  orderId: string;
  purchaseDate: string;
  version: string;
  invoiceNo: string;
  supportUntil: string;
  refundStatus: "none" | "requested" | "approved" | "rejected";
  licenseKey: string;
}

export interface MarketplaceWishlistItem {
  itemId: string;
  slug: string;
  title: string;
  author: string;
  price: number;
  rating: number;
  reviews: number;
}

export interface MarketplaceSubmission extends MarketItem {
  reviewNote?: string;
}

export type MarketplaceWorkflowState =
  | "draft"
  | "pending"
  | "review"
  | "approved"
  | "rejected"
  | "soft_rejected";

export interface MarketplaceAuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  at: string;
  details?: string;
}

export interface MarketplaceDisputeTicket {
  id: string;
  refundId: string;
  buyer: string;
  author: string;
  status: "open" | "under_review" | "resolved";
  createdAt: string;
  evidence: string[];
  timeline: string[];
}

export interface MarketplaceLedgerEntry {
  id: string;
  author: string;
  type: "credit" | "debit";
  source: "order" | "refund" | "payout" | "adjustment";
  amount: number;
  at: string;
  reference: string;
}

export interface MarketplaceConsistencyFinding {
  id: string;
  severity: "low" | "medium" | "high";
  issue: string;
  fixed: boolean;
}

export interface MarketplaceManagerSummary {
  gmv: number;
  takeRateRevenue: number;
  activeItems: number;
  activeAuthors: number;
  pendingReviews: number;
  reportedItems: number;
  pendingPayoutAmount: number;
  refundRatePct: number;
  systemHealth: "healthy" | "degraded" | "critical";
}

export interface MarketplaceRefundRequest {
  id: string;
  item: string;
  buyer: string;
  author: string;
  reason: string;
  amount: number;
  requested: string;
  status: "pending" | "escalated" | "approved" | "rejected";
  escalated: boolean;
}

export interface MarketplaceAuthorAdmin {
  id: string;
  username: string;
  country: string;
  level: string;
  items: number;
  sales: number;
  earnings: number;
  featured: boolean;
  suspended: boolean;
}

export interface MarketplacePayout {
  id: string;
  author: string;
  method: string;
  amount: number;
  period: string;
  requested: string;
  status: "pending" | "processing" | "paid" | "held";
}

export interface CustomerSubscription {
  id: string;
  product: string;
  price: string;
  status: SubscriptionStatus;
  nextBill: string;
  started: string;
  paymentMethod: string;
}

export interface LicenseDevice {
  name: string;
  id: string;
  activated: string;
}

export interface CustomerLicense {
  id: string;
  key: string;
  product: string;
  status: "active" | "inactive";
  maxActivations: number;
  devices: LicenseDevice[];
  expires: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string;
  status: "active" | "disabled";
  lastDelivery: string;
  successRate: string;
  description?: string;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  endpoint: string;
  status: "completed" | "pending" | "failed";
  code: string;
  time: string;
}

interface UiStore {
  customerSubscriptions: CustomerSubscription[];
  customerLicenses: CustomerLicense[];
  webhookEndpoints: WebhookEndpoint[];
  webhookDeliveries: WebhookDelivery[];
  marketplaceCart: MarketplaceCartItem[];
  marketplaceWishlist: MarketplaceWishlistItem[];
  marketplacePurchases: MarketplacePurchaseItem[];
  marketplaceVerifiedReferences: string[];
  marketplaceSubmissions: MarketplaceSubmission[];
  marketplaceRefunds: MarketplaceRefundRequest[];
  marketplaceAuthorsAdmin: MarketplaceAuthorAdmin[];
  marketplacePayouts: MarketplacePayout[];
  marketplaceAuditLogs: MarketplaceAuditLog[];
  marketplaceDisputes: MarketplaceDisputeTicket[];
  marketplaceLedger: MarketplaceLedgerEntry[];
  marketplaceIdempotencyKeys: string[];
  marketplaceEditLocks: Array<{ entity: string; entityId: string; owner: string; at: string }>;
  marketplaceSnapshots: Array<{
    id: string;
    createdAt: string;
    reason: string;
    data: Pick<
      UiStore,
      | "marketplaceSubmissions"
      | "marketplaceRefunds"
      | "marketplaceAuthorsAdmin"
      | "marketplacePayouts"
      | "marketplaceLedger"
    >;
  }>;
}

type CheckoutCoupon = { type: "percentage" | "flat"; value: number; label: string };

const CHECKOUT_COUPONS: Record<string, CheckoutCoupon> = {
  SAVE20: { type: "percentage", value: 20, label: "20% off" },
  WELCOME10: { type: "percentage", value: 10, label: "10% welcome discount" },
  FLAT5: { type: "flat", value: 5, label: "$5 off" },
};

const STORE_KEY = "erpvala.ui.store.v1";

const defaultStore: UiStore = {
  customerSubscriptions: [
    {
      id: "sub_001",
      product: "Pro Plan",
      price: "$29.00/mo",
      status: "active",
      nextBill: "Aug 15, 2024",
      started: "Jan 15, 2024",
      paymentMethod: "Visa •••• 4242",
    },
    {
      id: "sub_002",
      product: "API Add-on",
      price: "$49.00/mo",
      status: "active",
      nextBill: "Aug 18, 2024",
      started: "Jul 18, 2024",
      paymentMethod: "Visa •••• 4242",
    },
  ],
  customerLicenses: [
    {
      id: "lic_001",
      key: "EVLA-ABCD-EFGH-1234",
      product: "Enterprise License",
      status: "active",
      maxActivations: 5,
      devices: [
        { name: "MacBook Pro", id: "dev_001", activated: "Feb 20, 2024" },
        { name: "Desktop PC", id: "dev_002", activated: "Jul 10, 2024" },
      ],
      expires: "Feb 20, 2025",
    },
    {
      id: "lic_002",
      key: "EVLA-IJKL-MNOP-5678",
      product: "Enterprise License",
      status: "active",
      maxActivations: 5,
      devices: [],
      expires: "Apr 18, 2025",
    },
  ],
  webhookEndpoints: [
    {
      id: "wh_001",
      url: "https://api.acme.com/webhooks/erp-vala",
      events: "All events",
      status: "active",
      lastDelivery: "2024-07-15 14:32",
      successRate: "99.2%",
    },
    {
      id: "wh_002",
      url: "https://hooks.slack.com/services/xxx",
      events: "subscription.created, payment.completed",
      status: "active",
      lastDelivery: "2024-07-15 14:30",
      successRate: "100%",
    },
    {
      id: "wh_003",
      url: "https://old-api.acme.com/hooks",
      events: "All events",
      status: "disabled",
      lastDelivery: "2024-06-01 09:15",
      successRate: "87.5%",
    },
  ],
  webhookDeliveries: [
    {
      id: "del_001",
      event: "subscription.created",
      endpoint: "api.acme.com",
      status: "completed",
      code: "200",
      time: "2024-07-15 14:32:05",
    },
    {
      id: "del_002",
      event: "payment.completed",
      endpoint: "hooks.slack.com",
      status: "completed",
      code: "200",
      time: "2024-07-15 14:30:12",
    },
    {
      id: "del_003",
      event: "subscription.updated",
      endpoint: "api.acme.com",
      status: "completed",
      code: "200",
      time: "2024-07-15 13:45:33",
    },
    {
      id: "del_004",
      event: "payment.completed",
      endpoint: "api.acme.com",
      status: "pending",
      code: "—",
      time: "2024-07-15 13:44:50",
    },
  ],
  marketplaceCart: ITEMS.slice(0, 2).map((item) => ({
    itemId: item.id,
    slug: item.slug,
    title: item.title,
    author: item.author,
    price: item.price,
    license: "regular" as MarketplaceLicense,
  })),
  marketplaceWishlist: ITEMS.slice(2, 7).map((item) => ({
    itemId: item.id,
    slug: item.slug,
    title: item.title,
    author: item.author,
    price: item.price,
    rating: item.rating,
    reviews: item.reviews,
  })),
  marketplacePurchases: ITEMS.slice(0, 4).map((item, index) => ({
    itemId: item.id,
    slug: item.slug,
    title: item.title,
    author: item.author,
    price: item.price,
    license: index % 2 === 0 ? "regular" : "extended",
    orderId: `WIS-${(100000 + index).toString()}`,
    purchaseDate: ["2024-12-10", "2024-11-22", "2024-09-15", "2024-07-04"][index],
    version: item.version,
    invoiceNo: `INV-${20240 + index}`,
    supportUntil: ["2025-06-10", "2025-05-22", "2025-03-15", "2025-01-04"][index],
    refundStatus: "none",
    licenseKey: `EVL-${item.id.toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
  })),
  marketplaceVerifiedReferences: [],
  marketplaceSubmissions: deepClone(SUBMISSIONS),
  marketplaceRefunds: [
    {
      id: "rf_a01",
      item: "NovaPress SaaS Theme",
      buyer: "Buyer4912",
      author: "PixelStack",
      reason: "Not as described",
      amount: 59,
      requested: "2024-12-14",
      status: "pending",
      escalated: false,
    },
    {
      id: "rf_a02",
      item: "Mega Addons for Elementor",
      buyer: "Buyer8821",
      author: "ThemeNest",
      reason: "Bug — disputed by author",
      amount: 29,
      requested: "2024-12-13",
      status: "escalated",
      escalated: true,
    },
    {
      id: "rf_a03",
      item: "WC Multi-Vendor",
      buyer: "Buyer1102",
      author: "PixelStack",
      reason: "Bug — checkout broken",
      amount: 89,
      requested: "2024-12-08",
      status: "approved",
      escalated: false,
    },
    {
      id: "rf_a04",
      item: "Vue POS",
      buyer: "Buyer7723",
      author: "DevOrbit",
      reason: "Changed mind",
      amount: 45,
      requested: "2024-12-04",
      status: "rejected",
      escalated: false,
    },
  ],
  marketplaceAuthorsAdmin: AUTHORS.map((author) => ({
    ...author,
    suspended: false,
  })),
  marketplacePayouts: [
    {
      id: "po_001",
      author: "PixelStack",
      method: "PayPal",
      amount: 8240.5,
      period: "Dec 2024",
      requested: "2024-12-15",
      status: "pending",
    },
    {
      id: "po_002",
      author: "ThemeNest",
      method: "Wire",
      amount: 14820.0,
      period: "Dec 2024",
      requested: "2024-12-15",
      status: "pending",
    },
    {
      id: "po_003",
      author: "DevOrbit",
      method: "PayPal",
      amount: 4120.2,
      period: "Dec 2024",
      requested: "2024-12-14",
      status: "processing",
    },
    {
      id: "po_004",
      author: "AppForge",
      method: "Payoneer",
      amount: 6480.0,
      period: "Dec 2024",
      requested: "2024-12-14",
      status: "pending",
    },
    {
      id: "po_005",
      author: "CodeMatrix",
      method: "PayPal",
      amount: 2240.0,
      period: "Nov 2024",
      requested: "2024-11-30",
      status: "paid",
    },
    {
      id: "po_006",
      author: "VizMaster",
      method: "Wire",
      amount: 1890.0,
      period: "Nov 2024",
      requested: "2024-11-30",
      status: "paid",
    },
  ],
  marketplaceAuditLogs: [],
  marketplaceDisputes: [],
  marketplaceLedger: [
    {
      id: "ld_001",
      author: "PixelStack",
      type: "credit",
      source: "order",
      amount: 8240.5,
      at: "2024-12-15 09:00:00",
      reference: "ORD-PIX-DEC",
    },
    {
      id: "ld_002",
      author: "ThemeNest",
      type: "credit",
      source: "order",
      amount: 14820,
      at: "2024-12-15 09:10:00",
      reference: "ORD-THE-DEC",
    },
  ],
  marketplaceIdempotencyKeys: [],
  marketplaceEditLocks: [],
  marketplaceSnapshots: [],
};

let memoryStore: UiStore = structuredClone(defaultStore);

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function readStore(): UiStore {
  if (!canUseStorage()) return structuredClone(memoryStore);
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(defaultStore);
    return { ...defaultStore, ...JSON.parse(raw) } as UiStore;
  } catch {
    return structuredClone(defaultStore);
  }
}

function writeStore(store: UiStore) {
  memoryStore = structuredClone(store);
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("erpvala:ui-store-updated"));
}

function nowLabel() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function nowIso() {
  return new Date().toISOString();
}

function appendAuditLog(
  store: UiStore,
  action: string,
  entity: string,
  entityId: string,
  details?: string,
  actor = "admin.system",
) {
  store.marketplaceAuditLogs.unshift({
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    actor,
    action,
    entity,
    entityId,
    at: nowLabel(),
    details,
  });
  store.marketplaceAuditLogs = store.marketplaceAuditLogs.slice(0, 2000);
}

function markIdempotency(store: UiStore, key?: string) {
  if (!key?.trim()) return;
  const normalized = key.trim().toLowerCase();
  if (store.marketplaceIdempotencyKeys.includes(normalized)) {
    throw new Error("Duplicate operation blocked by idempotency guard.");
  }
  store.marketplaceIdempotencyKeys.unshift(normalized);
  store.marketplaceIdempotencyKeys = store.marketplaceIdempotencyKeys.slice(0, 1000);
}

function submissionRiskScore(entry: MarketplaceSubmission) {
  const tagPenalty = entry.tags.length < 2 ? 10 : 0;
  const descPenalty = entry.description.trim().length < 60 ? 20 : 0;
  const demoPenalty = entry.title.toLowerCase().includes("demo") ? 10 : 0;
  const total = Math.min(100, tagPenalty + descPenalty + demoPenalty + (entry.price <= 0 ? 40 : 0));
  return total;
}

function authorRiskScore(author: MarketplaceAuthorAdmin) {
  let score = 0;
  if (author.suspended) score += 70;
  if (author.sales < 100) score += 20;
  if (!author.featured) score += 10;
  return Math.min(100, score);
}

function createMarketplaceSnapshot(
  store: UiStore,
  reason: string,
): { id: string; createdAt: string; reason: string } {
  const snapshot = {
    id: `snap_${Date.now()}`,
    createdAt: nowIso(),
    reason,
    data: {
      marketplaceSubmissions: deepClone(store.marketplaceSubmissions),
      marketplaceRefunds: deepClone(store.marketplaceRefunds),
      marketplaceAuthorsAdmin: deepClone(store.marketplaceAuthorsAdmin),
      marketplacePayouts: deepClone(store.marketplacePayouts),
      marketplaceLedger: deepClone(store.marketplaceLedger),
    },
  };
  store.marketplaceSnapshots.unshift(snapshot);
  store.marketplaceSnapshots = store.marketplaceSnapshots.slice(0, 20);
  return { id: snapshot.id, createdAt: snapshot.createdAt, reason: snapshot.reason };
}

async function withLatency<T>(work: () => T | Promise<T>) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return work();
}

function deepClone<T>(value: T) {
  return structuredClone(value);
}

export function getUiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please retry.",
) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function getCustomerSubscriptions() {
  return withLatency(() => deepClone(readStore().customerSubscriptions));
}

export async function upgradeSubscription(id: string) {
  return withLatency(() => {
    const store = readStore();
    const item = store.customerSubscriptions.find((s) => s.id === id);
    if (!item) throw new Error("Subscription not found.");
    if (item.status !== "active") throw new Error("Only active subscriptions can be upgraded.");
    if (!item.product.includes("Plus")) item.product = `${item.product} Plus`;
    writeStore(store);
    return deepClone(store.customerSubscriptions);
  });
}

export async function updateSubscriptionPayment(id: string) {
  return withLatency(() => {
    const store = readStore();
    const item = store.customerSubscriptions.find((s) => s.id === id);
    if (!item) throw new Error("Subscription not found.");
    if (item.status !== "active") throw new Error("Only active subscriptions can update payment.");
    item.paymentMethod = "Visa •••• 1111";
    writeStore(store);
    return deepClone(store.customerSubscriptions);
  });
}

export async function cancelSubscription(id: string) {
  return withLatency(() => {
    const store = readStore();
    const item = store.customerSubscriptions.find((s) => s.id === id);
    if (!item) throw new Error("Subscription not found.");
    if (item.status === "canceled") throw new Error("Subscription is already canceled.");
    item.status = "canceled";
    item.nextBill = "—";
    writeStore(store);
    return deepClone(store.customerSubscriptions);
  });
}

export async function getCustomerLicenses() {
  return withLatency(() => deepClone(readStore().customerLicenses));
}

export async function activateLicenseDevice(licenseId: string, deviceName: string) {
  return withLatency(() => {
    const cleanName = deviceName.trim();
    if (!cleanName) throw new Error("Device name is required.");
    const store = readStore();
    const license = store.customerLicenses.find((l) => l.id === licenseId);
    if (!license) throw new Error("License not found.");
    if (license.devices.length >= license.maxActivations) {
      throw new Error("Activation limit reached for this license.");
    }
    license.devices.push({
      id: `dev_${Date.now()}`,
      name: cleanName,
      activated: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    });
    writeStore(store);
    return deepClone(store.customerLicenses);
  });
}

export async function deactivateLicenseDevice(licenseId: string, deviceId: string) {
  return withLatency(() => {
    const store = readStore();
    const license = store.customerLicenses.find((l) => l.id === licenseId);
    if (!license) throw new Error("License not found.");
    const before = license.devices.length;
    license.devices = license.devices.filter((d) => d.id !== deviceId);
    if (before === license.devices.length) throw new Error("Device not found.");
    writeStore(store);
    return deepClone(store.customerLicenses);
  });
}

export async function getWebhookEndpoints() {
  return withLatency(() => deepClone(readStore().webhookEndpoints));
}

export async function getWebhookDeliveries() {
  return withLatency(() => deepClone(readStore().webhookDeliveries));
}

function appendDelivery(
  store: UiStore,
  event: string,
  endpointUrl: string,
  status: WebhookDelivery["status"] = "completed",
) {
  const endpointHost = (() => {
    try {
      return new URL(endpointUrl).host;
    } catch {
      return endpointUrl;
    }
  })();
  store.webhookDeliveries = [
    {
      id: `del_${Date.now()}`,
      event,
      endpoint: endpointHost,
      status,
      code: status === "completed" ? "200" : status === "failed" ? "500" : "—",
      time: nowLabel(),
    },
    ...store.webhookDeliveries,
  ].slice(0, 30);
}

export async function saveWebhookEndpoint(input: {
  endpointId?: string;
  url: string;
  description?: string;
  selectedEvents: string[];
}) {
  return withLatency(() => {
    const cleanUrl = input.url.trim();
    if (!cleanUrl) throw new Error("Endpoint URL is required.");
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(cleanUrl);
    } catch {
      throw new Error("Enter a valid URL.");
    }
    if (parsedUrl.protocol !== "https:") throw new Error("Webhook URL must use HTTPS.");
    if (input.selectedEvents.length === 0) throw new Error("Select at least one event.");

    const store = readStore();
    const events = input.selectedEvents.join(", ");
    const now = nowLabel().slice(0, 16);
    const existing = input.endpointId
      ? store.webhookEndpoints.find((e) => e.id === input.endpointId)
      : undefined;

    if (existing) {
      existing.url = cleanUrl;
      existing.description = input.description;
      existing.events = events;
      existing.lastDelivery = now;
      appendDelivery(store, "webhook.updated", cleanUrl);
    } else {
      store.webhookEndpoints = [
        {
          id: `wh_${Date.now()}`,
          url: cleanUrl,
          description: input.description,
          events,
          status: "active",
          lastDelivery: now,
          successRate: "100%",
        },
        ...store.webhookEndpoints,
      ];
      appendDelivery(store, "webhook.created", cleanUrl);
    }

    writeStore(store);
    return {
      endpoints: deepClone(store.webhookEndpoints),
      deliveries: deepClone(store.webhookDeliveries),
    };
  });
}

export async function deleteWebhookEndpoint(endpointId: string) {
  return withLatency(() => {
    const store = readStore();
    const endpoint = store.webhookEndpoints.find((e) => e.id === endpointId);
    if (!endpoint) throw new Error("Webhook endpoint not found.");
    store.webhookEndpoints = store.webhookEndpoints.filter((e) => e.id !== endpointId);
    appendDelivery(store, "webhook.deleted", endpoint.url);
    writeStore(store);
    return {
      endpoints: deepClone(store.webhookEndpoints),
      deliveries: deepClone(store.webhookDeliveries),
    };
  });
}

export async function applyCheckoutCoupon(code: string) {
  return withLatency(() => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) throw new Error("Enter a coupon code.");
    const coupon = CHECKOUT_COUPONS[normalized];
    if (!coupon) throw new Error("Invalid coupon code.");
    return { code: normalized, coupon };
  });
}

export async function processCheckoutPayment(payload: {
  cardNumber: string;
  email: string;
  amount: number;
  currency: string;
}) {
  return withLatency(() => {
    const digits = payload.cardNumber.replace(/\s/g, "");
    if (!digits) throw new Error("Card number is required.");
    if (digits.endsWith("0000"))
      throw new Error("Payment was declined. Please verify card details or use another card.");
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;
    return {
      orderId,
      amount: payload.amount,
      currency: payload.currency,
      receiptEmail: payload.email,
    };
  });
}

function itemById(itemId: string) {
  return ITEMS.find((item) => item.id === itemId);
}

function addMonths(isoDate: string, months: number) {
  const dt = new Date(isoDate);
  dt.setMonth(dt.getMonth() + months);
  return dt.toISOString().slice(0, 10);
}

function createLicenseKey(itemId: string) {
  return `EVL-${itemId.toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export async function getMarketplaceCart() {
  return withLatency(() => deepClone(readStore().marketplaceCart));
}

export async function getMarketplaceWishlist() {
  return withLatency(() => deepClone(readStore().marketplaceWishlist));
}

export async function addMarketplaceWishlistItem(itemId: string) {
  return withLatency(() => {
    const store = readStore();
    const item = itemById(itemId);
    if (!item) throw new Error("Item not found.");
    const exists = store.marketplaceWishlist.some((entry) => entry.itemId === itemId);
    if (!exists) {
      store.marketplaceWishlist.unshift({
        itemId: item.id,
        slug: item.slug,
        title: item.title,
        author: item.author,
        price: item.price,
        rating: item.rating,
        reviews: item.reviews,
      });
      writeStore(store);
    }
    return deepClone(store.marketplaceWishlist);
  });
}

export async function removeMarketplaceWishlistItem(itemId: string) {
  return withLatency(() => {
    const store = readStore();
    const before = store.marketplaceWishlist.length;
    store.marketplaceWishlist = store.marketplaceWishlist.filter(
      (entry) => entry.itemId !== itemId,
    );
    if (store.marketplaceWishlist.length === before) throw new Error("Wishlist item not found.");
    writeStore(store);
    return deepClone(store.marketplaceWishlist);
  });
}

export async function addMarketplaceCartItem(
  itemId: string,
  license: MarketplaceLicense = "regular",
) {
  return withLatency(() => {
    const store = readStore();
    const item = itemById(itemId);
    if (!item) throw new Error("Item not found.");
    const existing = store.marketplaceCart.find((entry) => entry.itemId === itemId);
    if (existing) {
      existing.license = license;
    } else {
      store.marketplaceCart.unshift({
        itemId: item.id,
        slug: item.slug,
        title: item.title,
        author: item.author,
        price: item.price,
        license,
      });
    }
    writeStore(store);
    return deepClone(store.marketplaceCart);
  });
}

export async function updateMarketplaceCartItemLicense(
  itemId: string,
  license: MarketplaceLicense,
) {
  return withLatency(() => {
    const store = readStore();
    const entry = store.marketplaceCart.find((item) => item.itemId === itemId);
    if (!entry) throw new Error("Cart item not found.");
    entry.license = license;
    writeStore(store);
    return deepClone(store.marketplaceCart);
  });
}

export async function removeMarketplaceCartItem(itemId: string) {
  return withLatency(() => {
    const store = readStore();
    const before = store.marketplaceCart.length;
    store.marketplaceCart = store.marketplaceCart.filter((entry) => entry.itemId !== itemId);
    if (store.marketplaceCart.length === before) throw new Error("Cart item not found.");
    writeStore(store);
    return deepClone(store.marketplaceCart);
  });
}

export async function getMarketplacePurchases() {
  return withLatency(() => deepClone(readStore().marketplacePurchases));
}

export async function requestMarketplaceRefund(orderId: string) {
  return withLatency(() => {
    const store = readStore();
    const purchase = store.marketplacePurchases.find((entry) => entry.orderId === orderId);
    if (!purchase) throw new Error("Order not found.");
    if (purchase.refundStatus === "requested") throw new Error("Refund already requested.");
    purchase.refundStatus = "requested";
    writeStore(store);
    return deepClone(store.marketplacePurchases);
  });
}

export async function startMarketplaceDownload(orderId: string) {
  return withLatency(() => {
    const purchase = readStore().marketplacePurchases.find((entry) => entry.orderId === orderId);
    if (!purchase) throw new Error("Order not found.");
    const safeSlug = purchase.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    return {
      downloadId: `DL-${Date.now()}`,
      fileName: `${safeSlug}-${purchase.version}.zip`,
    };
  });
}

export async function openMarketplaceInvoice(orderId: string) {
  return withLatency(() => {
    const purchase = readStore().marketplacePurchases.find((entry) => entry.orderId === orderId);
    if (!purchase) throw new Error("Order not found.");
    return {
      invoiceNo: purchase.invoiceNo,
      invoiceUrl: `/customer/marketplace-downloads?invoice=${encodeURIComponent(purchase.invoiceNo)}`,
    };
  });
}

export async function renewMarketplaceSupport(orderId: string) {
  return withLatency(() => {
    const store = readStore();
    const purchase = store.marketplacePurchases.find((entry) => entry.orderId === orderId);
    if (!purchase) throw new Error("Order not found.");
    purchase.supportUntil = addMonths(purchase.supportUntil, 6);
    writeStore(store);
    return deepClone(store.marketplacePurchases);
  });
}

export async function verifyWiseCheckoutPayment(payload: {
  reference: string;
  proof: string;
  email: string;
  amount: number;
  currency: string;
}) {
  return withLatency(() => {
    const reference = payload.reference.trim();
    const normalizedReference = reference.toUpperCase();
    const proof = payload.proof.trim();
    if (!reference) throw new Error("Transaction reference is required.");
    if (!proof) throw new Error("Payment proof is required.");
    if (!payload.email.trim()) throw new Error("Receipt email is required.");
    if (!(payload.amount > 0)) throw new Error("Invalid checkout amount.");
    if (normalizedReference.includes("FAIL")) {
      throw new Error("Wise verification rejected this reference. Please verify and retry.");
    }

    const store = readStore();
    if (store.marketplaceCart.length === 0) {
      throw new Error("Your cart is empty. Add an item before checkout.");
    }
    if (store.marketplaceVerifiedReferences.includes(normalizedReference)) {
      throw new Error("This payment reference has already been processed.");
    }
    const orderId = `WIS-${Date.now()}`;
    const purchaseDate = new Date().toISOString().slice(0, 10);
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;

    const purchased = store.marketplaceCart.map((entry, index) => {
      const item = itemById(entry.itemId);
      return {
        ...entry,
        orderId: `${orderId}-${index + 1}`,
        purchaseDate,
        version: item?.version ?? "1.0.0",
        invoiceNo,
        supportUntil: addMonths(purchaseDate, 6),
        refundStatus: "none" as const,
        licenseKey: createLicenseKey(entry.itemId),
      };
    });

    if (purchased.length > 0) {
      store.marketplacePurchases = [...purchased, ...store.marketplacePurchases];
      store.marketplaceVerifiedReferences.unshift(normalizedReference);
      store.marketplaceCart = [];
      writeStore(store);
    }

    return {
      status: "verified" as const,
      orderId,
      reference,
      amount: payload.amount,
      currency: payload.currency,
      receiptEmail: payload.email,
    };
  });
}

export async function verifyWiseWithdrawalRequest(payload: {
  reference: string;
  proof: string;
  amount: number;
}) {
  return withLatency(() => {
    const reference = payload.reference.trim();
    if (!reference) throw new Error("Transaction reference is required.");
    if (!payload.proof.trim()) throw new Error("Payment proof is required.");
    if (!(payload.amount > 0)) throw new Error("Invalid withdrawal amount.");
    if (reference.toUpperCase().includes("FAIL")) {
      throw new Error("Withdrawal verification failed for this reference.");
    }

    return {
      status: "queued" as const,
      withdrawalId: `WD-${Date.now()}`,
      reference,
      amount: payload.amount,
    };
  });
}

export async function getMarketplaceSubmissions() {
  return withLatency(() => deepClone(readStore().marketplaceSubmissions));
}

export async function submitMarketplaceItem(input: {
  title: string;
  category: string;
  subcategory: string;
  price: number;
  description: string;
  tags: string[];
  version: string;
}) {
  return withLatency(() => {
    const store = readStore();
    if (!input.title.trim()) throw new Error("Item title is required.");
    if (!input.category.trim()) throw new Error("Category is required.");
    if (!(input.price > 0)) throw new Error("Price must be greater than zero.");

    const id = `s${Date.now().toString().slice(-6)}`;
    const slug = input.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    const today = new Date().toISOString().slice(0, 10);

    store.marketplaceSubmissions.unshift({
      id,
      slug,
      title: input.title.trim(),
      category: input.category,
      subcategory: input.subcategory || "General",
      author: "PixelStack",
      authorAvatar: "PS",
      price: input.price,
      rating: 0,
      reviews: 0,
      sales: 0,
      thumbnail: "",
      tags: input.tags,
      lastUpdate: today,
      created: today,
      version: input.version || "1.0.0",
      description: input.description || "Submitted for review.",
      status: "pending",
    });

    writeStore(store);
    return deepClone(store.marketplaceSubmissions);
  });
}

export async function decideMarketplaceSubmission(
  id: string,
  status: "live" | "rejected" | "soft_rejected",
  reviewNote?: string,
) {
  return withLatency(() => {
    const store = readStore();
    const entry = store.marketplaceSubmissions.find((item) => item.id === id);
    if (!entry) throw new Error("Submission not found.");
    entry.status = status;
    entry.reviewNote = reviewNote?.trim() || undefined;
    writeStore(store);
    return deepClone(store.marketplaceSubmissions);
  });
}

export async function getMarketplaceRefunds() {
  return withLatency(() => deepClone(readStore().marketplaceRefunds));
}

export async function updateMarketplaceRefundStatus(id: string, status: "approved" | "rejected") {
  return withLatency(() => {
    const store = readStore();
    const entry = store.marketplaceRefunds.find((item) => item.id === id);
    if (!entry) throw new Error("Refund request not found.");
    entry.status = status;
    writeStore(store);
    return deepClone(store.marketplaceRefunds);
  });
}

export async function getMarketplaceAuthorsAdmin() {
  return withLatency(() => deepClone(readStore().marketplaceAuthorsAdmin));
}

export async function toggleMarketplaceAuthorFeatured(id: string) {
  return withLatency(() => {
    const store = readStore();
    const entry = store.marketplaceAuthorsAdmin.find((item) => item.id === id);
    if (!entry) throw new Error("Author not found.");
    entry.featured = !entry.featured;
    writeStore(store);
    return deepClone(store.marketplaceAuthorsAdmin);
  });
}

export async function suspendMarketplaceAuthor(id: string) {
  return withLatency(() => {
    const store = readStore();
    const entry = store.marketplaceAuthorsAdmin.find((item) => item.id === id);
    if (!entry) throw new Error("Author not found.");
    entry.suspended = true;
    writeStore(store);
    return deepClone(store.marketplaceAuthorsAdmin);
  });
}

export async function getMarketplacePayouts() {
  return withLatency(() => deepClone(readStore().marketplacePayouts));
}

export async function updateMarketplacePayoutStatus(id: string, status: "paid" | "held") {
  return withLatency(() => {
    const store = readStore();
    const entry = store.marketplacePayouts.find((item) => item.id === id);
    if (!entry) throw new Error("Payout record not found.");
    entry.status = status;
    writeStore(store);
    return deepClone(store.marketplacePayouts);
  });
}

export async function batchProcessMarketplacePayouts() {
  return withLatency(() => {
    const store = readStore();
    store.marketplacePayouts = store.marketplacePayouts.map((entry) =>
      entry.status === "pending" ? { ...entry, status: "processing" } : entry,
    );
    appendAuditLog(store, "payout.batch.process", "payout", "all", "Queued pending payouts");
    writeStore(store);
    return deepClone(store.marketplacePayouts);
  });
}

export async function getMarketplaceManagerSummary() {
  return withLatency(() => {
    const store = readStore();
    const pendingReviews = store.marketplaceSubmissions.filter(
      (entry) => entry.status === "pending",
    ).length;
    const pendingPayoutAmount = store.marketplacePayouts
      .filter((entry) => entry.status === "pending")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const refundRequested = store.marketplacePurchases.filter(
      (entry) => entry.refundStatus === "requested",
    ).length;
    const totalPurchases = Math.max(1, store.marketplacePurchases.length);
    const refundRatePct = Number(((refundRequested / totalPurchases) * 100).toFixed(2));
    const highRiskAuthors = store.marketplaceAuthorsAdmin.filter(
      (author) => authorRiskScore(author) >= 70,
    ).length;

    const summary: MarketplaceManagerSummary = {
      gmv: 348000,
      takeRateRevenue: 104400,
      activeItems: store.marketplaceSubmissions.filter((entry) => entry.status === "live").length,
      activeAuthors: store.marketplaceAuthorsAdmin.filter((entry) => !entry.suspended).length,
      pendingReviews,
      reportedItems: store.marketplaceRefunds.filter((entry) => entry.escalated).length,
      pendingPayoutAmount,
      refundRatePct,
      systemHealth: highRiskAuthors > 3 ? "degraded" : "healthy",
    };

    return summary;
  });
}

export async function runMarketplaceSubmissionQualityChecks(submissionId: string) {
  return withLatency(() => {
    const store = readStore();
    const entry = store.marketplaceSubmissions.find((item) => item.id === submissionId);
    if (!entry) throw new Error("Submission not found.");

    const checks = [
      {
        key: "description",
        passed: entry.description.trim().length >= 60,
        message: "Description must be at least 60 chars.",
      },
      {
        key: "tags",
        passed: entry.tags.length >= 2,
        message: "At least 2 tags required.",
      },
      {
        key: "price",
        passed: entry.price > 0,
        message: "Price must be greater than zero.",
      },
      {
        key: "duplicate-title",
        passed:
          store.marketplaceSubmissions.filter(
            (item) =>
              item.id !== entry.id && item.title.toLowerCase() === entry.title.toLowerCase(),
          ).length === 0,
        message: "Potential duplicate title detected.",
      },
    ];

    const risk = submissionRiskScore(entry);
    appendAuditLog(
      store,
      "submission.quality.scan",
      "submission",
      submissionId,
      `Risk score=${risk}`,
    );
    writeStore(store);
    return { checks, risk };
  });
}

export async function bulkDecideMarketplaceSubmissions(input: {
  ids: string[];
  status: "live" | "rejected" | "soft_rejected";
  reviewNote?: string;
  idempotencyKey?: string;
}) {
  return withLatency(() => {
    const store = readStore();
    markIdempotency(store, input.idempotencyKey);
    if (input.ids.length === 0) throw new Error("Select at least one submission.");

    const allowed = new Set(input.ids);
    let changed = 0;
    store.marketplaceSubmissions = store.marketplaceSubmissions.map((entry) => {
      if (!allowed.has(entry.id)) return entry;
      changed += 1;
      return {
        ...entry,
        status: input.status,
        reviewNote: input.reviewNote?.trim() || entry.reviewNote,
      };
    });

    if (changed === 0) throw new Error("No matching submissions found.");
    appendAuditLog(
      store,
      "submission.bulk.decision",
      "submission",
      "bulk",
      `${changed} updated to ${input.status}`,
    );
    writeStore(store);
    return deepClone(store.marketplaceSubmissions);
  });
}

export async function getMarketplaceAuthorOpsView() {
  return withLatency(() => {
    const store = readStore();
    return store.marketplaceAuthorsAdmin.map((author) => {
      const risk = authorRiskScore(author);
      const tier = author.sales > 15000 ? "premium" : author.sales > 5000 ? "trusted" : "new";
      const strikes = author.suspended ? 3 : risk >= 40 ? 1 : 0;
      const payoutEligible = !author.suspended && risk < 70 && author.earnings >= 100;
      return {
        ...author,
        risk,
        tier,
        strikes,
        payoutEligible,
        kycStatus: risk >= 70 ? "review" : "verified",
        reputationScore: Math.max(0, 100 - risk + (author.featured ? 5 : 0)),
      };
    });
  });
}

export async function checkMarketplacePayoutEligibility(authorRef: string) {
  return withLatency(() => {
    const store = readStore();
    const normalized = authorRef.trim().toLowerCase();
    const author = store.marketplaceAuthorsAdmin.find(
      (entry) => entry.id === authorRef || entry.username.toLowerCase() === normalized,
    );
    if (!author) throw new Error("Author not found.");
    const risk = authorRiskScore(author);
    const minThreshold = 100;
    const eligible = !author.suspended && author.earnings >= minThreshold && risk < 70;
    return {
      eligible,
      risk,
      threshold: minThreshold,
      holdReason: eligible ? null : "Risk/threshold check failed",
    };
  });
}

export async function recordMarketplaceManagerAction(input: {
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  actor?: string;
  idempotencyKey?: string;
}) {
  return withLatency(() => {
    const store = readStore();
    markIdempotency(store, input.idempotencyKey);
    appendAuditLog(
      store,
      input.action,
      input.entity,
      input.entityId,
      input.details,
      input.actor || "admin.system",
    );
    writeStore(store);
    return { ok: true, at: nowIso() };
  });
}

export async function createMarketplaceDisputeTicket(input: {
  refundId: string;
  evidence: string;
  actor?: string;
}) {
  return withLatency(() => {
    const store = readStore();
    const refund = store.marketplaceRefunds.find((entry) => entry.id === input.refundId);
    if (!refund) throw new Error("Refund request not found.");

    const ticket: MarketplaceDisputeTicket = {
      id: `disp_${Date.now()}`,
      refundId: input.refundId,
      buyer: refund.buyer,
      author: refund.author,
      status: "open",
      createdAt: nowIso(),
      evidence: [input.evidence.trim()].filter(Boolean),
      timeline: [`${nowLabel()} ticket created`],
    };

    refund.status = "escalated";
    refund.escalated = true;
    store.marketplaceDisputes.unshift(ticket);
    appendAuditLog(
      store,
      "refund.dispute.create",
      "refund",
      input.refundId,
      `Ticket ${ticket.id}`,
      input.actor || "admin.system",
    );
    writeStore(store);
    return deepClone(ticket);
  });
}

export async function getMarketplaceDisputes() {
  return withLatency(() => deepClone(readStore().marketplaceDisputes));
}

export async function runMarketplaceConsistencyCheck(autoFix = true) {
  return withLatency(() => {
    const store = readStore();
    const findings: MarketplaceConsistencyFinding[] = [];

    for (const payout of store.marketplacePayouts) {
      const authorExists = store.marketplaceAuthorsAdmin.some(
        (author) => author.username === payout.author,
      );
      if (!authorExists) {
        findings.push({
          id: `cons_${Date.now()}_${payout.id}`,
          severity: "high",
          issue: `Orphan payout ${payout.id} has unknown author ${payout.author}`,
          fixed: false,
        });
      }
    }

    const duplicateSubmissionTitles = new Set<string>();
    for (const entry of store.marketplaceSubmissions) {
      const normalized = entry.title.trim().toLowerCase();
      if (duplicateSubmissionTitles.has(normalized)) {
        findings.push({
          id: `cons_dup_${entry.id}`,
          severity: "medium",
          issue: `Duplicate submission title detected: ${entry.title}`,
          fixed: false,
        });
      } else {
        duplicateSubmissionTitles.add(normalized);
      }
    }

    if (autoFix) {
      for (const finding of findings) {
        if (finding.issue.startsWith("Duplicate submission title")) {
          finding.fixed = true;
        }
      }
    }

    appendAuditLog(
      store,
      "consistency.check",
      "system",
      "marketplace",
      `${findings.length} finding(s), autoFix=${autoFix}`,
    );
    writeStore(store);
    return findings;
  });
}

export async function reconcileMarketplacePayouts() {
  return withLatency(() => {
    const store = readStore();
    const totalsByAuthor = new Map<string, number>();
    for (const entry of store.marketplaceLedger) {
      const sign = entry.type === "credit" ? 1 : -1;
      totalsByAuthor.set(
        entry.author,
        (totalsByAuthor.get(entry.author) || 0) + sign * entry.amount,
      );
    }

    const report = store.marketplacePayouts.map((payout) => {
      const balance = totalsByAuthor.get(payout.author) || 0;
      return {
        payoutId: payout.id,
        author: payout.author,
        payoutAmount: payout.amount,
        ledgerBalance: Number(balance.toFixed(2)),
        mismatch: payout.amount > balance,
      };
    });

    appendAuditLog(store, "payout.reconcile", "payout", "all", `${report.length} rows reconciled`);
    writeStore(store);
    return report;
  });
}

export async function exportMarketplaceManagerData(
  entity: "submissions" | "refunds" | "authors" | "payouts",
) {
  return withLatency(() => {
    const store = readStore();
    const data =
      entity === "submissions"
        ? store.marketplaceSubmissions
        : entity === "refunds"
          ? store.marketplaceRefunds
          : entity === "authors"
            ? store.marketplaceAuthorsAdmin
            : store.marketplacePayouts;

    appendAuditLog(store, "export", entity, "all", `Exported ${data.length} records`);
    writeStore(store);
    return {
      entity,
      exportedAt: nowIso(),
      count: data.length,
      rows: deepClone(data),
    };
  });
}

export async function getMarketplaceAuditLogs() {
  return withLatency(() => deepClone(readStore().marketplaceAuditLogs));
}

export async function snapshotMarketplaceManagerState(reason: string) {
  return withLatency(() => {
    const store = readStore();
    const snapshot = createMarketplaceSnapshot(store, reason.trim() || "Manual snapshot");
    appendAuditLog(store, "snapshot.create", "snapshot", snapshot.id, snapshot.reason);
    writeStore(store);
    return snapshot;
  });
}

export async function restoreMarketplaceManagerSnapshot(snapshotId: string) {
  return withLatency(() => {
    const store = readStore();
    const snapshot = store.marketplaceSnapshots.find((entry) => entry.id === snapshotId);
    if (!snapshot) throw new Error("Snapshot not found.");

    store.marketplaceSubmissions = deepClone(snapshot.data.marketplaceSubmissions);
    store.marketplaceRefunds = deepClone(snapshot.data.marketplaceRefunds);
    store.marketplaceAuthorsAdmin = deepClone(snapshot.data.marketplaceAuthorsAdmin);
    store.marketplacePayouts = deepClone(snapshot.data.marketplacePayouts);
    store.marketplaceLedger = deepClone(snapshot.data.marketplaceLedger);

    appendAuditLog(store, "snapshot.restore", "snapshot", snapshotId, snapshot.reason);
    writeStore(store);
    return {
      restored: true,
      snapshotId,
      restoredAt: nowIso(),
    };
  });
}

export async function acquireMarketplaceEditLock(entity: string, entityId: string, owner: string) {
  return withLatency(() => {
    const store = readStore();
    const existing = store.marketplaceEditLocks.find(
      (entry) => entry.entity === entity && entry.entityId === entityId,
    );
    if (existing && existing.owner !== owner) {
      throw new Error(`Record is currently locked by ${existing.owner}`);
    }

    if (!existing) {
      store.marketplaceEditLocks.unshift({ entity, entityId, owner, at: nowIso() });
      appendAuditLog(store, "lock.acquire", entity, entityId, `owner=${owner}`);
      writeStore(store);
    }

    return { locked: true, entity, entityId, owner };
  });
}

export async function releaseMarketplaceEditLock(entity: string, entityId: string, owner: string) {
  return withLatency(() => {
    const store = readStore();
    const before = store.marketplaceEditLocks.length;
    store.marketplaceEditLocks = store.marketplaceEditLocks.filter(
      (entry) => !(entry.entity === entity && entry.entityId === entityId && entry.owner === owner),
    );
    if (before !== store.marketplaceEditLocks.length) {
      appendAuditLog(store, "lock.release", entity, entityId, `owner=${owner}`);
      writeStore(store);
    }
    return { released: before !== store.marketplaceEditLocks.length };
  });
}
