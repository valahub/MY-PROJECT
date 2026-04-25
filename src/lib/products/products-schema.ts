// Products Schema
// Database schema definitions for product system with Paddle integration

// ============================================
// PRODUCT ENTITY
// ============================================

export type ProductType = "subscription" | "one-time" | "license";
export type ProductStatus = "active" | "draft" | "archived";
export type ProductVisibility = "public" | "private";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type BillingCycle = "monthly" | "yearly" | "one-time";

export interface ProductEntity {
  id: string;
  name: string;
  description: string;
  merchantId: string;
  type: ProductType;
  status: ProductStatus;
  visibility: ProductVisibility;
  approvalStatus: ApprovalStatus;
  version: string;
  currentVersion: string;
  paddleProductId: string;
  paddlePriceId: string;
  price: number;
  currency: string;
  trialDays: number;
  features: string[];
  demoUrl?: string;
  documentationUrl?: string;
  supportEmail?: string;
  revenue: number;
  customers: number;
  churnRate: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  merchantId: string;
  type: ProductType;
  status: ProductStatus;
  visibility: ProductVisibility;
  paddleProductId: string;
  paddlePriceId: string;
  price: number;
  currency: string;
  trialDays: number;
  features: string[];
  demoUrl?: string;
  documentationUrl?: string;
  supportEmail?: string;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  type?: ProductType;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  paddleProductId?: string;
  paddlePriceId?: string;
  price?: number;
  currency?: string;
  trialDays?: number;
  features?: string[];
  demoUrl?: string;
  documentationUrl?: string;
  supportEmail?: string;
  version?: string;
}

// ============================================
// PRODUCT PLAN ENTITY
// ============================================

export interface ProductPlanEntity {
  id: string;
  productId: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  paddlePriceId: string;
  features: string[];
  trialDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPlanCreateInput {
  productId: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  paddlePriceId: string;
  features: string[];
  trialDays: number;
}

// ============================================
// LICENSE ENTITY
// ============================================

export type LicenseStatus = "active" | "expired" | "revoked" | "suspended";

export interface LicenseEntity {
  id: string;
  userId: string;
  productId: string;
  licenseKey: string;
  status: LicenseStatus;
  expiryDate: string;
  activationLimit: number;
  activationCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseCreateInput {
  userId: string;
  productId: string;
  expiryDate: string;
  activationLimit: number;
}

// ============================================
// WEBHOOK LOG ENTITY
// ============================================

export type WebhookStatus = "pending" | "success" | "failed" | "retrying";

export interface WebhookLogEntity {
  id: string;
  event: string;
  payload: Record<string, unknown>;
  status: WebhookStatus;
  retryCount: number;
  lastError?: string;
  processedAt?: string;
  createdAt: string;
}

// ============================================
// COUPON ENTITY
// ============================================

export type CouponStatus = "active" | "expired" | "disabled";

export interface CouponEntity {
  id: string;
  code: string;
  discountPercent: number;
  discountAmount?: number;
  productId?: string;
  maxUses?: number;
  usedCount: number;
  expiryDate: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CouponCreateInput {
  code: string;
  discountPercent: number;
  discountAmount?: number;
  productId?: string;
  maxUses?: number;
  expiryDate: string;
}

// ============================================
// PRODUCT METRICS ENTITY
// ============================================

export interface ProductMetricsEntity {
  id: string;
  productId: string;
  revenue: number;
  customers: number;
  activeSubscriptions: number;
  churnRate: number;
  conversionRate: number;
  refunds: number;
  period: string;
  createdAt: string;
}

// ============================================
// SQL SCHEMA
// ============================================

export const PRODUCTS_SQL_SCHEMA = `
-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  merchant_id VARCHAR(255) NOT NULL,
  type ENUM('subscription', 'one-time', 'license') NOT NULL DEFAULT 'subscription',
  status ENUM('active', 'draft', 'archived') NOT NULL DEFAULT 'draft',
  visibility ENUM('public', 'private') NOT NULL DEFAULT 'private',
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  current_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  paddle_product_id VARCHAR(255) NOT NULL,
  paddle_price_id VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  trial_days INT DEFAULT 0,
  features JSON,
  demo_url VARCHAR(500),
  documentation_url VARCHAR(500),
  support_email VARCHAR(255),
  revenue DECIMAL(15, 2) DEFAULT 0.00,
  customers INT DEFAULT 0,
  churn_rate DECIMAL(5, 2) DEFAULT 0.00,
  conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_paddle_product_id (paddle_product_id)
);

-- Product plans table
CREATE TABLE IF NOT EXISTS product_plans (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle ENUM('monthly', 'yearly', 'one-time') NOT NULL,
  paddle_price_id VARCHAR(255) NOT NULL,
  features JSON,
  trial_days INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  status ENUM('active', 'expired', 'revoked', 'suspended') NOT NULL DEFAULT 'active',
  expiry_date TIMESTAMP NOT NULL,
  activation_limit INT DEFAULT 1,
  activation_count INT DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  INDEX idx_license_key (license_key)
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id VARCHAR(255) PRIMARY KEY,
  event VARCHAR(255) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending', 'success', 'failed', 'retrying') NOT NULL DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  last_error TEXT,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event (event),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent DECIMAL(5, 2) NOT NULL,
  discount_amount DECIMAL(10, 2),
  product_id VARCHAR(255),
  max_uses INT,
  used_count INT DEFAULT 0,
  expiry_date TIMESTAMP NOT NULL,
  status ENUM('active', 'expired', 'disabled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_status (status)
);

-- Product metrics table
CREATE TABLE IF NOT EXISTS product_metrics (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  revenue DECIMAL(15, 2) DEFAULT 0.00,
  customers INT DEFAULT 0,
  active_subscriptions INT DEFAULT 0,
  churn_rate DECIMAL(5, 2) DEFAULT 0.00,
  conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
  refunds INT DEFAULT 0,
  period VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_period (period)
);
`;
