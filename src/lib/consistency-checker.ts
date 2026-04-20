// Consistency Checker
// Detects mismatches between logically-coupled records (e.g. orders with no
// matching payment, subscriptions without entitlements) and optionally
// auto-reconciles them.
//
// Check types:
//   order_payment_mismatch     — order shows paid but no successful payment record
//   subscription_entitlement   — active subscription but missing entitlement grant
//   license_status_conflict    — license active but subscription cancelled
//   invoice_balance_mismatch   — invoice total ≠ sum of line items
//   webhook_delivery_gap       — event fired but no delivery record within 5 min

export type ConsistencyCheckType =
  | "order_payment_mismatch"
  | "subscription_entitlement"
  | "license_status_conflict"
  | "invoice_balance_mismatch"
  | "webhook_delivery_gap";

export type ConsistencyIssueSeverity = "critical" | "high" | "medium" | "low";

export type ReconcileStrategy = "auto" | "manual" | "flag_only";

export interface ConsistencyRule {
  id: string;
  label: string;
  checkType: ConsistencyCheckType;
  severity: ConsistencyIssueSeverity;
  /** Whether to attempt automatic reconciliation on mismatch */
  reconcileStrategy: ReconcileStrategy;
  /** How to fix the issue (runs when reconcileStrategy = "auto") */
  reconcile?: (issue: ConsistencyIssue) => Promise<boolean>;
}

export interface ConsistencyIssue {
  id: string;
  ruleId: string;
  checkType: ConsistencyCheckType;
  severity: ConsistencyIssueSeverity;
  entityType: string;
  entityId: string;
  description: string;
  detectedAt: number;
  resolved: boolean;
  resolvedAt: number | null;
  resolveMethod: "auto" | "manual" | null;
  autoFixAttempts: number;
}

export interface ConsistencyReport {
  id: string;
  startedAt: number;
  completedAt: number | null;
  /** Issues found in this run */
  issues: ConsistencyIssue[];
  /** Counts */
  totalChecked: number;
  totalIssues: number;
  autoResolved: number;
  manualNeeded: number;
  /** Whether the run completed without error */
  success: boolean;
  errorMessage: string | null;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const ISSUE_CAP = 200;

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Simulated dataset ─────────────────────────────────────────────────────────

// In production these would be real API calls.  Here we produce plausible mock
// data so the UI is fully functional without a backend.

async function simulateCheckOrderPayments(): Promise<ConsistencyIssue[]> {
  await new Promise((r) => setTimeout(r, 120));
  // Simulate 0-2 mismatches per run
  const count = Math.random() < 0.3 ? Math.ceil(Math.random() * 2) : 0;
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    ruleId: "order-payment-check",
    checkType: "order_payment_mismatch" as ConsistencyCheckType,
    severity: "critical" as ConsistencyIssueSeverity,
    entityType: "Order",
    entityId: `ORD-${1000 + Math.floor(Math.random() * 9000)}`,
    description: `Order #${i + 1} marked paid but no successful payment record found`,
    detectedAt: Date.now(),
    resolved: false,
    resolvedAt: null,
    resolveMethod: null,
    autoFixAttempts: 0,
  }));
}

async function simulateCheckSubscriptionEntitlements(): Promise<ConsistencyIssue[]> {
  await new Promise((r) => setTimeout(r, 90));
  const count = Math.random() < 0.25 ? Math.ceil(Math.random() * 3) : 0;
  return Array.from({ length: count }, () => ({
    id: generateId(),
    ruleId: "sub-entitlement-check",
    checkType: "subscription_entitlement" as ConsistencyCheckType,
    severity: "high" as ConsistencyIssueSeverity,
    entityType: "Subscription",
    entityId: `SUB-${1000 + Math.floor(Math.random() * 9000)}`,
    description: "Active subscription missing entitlement grant",
    detectedAt: Date.now(),
    resolved: false,
    resolvedAt: null,
    resolveMethod: null,
    autoFixAttempts: 0,
  }));
}

async function simulateCheckLicenses(): Promise<ConsistencyIssue[]> {
  await new Promise((r) => setTimeout(r, 80));
  const count = Math.random() < 0.2 ? 1 : 0;
  return Array.from({ length: count }, () => ({
    id: generateId(),
    ruleId: "license-status-check",
    checkType: "license_status_conflict" as ConsistencyCheckType,
    severity: "high" as ConsistencyIssueSeverity,
    entityType: "License",
    entityId: `LIC-${1000 + Math.floor(Math.random() * 9000)}`,
    description: "License marked active but associated subscription is cancelled",
    detectedAt: Date.now(),
    resolved: false,
    resolvedAt: null,
    resolveMethod: null,
    autoFixAttempts: 0,
  }));
}

async function simulateCheckInvoices(): Promise<ConsistencyIssue[]> {
  await new Promise((r) => setTimeout(r, 70));
  const count = Math.random() < 0.15 ? 1 : 0;
  return Array.from({ length: count }, () => ({
    id: generateId(),
    ruleId: "invoice-balance-check",
    checkType: "invoice_balance_mismatch" as ConsistencyCheckType,
    severity: "medium" as ConsistencyIssueSeverity,
    entityType: "Invoice",
    entityId: `INV-${1000 + Math.floor(Math.random() * 9000)}`,
    description: "Invoice total does not match sum of line items",
    detectedAt: Date.now(),
    resolved: false,
    resolvedAt: null,
    resolveMethod: null,
    autoFixAttempts: 0,
  }));
}

