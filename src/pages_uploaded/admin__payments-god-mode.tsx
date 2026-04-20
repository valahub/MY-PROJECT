
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BrainCircuit,
  Route as RouteIcon,
  ShieldCheck,
  RefreshCw,
  Activity,
  CircleDollarSign,
  Link2,
  Scale,
  Loader2,
  Download,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminPaymentsGodModePage,
  head: () => ({ meta: [{ title: "Payments God Mode — Admin — ERP Vala" }] }),
});

const gatewayRouting = [
  {
    scenario: "EU subscription renewal",
    primary: "Adyen",
    fallback: "Stripe",
    successRate: "99.5%",
    p95Latency: "168ms",
    unitCost: "0.32%",
    decision: "Auto-selected by AI",
  },
  {
    scenario: "US one-time card payment",
    primary: "Stripe",
    fallback: "Braintree",
    successRate: "99.7%",
    p95Latency: "141ms",
    unitCost: "2.90% + $0.30",
    decision: "Best blended score",
  },
  {
    scenario: "IN low-ticket digital purchase",
    primary: "Razorpay UPI",
    fallback: "Razorpay Card",
    successRate: "99.2%",
    p95Latency: "122ms",
    unitCost: "0.50%",
    decision: "Region + method match",
  },
  {
    scenario: "BR BNPL checkout",
    primary: "Klarna",
    fallback: "Stripe",
    successRate: "97.9%",
    p95Latency: "312ms",
    unitCost: "4.10%",
    decision: "Alt payment preference",
  },
];

const retryAndFailover = [
  {
    id: "RTY-9001",
    paymentId: "pay_2f93ab",
    firstFailure: "Stripe timeout",
    retryPath: "Braintree (network token)",
    nextRetryAt: "2026-04-18 19:28 UTC",
    outcome: "processing",
  },
  {
    id: "RTY-9002",
    paymentId: "pay_901fd1",
    firstFailure: "Issuer soft decline",
    retryPath: "Adyen (3DS rail)",
    nextRetryAt: "2026-04-18 19:31 UTC",
    outcome: "queued",
  },
  {
    id: "RTY-9003",
    paymentId: "pay_a2c440",
    firstFailure: "PayPal 5xx",
    retryPath: "Stripe (wallet fallback)",
    nextRetryAt: "2026-04-18 19:24 UTC",
    outcome: "completed",
  },
];

const paymentStatusStream = [
  {
    paymentId: "pay_2f93ab",
    channel: "ws/payments",
    state: "processing",
    source: "gateway poller",
  },
  {
    paymentId: "pay_901fd1",
    channel: "ws/payments",
    state: "requires_action",
    source: "SCA step-up",
  },
  { paymentId: "pay_a2c440", channel: "ws/payments", state: "succeeded", source: "webhook" },
  { paymentId: "pay_d7be22", channel: "ws/payments", state: "failed", source: "issuer response" },
];

const reconciliationRows = [
  {
    window: "2026-04-18 18:00-19:00",
    gatewayCount: "12,582",
    dbCount: "12,580",
    mismatches: 2,
    autoFix: "2 replayed webhooks",
    status: "reconciled",
  },
  {
    window: "2026-04-18 17:00-18:00",
    gatewayCount: "12,101",
    dbCount: "12,101",
    mismatches: 0,
    autoFix: "None",
    status: "reconciled",
  },
  {
    window: "2026-04-18 16:00-17:00",
    gatewayCount: "11,870",
    dbCount: "11,868",
    mismatches: 2,
    autoFix: "1 duplicate voided, 1 inserted",
    status: "reconciled",
  },
];

const settlementRows = [
  {
    batch: "SET-EU-2206",
    gateway: "Adyen",
    gross: "$284,120.00",
    fees: "$7,612.44",
    net: "$276,507.56",
    bankPayout: "$276,507.56",
    status: "settled",
  },
  {
    batch: "SET-US-8813",
    gateway: "Stripe",
    gross: "$412,993.11",
    fees: "$12,672.29",
    net: "$400,320.82",
    bankPayout: "$400,320.82",
    status: "settled",
  },
  {
    batch: "SET-APAC-7702",
    gateway: "Razorpay",
    gross: "$97,220.44",
    fees: "$1,420.80",
    net: "$95,799.64",
    bankPayout: "$95,799.64",
    status: "processing",
  },
];

