export type CoreEventName =
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "product.status_changed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.paused"
  | "subscription.resumed"
  | "subscription.renewed"
  | "subscription.plan_changed"
  | "subscription.status_changed"
  | "pricing.plan.created"
  | "pricing.plan.updated"
  | "pricing.plan.deleted"
  | "audit.log.created"
  | "license.generated"
  | "license.activated"
  | "license.deactivated"
  | "license.expired"
  | "license.tampered"
  | "license.revoked"
  | "transaction.created"
  | "transaction.completed"
  | "transaction.failed"
  | "transaction.refunded"
  | "transaction.chargeback"
  | "invoice.created"
  | "invoice.paid"
  | "invoice.voided"
  | "invoice.retry_attempted"
  | "dunning.recovered"
  | "dunning.auto_canceled"
  | "dunning.stage_changed"
  | "proration.calculated"
  | "proration.overridden"
  | "feature.flag.toggled"
  | "entitlement.granted"
  | "entitlement.revoked"
  | "limit.changed"
  | "currency.rate_updated"
  | "currency.rate_override"
  | "currency.base_changed"
  | "currency.fx_adjusted"
  | "pricing.rule_created"
  | "pricing.rule_updated"
  | "pricing.rule_deleted"
  | "pricing.multiplier_changed"
  | "pricing.tax_config_changed"
  | "customer.created"
  | "customer.updated"
  | "customer.suspended"
  | "customer.blocked"
  | "customer.activated"
  | "customer.session_revoked"
  | "customer.password_reset"
  | "marketplace.item_created"
  | "marketplace.item_approved"
  | "marketplace.item_rejected"
  | "marketplace.item_hidden"
  | "marketplace.author_verified"
  | "marketplace.author_banned"
  | "marketplace.payout_processed"
  | "marketplace.report_resolved"
  | "marketplace.refund"
  | "marketplace.order_created"
  | "marketplace.gmv_updated"
  | "featured_slot_created"
  | "featured_slot_removed"
  | "dmca_approved"
  | "dmca_rejected"
  | "author_level_changed"
  | "quality_scan_completed"
  | "review_approved"
  | "review_soft_rejected"
  | "review_rejected";

export interface CoreEvent<T = unknown> {
  id: string;
  name: CoreEventName;
  payload: T;
  createdAt: string;
}

type Handler<T = unknown> = (event: CoreEvent<T>) => Promise<void> | void;

class EventBus {
  private handlers = new Map<CoreEventName, Handler[]>();

  on<T = unknown>(name: CoreEventName, handler: Handler<T>): void {
    const existing = this.handlers.get(name) ?? [];
    existing.push(handler as Handler);
    this.handlers.set(name, existing);
  }

  async emit<T = unknown>(name: CoreEventName, payload: T): Promise<CoreEvent<T>> {
    const event: CoreEvent<T> = {
      id: `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`,
      name,
      payload,
      createdAt: new Date().toISOString(),
    };

    const list = this.handlers.get(name) ?? [];
    await Promise.all(list.map((handler) => Promise.resolve(handler(event))));
    return event;
  }
}

export const eventBus = new EventBus();
