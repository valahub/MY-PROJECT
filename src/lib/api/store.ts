// In-memory data store — MVP layer (no persistent DB)
// WARNING: State is scoped to a single Cloudflare Worker instance.
// Replace with D1 / KV / Durable Objects for production multi-instance deployments.

import type {
  Role,
  UserStatus,
  ProductStatus,
  OrderStatus,
  PaymentStatus,
  InvoiceStatus,
} from "./types";

// ── Entity shapes ─────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  status: UserStatus;
  merchantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMerchantProfile {
  userId: string;
  businessName: string;
  businessType: string;
  taxId?: string;
  country: string;
  website?: string;
  kycStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface StoredProduct {
  id: string;
  slug: string;
  merchantId: string;
  title: string;
  description: string;
  categoryId?: string;
  status: ProductStatus;
  price: number;
  currency: string;
  taxable: boolean;
  version: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCategory {
  id: string;
  slug: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export interface StoredPlan {
  id: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly" | "one_time";
  active: boolean;
  createdAt: string;
}

export interface StoredCheckoutSession {
  id: string;
  userId: string;
  productId?: string;
  planId?: string;
  discountCode?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  status: "open" | "completed" | "expired";
  expiresAt: string;
  createdAt: string;
}

export interface StoredOrder {
  id: string;
  userId: string;
  checkoutSessionId?: string;
  productId?: string;
  planId?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredPayment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayRef?: string;
  idempotencyKey?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredInvoice {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string;
  createdAt: string;
}

export interface StoredDiscount {
  id: string;
  merchantId: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  maxUses?: number;
  uses: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export interface StoredApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  scopes: string[];
  sandbox: boolean;
  active: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface StoredWebhook {
  id: string;
  merchantId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
}

export interface StoredWebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: string;
  status: "delivered" | "failed" | "pending";
  attempts: number;
  responseCode?: number;
  createdAt: string;
}

export interface StoredRefreshToken {
  jti: string;
  userId: string;
  expiresAt: number; // unix timestamp
}

// ── Store singleton ───────────────────────────────────────────────────────────

class Store {
  // Primary maps: id → entity
  users = new Map<string, StoredUser>();
  merchantProfiles = new Map<string, StoredMerchantProfile>(); // keyed by userId
  products = new Map<string, StoredProduct>();
  categories = new Map<string, StoredCategory>();
  plans = new Map<string, StoredPlan>();
  checkoutSessions = new Map<string, StoredCheckoutSession>();
  orders = new Map<string, StoredOrder>();
  payments = new Map<string, StoredPayment>();
  invoices = new Map<string, StoredInvoice>();
  discounts = new Map<string, StoredDiscount>();
  apiKeys = new Map<string, StoredApiKey>();
  webhooks = new Map<string, StoredWebhook>();
  webhookLogs = new Map<string, StoredWebhookLog>();
  refreshTokens = new Map<string, StoredRefreshToken>(); // jti → record

  // Revoked access token JTIs (to prevent replay after logout)
  revokedTokens = new Set<string>();

  // Secondary indexes for fast lookup
  usersByEmail = new Map<string, string>(); // email → userId
  productsBySlug = new Map<string, string>(); // slug → productId
  discountsByCode = new Map<string, string>(); // code → discountId
  apiKeysByKey = new Map<string, string>(); // key string → apiKeyId
  invoicesByOrderId = new Map<string, string>(); // orderId → invoiceId

  /** Populate default admin and merchant accounts for development only.
   * The "seed:" prefix marks passwords as plaintext dev fixtures handled
   * by verifyPassword(). These accounts MUST NOT exist in production —
   * replace this module with a proper persistent store before deploying.
   */
  seedDefaults(): void {
    const now = new Date().toISOString();

    // Admin
    const adminId = "usr_admin_001";
    this.users.set(adminId, {
      id: adminId,
      email: "admin@erpvala.com",
      passwordHash: "seed:Admin#123",
      name: "Super Admin",
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    this.usersByEmail.set("admin@erpvala.com", adminId);

    // Merchant
    const merchantUserId = "usr_merchant_001";
    this.users.set(merchantUserId, {
      id: merchantUserId,
      email: "merchant@acme.com",
      passwordHash: "seed:Merchant@1234",
      name: "Acme Corp",
      role: "merchant",
      status: "active",
      merchantId: "mch_001",
      createdAt: now,
      updatedAt: now,
    });
    this.usersByEmail.set("merchant@acme.com", merchantUserId);

    // Customer
    const customerUserId = "usr_customer_001";
    this.users.set(customerUserId, {
      id: customerUserId,
      email: "customer@example.com",
      passwordHash: "seed:Customer@1234",
      name: "Jane Smith",
      role: "customer",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    this.usersByEmail.set("customer@example.com", customerUserId);

    // Seed categories
    const cats = [
      { id: "cat_001", slug: "wordpress", name: "WordPress" },
      { id: "cat_002", slug: "html-templates", name: "HTML Templates" },
      { id: "cat_003", slug: "javascript", name: "JavaScript" },
      { id: "cat_004", slug: "php-scripts", name: "PHP Scripts" },
      { id: "cat_005", slug: "mobile", name: "Mobile" },
    ];
    for (const c of cats) {
      this.categories.set(c.id, { ...c, createdAt: now });
    }

    // Seed a sample product for the merchant
    const prodId = "prod_001";
    const prodSlug = "nova-saas-theme";
    this.products.set(prodId, {
      id: prodId,
      slug: prodSlug,
      merchantId: "mch_001",
      title: "Nova SaaS Theme",
      description: "A fast, modern SaaS landing page theme.",
      categoryId: "cat_001",
      status: "published",
      price: 59,
      currency: "USD",
      taxable: true,
      version: "1.0.0",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    this.productsBySlug.set(prodSlug, prodId);

    // Seed a plan for the product
    this.plans.set("plan_001", {
      id: "plan_001",
      productId: prodId,
      name: "Regular License",
      price: 59,
      currency: "USD",
      interval: "one_time",
      active: true,
      createdAt: now,
    });

    // Seed a discount
    const discId = "disc_001";
    this.discounts.set(discId, {
      id: discId,
      merchantId: "mch_001",
      code: "LAUNCH20",
      type: "percent",
      value: 20,
      maxUses: 100,
      uses: 4,
      active: true,
      createdAt: now,
    });
    this.discountsByCode.set("LAUNCH20", discId);
  }
}

export const store = new Store();
store.seedDefaults();