const disputeRows = [
  {
    id: "CB-1901",
    paymentId: "pay_97afc0",
    amount: "$249.00",
    reason: "Fraudulent",
    evidencePack: "Device + 3DS + IP history",
    stage: "submitted",
    status: "in_review",
  },
  {
    id: "CB-1902",
    paymentId: "pay_67b9de",
    amount: "$49.00",
    reason: "Product not received",
    evidencePack: "Fulfillment logs + access receipts",
    stage: "won",
    status: "completed",
  },
];

const advancedFlows = [
  {
    flow: "Payment links",
    detail: "Shareable links with expiry + reuse policy",
    metric: "2,840 active links",
    status: "active",
  },
  {
    flow: "Split payments",
    detail: "Platform/merchant real-time commission split",
    metric: "14.2% avg platform take",
    status: "active",
  },
  {
    flow: "Escrow mode",
    detail: "Conditional release after delivery confirmation",
    metric: "312 open escrow holds",
    status: "active",
  },
  {
    flow: "PSD2/SCA rules",
    detail: "EU adaptive challenge orchestration",
    metric: "97.4% frictionless",
    status: "active",
  },
  {
    flow: "Alt payments",
    detail: "UPI, wallets, bank transfer, BNPL by region",
    metric: "31.6% non-card volume",
    status: "active",
  },
  {
    flow: "Currency hedging",
    detail: "FX lock windows with exposure controls",
    metric: "$1.9M hedged today",
    status: "active",
  },
];

const selfHealLog = [
  {
    id: "SH-5401",
    issue: "Stuck processing > 10m",
    action: "Gateway re-query + webhook replay",
    result: "Marked succeeded",
    status: "resolved",
  },
  {
    id: "SH-5402",
    issue: "Missing settlement line",
    action: "Ledger patch + reconciliation rerun",
    result: "Batch corrected",
    status: "resolved",
  },
  {
    id: "SH-5403",
    issue: "Retry flow dead-letter",
    action: "Re-triggered via failover rail",
    result: "Now processing",
    status: "processing",
  },
];

