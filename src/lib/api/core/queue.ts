import { store } from "@/lib/api/store";

export type QueueJobType = "email.send" | "webhook.deliver" | "billing.renewal" | "dunning.retry";

export interface QueueJob {
  id: string;
  type: QueueJobType;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  nextRunAt: string;
  createdAt: string;
}

type QueueProcessor = (job: QueueJob) => Promise<void>;

class QueueEngine {
  private jobs: QueueJob[] = [];
  private processors = new Map<QueueJobType, QueueProcessor>();

  register(type: QueueJobType, processor: QueueProcessor): void {
    this.processors.set(type, processor);
  }

  enqueue(
    type: QueueJobType,
    payload: Record<string, unknown>,
    delayMs = 0,
    maxAttempts = 3,
  ): QueueJob {
    const now = Date.now();
    const job: QueueJob = {
      id: `job_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      type,
      payload,
      attempts: 0,
      maxAttempts,
      nextRunAt: new Date(now + delayMs).toISOString(),
      createdAt: new Date(now).toISOString(),
    };
    this.jobs.push(job);
    return job;
  }

  async processDue(): Promise<void> {
    const now = Date.now();
    const due = this.jobs.filter((j) => new Date(j.nextRunAt).getTime() <= now);
    this.jobs = this.jobs.filter((j) => new Date(j.nextRunAt).getTime() > now);

    for (const job of due) {
      const processor = this.processors.get(job.type);
      if (!processor) continue;

      try {
        job.attempts += 1;
        await processor(job);
      } catch {
        if (job.attempts < job.maxAttempts) {
          const retryDelay = job.attempts * 60 * 1000;
          job.nextRunAt = new Date(Date.now() + retryDelay).toISOString();
          this.jobs.push(job);
        }
      }
    }
  }
}

export const queueEngine = new QueueEngine();

queueEngine.register("webhook.deliver", async (job) => {
  const webhookId = String(job.payload.webhookId ?? "");
  const event = String(job.payload.event ?? "unknown");
  const payload = JSON.stringify(job.payload.payload ?? {});
  const logId = `whl_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;

  store.webhookLogs.set(logId, {
    id: logId,
    webhookId,
    event,
    payload,
    status: "delivered",
    attempts: job.attempts,
    responseCode: 200,
    createdAt: new Date().toISOString(),
  });
});

queueEngine.register("email.send", async () => {
  return;
});

queueEngine.register("billing.renewal", async () => {
  return;
});

queueEngine.register("dunning.retry", async () => {
  return;
});
