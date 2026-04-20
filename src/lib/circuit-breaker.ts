// Circuit Breaker
// Implements the classic three-state circuit breaker pattern:
//
//   CLOSED   — normal operation; failures are counted
//   OPEN     — calls are rejected immediately (fail-fast); a cooldown timer
//              is running before the next probe is allowed
//   HALF-OPEN — a single probe attempt is allowed; if it succeeds the breaker
//               resets to CLOSED, otherwise it reverts to OPEN
//
// Each breaker instance is keyed by an id and stored in a shared registry so
// all call-sites use the same state machine.

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerConfig {
  /** Unique identifier (usually the service / endpoint name) */
  id: string;
  /** Consecutive failures that trip the breaker (default 5) */
  failureThreshold?: number;
  /** Consecutive successes in half-open that reset to closed (default 2) */
  successThreshold?: number;
  /** Time to wait in OPEN state before moving to HALF-OPEN (ms, default 60 000) */
  cooldownMs?: number;
  /** Per-call timeout; if the handler exceeds this the call counts as a failure (ms, default 10 000) */
  timeoutMs?: number;
}

export interface CircuitSnapshot {
  id: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  /** ISO timestamp when the breaker last tripped to OPEN (null if never) */
  openedAt: string | null;
  /** ISO timestamp when the breaker will allow the next probe (null when closed) */
  retryAfter: string | null;
  /** Total calls attempted through this breaker (session) */
  totalCalls: number;
  /** Total calls rejected due to open state */
  rejectedCalls: number;
  /** Last error message (empty string if last call succeeded) */
  lastError: string;
}

export type CircuitListener = (snapshot: CircuitSnapshot) => void;

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_SUCCESS_THRESHOLD = 2;
const DEFAULT_COOLDOWN_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 10_000;

// ── Single breaker ─────────────────────────────────────────────────────────────

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private openedAt: Date | null = null;
  private retryAfter: Date | null = null;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private totalCalls = 0;
  private rejectedCalls = 0;
  private lastError = "";
  private readonly listeners: CircuitListener[] = [];

  constructor(private readonly config: Required<CircuitBreakerConfig>) {}

  get id(): string {
    return this.config.id;
  }

  // ── Pub/Sub ────────────────────────────────────────────────────────────────

  subscribe(listener: CircuitListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  private notify(): void {
    const snap = this.snapshot();
    this.listeners.forEach((l) => {
      try {
        l(snap);
      } catch {
        // ignore listener errors
      }
    });
  }

  // ── Core execute ───────────────────────────────────────────────────────────

  async execute<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    this.totalCalls++;

    if (this.state === "open") {
      this.rejectedCalls++;
      throw new CircuitOpenError(this.config.id, this.retryAfter);
    }

    const wasHalfOpen = this.state === "half-open";
    const controller = new AbortController();
    const timeoutHandle = setTimeout(
      () => controller.abort(new Error("Circuit breaker timeout")),
      this.config.timeoutMs,
    );

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutHandle);
      this.onSuccess(wasHalfOpen);
      return result;
    } catch (err) {
      clearTimeout(timeoutHandle);
      const msg = err instanceof Error ? err.message : String(err);
      this.onFailure(msg, wasHalfOpen);
      throw err;
    }
  }

  // ── Manual controls ────────────────────────────────────────────────────────

  /** Force-reset the breaker to CLOSED (operator override). */
  reset(): void {
    this.clearCooldown();
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = null;
    this.retryAfter = null;
    this.lastError = "";
    this.notify();
  }

  /** Force-trip the breaker to OPEN immediately. */
  trip(reason = "Manual trip"): void {
    this.lastError = reason;
    this.openCircuit();
  }

  // ── State helpers ──────────────────────────────────────────────────────────

  private onSuccess(wasHalfOpen: boolean): void {
    this.lastError = "";
    if (wasHalfOpen) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.clearCooldown();
        this.state = "closed";
        this.failureCount = 0;
        this.successCount = 0;
        this.openedAt = null;
        this.retryAfter = null;
      }
    } else {
      // In closed state successes reset the failure counter
      this.failureCount = 0;
    }
    this.notify();
  }

  private onFailure(message: string, wasHalfOpen: boolean): void {
    this.lastError = message;
    if (wasHalfOpen) {
      // Failed probe — revert to OPEN with a fresh cooldown
      this.successCount = 0;
      this.openCircuit();
      return;
    }
    this.failureCount++;
    if (this.failureCount >= this.config.failureThreshold) {
      this.openCircuit();
    } else {
      this.notify();
    }
  }

  private openCircuit(): void {
    this.clearCooldown();
    this.state = "open";
    this.openedAt = new Date();
    this.retryAfter = new Date(Date.now() + this.config.cooldownMs);

    this.cooldownTimer = setTimeout(() => {
      this.state = "half-open";
      this.successCount = 0;
      this.notify();
    }, this.config.cooldownMs);

    this.notify();
  }

  private clearCooldown(): void {
    if (this.cooldownTimer !== null) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  // ── Snapshot ───────────────────────────────────────────────────────────────

  snapshot(): CircuitSnapshot {
    return {
      id: this.config.id,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      openedAt: this.openedAt?.toISOString() ?? null,
      retryAfter: this.retryAfter?.toISOString() ?? null,
      totalCalls: this.totalCalls,
      rejectedCalls: this.rejectedCalls,
      lastError: this.lastError,
    };
  }
}

