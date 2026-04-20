export type CoreEventName =
  | "product.created"
  | "product.updated"
  | "product.archived"
  | "product.publish_requested"
  | "product.published"
  | "checkout.session.created"
  | "payment.intent.created"
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded"
  | "order.completed"
  | "invoice.generated"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.cancelled"
  | "license.generated"
  | "license.revoked"
  | "dunning.retry_scheduled"
  | "payout.requested"
  | "webhook.delivery.queued";

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
