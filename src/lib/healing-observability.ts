export type HealingEventStatus = "queued" | "retry" | "recovered" | "failed" | "success";

export interface HealingEvent {
  id: string;
  at: string;
  operationId: string;
  actionType: string;
  status: HealingEventStatus;
  attempt?: number;
  strategy?: "retry" | "fallback" | "queue";
  message?: string;
}

class HealingObservability {
  private events: HealingEvent[] = [];

  push(event: Omit<HealingEvent, "id" | "at">): HealingEvent {
    const saved: HealingEvent = {
      id: `heal_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      at: new Date().toISOString(),
      ...event,
    };
    this.events.unshift(saved);
    if (this.events.length > 1000) this.events = this.events.slice(0, 1000);
    return saved;
  }

  list(limit = 100): HealingEvent[] {
    return this.events.slice(0, Math.max(1, Math.min(limit, 500)));
  }

  stats() {
    const last100 = this.events.slice(0, 100);
    const failed = last100.filter((e) => e.status === "failed").length;
    const recovered = last100.filter((e) => e.status === "recovered").length;
    const retries = last100.filter((e) => e.status === "retry").length;
    return {
      total: this.events.length,
      failed,
      recovered,
      retries,
      healthScore: Math.max(0, 100 - failed + recovered),
    };
  }
}

export const healingObservability = new HealingObservability();
