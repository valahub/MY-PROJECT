// Health Check Engine
// Polls configured service endpoints at a fixed heartbeat interval, tracks
// latency, compares against per-service SLOs, and publishes status-change
// events to subscribers.
//
// Status model (ordered by severity, ascending):
//   healthy       — response within normal latency threshold
//   latency_spike — response received but slower than latencyThresholdMs
//   degraded      — consecutive soft failures (≥2 but < failureThreshold)
//   down          — consecutive hard failures ≥ failureThreshold
//   unknown       — not yet polled

export type HealthStatus = "healthy" | "degraded" | "down" | "latency_spike" | "unknown";

export interface ServiceSLO {
  /** Target uptime fraction (e.g. 0.999 = 99.9 %) */
  uptimeFraction: number;
  /** Max acceptable p50 latency in ms */
  latencyP50Ms: number;
  /** Max acceptable p95 latency in ms */
  latencyP95Ms: number;
}

export interface ServiceConfig {
  /** Unique service identifier */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Service category (shown on dashboard) */
  category: "api" | "database" | "queue" | "payments" | "other";
  /** How often to simulate a heartbeat check (ms, default 30 000) */
  heartbeatIntervalMs?: number;
  /** Latency above this triggers latency_spike (ms, default 500) */
  latencyThresholdMs?: number;
  /** Latency above this marks service as degraded (ms, default 2 000) */
  criticalLatencyMs?: number;
  /** Consecutive failures before status becomes "down" (default 3) */
  failureThreshold?: number;
  /** Per-service SLO definitions */
  slo?: ServiceSLO;
}

export interface HealthRecord {
  serviceId: string;
  status: HealthStatus;
  /** Last measured latency in ms (-1 = not yet measured) */
  latencyMs: number;
  /** ISO timestamp of last successful check */
  lastChecked: string | null;
  /** Number of consecutive check failures */
  consecutiveFailures: number;
  /** Human-readable status message */
  message: string;
  /** Uptime fraction over the current session (0.0 = 0 %, 1.0 = 100 %) */
  uptimeFraction: number;
  /** Latency history (last 20 samples) for sparklines */
  latencyHistory: number[];
}

export interface HealthEvent {
  serviceId: string;
  previousStatus: HealthStatus;
  currentStatus: HealthRecord;
  timestamp: number;
}

export type HealthListener = (event: HealthEvent) => void;

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_HEARTBEAT_MS = 30_000;
const DEFAULT_LATENCY_THRESHOLD_MS = 500;
const DEFAULT_CRITICAL_LATENCY_MS = 2_000;
const DEFAULT_FAILURE_THRESHOLD = 3;
const HISTORY_SIZE = 20;

// ── Simulated probe (no real network in this frontend) ────────────────────────

/**
 * Simulates a health probe.  In production this would call the actual
 * service's /health endpoint via fetch; here it produces realistic synthetic
 * data so the UI stays functional without a backend.
 */
function simulateProbe(config: ServiceConfig): Promise<{ latencyMs: number; ok: boolean }> {
  return new Promise((resolve) => {
    // Base latency influenced by category
    const bases: Record<ServiceConfig["category"], number> = {
      api: 80,
      database: 120,
      queue: 60,
      payments: 200,
      other: 100,
    };
    const base = bases[config.category];
    // Add bounded random jitter (±60 %)
    const jitter = base * (Math.random() * 1.2 - 0.6);
    const latencyMs = Math.max(10, Math.round(base + jitter));

    // Random failure probability ~3 %
    const ok = Math.random() > 0.03;

    setTimeout(() => resolve({ latencyMs: ok ? latencyMs : latencyMs * 10, ok }), latencyMs);
  });
}

// ── Manager class ─────────────────────────────────────────────────────────────

class HealthCheckManager {
  private readonly configs = new Map<string, ServiceConfig>();
  private readonly records = new Map<string, HealthRecord>();
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly listeners: HealthListener[] = [];
  /** Session-level counters for uptime calculation */
  private readonly checksTotal = new Map<string, number>();
  private readonly checksSuccess = new Map<string, number>();

  // ── Registration ──────────────────────────────────────────────────────────

