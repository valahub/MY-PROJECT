
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import {
  consistencyChecker,
  type ConsistencyIssue,
  type ConsistencyReport,
} from "@/lib/consistency-checker";
import { recoveryOrchestrator } from "@/lib/recovery-policy";
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wrench,
  ShieldCheck,
  Loader2,
} from "lucide-react";

({
  component: AdminConsistencyPage,
  head: () => ({ meta: [{ title: "Data Consistency — Admin — ERP Vala" }] }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function severityVariant(severity: string): string {
  switch (severity) {
    case "critical":
      return "critical";
    case "high":
      return "blocked";
    case "medium":
      return "pending";
    case "low":
      return "trialing";
    default:
      return "inactive";
  }
}

function resolveMethodLabel(method: string | null): string {
  if (!method) return "Unresolved";
  return method === "auto" ? "Auto-reconciled" : "Manually resolved";
}

// ── Seed historical issues for rich initial view ──────────────────────────────

function makeSeedIssues(): ConsistencyIssue[] {
  const now = Date.now();
  return [
    {
      id: "seed-issue-1",
      ruleId: "order-payment-check",
      checkType: "order_payment_mismatch",
      severity: "critical",
      entityType: "Order",
      entityId: "ORD-7821",
      description: "Order marked paid but no successful payment record found",
      detectedAt: now - 7_200_000,
      resolved: true,
      resolvedAt: now - 7_150_000,
      resolveMethod: "auto",
      autoFixAttempts: 1,
    },
    {
      id: "seed-issue-2",
      ruleId: "sub-entitlement-check",
      checkType: "subscription_entitlement",
      severity: "high",
      entityType: "Subscription",
      entityId: "SUB-4412",
      description: "Active subscription missing entitlement grant",
      detectedAt: now - 14_400_000,
      resolved: true,
      resolvedAt: now - 14_300_000,
      resolveMethod: "auto",
      autoFixAttempts: 1,
    },
    {
      id: "seed-issue-3",
      ruleId: "license-status-check",
      checkType: "license_status_conflict",
      severity: "high",
      entityType: "License",
      entityId: "LIC-2290",
      description: "License marked active but associated subscription is cancelled",
      detectedAt: now - 28_800_000,
      resolved: false,
      resolvedAt: null,
      resolveMethod: null,
      autoFixAttempts: 0,
    },
    {
      id: "seed-issue-4",
      ruleId: "invoice-balance-check",
      checkType: "invoice_balance_mismatch",
      severity: "medium",
      entityType: "Invoice",
      entityId: "INV-9034",
      description: "Invoice total does not match sum of line items",
      detectedAt: now - 43_200_000,
      resolved: true,
      resolvedAt: now - 43_100_000,
      resolveMethod: "auto",
      autoFixAttempts: 1,
    },
    {
      id: "seed-issue-5",
      ruleId: "webhook-delivery-check",
      checkType: "webhook_delivery_gap",
      severity: "low",
      entityType: "WebhookEvent",
      entityId: "EVT-1183",
      description: "Webhook event fired but no delivery attempt recorded within 5 minutes",
      detectedAt: now - 57_600_000,
      resolved: true,
      resolvedAt: now - 57_500_000,
      resolveMethod: "auto",
      autoFixAttempts: 1,
    },
  ];
}

// ── Page component ────────────────────────────────────────────────────────────

function AdminConsistencyPage() {
  const [issues, setIssues] = useState<ConsistencyIssue[]>(makeSeedIssues);
  const [latestReport, setLatestReport] = useState<ConsistencyReport | null>(null);
  const [running, setRunning] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Load existing issues from checker store on mount
  useEffect(() => {
    const existing = consistencyChecker.getIssues();
    if (existing.length > 0) {
      setIssues((prev) => [...existing, ...prev].slice(0, 200));
    }
    const existingReport = consistencyChecker.getLatestReport();
    if (existingReport) setLatestReport(existingReport);

    const unsub = consistencyChecker.subscribe((newIssues) => {
      setIssues((prev) => [...newIssues, ...prev].slice(0, 200));
      setLatestReport(consistencyChecker.getLatestReport());
    });
    return unsub;
  }, []);

  const runChecks = useCallback(async () => {
    setRunning(true);
    try {
      const report = await consistencyChecker.runChecks();
      setLatestReport(report);
      if (report.totalIssues > 0) {
        await recoveryOrchestrator.trigger("consistency_mismatch", "database-primary");
      }
    } finally {
      setRunning(false);
    }
  }, []);

  const handleResolve = useCallback(async (issueId: string) => {
    setResolvingId(issueId);
    await new Promise((r) => setTimeout(r, 300));
    consistencyChecker.resolveIssue(issueId);
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, resolved: true, resolvedAt: Date.now(), resolveMethod: "manual" }
          : i,
      ),
    );
    setResolvingId(null);
  }, []);

  const totalIssues = issues.length;
  const unresolved = issues.filter((i) => !i.resolved).length;
  const autoResolved = issues.filter((i) => i.resolved && i.resolveMethod === "auto").length;
  const manualResolved = issues.filter((i) => i.resolved && i.resolveMethod === "manual").length;

  const tableRows = issues.map((issue) => ({
    ...issue,
    detectedAtStr: new Date(issue.detectedAt).toLocaleString(),
    resolvedLabel: issue.resolved ? resolveMethodLabel(issue.resolveMethod) : "—",
    statusStr: issue.resolved ? "resolved" : "pending",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Data Consistency</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={runChecks} disabled={running}>
            {running ? (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Run Checks Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Issues Detected"
          value={String(totalIssues)}
          icon={AlertTriangle}
          change={`${unresolved} unresolved`}
          changeType={unresolved > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Auto-Reconciled"
          value={String(autoResolved)}
          icon={CheckCircle2}
          change="By recovery policy"
          changeType="positive"
        />
        <StatCard
          title="Manual Needed"
          value={String(manualResolved)}
          icon={Wrench}
          change="Operator-resolved"
          changeType="neutral"
        />
        <StatCard
          title="Last Check"
          value={latestReport ? new Date(latestReport.startedAt).toLocaleTimeString() : "Never"}
          icon={Clock}
          change={
            latestReport
              ? `${latestReport.totalChecked} check types · ${latestReport.success ? "Passed" : "Error"}`
              : "Run checks to see results"
          }
          changeType={latestReport?.success ? "positive" : "neutral"}
        />
      </div>

      {/* Check types summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Consistency Check Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                type: "order_payment_mismatch",
                label: "Order ↔ Payment",
                description: "Orders marked paid with no matching payment record",
              },
              {
                type: "subscription_entitlement",
                label: "Subscription ↔ Entitlement",
                description: "Active subscriptions missing entitlement grants",
              },
              {
                type: "license_status_conflict",
                label: "License ↔ Subscription",
                description: "Active licenses on cancelled subscriptions",
              },
              {
                type: "invoice_balance_mismatch",
                label: "Invoice Balance",
                description: "Invoice total ≠ sum of line items",
              },
              {
                type: "webhook_delivery_gap",
                label: "Webhook Delivery",
                description: "Events fired with no delivery record within 5 min",
              },
            ].map((ct) => {
              const typeIssues = issues.filter((i) => i.checkType === ct.type);
              const typeUnresolved = typeIssues.filter((i) => !i.resolved).length;
              return (
                <div key={ct.type} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{ct.label}</p>
                    {typeUnresolved > 0 ? (
                      <StatusBadge status="pending" />
                    ) : (
                      <StatusBadge status="active" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{ct.description}</p>
                  {typeIssues.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {typeIssues.length} found · {typeIssues.length - typeUnresolved} resolved
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Issues table */}
      <DataTable
        title="Issue Log"
        columns={[
          {
            header: "Severity",
            accessorKey: "severity",
            cell: ({ row }) => <StatusBadge status={severityVariant(row.original.severity)} />,
          },
          {
            header: "Entity",
            accessorKey: "entityId",
            cell: ({ row }) => (
              <div>
                <p className="font-mono text-xs font-medium">{row.original.entityId}</p>
                <p className="text-xs text-muted-foreground">{row.original.entityType}</p>
              </div>
            ),
          },
          {
            header: "Type",
            accessorKey: "checkType",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {row.original.checkType}
              </code>
            ),
          },
          { header: "Description", accessorKey: "description" },
          { header: "Detected", accessorKey: "detectedAtStr" },
          {
            header: "Status",
            accessorKey: "statusStr",
            cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={row.original.statusStr} />
                {row.original.resolved && (
                  <span className="text-xs text-muted-foreground">
                    {row.original.resolvedLabel}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: "Action",
            accessorKey: "id",
            cell: ({ row }) =>
              !row.original.resolved ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 px-2"
                  disabled={resolvingId === row.original.id}
                  onClick={() => handleResolve(row.original.id)}
                >
                  {resolvingId === row.original.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {resolvingId === row.original.id ? "Resolving…" : "Resolve"}
                </Button>
              ) : null,
          },
        ]}
        data={tableRows}
      />

      {/* Integrity check info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post-Restore Integrity Checks</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            After any backup restore, all five check types run automatically. Results are published
            to this page and to the Recovery Log.
          </p>
          <p>
            Auto-reconcile resolves <strong className="text-foreground">order/payment</strong>,{" "}
            <strong className="text-foreground">subscription/entitlement</strong>,{" "}
            <strong className="text-foreground">invoice balance</strong>, and{" "}
            <strong className="text-foreground">webhook gap</strong> issues. License conflicts
            require manual review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default severityVariant;