// ── Custom error ───────────────────────────────────────────────────────────────

export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitId: string,
    public readonly retryAfter: Date | null,
  ) {
    super(
      `Circuit "${circuitId}" is OPEN — calls are suspended until ${retryAfter?.toISOString() ?? "cooldown completes"}`,
    );
    this.name = "CircuitOpenError";
  }
}

// ── Registry ───────────────────────────────────────────────────────────────────

class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();
  private readonly listeners: Array<(snap: CircuitSnapshot) => void> = [];

  /** Get or create a circuit breaker for the given config. */
  getOrCreate(config: CircuitBreakerConfig): CircuitBreaker {
    const existing = this.breakers.get(config.id);
    if (existing) return existing;

    const full: Required<CircuitBreakerConfig> = {
      id: config.id,
      failureThreshold: config.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD,
      successThreshold: config.successThreshold ?? DEFAULT_SUCCESS_THRESHOLD,
      cooldownMs: config.cooldownMs ?? DEFAULT_COOLDOWN_MS,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };

    const breaker = new CircuitBreaker(full);
    // Propagate state changes to registry-level listeners
    breaker.subscribe((snap) => this.listeners.forEach((l) => l(snap)));
    this.breakers.set(config.id, breaker);
    return breaker;
  }

  getSnapshot(id: string): CircuitSnapshot | undefined {
    return this.breakers.get(id)?.snapshot();
  }

  getAllSnapshots(): CircuitSnapshot[] {
    return Array.from(this.breakers.values()).map((b) => b.snapshot());
  }

  reset(id: string): void {
    this.breakers.get(id)?.reset();
  }

  resetAll(): void {
    this.breakers.forEach((b) => b.reset());
  }

  /** Subscribe to state changes from any registered breaker. */
  subscribe(listener: (snap: CircuitSnapshot) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  /**
   * Convenience wrapper: execute fn through the named circuit breaker.
   * Creates the breaker with default config if it does not already exist.
   */
  async execute<T>(id: string, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    return this.getOrCreate({ id }).execute(fn);
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// ── Pre-register default breakers for known services ─────────────────────────

const DEFAULT_BREAKER_CONFIGS: CircuitBreakerConfig[] = [
  { id: "api-gateway", failureThreshold: 5, cooldownMs: 60_000, timeoutMs: 10_000 },
  { id: "database-primary", failureThreshold: 3, cooldownMs: 30_000, timeoutMs: 5_000 },
  { id: "job-queue", failureThreshold: 5, cooldownMs: 45_000, timeoutMs: 15_000 },
  { id: "payment-gateway", failureThreshold: 3, cooldownMs: 90_000, timeoutMs: 12_000 },
];

DEFAULT_BREAKER_CONFIGS.forEach((cfg) => circuitBreakerRegistry.getOrCreate(cfg));