  register(config: ServiceConfig): void {
    this.configs.set(config.id, config);
    this.records.set(config.id, {
      serviceId: config.id,
      status: "unknown",
      latencyMs: -1,
      lastChecked: null,
      consecutiveFailures: 0,
      message: "Awaiting first heartbeat",
      uptimeFraction: 1,
      latencyHistory: [],
    });
    this.checksTotal.set(config.id, 0);
    this.checksSuccess.set(config.id, 0);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  startMonitoring(serviceId: string): void {
    const config = this.configs.get(serviceId);
    if (!config) return;
    if (this.timers.has(serviceId)) return; // already running

    const interval = config.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_MS;
    // Run first check immediately
    void this.runCheck(serviceId);
    const timer = setInterval(() => void this.runCheck(serviceId), interval);
    this.timers.set(serviceId, timer);
  }

  stopMonitoring(serviceId: string): void {
    const timer = this.timers.get(serviceId);
    if (timer !== undefined) {
      clearInterval(timer);
      this.timers.delete(serviceId);
    }
  }

  startAll(): void {
    for (const id of this.configs.keys()) this.startMonitoring(id);
  }

  stopAll(): void {
    for (const id of this.configs.keys()) this.stopMonitoring(id);
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  getRecord(serviceId: string): HealthRecord | undefined {
    return this.records.get(serviceId);
  }

  getAllRecords(): HealthRecord[] {
    return Array.from(this.records.values());
  }

  getConfig(serviceId: string): ServiceConfig | undefined {
    return this.configs.get(serviceId);
  }

  // ── Pub/Sub ────────────────────────────────────────────────────────────────

  subscribe(listener: HealthListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  private emit(event: HealthEvent): void {
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch {
        // listener errors must not break the polling loop
      }
    });
  }

  // ── Core polling ───────────────────────────────────────────────────────────

  private async runCheck(serviceId: string): Promise<void> {
    const config = this.configs.get(serviceId);
    const current = this.records.get(serviceId);
    if (!config || !current) return;

    const total = (this.checksTotal.get(serviceId) ?? 0) + 1;
    this.checksTotal.set(serviceId, total);

    const previousStatus = current.status;

    try {
      const { latencyMs, ok } = await simulateProbe(config);

      const latencyThreshold = config.latencyThresholdMs ?? DEFAULT_LATENCY_THRESHOLD_MS;
      const criticalLatency = config.criticalLatencyMs ?? DEFAULT_CRITICAL_LATENCY_MS;
      const failureThreshold = config.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;

      // Update latency history (rolling window)
      const history = [...current.latencyHistory, latencyMs].slice(-HISTORY_SIZE);

      if (!ok) {
        const failures = current.consecutiveFailures + 1;
        const newStatus: HealthStatus =
          failures >= failureThreshold
            ? "down"
            : failures >= 2
              ? "degraded"
              : current.status === "healthy"
                ? "degraded"
                : current.status;

        const updated: HealthRecord = {
          ...current,
          status: newStatus,
          latencyMs,
          consecutiveFailures: failures,
          message:
            newStatus === "down"
              ? `Service unreachable (${failures} consecutive failures)`
              : `Intermittent failures detected (${failures} in a row)`,
          uptimeFraction: this.calculateUptime(serviceId),
          latencyHistory: history,
        };
        this.records.set(serviceId, updated);
        if (newStatus !== previousStatus) {
          this.emit({ serviceId, previousStatus, currentStatus: updated, timestamp: Date.now() });
        }
        return;
      }

      // Successful check
      const successes = (this.checksSuccess.get(serviceId) ?? 0) + 1;
      this.checksSuccess.set(serviceId, successes);

      let newStatus: HealthStatus;
      if (latencyMs > criticalLatency) {
        newStatus = "degraded";
      } else if (latencyMs > latencyThreshold) {
        newStatus = "latency_spike";
      } else {
        newStatus = "healthy";
      }

      const updated: HealthRecord = {
        ...current,
        status: newStatus,
        latencyMs,
        lastChecked: new Date().toISOString(),
        consecutiveFailures: 0,
        message:
          newStatus === "healthy"
            ? "All checks passing"
            : newStatus === "latency_spike"
              ? `Response time elevated (${latencyMs}ms)`
              : `High latency detected (${latencyMs}ms)`,
        uptimeFraction: this.calculateUptime(serviceId),
        latencyHistory: history,
      };
      this.records.set(serviceId, updated);

      if (newStatus !== previousStatus) {
        this.emit({ serviceId, previousStatus, currentStatus: updated, timestamp: Date.now() });
      }
    } catch (err) {
      const failures = current.consecutiveFailures + 1;
      const failureThreshold = config.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
      const newStatus: HealthStatus = failures >= failureThreshold ? "down" : "degraded";
      const errMsg = err instanceof Error ? err.message : String(err);

      const updated: HealthRecord = {
        ...current,
        status: newStatus,
        consecutiveFailures: failures,
        message: `Probe error: ${errMsg}`,
        uptimeFraction: this.calculateUptime(serviceId),
      };
      this.records.set(serviceId, updated);

      if (newStatus !== previousStatus) {
        this.emit({ serviceId, previousStatus, currentStatus: updated, timestamp: Date.now() });
      }
    }
  }

  private calculateUptime(serviceId: string): number {
    const total = this.checksTotal.get(serviceId) ?? 0;
    const success = this.checksSuccess.get(serviceId) ?? 0;
    return total === 0 ? 1 : success / total;
  }
}

export const healthCheckManager = new HealthCheckManager();

// ── Default service definitions ───────────────────────────────────────────────

export const DEFAULT_SERVICES: ServiceConfig[] = [
  {
    id: "api-gateway",
    name: "API Gateway",
    category: "api",
    heartbeatIntervalMs: 30_000,
    latencyThresholdMs: 300,
    criticalLatencyMs: 1_000,
    failureThreshold: 3,
    slo: { uptimeFraction: 0.999, latencyP50Ms: 150, latencyP95Ms: 500 },
  },
  {
    id: "database-primary",
    name: "Database (Primary)",
    category: "database",
    heartbeatIntervalMs: 15_000,
    latencyThresholdMs: 200,
    criticalLatencyMs: 800,
    failureThreshold: 2,
    slo: { uptimeFraction: 0.9999, latencyP50Ms: 100, latencyP95Ms: 300 },
  },
  {
    id: "job-queue",
    name: "Job Queue",
    category: "queue",
    heartbeatIntervalMs: 20_000,
    latencyThresholdMs: 500,
    criticalLatencyMs: 2_000,
    failureThreshold: 4,
    slo: { uptimeFraction: 0.999, latencyP50Ms: 200, latencyP95Ms: 800 },
  },
  {
    id: "payment-gateway",
    name: "Payment Gateway",
    category: "payments",
    heartbeatIntervalMs: 30_000,
    latencyThresholdMs: 600,
    criticalLatencyMs: 2_500,
    failureThreshold: 3,
    slo: { uptimeFraction: 0.9995, latencyP50Ms: 300, latencyP95Ms: 1_000 },
  },
];

// Register default services once
DEFAULT_SERVICES.forEach((s) => healthCheckManager.register(s));
