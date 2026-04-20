import { canAccess } from "@/lib/api/rbac";
import {
  store,
  type StoredCheckoutSession,
  type StoredInvoice,
  type StoredOrder,
  type StoredPayment,
  type StoredProduct,
} from "@/lib/api/store";
import type { Role } from "@/lib/api/types";
import { eventBus } from "./events";
import { queueEngine } from "./queue";
import { repositories, createId } from "./repositories";
import { coreState, type LicenseRecord, type SubscriptionRecord } from "./state";

const TAX_BY_COUNTRY: Record<string, number> = {
  US: 0,
  GB: 0.2,
  DE: 0.19,
  FR: 0.2,
  AU: 0.1,
  CA: 0.05,
  default: 0.1,
};

const DUNNING_RETRY_SCHEDULE_DAYS = [1, 3, 7];
const DEFAULT_COMMISSION_RATE = 0.15;

export class ServiceError extends Error {
  constructor(
    public code: "NOT_FOUND" | "FORBIDDEN" | "BAD_REQUEST" | "CONFLICT",
    message: string,
  ) {
    super(message);
  }
}

function assert(
  condition: unknown,
  code: ServiceError["code"],
  message: string,
): asserts condition {
  if (!condition) throw new ServiceError(code, message);
}

function nowIso(): string {
  return new Date().toISOString();
}

function plusDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function addInterval(start: Date, interval: "monthly" | "yearly"): Date {
  const d = new Date(start);
  if (interval === "monthly") d.setMonth(d.getMonth() + 1);
  if (interval === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d;
}

function randomChecksum(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function generateLicenseKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    let block = "";
    for (let j = 0; j < 5; j++) block += chars[Math.floor(Math.random() * chars.length)];
    parts.push(block);
  }
  return parts.join("-");
}

class SecurityService {
  enforce(permission: Parameters<typeof canAccess>[1], role: Role | undefined): void {
    assert(canAccess(role, permission), "FORBIDDEN", "Permission denied");
  }

  rateLimitBucket(ip: string): string {
    return `rl:${ip}`;
  }

  fraudRiskScore(input: { amount: number; ip: string; userId: string }): number {
    let score = 0;
    if (input.amount > 1000) score += 30;
    if (input.amount > 5000) score += 35;
    if (input.ip === "unknown") score += 25;
    if (input.userId.startsWith("usr_customer")) score += 5;
    return Math.min(score, 100);
  }
}

class AnalyticsService {
  capture(
    event: "payment_succeeded" | "payment_refunded" | "subscription_cancelled",
    amount = 0,
  ): void {
    if (event === "payment_succeeded") {
      coreState.analytics.mrr += amount;
      coreState.analytics.arr = coreState.analytics.mrr * 12;
    }
    if (event === "payment_refunded") {
      coreState.analytics.refundedRevenue += amount;
      coreState.analytics.mrr = Math.max(0, coreState.analytics.mrr - amount);
      coreState.analytics.arr = coreState.analytics.mrr * 12;
    }
    if (event === "subscription_cancelled") coreState.analytics.churnCount += 1;
    coreState.analytics.updatedAt = nowIso();
  }
}

class EntitlementService {
  resolveForUser(userId: string): string[] {
    const entitlements = coreState.entitlements.get(userId) ?? [];
    return [...new Set(entitlements.flatMap((entry) => entry.features))];
  }

  grantFromPlan(userId: string, subscriptionId: string, interval: "monthly" | "yearly"): void {
    const features =
      interval === "yearly" ? ["updates", "priority_support", "analytics"] : ["updates", "support"];
    const existing = coreState.entitlements.get(userId) ?? [];
    existing.push({
      userId,
      source: "plan",
      sourceId: subscriptionId,
      features,
      updatedAt: nowIso(),
    });
    coreState.entitlements.set(userId, existing);
  }

  grantFromLicense(userId: string, licenseId: string): void {
    const existing = coreState.entitlements.get(userId) ?? [];
    existing.push({
      userId,
      source: "license",
      sourceId: licenseId,
      features: ["download", "activate_device"],
      updatedAt: nowIso(),
    });
    coreState.entitlements.set(userId, existing);
  }
}

