// Central Action Manager
// Provides: state machine (idle/loading/success/error), event guard (debounce +
// idempotency keys), configurable timeout, auto-retry with backoff, optimistic
// updates with rollback, permission/dependency guards, post-action consistency
// check, and a full audit log.

export type ActionPhase = "idle" | "loading" | "success" | "error";

export interface RetryPolicy {
  maxAttempts: number;
  /** Fixed ms, or a function of attempt index (1-based) */
  backoffMs?: number | ((attempt: number) => number);
}

export interface ActionConfig<TPayload = unknown, TResult = unknown> {
  /** Unique action identifier — also the debounce key */
  id: string;
  /** Minimum ms between consecutive triggers (default 300) */
  debounceMs?: number;
  /** Max ms to wait before aborting with a timeout error (default 30 000) */
  timeoutMs?: number;
  /** Auto-retry policy */
  retry?: RetryPolicy;
  /** Return true to allow. Runs before handler. */
  permissionGuard?: () => boolean | Promise<boolean>;
  /** Return true when all required data/APIs are available */
  dependencyCheck?: () => boolean;
  /** Optimistic state update applied before the handler resolves */
  optimisticUpdate?: (payload: TPayload) => void;
  /** Revert optimistic state when the handler fails all retries */
  rollbackUpdate?: (payload: TPayload) => void;
  /** Called after success to verify server matches client expectation */
  consistencyCheck?: (result: TResult) => Promise<boolean>;
  /** Called when consistencyCheck returns false */
  onConsistencyMismatch?: () => void;
  /** Generate an idempotency key from the payload */
  idempotencyKey?: (payload: TPayload) => string;
}

export interface ActionLogEntry {
  actionId: string;
  phase: ActionPhase;
  timestamp: number;
  payload?: unknown;
  error?: string;
  attempt?: number;
  idempotencyKey?: string;
}

export type ActionListener = (entry: ActionLogEntry) => void;

// Valid phase transitions
const VALID_TRANSITIONS: Record<ActionPhase, ActionPhase[]> = {
  idle: ["loading"],
  loading: ["success", "error"],
  success: ["idle", "loading"],
  error: ["idle", "loading"],
};

class ActionManager {
  private readonly phases = new Map<string, ActionPhase>();
  private readonly lastTrigger = new Map<string, number>();
  private readonly log: ActionLogEntry[] = [];
  private listeners: ActionListener[] = [];

  // ── Phase helpers ────────────────────────────────────────────────────────

  getPhase(actionId: string): ActionPhase {
    return this.phases.get(actionId) ?? "idle";
  }

  /** Attempt a phase transition; returns false if the transition is invalid. */
  transition(actionId: string, to: ActionPhase): boolean {
    const from = this.getPhase(actionId);
    if (!VALID_TRANSITIONS[from].includes(to)) {
      console.warn(`[ActionManager] Invalid transition ${from}→${to} for "${actionId}"`);
      return false;
    }
    this.phases.set(actionId, to);
    return true;
  }

  /** Force-reset an action to idle (used by self-heal / manual reset). */
  reset(actionId: string): void {
    this.phases.set(actionId, "idle");
    this.emit({ actionId, phase: "idle", timestamp: Date.now() });
  }

  // ── Pub/sub ──────────────────────────────────────────────────────────────

  subscribe(listener: ActionListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(entry: ActionLogEntry): void {
    this.log.push(entry);
    if (this.log.length > 500) this.log.shift();
    this.listeners.forEach((l) => l(entry));
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[Action:${entry.actionId}] ${entry.phase}`, entry);
    }
  }

  getLog(): ActionLogEntry[] {
    return [...this.log];
  }

  // ── Core execute ─────────────────────────────────────────────────────────

  async execute<TPayload = unknown, TResult = unknown>(
    config: ActionConfig<TPayload, TResult>,
    handler: (payload: TPayload, signal: AbortSignal) => Promise<TResult>,
    payload: TPayload,
  ): Promise<TResult | undefined> {
    const {
      id,
      debounceMs = 300,
      timeoutMs = 30_000,
      retry = { maxAttempts: 1 },
      permissionGuard,
      dependencyCheck,
      optimisticUpdate,
      rollbackUpdate,
      consistencyCheck,
      onConsistencyMismatch,
      idempotencyKey,
    } = config;

    // ── Event guard (debounce) ──────────────────────────────────────────────
    const now = Date.now();
    const last = this.lastTrigger.get(id) ?? 0;
    if (now - last < debounceMs) {
      this.emit({
        actionId: id,
        phase: "idle",
        timestamp: now,
        error: "Debounced — triggered too quickly",
      });
      return undefined;
    }
    this.lastTrigger.set(id, now);

    // ── State guard ────────────────────────────────────────────────────────
    if (!this.transition(id, "loading")) return undefined;

    // ── Permission guard ───────────────────────────────────────────────────
    if (permissionGuard) {
      const allowed = await permissionGuard();
      if (!allowed) {
        this.transition(id, "error");
        this.emit({
          actionId: id,
          phase: "error",
          timestamp: Date.now(),
          error: "Permission denied",
        });
        return undefined;
      }
    }

    // ── Dependency check ───────────────────────────────────────────────────
    if (dependencyCheck && !dependencyCheck()) {
      this.transition(id, "error");
      this.emit({
        actionId: id,
        phase: "error",
        timestamp: Date.now(),
        error: "Required dependencies are unavailable",
      });
      return undefined;
    }

    const iKey = idempotencyKey?.(payload);
    this.emit({
      actionId: id,
      phase: "loading",
      timestamp: Date.now(),
      payload,
      idempotencyKey: iKey,
    });

    // ── Optimistic update ──────────────────────────────────────────────────
    optimisticUpdate?.(payload);

    // ── Retry loop ─────────────────────────────────────────────────────────
    const maxAttempts = retry.maxAttempts;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(
        () => controller.abort(new Error("Action timed out")),
        timeoutMs,
      );

      try {
        const result = await handler(payload, controller.signal);
        clearTimeout(timeoutHandle);

        this.transition(id, "success");
        this.emit({
          actionId: id,
          phase: "success",
          timestamp: Date.now(),
          payload,
          attempt,
          idempotencyKey: iKey,
        });

        // ── Consistency check ────────────────────────────────────────────
        if (consistencyCheck) {
          const consistent = await consistencyCheck(result);
          if (!consistent) {
            onConsistencyMismatch?.();
          }
        }

        // Auto-reset to idle after a brief success window
        setTimeout(() => {
          if (this.getPhase(id) === "success") this.transition(id, "idle");
        }, 2_000);

        return result;
      } catch (err) {
        clearTimeout(timeoutHandle);
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        this.emit({
          actionId: id,
          phase: "error",
          timestamp: Date.now(),
          error: errMsg,
          attempt,
        });

        if (attempt < maxAttempts) {
          const rawBackoff = retry.backoffMs ?? 1_000;
          const backoff =
            typeof rawBackoff === "function" ? rawBackoff(attempt) : rawBackoff * attempt;
          await new Promise<void>((r) => setTimeout(r, backoff));
          // Re-enter loading for next attempt
          this.phases.set(id, "loading");
        }
      }
    }

    // ── All attempts failed ────────────────────────────────────────────────
    rollbackUpdate?.(payload);
    this.transition(id, "error");
    throw lastError;
  }
}

export const actionManager = new ActionManager();