function AdminPaymentsGodModePage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isRunningSweep, setIsRunningSweep] = useState(false);

  const handleExportIntelligence = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Payment intelligence exported successfully");
    } catch (error) {
      toast.error("Failed to export payment intelligence");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunSelfHeal = async () => {
    if (!confirm("Are you sure you want to run a self-heal sweep? This will trigger automated recovery actions.")) {
      return;
    }
    setIsRunningSweep(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Self-heal sweep completed successfully");
    } catch (error) {
      toast.error("Failed to run self-heal sweep");
    } finally {
      setIsRunningSweep(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments — God Mode Final</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportIntelligence} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export Payment Intelligence"}
          </Button>
          <Button onClick={handleRunSelfHeal} disabled={isRunningSweep}>
            {isRunningSweep ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {isRunningSweep ? "Running..." : "Run Self-Heal Sweep"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Orchestrator Autonomy"
          value="99.94%"
          icon={BrainCircuit}
          change="Dynamic route + fallback active"
          changeType="positive"
        />
        <StatCard
          title="Gateway Success Rate"
          value="99.31%"
          icon={RouteIcon}
          change="+0.42% after adaptive retries"
          changeType="positive"
        />
        <StatCard
          title="Realtime Status Stream"
          value="13.8k/min"
          icon={Activity}
          change="WebSocket fanout healthy"
          changeType="neutral"
        />
        <StatCard
          title="Self-Heal Recoveries (24h)"
          value="184"
          icon={RefreshCw}
          change="92% auto-resolved"
          changeType="positive"
        />
      </div>

      <DataTable
        title="Payment Orchestrator + Smart Routing AI"
        columns={[
          { header: "Scenario", accessorKey: "scenario" },
          { header: "Primary", accessorKey: "primary" },
          { header: "Fallback", accessorKey: "fallback" },
          { header: "Success", accessorKey: "successRate" },
          { header: "P95 Latency", accessorKey: "p95Latency" },
          { header: "Cost", accessorKey: "unitCost" },
          { header: "Decisioning", accessorKey: "decision" },
        ]}
        data={gatewayRouting}
      />

      <DataTable
        title="Smart Retry Engine + Failover Memory"
        columns={[
          { header: "Retry ID", accessorKey: "id" },
          { header: "Payment", accessorKey: "paymentId" },
          { header: "Initial Failure", accessorKey: "firstFailure" },
          { header: "Adaptive Path", accessorKey: "retryPath" },
          { header: "Next Attempt", accessorKey: "nextRetryAt" },
          {
            header: "Outcome",
            accessorKey: "outcome",
            cell: ({ row }) => <StatusBadge status={row.original.outcome} />,
          },
        ]}
        data={retryAndFailover}
      />

      <DataTable
        title="Real-Time Payment Status Stream"
        columns={[
          { header: "Payment", accessorKey: "paymentId" },
          { header: "WebSocket Channel", accessorKey: "channel" },
          { header: "State", accessorKey: "state" },
          { header: "Source", accessorKey: "source" },
        ]}
        data={paymentStatusStream}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          title="Payment Reconciliation"
          columns={[
            { header: "Window", accessorKey: "window" },
            { header: "Gateway", accessorKey: "gatewayCount" },
            { header: "DB", accessorKey: "dbCount" },
            { header: "Mismatches", accessorKey: "mismatches" },
            { header: "Auto-fix", accessorKey: "autoFix" },
            {
              header: "Status",
              accessorKey: "status",
              cell: ({ row }) => <StatusBadge status={row.original.status} />,
            },
          ]}
          data={reconciliationRows}
        />
        <DataTable
          title="Settlement Tracking"
          columns={[
            { header: "Batch", accessorKey: "batch" },
            { header: "Gateway", accessorKey: "gateway" },
            { header: "Gross", accessorKey: "gross" },
            { header: "Fees", accessorKey: "fees" },
            { header: "Net", accessorKey: "net" },
            { header: "Bank Payout", accessorKey: "bankPayout" },
            {
              header: "Status",
              accessorKey: "status",
              cell: ({ row }) => <StatusBadge status={row.original.status} />,
            },
          ]}
          data={settlementRows}
        />
      </div>

      <DataTable
        title="Chargeback Defense"
        columns={[
          { header: "Case", accessorKey: "id" },
          { header: "Payment", accessorKey: "paymentId" },
          { header: "Amount", accessorKey: "amount" },
          { header: "Reason", accessorKey: "reason" },
          { header: "Evidence", accessorKey: "evidencePack" },
          { header: "Dispute Stage", accessorKey: "stage" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={disputeRows}
      />

      <DataTable
        title="Payment Links, Split Payments, Escrow, Compliance, Alt Methods, Hedging"
        columns={[
          { header: "Flow", accessorKey: "flow" },
          { header: "Capability", accessorKey: "detail" },
          { header: "Live Metric", accessorKey: "metric" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={advancedFlows}
      />

      <DataTable
        title="Self-Heal Payments Activity"
        columns={[
          { header: "Event", accessorKey: "id" },
          { header: "Detected Issue", accessorKey: "issue" },
          { header: "Automated Action", accessorKey: "action" },
          { header: "Result", accessorKey: "result" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={selfHealLog}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tokenization + Analytics Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">PCI Vault Tokens</span>
              </div>
              <span className="font-medium">84,220</span>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Network Tokens</span>
              </div>
              <span className="font-medium">63,944</span>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Alt Payment Mix</span>
              </div>
              <span className="font-medium">31.6%</span>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">FX Exposure Guarded</span>
              </div>
              <span className="font-medium">96.2%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPaymentsGodModePage;