class WebhookService {
  async queueDeliveries(
    merchantId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const webhooks = [...store.webhooks.values()].filter(
      (w) => w.merchantId === merchantId && w.active && w.events.includes(event),
    );
    for (const webhook of webhooks) {
      queueEngine.enqueue("webhook.deliver", { webhookId: webhook.id, event, payload });
      await eventBus.emit("webhook.delivery.queued", { webhookId: webhook.id, event });
    }
    await queueEngine.processDue();
  }
}

class ProductService {
  async create(input: {
    merchantId: string;
    title: string;
    description: string;
    categoryId?: string;
    price: number;
    currency: string;
    taxable: boolean;
    version: string;
    filePath?: string;
  }): Promise<StoredProduct> {
    const id = createId("prod");
    const now = nowIso();
    const slugBase = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = store.productsBySlug.has(slugBase) ? `${slugBase}-${id.slice(-4)}` : slugBase;

    const product: StoredProduct = {
      id,
      slug,
      merchantId: input.merchantId,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      status: "draft",
      price: input.price,
      currency: input.currency,
      taxable: input.taxable,
      version: input.version,
      createdAt: now,
      updatedAt: now,
    };

    repositories.product.save(product);

    repositories.product.saveApproval({
      productId: product.id,
      requestedBy: input.merchantId,
      requestedAt: now,
      status: "none",
    });

    repositories.product.addVersion({
      id: createId("ver"),
      productId: product.id,
      version: input.version,
      filePath: input.filePath ?? `files/${product.id}/${input.version}.zip`,
      checksum: randomChecksum(),
      createdAt: now,
    });

    await eventBus.emit("product.created", { productId: product.id, merchantId: input.merchantId });
    return product;
  }

  async update(input: {
    productId: string;
    actorRole: Role;
    actorMerchantId?: string;
    patch: Partial<
      Pick<
        StoredProduct,
        "title" | "description" | "categoryId" | "price" | "currency" | "taxable" | "version"
      >
    >;
    filePath?: string;
  }): Promise<StoredProduct> {
    const product = repositories.product.findByIdOrSlug(input.productId);
    assert(product, "NOT_FOUND", "Product not found");
    assert(
      input.actorRole === "admin" || product.merchantId === input.actorMerchantId,
      "FORBIDDEN",
      "You do not own this product",
    );

    Object.assign(product, input.patch);
    product.updatedAt = nowIso();

    if (input.patch.version) {
      repositories.product.addVersion({
        id: createId("ver"),
        productId: product.id,
        version: input.patch.version,
        filePath: input.filePath ?? `files/${product.id}/${input.patch.version}.zip`,
        checksum: randomChecksum(),
        createdAt: nowIso(),
      });
    }

    repositories.product.save(product);
    await eventBus.emit("product.updated", { productId: product.id });
    return product;
  }

  async archive(input: {
    productId: string;
    actorRole: Role;
    actorMerchantId?: string;
  }): Promise<StoredProduct> {
    const product = repositories.product.findByIdOrSlug(input.productId);
    assert(product, "NOT_FOUND", "Product not found");
    assert(
      input.actorRole === "admin" || product.merchantId === input.actorMerchantId,
      "FORBIDDEN",
      "You do not own this product",
    );

    product.status = "archived";
    product.updatedAt = nowIso();
    repositories.product.save(product);
    await eventBus.emit("product.archived", { productId: product.id });
    return product;
  }

  async requestPublish(
    productId: string,
    actorUserId: string,
    actorRole: Role,
    actorMerchantId?: string,
  ): Promise<StoredProduct> {
    const product = repositories.product.findByIdOrSlug(productId);
    assert(product, "NOT_FOUND", "Product not found");
    assert(
      actorRole === "admin" || product.merchantId === actorMerchantId,
      "FORBIDDEN",
      "You do not own this product",
    );

    if (actorRole === "admin") {
      return this.approvePublish(productId, actorUserId);
    }

    repositories.product.saveApproval({
      productId: product.id,
      requestedBy: actorUserId,
      requestedAt: nowIso(),
      status: "pending",
    });

    await eventBus.emit("product.publish_requested", {
      productId: product.id,
      requestedBy: actorUserId,
    });
    return product;
  }

