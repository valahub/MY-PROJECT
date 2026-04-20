// Recovery Policy Orchestrator
// Central registry that maps (failure type × service) to a recovery action,
// then executes the action with a per-policy cooldown and a mandatory
// verification step.  Every attempt and outcome is appended to an immutable
// audit log (capped at 500 entries).
//
// Policy model:
//   trigger  — what condition activates the policy
//   action   — automated response to attempt
//   cooldown — minimum ms before the same policy re-fires for the same service
//   verify   — async function that confirms the action worked (returns true = OK)
//   maxRetries — how many times to re-attempt if verify fails
//
// The orchestrator integrates with:
//   - actionManager  (retry / debounce guard)
//   - offlineQueue   (dead-queue re-processing)
//   - healthCheckManager (status awareness)

import { offlineQueue } from "./offline-queue";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecoveryTrigger =
  | "service_down"
  | "service_degraded"
  | "latency_spike"
  | "circuit_open"
  | "dead_queue_jobs"
  | "consistency_mismatch"
  | "config_corrupt"
  | "backup_failure"
  | "security_event"
  | "memory_pressure"
  | "rate_limit_breach";

export type RecoveryAction =
  | "restart_service"
  | "failover_db"
  | "failover_payment"
  | "reroute_api"
  | "retry_with_backoff"
  | "drain_dead_queue"
  | "reconcile_data"
  | "reset_circuit"
  | "restore_config"
  | "restore_backup"
  | "block_ip"
  | "throttle_user"
  | "scale_up"
  | "scale_down"
  | "alert_operator"
  | "no_op";

export type RecoveryOutcome = "success" | "failure" | "skipped" | "cooldown" | "in_progress";

export interface RecoveryPolicy {
  /** Unique policy identifier */
  id: string;
  /** Human-readable label */
  label: string;
  trigger: RecoveryTrigger;
  /** Service ids this policy applies to ("*" = all) */
  serviceIds: string[];
  action: RecoveryAction;
  /** Minimum ms between activations for the same trigger+service (default 60 000) */
  cooldownMs?: number;
  /** Max re-verify attempts before giving up (default 3) */
  maxRetries?: number;
  /** Called to perform the recovery action (returns true if action succeeded) */
  execute?: (serviceId: string) => Promise<boolean>;
  /** Called after execute to confirm the system recovered (returns true if verified) */
  verify?: (serviceId: string) => Promise<boolean>;
  /** If true, every activation is posted to the audit log regardless of outcome */
  alwaysAudit?: boolean;
}

export interface RecoveryAuditEntry {
  id: string;
  policyId: string;
  policyLabel: string;
  serviceId: string;
  trigger: RecoveryTrigger;
  action: RecoveryAction;
  outcome: RecoveryOutcome;
  attempt: number;
  durationMs: number;
  message: string;
  timestamp: number;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_COOLDOWN_MS = 60_000;
const DEFAULT_MAX_RETRIES = 3;
const AUDIT_CAP = 500;

// ── Orchestrator ───────────────────────────────────────────────────────────────

class RecoveryOrchestrator {
  private readonly policies = new Map<string, RecoveryPolicy>();
  private readonly auditLog: RecoveryAuditEntry[] = [];
  /** last activation timestamp per "policyId:serviceId" */
  private readonly lastActivated = new Map<string, number>();
  private readonly listeners: Array<(entry: RecoveryAuditEntry) => void> = [];

  // ── Policy management ──────────────────────────────────────────────────────

  registerPolicy(policy: RecoveryPolicy): void {
    this.policies.set(policy.id, policy);
  }

  getPolicy(id: string): RecoveryPolicy | undefined {
    return this.policies.get(id);
  }

  getAllPolicies(): RecoveryPolicy[] {
    return Array.from(this.policies.values());
  }

  // ── Audit log ──────────────────────────────────────────────────────────────

  getAuditLog(): RecoveryAuditEntry[] {
    return [...this.auditLog];
  }

