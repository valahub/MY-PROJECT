
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import {
  recoveryOrchestrator,
  type RecoveryAuditEntry,
  type RecoveryOutcome,
} from "@/lib/recovery-policy";
import { DEFAULT_SERVICES } from "@/lib/health-check";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

({
  component: AdminRecoveryLogPage,
  head: () => ({ meta: [{ title: "Recovery Log — Admin — ERP Vala" }] }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function outcomeVariant(outcome: RecoveryOutcome): string {
  switch (outcome) {
    case "success":
      return "active";
    case "failure":
      return "blocked";
    case "cooldown":
      return "pending";
    case "skipped":
      return "paused";
    case "in_progress":
      return "trialing";
    default:
      return "inactive";
  }
}

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Seed some historical entries for a richer initial view ───────────────────

function makeSeedEntries(): RecoveryAuditEntry[] {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      policyId: "restart-on-down",
      policyLabel: "Auto-restart on service down",
      serviceId: "job-queue",
      trigger: "service_down",
      action: "restart_service",
      outcome: "success",
      attempt: 1,
      durationMs: 812,
      message: "Auto-restart on service down completed successfully",
      timestamp: now - 3_600_000,
    },
    {
      id: "seed-2",
      policyId: "failover-payment-on-degraded",
      policyLabel: "Payment gateway fallback",
      serviceId: "payment-gateway",
      trigger: "service_degraded",
      action: "failover_payment",
      outcome: "success",
      attempt: 1,
      durationMs: 624,
      message: "Payment gateway fallback completed successfully",
      timestamp: now - 7_200_000,
    },
    {
      id: "seed-3",
      policyId: "reconcile-on-mismatch",
      policyLabel: "Data consistency reconciliation",
      serviceId: "database-primary",
      trigger: "consistency_mismatch",
      action: "reconcile_data",
      outcome: "failure",
      attempt: 3,
      durationMs: 4_500,
      message: "Verify failed after execute (attempt 3)",
      timestamp: now - 14_400_000,
    },
    {
      id: "seed-4",
      policyId: "block-ip-on-security",
      policyLabel: "Auto-block suspicious IP",
      serviceId: "api-gateway",
      trigger: "security_event",
      action: "block_ip",
      outcome: "success",
      attempt: 1,
      durationMs: 152,
      message: "Auto-block suspicious IP completed successfully",
      timestamp: now - 21_600_000,
    },
    {
      id: "seed-5",
      policyId: "reset-circuit-on-open",
      policyLabel: "Reset circuit breaker after cooldown",
      serviceId: "api-gateway",
      trigger: "circuit_open",
      action: "reset_circuit",
      outcome: "cooldown",
      attempt: 0,
      durationMs: 0,
      message: "Skipped — in cooldown window",
      timestamp: now - 28_800_000,
    },
  ];
}

// ── Cooldown status for each default policy ───────────────────────────────────

interface PolicyStatus {
  id: string;
  label: string;
  trigger: string;
  action: string;
  cooldownSec: number;
}

const POLICY_DISPLAY: PolicyStatus[] = [
  {
    id: "restart-on-down",
    label: "Auto-restart on service down",
    trigger: "service_down",
    action: "restart_service",
    cooldownSec: 120,
  },
  {
    id: "failover-db-on-down",
    label: "DB replica failover",
    trigger: "service_down",
    action: "failover_db",
    cooldownSec: 300,
  },
  {
    id: "failover-payment-on-degraded",
    label: "Payment gateway fallback",
    trigger: "service_degraded",
    action: "failover_payment",
    cooldownSec: 180,
  },
  {
    id: "reconcile-on-mismatch",
    label: "Data consistency reconciliation",
    trigger: "consistency_mismatch",
    action: "reconcile_data",
    cooldownSec: 300,
  },
  {
    id: "block-ip-on-security",
    label: "Auto-block suspicious IP",
    trigger: "security_event",
    action: "block_ip",
    cooldownSec: 30,
  },
  {
    id: "restore-config-on-corrupt",
    label: "Restore last-good config",
    trigger: "config_corrupt",
    action: "restore_config",
    cooldownSec: 600,
  },
];

// ── Page component ────────────────────────────────────────────────────────────

function AdminRecoveryLogPage() {
  const [entries, setEntries] = useState<RecoveryAuditEntry[]>(makeSeedEntries);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const unsub = recoveryOrchestrator.subscribe((entry) => {
      setEntries((prev) => [entry, ...prev].slice(0, 100));
    });
    // Load any entries that fired before mount
    const existing = recoveryOrchestrator.getAuditLog();
    if (existing.length > 0) {
      setEntries((prev) => [...existing.slice().reverse(), ...prev].slice(0, 100));
    }
    return unsub;
  }, []);

  const handleSimulateAll = useCallback(async () => {
    setTriggering(true);
    // Trigger one event per service to populate the log
    for (const svc of DEFAULT_SERVICES) {
      await recoveryOrchestrator.trigger("latency_spike", svc.id);
    }
    setTriggering(false);
  }, []);

  const successCount = entries.filter((e) => e.outcome === "success").length;
  const failureCount = entries.filter((e) => e.outcome === "failure").length;
  const cooldownCount = entries.filter((e) => e.outcome === "cooldown").length;
  const totalFixed = successCount;
  const successRate =
    totalFixed + failureCount > 0
      ? Math.round((totalFixed / (totalFixed + failureCount)) * 100)
      : 100;

  const avgRecoveryMs =
    entries.filter((e) => e.outcome === "success" && e.durationMs > 0).length > 0
      ? Math.round(
          entries
            .filter((e) => e.outcome === "success" && e.durationMs > 0)
            .reduce((a, e) => a + e.durationMs, 0) /
            entries.filter((e) => e.outcome === "success" && e.durationMs > 0).length,
        )
      : 0;

  const tableRows = entries.map((e) => ({
    ...e,
    timestampStr: new Date(e.timestamp).toLocaleString(),
    durationStr: formatDuration(e.durationMs),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recovery Log</h1>
        <Button variant="outline" size="sm" onClick={handleSimulateAll} disabled={triggering}>
          {triggering ? (
            <>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Simulate Events
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Auto-Fixes Applied"
          value={String(totalFixed)}
          icon={CheckCircle2}
          change="This session"
          changeType="positive"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate} %`}
          icon={Activity}
          change={failureCount > 0 ? `${failureCount} failures` : "All resolved"}
          changeType={failureCount > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Avg Recovery Time"
          value={avgRecoveryMs > 0 ? `${avgRecoveryMs}ms` : "—"}
          icon={Clock}
          change="From trigger to verify"
          changeType="neutral"
        />
        <StatCard
          title="Cooldown Skips"
          value={String(cooldownCount)}
          icon={AlertTriangle}
          change="Policy rate-limited"
          changeType="neutral"
        />
      </div>

      {/* Policy matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Active Recovery Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {POLICY_DISPLAY.map((p) => {
              const lastEntry = entries.find((e) => e.policyId === p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border p-3 gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Trigger: <span className="font-mono">{p.trigger}</span> → Action:{" "}
                      <span className="font-mono">{p.action}</span> · Cooldown:{" "}
                      {p.cooldownSec >= 60 ? `${p.cooldownSec / 60}m` : `${p.cooldownSec}s`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lastEntry ? (
                      <>
                        <StatusBadge status={outcomeVariant(lastEntry.outcome)} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(lastEntry.timestamp).toLocaleTimeString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">No activations yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Audit log table */}
      <DataTable
        title="Full Audit Log"
        columns={[
          { header: "Policy", accessorKey: "policyLabel" },
          {
            header: "Service",
            accessorKey: "serviceId",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.serviceId}</span>,
          },
          {
            header: "Trigger",
            accessorKey: "trigger",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.trigger}</code>
            ),
          },
          {
            header: "Action",
            accessorKey: "action",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.action}</code>
            ),
          },
          {
            header: "Outcome",
            accessorKey: "outcome",
            cell: ({ row }) => (
              <StatusBadge status={outcomeVariant(row.original.outcome as RecoveryOutcome)} />
            ),
          },
          { header: "Duration", accessorKey: "durationStr" },
          { header: "Message", accessorKey: "message" },
          { header: "Time", accessorKey: "timestampStr" },
        ]}
        data={tableRows}
      />

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            Monitor → Alert → Fix → Verify Loop
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">1. Monitor</strong> — The Health Check Engine polls
            each service on its configured heartbeat interval.
          </p>
          <p>
            <strong className="text-foreground">2. Alert</strong> — Status changes trigger the
            recovery orchestrator which matches the event against the policy matrix.
          </p>
          <p>
            <strong className="text-foreground">3. Fix</strong> — The matched policy executes its
            recovery action (restart, failover, reconcile, etc.) with retry/backoff.
          </p>
          <p>
            <strong className="text-foreground">4. Verify</strong> — After each action the
            orchestrator runs the policy's verify function; failure rolls back and re-queues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminRecoveryLogPage;