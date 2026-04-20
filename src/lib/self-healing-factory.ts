import { offlineQueue, type ConflictStrategy } from "@/lib/offline-queue";
import { parseError } from "@/lib/error-parser";
import { healingObservability } from "@/lib/healing-observability";

export interface SelfHealingExecutionContext<TPayload> {
  payload: TPayload;
  signal: AbortSignal;
  attempt: number;
}

export interface SelfHealingPolicy {
  timeoutMs?: number;
  maxAttempts?: number;
  backoffMs?: number;
  queueWhenOffline?: boolean;
  conflictStrategy?: ConflictStrategy;
  isTransient?: (error: unknown) => boolean;
}

export interface SelfHealingOptions<TPayload, TResult> {
  operationId: string;
  actionType: string;
  payload: TPayload;
  run: (context: SelfHealingExecutionContext<TPayload>) => Promise<TResult>;
  fallback?: (payload: TPayload) => Promise<TResult>;
  idempotencyKey?: string;
  policy?: SelfHealingPolicy;
  onQueued?: (queueId: string) => void;
  onRecovered?: (strategy: "retry" | "fallback" | "queue") => void;
}

export class SelfHealingFactory {
  async execute<TPayload, TResult>(
    options: SelfHealingOptions<TPayload, TResult>,
  ): Promise<TResult> {
    const {
      operationId,
      actionType,
      payload,
      run,
      fallback,
      idempotencyKey,
      onQueued,
      onRecovered,
    } = options;

    const policy: Required<
      Pick<
        SelfHealingPolicy,
        "timeoutMs" | "maxAttempts" | "backoffMs" | "queueWhenOffline" | "conflictStrategy"
      >
    > &
      Pick<SelfHealingPolicy, "isTransient"> = {
      timeoutMs: options.policy?.timeoutMs ?? 15_000,
      maxAttempts: options.policy?.maxAttempts ?? 3,
      backoffMs: options.policy?.backoffMs ?? 1_000,
      queueWhenOffline: options.policy?.queueWhenOffline ?? true,
      conflictStrategy: options.policy?.conflictStrategy ?? "last-write-wins",
      isTransient: options.policy?.isTransient,
    };

    if (policy.queueWhenOffline && this.isOffline()) {
      const queued = offlineQueue.enqueue({
        actionType,
        payload,
        idempotencyKey,
        conflictStrategy: policy.conflictStrategy,
      });
      healingObservability.push({
        operationId,
        actionType,
        status: "queued",
        message: "offline_queue",
      });
      onQueued?.(queued.id);
      onRecovered?.("queue");
      throw new Error(
        `No internet connection. Action was queued for automatic retry (${operationId}).`,
      );
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => {
        controller.abort(new Error("Action timed out"));
      }, policy.timeoutMs);

      try {
        const result = await run({ payload, signal: controller.signal, attempt });
        clearTimeout(timeoutHandle);
        healingObservability.push({
          operationId,
          actionType,
          status: "success",
          attempt,
        });
        if (attempt > 1) onRecovered?.("retry");
        return result;
      } catch (error) {
        clearTimeout(timeoutHandle);
        lastError = error;

        const isTransient = policy.isTransient
          ? policy.isTransient(error)
          : this.defaultIsTransientError(error);

        if (!isTransient || attempt >= policy.maxAttempts) break;

        healingObservability.push({
          operationId,
          actionType,
          status: "retry",
          attempt,
          message: error instanceof Error ? error.message : String(error),
        });

        await new Promise((resolve) => setTimeout(resolve, policy.backoffMs * attempt));
      }
    }

    if (fallback) {
      const recovered = await fallback(payload);
      healingObservability.push({
        operationId,
        actionType,
        status: "recovered",
        strategy: "fallback",
      });
      onRecovered?.("fallback");
      return recovered;
    }

    healingObservability.push({
      operationId,
      actionType,
      status: "failed",
      message: lastError instanceof Error ? lastError.message : String(lastError),
    });

    throw lastError;
  }

  private isOffline(): boolean {
    if (typeof navigator === "undefined") return false;
    return !navigator.onLine;
  }

  private defaultIsTransientError(error: unknown): boolean {
    const parsed = parseError(error);
    return parsed.retryable;
  }
}

export const selfHealingFactory = new SelfHealingFactory();