  async approvePublish(productId: string, adminUserId: string): Promise<StoredProduct> {
    const product = repositories.product.findByIdOrSlug(productId);
    assert(product, "NOT_FOUND", "Product not found");

    const approval = repositories.product.getApproval(product.id);
    assert(
      approval?.status === "pending" || approval?.status === "none",
      "BAD_REQUEST",
      "Product is not pending approval",
    );

    const now = nowIso();
    repositories.product.saveApproval({
      productId: product.id,
      requestedBy: approval?.requestedBy ?? product.merchantId,
      requestedAt: approval?.requestedAt ?? now,
      approvedBy: adminUserId,
      approvedAt: now,
      status: "approved",
    });

    product.status = "published";
    product.publishedAt = now;
    product.updatedAt = now;
    repositories.product.save(product);

    await eventBus.emit("product.published", { productId: product.id, approvedBy: adminUserId });
    return product;
  }
}

class CheckoutService {
  async createSession(input: {
    userId: string;
    productId?: string;
    planId?: string;
    discountCode?: string;
    currency: string;
    country: string;
  }): Promise<StoredCheckoutSession> {
    assert(
      input.productId || input.planId,
      "BAD_REQUEST",
      "Either productId or planId is required",
    );

    let product: StoredProduct | undefined;
    let subtotal = 0;
    let taxable = false;

    if (input.planId) {
      const plan = repositories.plan.getById(input.planId);
      assert(plan?.active, "NOT_FOUND", "Plan not found");
      subtotal = plan.price;
      product = store.products.get(plan.productId);
      taxable = Boolean(product?.taxable);
    } else if (input.productId) {
      product = store.products.get(input.productId);
      assert(product?.status === "published", "NOT_FOUND", "Product not found");
      subtotal = product.price;
      taxable = product.taxable;
    }

    let discountAmount = 0;
    let appliedDiscount: string | undefined;
    if (input.discountCode) {
      const code = input.discountCode.toUpperCase();
      const discountId = store.discountsByCode.get(code);
      const discount = discountId ? store.discounts.get(discountId) : undefined;
      if (discount?.active) {
        const notExpired = !discount.expiresAt || new Date(discount.expiresAt) > new Date();
        const underCap = !discount.maxUses || discount.uses < discount.maxUses;
        if (notExpired && underCap) {
          discountAmount =
            discount.type === "percent"
              ? Math.round(subtotal * (discount.value / 100) * 100) / 100
              : Math.min(discount.value, subtotal);
          appliedDiscount = code;
        }
      }
    }

    const country = input.country.toUpperCase();
    const taxRate = taxable ? (TAX_BY_COUNTRY[country] ?? TAX_BY_COUNTRY.default) : 0;
    const taxAmount = Math.round((subtotal - discountAmount) * taxRate * 100) / 100;
    const total = Math.max(0, subtotal - discountAmount + taxAmount);

    const createdAt = nowIso();
    const session: StoredCheckoutSession = {
      id: createId("cs", 14),
      userId: input.userId,
      productId: input.productId ?? product?.id,
      planId: input.planId,
      discountCode: appliedDiscount,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      currency: input.currency,
      status: "open",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt,
    };

    repositories.checkout.save(session);
    repositories.checkout.savePriceSnapshot({
      checkoutSessionId: session.id,
      productId: session.productId,
      planId: session.planId,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      currency: session.currency,
      country,
      createdAt,
    });

    await eventBus.emit("checkout.session.created", {
      sessionId: session.id,
      userId: input.userId,
    });
    return session;
  }
}

