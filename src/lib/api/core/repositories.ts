import {
  store,
  type StoredCheckoutSession,
  type StoredInvoice,
  type StoredOrder,
  type StoredPayment,
  type StoredPlan,
  type StoredProduct,
} from "@/lib/api/store";
import {
  coreState,
  type DunningRecord,
  type LicenseRecord,
  type PayoutRecord,
  type PriceSnapshot,
  type ProductApprovalRecord,
  type ProductVersionRecord,
  type SubscriptionRecord,
} from "./state";

export function createId(prefix: string, length = 12): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, length)}`;
}

export class ProductRepository {
  findByIdOrSlug(idOrSlug: string): StoredProduct | undefined {
    return (
      store.products.get(idOrSlug) ?? store.products.get(store.productsBySlug.get(idOrSlug) ?? "")
    );
  }

  save(product: StoredProduct): void {
    store.products.set(product.id, product);
    store.productsBySlug.set(product.slug, product.id);
  }

  delete(id: string): void {
    const existing = store.products.get(id);
    if (existing) {
      store.productsBySlug.delete(existing.slug);
      store.products.delete(id);
    }
  }

  addVersion(version: ProductVersionRecord): void {
    const versions = coreState.productVersions.get(version.productId) ?? [];
    versions.push(version);
    coreState.productVersions.set(version.productId, versions);
  }

  listVersions(productId: string): ProductVersionRecord[] {
    return coreState.productVersions.get(productId) ?? [];
  }

  saveApproval(record: ProductApprovalRecord): void {
    coreState.productApprovals.set(record.productId, record);
  }

  getApproval(productId: string): ProductApprovalRecord | undefined {
    return coreState.productApprovals.get(productId);
  }
}

export class CheckoutRepository {
  save(session: StoredCheckoutSession): void {
    store.checkoutSessions.set(session.id, session);
  }

  getById(id: string): StoredCheckoutSession | undefined {
    return store.checkoutSessions.get(id);
  }

  savePriceSnapshot(snapshot: PriceSnapshot): void {
    coreState.priceSnapshots.set(snapshot.checkoutSessionId, snapshot);
  }
}

export class OrderRepository {
  save(order: StoredOrder): void {
    store.orders.set(order.id, order);
  }

  getById(id: string): StoredOrder | undefined {
    return store.orders.get(id);
  }
}

export class PaymentRepository {
  save(payment: StoredPayment): void {
    store.payments.set(payment.id, payment);
  }

  getById(id: string): StoredPayment | undefined {
    return store.payments.get(id);
  }
}

export class InvoiceRepository {
  save(invoice: StoredInvoice): void {
    store.invoices.set(invoice.id, invoice);
    store.invoicesByOrderId.set(invoice.orderId, invoice.id);
  }

  getByOrderId(orderId: string): StoredInvoice | undefined {
    const invoiceId = store.invoicesByOrderId.get(orderId);
    return invoiceId ? store.invoices.get(invoiceId) : undefined;
  }
}

export class PlanRepository {
  getById(id: string): StoredPlan | undefined {
    return store.plans.get(id);
  }
}

export class SubscriptionRepository {
  save(subscription: SubscriptionRecord): void {
    coreState.subscriptions.set(subscription.id, subscription);
    const ids = new Set(coreState.subscriptionsByOrderId.get(subscription.orderId) ?? []);
    ids.add(subscription.id);
    coreState.subscriptionsByOrderId.set(subscription.orderId, [...ids]);
  }

  listByUser(userId: string): SubscriptionRecord[] {
    return [...coreState.subscriptions.values()].filter((s) => s.userId === userId);
  }

  getById(id: string): SubscriptionRecord | undefined {
    return coreState.subscriptions.get(id);
  }

  listByOrderId(orderId: string): SubscriptionRecord[] {
    const ids = coreState.subscriptionsByOrderId.get(orderId) ?? [];
    return ids
      .map((id) => coreState.subscriptions.get(id))
      .filter((record): record is SubscriptionRecord => Boolean(record));
  }
}

export class LicenseRepository {
  save(license: LicenseRecord): void {
    coreState.licenses.set(license.id, license);
    const ids = new Set(coreState.licensesByOrderId.get(license.orderId) ?? []);
    ids.add(license.id);
    coreState.licensesByOrderId.set(license.orderId, [...ids]);
  }

  listByUser(userId: string): LicenseRecord[] {
    return [...coreState.licenses.values()].filter((l) => l.userId === userId);
  }

  getById(id: string): LicenseRecord | undefined {
    return coreState.licenses.get(id);
  }

  listByOrderId(orderId: string): LicenseRecord[] {
    const ids = coreState.licensesByOrderId.get(orderId) ?? [];
    return ids
      .map((id) => coreState.licenses.get(id))
      .filter((record): record is LicenseRecord => Boolean(record));
  }
}

export class DunningRepository {
  save(record: DunningRecord): void {
    coreState.dunning.set(record.id, record);
  }

  getByPaymentId(paymentId: string): DunningRecord | undefined {
    return [...coreState.dunning.values()].find((d) => d.paymentId === paymentId);
  }
}

export class PayoutRepository {
  save(record: PayoutRecord): void {
    coreState.payouts.set(record.id, record);
  }
}

export class TransactionRepository {
  begin(): void {
    coreState.rollbackStoreSnapshots.push({
      payments: new Map(store.payments),
      products: new Map(store.products),
      orders: new Map(store.orders),
      invoices: new Map(store.invoices),
      webhookLogs: new Map(store.webhookLogs),
      subscriptions: new Map(coreState.subscriptions),
      subscriptionsByOrderId: new Map(
        [...coreState.subscriptionsByOrderId.entries()].map(([k, v]) => [k, [...v]]),
      ),
      licenses: new Map(coreState.licenses),
      licensesByOrderId: new Map(
        [...coreState.licensesByOrderId.entries()].map(([k, v]) => [k, [...v]]),
      ),
      dunning: new Map(coreState.dunning),
      payouts: new Map(coreState.payouts),
      entitlements: new Map([...coreState.entitlements.entries()].map(([k, v]) => [k, [...v]])),
      paymentGatewaySnapshots: new Map(coreState.paymentGatewaySnapshots),
      priceSnapshots: new Map(coreState.priceSnapshots),
      analytics: { ...coreState.analytics },
    });
  }

  commit(): void {
    coreState.rollbackStoreSnapshots.pop();
  }

  rollback(): void {
    const snapshot = coreState.rollbackStoreSnapshots.pop();
    if (!snapshot) return;
    store.payments = snapshot.payments;
    store.products = snapshot.products;
    store.orders = snapshot.orders;
    store.invoices = snapshot.invoices;
    store.webhookLogs = snapshot.webhookLogs;
    coreState.subscriptions = snapshot.subscriptions;
    coreState.subscriptionsByOrderId = snapshot.subscriptionsByOrderId;
    coreState.licenses = snapshot.licenses;
    coreState.licensesByOrderId = snapshot.licensesByOrderId;
    coreState.dunning = snapshot.dunning;
    coreState.payouts = snapshot.payouts;
    coreState.entitlements = snapshot.entitlements;
    coreState.paymentGatewaySnapshots = snapshot.paymentGatewaySnapshots;
    coreState.priceSnapshots = snapshot.priceSnapshots;
    coreState.analytics = snapshot.analytics;
  }
}

export const repositories = {
  product: new ProductRepository(),
  checkout: new CheckoutRepository(),
  order: new OrderRepository(),
  payment: new PaymentRepository(),
  invoice: new InvoiceRepository(),
  plan: new PlanRepository(),
  subscription: new SubscriptionRepository(),
  license: new LicenseRepository(),
  dunning: new DunningRepository(),
  payout: new PayoutRepository(),
  tx: new TransactionRepository(),
};
