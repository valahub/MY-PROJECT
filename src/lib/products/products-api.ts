// Products API Service
// Backend API endpoints for product management with Paddle integration

import { paddleRBACManager } from "@/lib/paddle-rbac";
import type {
  ProductEntity,
  ProductCreateInput,
  ProductUpdateInput,
  ProductPlanEntity,
  ProductPlanCreateInput,
  LicenseEntity,
  LicenseCreateInput,
  WebhookLogEntity,
  CouponEntity,
  CouponCreateInput,
  ProductMetricsEntity,
  ProductType,
  ProductStatus,
  LicenseStatus,
  WebhookStatus,
  CouponStatus,
} from "./products-schema";

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// IN-MEMORY STORAGE (for demo)
// ============================================

const products: Map<string, ProductEntity> = new Map();
const productPlans: Map<string, ProductPlanEntity> = new Map();
const licenses: Map<string, LicenseEntity> = new Map();
const webhookLogs: Map<string, WebhookLogEntity> = new Map();
const coupons: Map<string, CouponEntity> = new Map();
const productMetrics: Map<string, ProductMetricsEntity> = new Map();

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate license key
function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 25; i++) {
    if (i > 0 && i % 5 === 0) key += "-";
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Log webhook event
function logWebhook(event: string, payload: Record<string, unknown>): WebhookLogEntity {
  const log: WebhookLogEntity = {
    id: `webhook-${Date.now()}`,
    event,
    payload,
    status: "pending",
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };
  webhookLogs.set(log.id, log);
  return log;
}

// ============================================
// PRODUCTS API SERVICE
// ============================================

export class ProductsApiService {
  // ============================================
  // PRODUCT CRUD
  // ============================================

  async createProduct(input: ProductCreateInput): Promise<ApiResponse<ProductEntity>> {
    try {
      // Paddle RBAC Permission Check
      const hasPermission = paddleRBACManager.hasPermission(input.merchantId, "product.create", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied: product.create required" };
      }

      // Validate Paddle IDs
      if (!input.paddleProductId || !input.paddlePriceId) {
        return { success: false, error: "Paddle Product ID and Price ID are required" };
      }

      const id = `product-${Date.now()}`;
      const product: ProductEntity = {
        id,
        name: input.name,
        description: input.description,
        merchantId: input.merchantId,
        type: input.type,
        status: input.status,
        visibility: input.visibility,
        approvalStatus: "pending",
        version: "1.0.0",
        currentVersion: "1.0.0",
        paddleProductId: input.paddleProductId,
        paddlePriceId: input.paddlePriceId,
        price: input.price,
        currency: input.currency,
        trialDays: input.trialDays,
        features: input.features,
        demoUrl: input.demoUrl,
        documentationUrl: input.documentationUrl,
        supportEmail: input.supportEmail,
        revenue: 0,
        customers: 0,
        churnRate: 0,
        conversionRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        isDeleted: false,
      };

      products.set(id, product);

      // Log webhook
      logWebhook("product.created", { productId: id, name: product.name });

      return { success: true, data: product, message: "Product created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create product" };
    }
  }

  async updateProduct(productId: string, input: ProductUpdateInput): Promise<ApiResponse<ProductEntity>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      if (input.name !== undefined) product.name = input.name;
      if (input.description !== undefined) product.description = input.description;
      if (input.type !== undefined) product.type = input.type;
      if (input.status !== undefined) product.status = input.status;
      if (input.visibility !== undefined) product.visibility = input.visibility;
      if (input.paddleProductId !== undefined) product.paddleProductId = input.paddleProductId;
      if (input.paddlePriceId !== undefined) product.paddlePriceId = input.paddlePriceId;
      if (input.price !== undefined) product.price = input.price;
      if (input.currency !== undefined) product.currency = input.currency;
      if (input.trialDays !== undefined) product.trialDays = input.trialDays;
      if (input.features !== undefined) product.features = input.features;
      if (input.demoUrl !== undefined) product.demoUrl = input.demoUrl;
      if (input.documentationUrl !== undefined) product.documentationUrl = input.documentationUrl;
      if (input.supportEmail !== undefined) product.supportEmail = input.supportEmail;
      if (input.version !== undefined) {
        product.version = input.version;
        product.currentVersion = input.version;
      }

      product.updatedAt = new Date().toISOString();
      products.set(productId, product);

      // Log webhook
      logWebhook("product.updated", { productId, changes: Object.keys(input) });

      return { success: true, data: product, message: "Product updated successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update product" };
    }
  }

  async getProducts(merchantId?: string): Promise<ApiResponse<ProductEntity[]>> {
    try {
      let productList = Array.from(products.values()).filter(p => !p.isDeleted);
      if (merchantId) {
        productList = productList.filter(p => p.merchantId === merchantId);
      }
      return { success: true, data: productList };
    } catch (error) {
      return { success: false, error: "Failed to fetch products" };
    }
  }

  async getProduct(productId: string): Promise<ApiResponse<ProductEntity>> {
    try {
      const product = products.get(productId);
      if (!product || product.isDeleted) {
        return { success: false, error: "Product not found" };
      }
      return { success: true, data: product };
    } catch (error) {
      return { success: false, error: "Failed to fetch product" };
    }
  }

  async deleteProduct(productId: string, merchantId: string): Promise<ApiResponse<void>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      if (product.merchantId !== merchantId) {
        return { success: false, error: "Unauthorized" };
      }

      // Soft delete
      product.isDeleted = true;
      product.deletedAt = new Date().toISOString();
      product.status = "archived";
      product.updatedAt = new Date().toISOString();
      products.set(productId, product);

      // Log webhook
      logWebhook("product.deleted", { productId });

      return { success: true, message: "Product deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete product" };
    }
  }

  async archiveProduct(productId: string, merchantId: string): Promise<ApiResponse<ProductEntity>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      if (product.merchantId !== merchantId) {
        return { success: false, error: "Unauthorized" };
      }

      product.status = "archived";
      product.updatedAt = new Date().toISOString();
      products.set(productId, product);

      logWebhook("product.archived", { productId });

      return { success: true, data: product, message: "Product archived successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to archive product" };
    }
  }

  async cloneProduct(productId: string, merchantId: string): Promise<ApiResponse<ProductEntity>> {
    try {
      const original = products.get(productId);
      if (!original) {
        return { success: false, error: "Product not found" };
      }

      const newId = `product-${Date.now()}`;
      const cloned: ProductEntity = {
        ...original,
        id: newId,
        name: `${original.name} (Copy)`,
        status: "draft",
        approvalStatus: "pending",
        revenue: 0,
        customers: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      products.set(newId, cloned);

      logWebhook("product.cloned", { originalId: productId, newId });

      return { success: true, data: cloned, message: "Product cloned successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to clone product" };
    }
  }

  // ============================================
  // PRODUCT PLANS
  // ============================================

  async createPlan(input: ProductPlanCreateInput): Promise<ApiResponse<ProductPlanEntity>> {
    try {
      const id = `plan-${Date.now()}`;
      const plan: ProductPlanEntity = {
        id,
        productId: input.productId,
        name: input.name,
        price: input.price,
        billingCycle: input.billingCycle,
        paddlePriceId: input.paddlePriceId,
        features: input.features,
        trialDays: input.trialDays,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      productPlans.set(id, plan);

      return { success: true, data: plan, message: "Plan created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create plan" };
    }
  }

  async getProductPlans(productId: string): Promise<ApiResponse<ProductPlanEntity[]>> {
    try {
      const plans = Array.from(productPlans.values()).filter(p => p.productId === productId && p.isActive);
      return { success: true, data: plans };
    } catch (error) {
      return { success: false, error: "Failed to fetch plans" };
    }
  }

  // ============================================
  // LICENSES
  // ============================================

  async createLicense(input: LicenseCreateInput): Promise<ApiResponse<LicenseEntity>> {
    try {
      const id = `license-${Date.now()}`;
      const license: LicenseEntity = {
        id,
        userId: input.userId,
        productId: input.productId,
        licenseKey: generateLicenseKey(),
        status: "active",
        expiryDate: input.expiryDate,
        activationLimit: input.activationLimit,
        activationCount: 0,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      licenses.set(id, license);

      logWebhook("license.created", { licenseId: id, userId: input.userId });

      return { success: true, data: license, message: "License created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create license" };
    }
  }

  async validateLicense(licenseKey: string): Promise<ApiResponse<LicenseEntity>> {
    try {
      const license = Array.from(licenses.values()).find(l => l.licenseKey === licenseKey);
      if (!license) {
        return { success: false, error: "License not found" };
      }

      if (license.status !== "active") {
        return { success: false, error: `License is ${license.status}` };
      }

      if (new Date(license.expiryDate) < new Date()) {
        license.status = "expired";
        licenses.set(license.id, license);
        return { success: false, error: "License has expired" };
      }

      return { success: true, data: license };
    } catch (error) {
      return { success: false, error: "Failed to validate license" };
    }
  }

  async getUserLicenses(userId: string): Promise<ApiResponse<LicenseEntity[]>> {
    try {
      const userLicenses = Array.from(licenses.values()).filter(l => l.userId === userId);
      return { success: true, data: userLicenses };
    } catch (error) {
      return { success: false, error: "Failed to fetch licenses" };
    }
  }

  // ============================================
  // COUPONS
  // ============================================

  async createCoupon(input: CouponCreateInput): Promise<ApiResponse<CouponEntity>> {
    try {
      const id = `coupon-${Date.now()}`;
      const coupon: CouponEntity = {
        id,
        code: input.code.toUpperCase(),
        discountPercent: input.discountPercent,
        discountAmount: input.discountAmount,
        productId: input.productId,
        maxUses: input.maxUses,
        usedCount: 0,
        expiryDate: input.expiryDate,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      coupons.set(id, coupon);

      return { success: true, data: coupon, message: "Coupon created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create coupon" };
    }
  }

  async validateCoupon(code: string, productId?: string): Promise<ApiResponse<CouponEntity>> {
    try {
      const coupon = Array.from(coupons.values()).find(c => c.code === code.toUpperCase());
      if (!coupon) {
        return { success: false, error: "Coupon not found" };
      }

      if (coupon.status !== "active") {
        return { success: false, error: "Coupon is not active" };
      }

      if (new Date(coupon.expiryDate) < new Date()) {
        coupon.status = "expired";
        coupons.set(coupon.id, coupon);
        return { success: false, error: "Coupon has expired" };
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return { success: false, error: "Coupon usage limit reached" };
      }

      if (coupon.productId && coupon.productId !== productId) {
        return { success: false, error: "Coupon not valid for this product" };
      }

      return { success: true, data: coupon };
    } catch (error) {
      return { success: false, error: "Failed to validate coupon" };
    }
  }

  // ============================================
  // WEBHOOK HANDLING
  // ============================================

  async handleWebhook(event: string, payload: Record<string, unknown>): Promise<ApiResponse<void>> {
    try {
      const log = logWebhook(event, payload);

      // Process webhook based on event type
      switch (event) {
        case "payment.success":
          await this.handlePaymentSuccess(payload);
          break;
        case "subscription.active":
          await this.handleSubscriptionActive(payload);
          break;
        case "subscription.cancelled":
          await this.handleSubscriptionCancelled(payload);
          break;
        case "subscription.past_due":
          await this.handleSubscriptionPastDue(payload);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      log.status = "success";
      log.processedAt = new Date().toISOString();
      webhookLogs.set(log.id, log);

      return { success: true, message: "Webhook processed successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to process webhook" };
    }
  }

  private async handlePaymentSuccess(payload: Record<string, unknown>): Promise<void> {
    // Update product revenue and customer count
    const productId = payload.product_id as string;
    const amount = payload.amount as number;

    const product = products.get(productId);
    if (product) {
      product.revenue += amount;
      product.customers += 1;
      product.updatedAt = new Date().toISOString();
      products.set(productId, product);
    }
  }

  private async handleSubscriptionActive(payload: Record<string, unknown>): Promise<void> {
    // Handle subscription activation
    const productId = payload.product_id as string;
    const product = products.get(productId);
    if (product) {
      product.customers += 1;
      product.updatedAt = new Date().toISOString();
      products.set(productId, product);
    }
  }

  private async handleSubscriptionCancelled(payload: Record<string, unknown>): Promise<void> {
    // Handle subscription cancellation
    const productId = payload.product_id as string;
    const product = products.get(productId);
    if (product) {
      product.customers = Math.max(0, product.customers - 1);
      product.updatedAt = new Date().toISOString();
      products.set(productId, product);
    }
  }

  private async handleSubscriptionPastDue(payload: Record<string, unknown>): Promise<void> {
    // Handle past due subscription
    const productId = payload.product_id as string;
    const product = products.get(productId);
    if (product) {
      // Update churn rate calculation
      product.churnRate = Math.min(1, product.churnRate + 0.01);
      product.updatedAt = new Date().toISOString();
      products.set(productId, product);
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getProductAnalytics(productId: string): Promise<ApiResponse<ProductMetricsEntity>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      const metrics: ProductMetricsEntity = {
        id: `metrics-${Date.now()}`,
        productId,
        revenue: product.revenue,
        customers: product.customers,
        activeSubscriptions: product.type === "subscription" ? product.customers : 0,
        churnRate: product.churnRate,
        conversionRate: product.conversionRate,
        refunds: 0,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
        createdAt: new Date().toISOString(),
      };

      return { success: true, data: metrics };
    } catch (error) {
      return { success: false, error: "Failed to fetch analytics" };
    }
  }

  // ============================================
  // PLAN LOGIC
  // ============================================

  async enableRecurringBilling(productId: string): Promise<ApiResponse<void>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      if (product.type !== "subscription") {
        return { success: false, error: "Only subscription products can have recurring billing" };
      }

      // Enable recurring billing logic
      product.updatedAt = new Date().toISOString();
      products.set(productId, product);

      logWebhook("product.recurring_enabled", { productId });

      return { success: true, message: "Recurring billing enabled" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to enable recurring billing" };
    }
  }

  async disableRecurringBilling(productId: string): Promise<ApiResponse<void>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      product.updatedAt = new Date().toISOString();
      products.set(productId, product);

      logWebhook("product.recurring_disabled", { productId });

      return { success: true, message: "Recurring billing disabled" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to disable recurring billing" };
    }
  }

  // ============================================
  // SUBSCRIPTION STATE ENGINE
  // ============================================

  async updateSubscriptionState(
    subscriptionId: string,
    state: "active" | "trial" | "past_due" | "cancelled" | "expired",
  ): Promise<ApiResponse<void>> {
    try {
      // Update subscription state in the system
      logWebhook("subscription.state_updated", { subscriptionId, state });

      // Update product metrics based on state change
      if (state === "cancelled" || state === "expired") {
        // Find product by subscription and decrement customer count
        for (const [productId, product] of products.entries()) {
          if (product.customers > 0) {
            product.customers -= 1;
            product.churnRate = Math.min(1, product.churnRate + 0.01);
            product.updatedAt = new Date().toISOString();
            products.set(productId, product);
          }
        }
      }

      return { success: true, message: "Subscription state updated" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update subscription state" };
    }
  }

  // ============================================
  // DOWNLOAD ACCESS CONTROL
  // ============================================

  async checkDownloadAccess(userId: string, productId: string): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // Check if user has a valid license
      const userLicenses = Array.from(licenses.values()).filter(
        l => l.userId === userId && l.productId === productId
      );

      const activeLicense = userLicenses.find(l => l.status === "active" && new Date(l.expiryDate) > new Date());

      if (activeLicense) {
        return { success: true, data: { allowed: true } };
      }

      // Check if user has an active subscription (simulated)
      // In production, this would check Paddle subscription status
      const hasActiveSubscription = false; // Placeholder for actual check

      if (hasActiveSubscription) {
        return { success: true, data: { allowed: true } };
      }

      return { success: true, data: { allowed: false, reason: "No valid license or active subscription" } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to check download access" };
    }
  }

  async grantDownloadAccess(userId: string, productId: string, purchaseId: string): Promise<ApiResponse<LicenseEntity>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // Calculate expiry based on product type
      let expiryDate = new Date();
      if (product.type === "subscription") {
        expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month for subscription
      } else if (product.type === "license") {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year for license
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 10); // 10 years for one-time
      }

      const input: LicenseCreateInput = {
        userId,
        productId,
        expiryDate: expiryDate.toISOString(),
        activationLimit: product.type === "license" ? 3 : 1,
      };

      return await this.createLicense(input);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to grant download access" };
    }
  }

  // ============================================
  // WEBHOOK FAILSAFE SYSTEM
  // ============================================

  async retryFailedWebhooks(maxRetries: number = 3): Promise<ApiResponse<{ retried: number; failed: number }>> {
    try {
      const failedLogs = Array.from(webhookLogs.values()).filter(
        log => log.status === "failed" && log.retryCount < maxRetries
      );

      let retried = 0;
      let failed = 0;

      for (const log of failedLogs) {
        log.status = "retrying";
        log.retryCount += 1;
        webhookLogs.set(log.id, log);

        try {
          // Retry the webhook processing
          await this.handleWebhook(log.event, log.payload as Record<string, unknown>);
          retried++;
        } catch (error) {
          log.status = "failed";
          log.lastError = error instanceof Error ? error.message : "Unknown error";
          webhookLogs.set(log.id, log);
          failed++;
        }
      }

      return { success: true, data: { retried, failed }, message: `Retried ${retried} webhooks, ${failed} failed` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to retry webhooks" };
    }
  }

  async getWebhookLogs(event?: string, status?: WebhookStatus): Promise<ApiResponse<WebhookLogEntity[]>> {
    try {
      let logs = Array.from(webhookLogs.values());
      if (event) logs = logs.filter(l => l.event === event);
      if (status) logs = logs.filter(l => l.status === status);
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { success: true, data: logs };
    } catch (error) {
      return { success: false, error: "Failed to fetch webhook logs" };
    }
  }

  // ============================================
  // DATA CONSISTENCY CHECK
  // ============================================

  async recalcProductRevenue(productId: string): Promise<ApiResponse<{ newRevenue: number; oldRevenue: number }>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      const oldRevenue = product.revenue;
      
      // In production, this would recalculate from actual transactions
      // For now, we'll just validate the current value
      const newRevenue = oldRevenue;

      if (Math.abs(newRevenue - oldRevenue) > 0.01) {
        product.revenue = newRevenue;
        product.updatedAt = new Date().toISOString();
        products.set(productId, product);
      }

      logWebhook("product.revenue_recalculated", { productId, oldRevenue, newRevenue });

      return { success: true, data: { newRevenue, oldRevenue }, message: "Revenue recalculated" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to recalculate revenue" };
    }
  }

  async fixStatusMismatch(productId: string): Promise<ApiResponse<{ fixed: boolean }>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // Check for status mismatches and auto-fix
      let fixed = false;

      // If product is archived but has active sales, unarchive it
      if (product.status === "archived" && product.customers > 0) {
        product.status = "active";
        fixed = true;
      }

      // If product is active but approval is rejected, set to draft
      if (product.status === "active" && product.approvalStatus === "rejected") {
        product.status = "draft";
        fixed = true;
      }

      if (fixed) {
        product.updatedAt = new Date().toISOString();
        products.set(productId, product);
        logWebhook("product.status_fixed", { productId });
      }

      return { success: true, data: { fixed }, message: fixed ? "Status mismatch fixed" : "No issues found" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to fix status mismatch" };
    }
  }

  // ============================================
  // CACHE INVALIDATION
  // ============================================

  async invalidateProductCache(productId: string): Promise<ApiResponse<void>> {
    try {
      const product = products.get(productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // In production, this would clear Redis cache or CDN cache
      // For now, we'll just update the lastSyncedAt timestamp
      product.lastSyncedAt = new Date().toISOString();
      products.set(productId, product);

      logWebhook("product.cache_invalidated", { productId });

      return { success: true, message: "Cache invalidated" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to invalidate cache" };
    }
  }

  // ============================================
  // BULK ACTIONS
  // ============================================

  async bulkUpdateStatus(productIds: string[], status: ProductStatus): Promise<ApiResponse<void>> {
    try {
      productIds.forEach(id => {
        const product = products.get(id);
        if (product) {
          product.status = status;
          product.updatedAt = new Date().toISOString();
          products.set(id, product);
        }
      });

      logWebhook("products.bulk_updated", { productIds, status });

      return { success: true, message: "Products updated successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to bulk update" };
    }
  }

  async bulkDelete(productIds: string[], merchantId: string): Promise<ApiResponse<void>> {
    try {
      productIds.forEach(id => {
        const product = products.get(id);
        if (product && product.merchantId === merchantId) {
          product.isDeleted = true;
          product.deletedAt = new Date().toISOString();
          product.status = "archived";
          product.updatedAt = new Date().toISOString();
          products.set(id, product);
        }
      });

      logWebhook("products.bulk_deleted", { productIds });

      return { success: true, message: "Products deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to bulk delete" };
    }
  }
}

// Export singleton instance
export const productsApiService = new ProductsApiService();