class InvoiceService {
  async generate(order: StoredOrder, payment: StoredPayment): Promise<StoredInvoice> {
    const now = nowIso();
    const invoice: StoredInvoice = {
      id: createId("inv", 12),
      orderId: order.id,
      userId: order.userId,
      amount: order.total,
      currency: order.currency,
      status: "paid",
      issuedAt: now,
      paidAt: now,
      createdAt: now,
    };
    repositories.invoice.save(invoice);
    await eventBus.emit("invoice.generated", {
      invoiceId: invoice.id,
      orderId: order.id,
      numbering: `INV-${now.slice(0, 10).replace(/-/g, "")}-${invoice.id.slice(-6).toUpperCase()}`,
      pdfPath: `invoices/${invoice.id}.pdf`,
      taxBreakdown: { taxAmount: order.taxAmount, subtotal: order.subtotal },
      paymentId: payment.id,
    });
    return invoice;
  }
}

class SubscriptionService {
  async createFromOrder(order: StoredOrder): Promise<SubscriptionRecord | null> {
    if (!order.planId) return null;
    const plan = repositories.plan.getById(order.planId);
    if (!plan || (plan.interval !== "monthly" && plan.interval !== "yearly")) return null;

    const start = new Date();
    const periodEnd = addInterval(start, plan.interval);
    const subscription: SubscriptionRecord = {
      id: createId("sub"),
      userId: order.userId,
      planId: plan.id,
      orderId: order.id,
      status: "active",
      interval: plan.interval,
      startedAt: start.toISOString(),
      currentPeriodStart: start.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      updatedAt: start.toISOString(),
    };

    repositories.subscription.save(subscription);
    coreState.analytics.activeSubscriptions += 1;
    coreState.analytics.updatedAt = nowIso();
    await eventBus.emit("subscription.created", {
      subscriptionId: subscription.id,
      userId: order.userId,
      planId: plan.id,
    });

    queueEngine.enqueue(
      "billing.renewal",
      { subscriptionId: subscription.id },
      Math.max(0, periodEnd.getTime() - Date.now()),
    );
    services.entitlement.grantFromPlan(order.userId, subscription.id, plan.interval);
    return subscription;
  }

  async renew(subscriptionId: string): Promise<SubscriptionRecord> {
    const subscription = repositories.subscription.getById(subscriptionId);
    assert(subscription, "NOT_FOUND", "Subscription not found");
    assert(subscription.status === "active", "BAD_REQUEST", "Subscription is not active");

    const start = new Date();
    const end = addInterval(start, subscription.interval);
    subscription.currentPeriodStart = start.toISOString();
    subscription.currentPeriodEnd = end.toISOString();
    subscription.updatedAt = nowIso();

    repositories.subscription.save(subscription);
    await eventBus.emit("subscription.renewed", { subscriptionId: subscription.id });
    return subscription;
  }

  async updatePlan(input: {
    subscriptionId: string;
    targetPlanId: string;
  }): Promise<{ subscription: SubscriptionRecord; proratedDelta: number }> {
    const subscription = repositories.subscription.getById(input.subscriptionId);
    assert(subscription, "NOT_FOUND", "Subscription not found");

    const currentPlan = repositories.plan.getById(subscription.planId);
    const targetPlan = repositories.plan.getById(input.targetPlanId);
    assert(currentPlan && targetPlan, "NOT_FOUND", "Plan not found");
    assert(
      targetPlan.interval === "monthly" || targetPlan.interval === "yearly",
      "BAD_REQUEST",
      "Target plan must be recurring",
    );

    const remaining = Math.max(0, new Date(subscription.currentPeriodEnd).getTime() - Date.now());
    const totalCycle = Math.max(
      1,
      new Date(subscription.currentPeriodEnd).getTime() -
        new Date(subscription.currentPeriodStart).getTime(),
    );
    const ratio = remaining / totalCycle;
    const proratedDelta = Math.round((targetPlan.price - currentPlan.price) * ratio * 100) / 100;

    subscription.planId = targetPlan.id;
    subscription.interval = targetPlan.interval;
    subscription.updatedAt = nowIso();
    repositories.subscription.save(subscription);

    return { subscription, proratedDelta };
  }

  async pause(subscriptionId: string): Promise<SubscriptionRecord> {
    const subscription = repositories.subscription.getById(subscriptionId);
    assert(subscription, "NOT_FOUND", "Subscription not found");
    subscription.status = "paused";
    subscription.pausedAt = nowIso();
    subscription.updatedAt = nowIso();
    repositories.subscription.save(subscription);
    return subscription;
  }

