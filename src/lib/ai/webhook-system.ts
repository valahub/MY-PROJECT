// AI Webhook / Event System
// Trigger events for automation (blog.created, seo.updated, ai.failed)

export interface WebhookEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  processed: boolean;
  retryCount: number;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}

export class AIWebhookSystem {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private eventQueue: WebhookEvent[] = [];

  subscribe(subscription: Omit<WebhookSubscription, 'id'>): string {
    const id = this.generateId();
    const newSubscription: WebhookSubscription = {
      ...subscription,
      id,
    };

    this.subscriptions.set(id, newSubscription);
    return id;
  }

  unsubscribe(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  async triggerEvent(type: string, payload: any) {
    const event: WebhookEvent = {
      id: this.generateId(),
      type,
      payload,
      timestamp: Date.now(),
      processed: false,
      retryCount: 0,
    };

    this.eventQueue.push(event);
    await this.processEvent(event);
  }

  private async processEvent(event: WebhookEvent) {
    const relevantSubscriptions = Array.from(this.subscriptions.values()).filter(
      (sub) => sub.active && sub.events.includes(event.type)
    );

    for (const subscription of relevantSubscriptions) {
      try {
        await this.sendWebhook(subscription, event);
        event.processed = true;
      } catch (error) {
        event.retryCount++;
        if (event.retryCount < 3) {
          setTimeout(() => this.processEvent(event), 1000 * Math.pow(2, event.retryCount));
        }
      }
    }
  }

  private async sendWebhook(subscription: WebhookSubscription, event: WebhookEvent) {
    // In production, actual HTTP POST to webhook URL
    console.log(`[Webhook] Sending ${event.type} to ${subscription.url}`);
  }

  getSubscriptions(): WebhookSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  getEvents(filter?: { type?: string; processed?: boolean }): WebhookEvent[] {
    let filtered = this.eventQueue;

    if (filter?.type) {
      filtered = filtered.filter((e) => e.type === filter.type);
    }
    if (filter?.processed !== undefined) {
      filtered = filtered.filter((e) => e.processed === filter.processed);
    }

    return filtered;
  }

  private generateId(): string {
    return `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiWebhookSystem = new AIWebhookSystem();