async function simulateCheckWebhooks(): Promise<ConsistencyIssue[]> {
  await new Promise((r) => setTimeout(r, 60));
  const count = Math.random() < 0.2 ? Math.ceil(Math.random() * 2) : 0;
  return Array.from({ length: count }, () => ({
    id: generateId(),
    ruleId: "webhook-delivery-check",
    checkType: "webhook_delivery_gap" as ConsistencyCheckType,
    severity: "low" as ConsistencyIssueSeverity,
    entityType: "WebhookEvent",
    entityId: `EVT-${1000 + Math.floor(Math.random() * 9000)}`,
    description: "Webhook event fired but no delivery attempt recorded within 5 minutes",
    detectedAt: Date.now(),
    resolved: false,
    resolvedAt: null,
    resolveMethod: null,
    autoFixAttempts: 0,
  }));
}

// ── Checker class ──────────────────────────────────────────────────────────────

class ConsistencyChecker {
  private readonly rules = new Map<string, ConsistencyRule>();
  private readonly issues: ConsistencyIssue[] = [];
  private readonly reports: ConsistencyReport[] = [];
  private readonly listeners: Array<(issues: ConsistencyIssue[]) => void> = [];

  constructor() {
    this.registerDefaults();
  }

  // ── Registration ───────────────────────────────────────────────────────────

  registerRule(rule: ConsistencyRule): void {
    this.rules.set(rule.id, rule);
  }

  // ── Run a full check cycle ─────────────────────────────────────────────────

  async runChecks(): Promise<ConsistencyReport> {
    const report: ConsistencyReport = {
      id: generateId(),
      startedAt: Date.now(),
      completedAt: null,
      issues: [],
      totalChecked: 0,
      totalIssues: 0,
      autoResolved: 0,
      manualNeeded: 0,
      success: false,
      errorMessage: null,
    };

    try {
      const [orders, subs, licenses, invoices, webhooks] = await Promise.all([
        simulateCheckOrderPayments(),
        simulateCheckSubscriptionEntitlements(),
        simulateCheckLicenses(),
        simulateCheckInvoices(),
        simulateCheckWebhooks(),
      ]);

      const allIssues = [...orders, ...subs, ...licenses, ...invoices, ...webhooks];
      report.totalChecked = 5; // number of check types run
      report.totalIssues = allIssues.length;

      // Auto-reconcile where strategy allows
      for (const issue of allIssues) {
        const rule = this.rules.get(issue.ruleId);
        if (rule?.reconcileStrategy === "auto" && rule.reconcile) {
          try {
            issue.autoFixAttempts++;
            const fixed = await rule.reconcile(issue);
            if (fixed) {
              issue.resolved = true;
              issue.resolvedAt = Date.now();
              issue.resolveMethod = "auto";
              report.autoResolved++;
            } else {
              report.manualNeeded++;
            }
          } catch {
            report.manualNeeded++;
          }
        } else {
          report.manualNeeded++;
        }

        // Store in rolling issues list
        this.issues.push(issue);
        if (this.issues.length > ISSUE_CAP) this.issues.shift();
      }

      report.issues = allIssues;
      report.success = true;
    } catch (err) {
      report.errorMessage = err instanceof Error ? err.message : String(err);
    }

    report.completedAt = Date.now();
    this.reports.push(report);
    if (this.reports.length > 50) this.reports.shift();

    this.notify(report.issues);
    return report;
  }

  // ── Manual resolution ──────────────────────────────────────────────────────

  resolveIssue(issueId: string): boolean {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue || issue.resolved) return false;
    issue.resolved = true;
    issue.resolvedAt = Date.now();
    issue.resolveMethod = "manual";
    return true;
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  getIssues(onlyUnresolved = false): ConsistencyIssue[] {
    return onlyUnresolved ? this.issues.filter((i) => !i.resolved) : [...this.issues];
  }

  getReports(): ConsistencyReport[] {
    return [...this.reports];
  }

  getLatestReport(): ConsistencyReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  // ── Pub/Sub ────────────────────────────────────────────────────────────────

  subscribe(listener: (issues: ConsistencyIssue[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  private notify(newIssues: ConsistencyIssue[]): void {
    this.listeners.forEach((l) => {
      try {
        l(newIssues);
      } catch {
        // ignore
      }
    });
  }

  // ── Default rules ──────────────────────────────────────────────────────────

  private registerDefaults(): void {
    const defaults: ConsistencyRule[] = [
      {
        id: "order-payment-check",
        label: "Order ↔ Payment sync",
        checkType: "order_payment_mismatch",
        severity: "critical",
        reconcileStrategy: "auto",
        reconcile: async (_issue) => {
          await new Promise((r) => setTimeout(r, 200));
          return Math.random() > 0.1;
        },
      },
      {
        id: "sub-entitlement-check",
        label: "Subscription ↔ Entitlement sync",
        checkType: "subscription_entitlement",
        severity: "high",
        reconcileStrategy: "auto",
        reconcile: async (_issue) => {
          await new Promise((r) => setTimeout(r, 150));
          return Math.random() > 0.05;
        },
      },
      {
        id: "license-status-check",
        label: "License ↔ Subscription status",
        checkType: "license_status_conflict",
        severity: "high",
        reconcileStrategy: "manual",
      },
      {
        id: "invoice-balance-check",
        label: "Invoice balance integrity",
        checkType: "invoice_balance_mismatch",
        severity: "medium",
        reconcileStrategy: "auto",
        reconcile: async (_issue) => {
          await new Promise((r) => setTimeout(r, 100));
          return true;
        },
      },
      {
        id: "webhook-delivery-check",
        label: "Webhook delivery gap",
        checkType: "webhook_delivery_gap",
        severity: "low",
        reconcileStrategy: "auto",
        reconcile: async (_issue) => {
          await new Promise((r) => setTimeout(r, 80));
          return true;
        },
      },
    ];

    defaults.forEach((r) => this.registerRule(r));
  }
}

export const consistencyChecker = new ConsistencyChecker();