  async resume(subscriptionId: string): Promise<SubscriptionRecord> {
    const subscription = repositories.subscription.getById(subscriptionId);
    assert(subscription, "NOT_FOUND", "Subscription not found");
    assert(subscription.status === "paused", "BAD_REQUEST", "Subscription is not paused");
    subscription.status = "active";
    subscription.updatedAt = nowIso();
    repositories.subscription.save(subscription);
    return subscription;
  }

  async cancel(subscriptionId: string): Promise<SubscriptionRecord> {
    const subscription = repositories.subscription.getById(subscriptionId);
    assert(subscription, "NOT_FOUND", "Subscription not found");
    subscription.status = "cancelled";
    subscription.cancelledAt = nowIso();
    subscription.updatedAt = nowIso();
    repositories.subscription.save(subscription);
    services.analytics.capture("subscription_cancelled");
    await eventBus.emit("subscription.cancelled", { subscriptionId: subscription.id });
    return subscription;
  }
}

class LicenseService {
  async generateFromOrder(order: StoredOrder): Promise<LicenseRecord | null> {
    if (!order.productId || order.planId) return null;

    const license: LicenseRecord = {
      id: createId("lic"),
      userId: order.userId,
      productId: order.productId,
      orderId: order.id,
      key: generateLicenseKey(),
      status: "active",
      maxDevices: 3,
      boundDevices: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    repositories.license.save(license);
    services.entitlement.grantFromLicense(order.userId, license.id);
    await eventBus.emit("license.generated", { licenseId: license.id, userId: order.userId });
    return license;
  }

  activate(licenseId: string, deviceId: string): LicenseRecord {
    if (coreState.licenseActivationLocks.has(licenseId)) {
      throw new ServiceError("CONFLICT", "License activation already in progress");
    }
    coreState.licenseActivationLocks.add(licenseId);

    try {
      const license = repositories.license.getById(licenseId);
      assert(license, "NOT_FOUND", "License not found");
      assert(license.status === "active", "BAD_REQUEST", "License inactive");

      if (!license.boundDevices.includes(deviceId)) {
        assert(
          license.boundDevices.length < license.maxDevices,
          "BAD_REQUEST",
          "Device limit reached",
        );
        license.boundDevices.push(deviceId);
      }

      license.updatedAt = nowIso();
      repositories.license.save(license);
      return license;
    } finally {
      coreState.licenseActivationLocks.delete(licenseId);
    }
  }

  validate(licenseId: string): { valid: boolean; reason?: string } {
    const license = repositories.license.getById(licenseId);
    if (!license) return { valid: false, reason: "not_found" };
    if (license.status !== "active") return { valid: false, reason: license.status };
    if (license.expiresAt && new Date(license.expiresAt) <= new Date())
      return { valid: false, reason: "expired" };
    return { valid: true };
  }

  async revoke(licenseId: string): Promise<LicenseRecord> {
    const license = repositories.license.getById(licenseId);
    assert(license, "NOT_FOUND", "License not found");
    license.status = "revoked";
    license.updatedAt = nowIso();
    repositories.license.save(license);
    await eventBus.emit("license.revoked", { licenseId });
    return license;
  }
}

class DunningService {
  async schedule(paymentId: string, subscriptionId?: string): Promise<void> {
    const existing = repositories.dunning.getByPaymentId(paymentId);
    if (existing) return;

    const base = nowIso();
    const record = {
      id: createId("dun"),
      paymentId,
      subscriptionId,
      retries: 0,
      nextRetryAt: plusDays(DUNNING_RETRY_SCHEDULE_DAYS[0]),
      status: "scheduled" as const,
      createdAt: base,
      updatedAt: base,
    };
    repositories.dunning.save(record);

    for (const day of DUNNING_RETRY_SCHEDULE_DAYS) {
      queueEngine.enqueue(
        "dunning.retry",
        { paymentId, subscriptionId, retryInDays: day },
        day * 24 * 60 * 60 * 1000,
      );
    }

    queueEngine.enqueue("email.send", { paymentId, template: "dunning_notice" });
    await eventBus.emit("dunning.retry_scheduled", {
      paymentId,
      scheduleDays: DUNNING_RETRY_SCHEDULE_DAYS,
    });
  }
}

class PayoutService {
  async requestForOrder(order: StoredOrder): Promise<void> {
    if (!order.productId) return;
    const product = store.products.get(order.productId);
    if (!product) return;

    const grossAmount = order.total;
    const commissionAmount = Math.round(grossAmount * DEFAULT_COMMISSION_RATE * 100) / 100;
    const netAmount = grossAmount - commissionAmount;
    const payout = {
      id: createId("payo"),
      merchantId: product.merchantId,
      orderId: order.id,
      grossAmount,
      commissionAmount,
      netAmount,
      currency: order.currency,
      status: "requested" as const,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    repositories.payout.save(payout);
    await eventBus.emit("payout.requested", {
      payoutId: payout.id,
      merchantId: payout.merchantId,
      netAmount: payout.netAmount,
    });
  }
}

class OrderService {
  async completeOrderAfterPayment(payment: StoredPayment): Promise<{
    order: StoredOrder;
    invoice: StoredInvoice;
    subscription: SubscriptionRecord | null;
    license: LicenseRecord | null;
  }> {
    const order = repositories.order.getById(payment.orderId);
    assert(order, "NOT_FOUND", "Order not found");

    order.status = "completed";
    order.updatedAt = nowIso();
    repositories.order.save(order);

    await eventBus.emit("order.completed", { orderId: order.id, userId: order.userId });

    const invoice = await services.invoice.generate(order, payment);
    const subscription = await services.subscription.createFromOrder(order);
    const license = await services.license.generateFromOrder(order);
    await services.payout.requestForOrder(order);
    services.analytics.capture("payment_succeeded", order.total);

    return { order, invoice, subscription, license };
  }
}

class PaymentService {
  async createIntent(input: {
    orderId: string;
    userId: string;
    ip: string;
    currency: string;
    idempotencyKey?: string;
  }): Promise<StoredPayment> {
    const order = repositories.order.getById(input.orderId);
    assert(order, "NOT_FOUND", "Order not found");
    assert(order.userId === input.userId, "FORBIDDEN", "Forbidden");
    assert(order.status === "pending", "BAD_REQUEST", "Order is not in pending state");

    const risk = services.security.fraudRiskScore({
      amount: order.total,
      ip: input.ip,
      userId: input.userId,
    });
    assert(risk < 85, "BAD_REQUEST", "Risk score too high");

    const payment: StoredPayment = {
      id: createId("pay", 14),
      orderId: order.id,
      userId: input.userId,
      amount: order.total,
      currency: input.currency,
      status: "pending",
      gatewayRef: `mock_pi_${input.orderId}`,
      idempotencyKey: input.idempotencyKey,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    repositories.payment.save(payment);
    await eventBus.emit("payment.intent.created", { paymentId: payment.id, orderId: order.id });
    return payment;
  }

  async confirm(input: {
    paymentId: string;
    userId: string;
    forceFail?: boolean;
    gatewayToken?: string;
  }): Promise<{
    payment: StoredPayment;
    order?: StoredOrder;
    invoice?: StoredInvoice;
    subscription?: SubscriptionRecord | null;
    license?: LicenseRecord | null;
  }> {
    repositories.tx.begin();
    try {
      const payment = repositories.payment.getById(input.paymentId);
      assert(payment, "NOT_FOUND", "Payment not found");
      assert(payment.userId === input.userId, "FORBIDDEN", "Forbidden");
      assert(payment.status === "pending", "BAD_REQUEST", "Payment already processed");

      coreState.paymentGatewaySnapshots.set(payment.id, {
        paymentId: payment.id,
        rawRequest: JSON.stringify({ gatewayToken: input.gatewayToken ?? null }),
        rawResponse: JSON.stringify({
          status: input.forceFail ? "failed" : "succeeded",
          at: nowIso(),
        }),
        createdAt: nowIso(),
      });

      if (input.forceFail) {
        payment.status = "failed";
        payment.updatedAt = nowIso();
        repositories.payment.save(payment);

        const order = repositories.order.getById(payment.orderId);
        if (order) {
          order.status = "failed";
          order.updatedAt = nowIso();
          repositories.order.save(order);
        }

        await services.dunning.schedule(payment.id);
        await eventBus.emit("payment.failed", { paymentId: payment.id, orderId: payment.orderId });
        repositories.tx.commit();
        return { payment, order };
      }

      payment.status = "succeeded";
      payment.updatedAt = nowIso();
      repositories.payment.save(payment);

      const completed = await services.order.completeOrderAfterPayment(payment);
      await eventBus.emit("payment.succeeded", { paymentId: payment.id, orderId: payment.orderId });
      repositories.tx.commit();

      return {
        payment,
        order: completed.order,
        invoice: completed.invoice,
        subscription: completed.subscription,
        license: completed.license,
      };
    } catch (error) {
      repositories.tx.rollback();
      throw error;
    }
  }

  async refund(input: {
    paymentId: string;
  }): Promise<{ payment: StoredPayment; order: StoredOrder | null }> {
    const payment = repositories.payment.getById(input.paymentId);
    assert(payment, "NOT_FOUND", "Payment not found");
    assert(
      payment.status === "succeeded",
      "BAD_REQUEST",
      "Only succeeded payments can be refunded",
    );

    payment.status = "refunded";
    payment.refundedAt = nowIso();
    payment.updatedAt = nowIso();
    repositories.payment.save(payment);

    const order = repositories.order.getById(payment.orderId) ?? null;
    if (order) {
      order.status = "refunded";
      order.updatedAt = nowIso();
      repositories.order.save(order);

      const invoice = repositories.invoice.getByOrderId(order.id);
      if (invoice) {
        invoice.status = "void";
        repositories.invoice.save(invoice);
      }
    }

    const subs = repositories.subscription
      .listByOrderId(payment.orderId)
      .filter((s) => s.status !== "cancelled");
    for (const subscription of subs) {
      if (subscription.status === "active" && coreState.analytics.activeSubscriptions > 0) {
        coreState.analytics.activeSubscriptions -= 1;
      }
      subscription.status = "cancelled";
      subscription.cancelledAt = nowIso();
      subscription.updatedAt = nowIso();
      repositories.subscription.save(subscription);
    }

    const licenses = repositories.license
      .listByOrderId(payment.orderId)
      .filter((l) => l.status === "active");
    for (const license of licenses) {
      license.status = "revoked";
      license.updatedAt = nowIso();
      repositories.license.save(license);
    }

    services.analytics.capture("payment_refunded", payment.amount);
    await eventBus.emit("payment.refunded", { paymentId: payment.id, orderId: payment.orderId });

    return { payment, order };
  }
}

export const services = {
  security: new SecurityService(),
  analytics: new AnalyticsService(),
  entitlement: new EntitlementService(),
  webhook: new WebhookService(),
  product: new ProductService(),
  checkout: new CheckoutService(),
  invoice: new InvoiceService(),
  subscription: new SubscriptionService(),
  license: new LicenseService(),
  dunning: new DunningService(),
  payout: new PayoutService(),
  order: new OrderService(),
  payment: new PaymentService(),
};

eventBus.on("payment.succeeded", async (event) => {
  const payload = event.payload as { orderId: string };
  const order = repositories.order.getById(payload.orderId);
  if (!order?.productId) return;
  const product = store.products.get(order.productId);
  if (!product) return;
  await services.webhook.queueDeliveries(product.merchantId, "payment.succeeded", payload);
});

eventBus.on("payment.failed", async (event) => {
  const payload = event.payload as { orderId: string };
  const order = repositories.order.getById(payload.orderId);
  if (!order?.productId) return;
  const product = store.products.get(order.productId);
  if (!product) return;
  await services.webhook.queueDeliveries(product.merchantId, "payment.failed", payload);
});

eventBus.on("payment.refunded", async (event) => {
  const payload = event.payload as { orderId: string };
  const order = repositories.order.getById(payload.orderId);
  if (!order?.productId) return;
  const product = store.products.get(order.productId);
  if (!product) return;
  await services.webhook.queueDeliveries(product.merchantId, "payment.refunded", payload);
});