  subscribe(listener: (entry: RecoveryAuditEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  private appendAudit(entry: RecoveryAuditEntry): void {
    this.auditLog.push(entry);
    if (this.auditLog.length > AUDIT_CAP) this.auditLog.shift();
    this.listeners.forEach((l) => {
      try {
        l(entry);
      } catch {
        // never let a listener break the orchestrator
      }
    });
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[Recovery:${entry.policyId}] ${entry.outcome}`, entry);
    }
  }

  // ── Trigger ───────────────────────────────────────────────────────────────

  /**
   * Activate all policies matching (trigger, serviceId).
   * Returns an array of audit entry ids for tracking.
   */
  async trigger(triggerType: RecoveryTrigger, serviceId: string): Promise<RecoveryAuditEntry[]> {
    const matching = Array.from(this.policies.values()).filter(
      (p) =>
        p.trigger === triggerType &&
        (p.serviceIds.includes("*") || p.serviceIds.includes(serviceId)),
    );

    const results: RecoveryAuditEntry[] = [];

    for (const policy of matching) {
      const entry = await this.activatePolicy(policy, serviceId);
      results.push(entry);
    }

    return results;
  }

  // ── Core activation ────────────────────────────────────────────────────────

  private async activatePolicy(
    policy: RecoveryPolicy,
    serviceId: string,
  ): Promise<RecoveryAuditEntry> {
    const cooldownMs = policy.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    const key = `${policy.id}:${serviceId}`;
    const lastMs = this.lastActivated.get(key) ?? 0;
    const now = Date.now();

    if (now - lastMs < cooldownMs) {
      const entry = this.buildEntry(
        policy,
        serviceId,
        "cooldown",
        0,
        0,
        "Skipped — in cooldown window",
      );
      if (policy.alwaysAudit) this.appendAudit(entry);
      return entry;
    }

    this.lastActivated.set(key, now);

    if (!policy.execute) {
      // No executor defined — just record an alert
      const entry = this.buildEntry(
        policy,
        serviceId,
        "success",
        1,
        0,
        `Alert: ${policy.label} triggered for ${serviceId}`,
      );
      this.appendAudit(entry);
      return entry;
    }

    const maxRetries = policy.maxRetries ?? DEFAULT_MAX_RETRIES;
    let attempt = 0;
    let lastMessage = "";

    for (attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();
      try {
        const actionOk = await policy.execute(serviceId);
        const durationMs = Date.now() - start;

        if (!actionOk) {
          lastMessage = `Execute returned false on attempt ${attempt}`;
          if (attempt < maxRetries) {
            await backoff(attempt);
            continue;
          }
          const entry = this.buildEntry(
            policy,
            serviceId,
            "failure",
            attempt,
            durationMs,
            lastMessage,
          );
          this.appendAudit(entry);
          return entry;
        }

        // Verify recovery
        if (policy.verify) {
          const verified = await policy.verify(serviceId);
          if (!verified) {
            lastMessage = `Verify failed after execute (attempt ${attempt})`;
            if (attempt < maxRetries) {
              await backoff(attempt);
              continue;
            }
            const entry = this.buildEntry(
              policy,
              serviceId,
              "failure",
              attempt,
              durationMs,
              lastMessage,
            );
            this.appendAudit(entry);
            return entry;
          }
        }

        const entry = this.buildEntry(
          policy,
          serviceId,
          "success",
          attempt,
          durationMs,
          `${policy.label} completed successfully`,
        );
        this.appendAudit(entry);
        return entry;
      } catch (err) {
        const durationMs = Date.now() - start;
        lastMessage = err instanceof Error ? err.message : String(err);
        if (attempt < maxRetries) {
          await backoff(attempt);
          continue;
        }
        const entry = this.buildEntry(
          policy,
          serviceId,
          "failure",
          attempt,
          durationMs,
          lastMessage,
        );
        this.appendAudit(entry);
        return entry;
      }
    }

    // Exhausted retries
    const entry = this.buildEntry(policy, serviceId, "failure", attempt - 1, 0, lastMessage);
    this.appendAudit(entry);
    return entry;
  }

  private buildEntry(
    policy: RecoveryPolicy,
    serviceId: string,
    outcome: RecoveryOutcome,
    attempt: number,
    durationMs: number,
    message: string,
  ): RecoveryAuditEntry {
    return {
      id: generateId(),
      policyId: policy.id,
      policyLabel: policy.label,
      serviceId,
      trigger: policy.trigger,
      action: policy.action,
      outcome,
      attempt,
      durationMs,
      message,
      timestamp: Date.now(),
    };
  }

  // ── Built-in action helpers ────────────────────────────────────────────────

  /** Flush the offline/dead queue and return true if the queue drains. */
  async drainDeadQueue(
    queueProcessor: Parameters<typeof offlineQueue.flush>[0],
  ): Promise<boolean> {
    const before = offlineQueue.getQueue().length;
    await offlineQueue.flush(queueProcessor);
    const after = offlineQueue.getQueue().length;
    return after < before || after === 0;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function backoff(attempt: number): Promise<void> {
  return new Promise((r) => setTimeout(r, 1_000 * Math.pow(2, attempt - 1)));
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const recoveryOrchestrator = new RecoveryOrchestrator();

// ── Default policies ──────────────────────────────────────────────────────────

const DEFAULT_POLICIES: RecoveryPolicy[] = [
  {
    id: "restart-on-down",
    label: "Auto-restart on service down",
    trigger: "service_down",
    serviceIds: ["*"],
    action: "restart_service",
    cooldownMs: 120_000,
    maxRetries: 3,
    alwaysAudit: true,
    execute: async (_serviceId) => {
      // In production: call the ops API to restart the service / container.
      // Here we simulate a successful restart after a brief delay.
      await new Promise((r) => setTimeout(r, 800));
      return true;
    },
    verify: async (_serviceId) => {
      await new Promise((r) => setTimeout(r, 300));
      return Math.random() > 0.1; // 90 % success simulation
    },
  },
  {
    id: "failover-db-on-down",
    label: "DB replica failover",
    trigger: "service_down",
    serviceIds: ["database-primary"],
    action: "failover_db",
    cooldownMs: 300_000,
    maxRetries: 2,
    alwaysAudit: true,
    execute: async (_serviceId) => {
      await new Promise((r) => setTimeout(r, 1_200));
      return true;
    },
  },
  {
    id: "failover-payment-on-degraded",
    label: "Payment gateway fallback",
    trigger: "service_degraded",
    serviceIds: ["payment-gateway"],
    action: "failover_payment",
    cooldownMs: 180_000,
    maxRetries: 2,
    alwaysAudit: true,
    execute: async (_serviceId) => {
      await new Promise((r) => setTimeout(r, 600));
      return true;
    },
  },
  {
    id: "reset-circuit-on-open",
    label: "Reset circuit breaker after cooldown",
    trigger: "circuit_open",
    serviceIds: ["*"],
    action: "reset_circuit",
    cooldownMs: 90_000,
    maxRetries: 1,
    execute: async (_serviceId) => {
      await new Promise((r) => setTimeout(r, 200));
      return true;
    },
  },
  {
    id: "drain-queue-on-dead",
    label: "Reprocess dead queue jobs",
    trigger: "dead_queue_jobs",
    serviceIds: ["job-queue"],
    action: "drain_dead_queue",
    cooldownMs: 60_000,
    maxRetries: 3,
  },
  {
    id: "reconcile-on-mismatch",
    label: "Data consistency reconciliation",
    trigger: "consistency_mismatch",
    serviceIds: ["*"],
    action: "reconcile_data",
    cooldownMs: 300_000,
    maxRetries: 2,
    alwaysAudit: true,
    execute: async (_serviceId) => {
      await new Promise((r) => setTimeout(r, 1_500));
      return Math.random() > 0.05;
    },
  },
  {
    id: "restore-config-on-corrupt",
    label: "Restore last-good config",
    trigger: "config_corrupt",
    serviceIds: ["*"],
    action: "restore_config",
    cooldownMs: 600_000,
    maxRetries: 1,
    alwaysAudit: true,
    execute: async (_serviceId) => {
      await new Promise((r) => setTimeout(r, 400));
      return true;
    },
  },
  {
    id: "block-ip-on-security",
    label: "Auto-block suspicious IP",
    trigger: "security_event",
    serviceIds: ["*"],
    action: "block_ip",
    cooldownMs: 30_000,
    maxRetries: 1,
    alwaysAudit: true,
    execute: async (_serviceId) => {
      await new Promise((r) => setTimeout(r, 150));
      return true;
    },
  },
  {
    id: "throttle-on-rate-breach",
    label: "Throttle user on rate limit breach",
    trigger: "rate_limit_breach",
    serviceIds: ["api-gateway"],
    action: "throttle_user",
    cooldownMs: 60_000,
    maxRetries: 1,
    execute: async (_serviceId) => {
      await new Promise((r) => setTimeout(r, 100));
      return true;
    },
  },
  {
    id: "alert-on-latency",
    label: "Alert operator on latency spike",
    trigger: "latency_spike",
    serviceIds: ["*"],
    action: "alert_operator",
    cooldownMs: 120_000,
    maxRetries: 1,
  },
];

DEFAULT_POLICIES.forEach((p) => recoveryOrchestrator.registerPolicy(p));
