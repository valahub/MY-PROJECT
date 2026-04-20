
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertTriangle, CheckCircle, Clock, Shield, Loader2, Settings, FileText, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminAutoRollbackPage,
  head: () => ({ meta: [{ title: "Auto Rollback — Admin — ERP Vala" }] }),
});

const rollbackEvents = [
  {
    id: "RB-001",
    trigger: "Error rate spike (>5%)",
    target: "billing-api v2.4.1",
    rolledBackTo: "billing-api v2.4.0",
    detectedAt: "2024-01-18 11:22",
    completedAt: "2024-01-18 11:22:18",
    type: "code",
    status: "completed",
  },
  {
    id: "RB-002",
    trigger: "DB query latency >2 s",
    target: "schema migration 0048",
    rolledBackTo: "schema migration 0047",
    detectedAt: "2024-01-17 08:44",
    completedAt: "2024-01-17 08:44:51",
    type: "db",
    status: "completed",
  },
  {
    id: "RB-003",
    trigger: "Anomalous config diff",
    target: "rate-limit policy v5",
    rolledBackTo: "rate-limit policy v4",
    detectedAt: "2024-01-16 14:05",
    completedAt: "2024-01-16 14:05:09",
    type: "config",
    status: "completed",
  },
  {
    id: "RB-004",
    trigger: "Memory usage >90%",
    target: "webhook-dispatcher v1.9.2",
    rolledBackTo: "webhook-dispatcher v1.9.1",
    detectedAt: "2024-01-15 22:10",
    completedAt: "—",
    type: "code",
    status: "in-progress",
  },
  {
    id: "RB-005",
    trigger: "Payment success rate <95%",
    target: "checkout-api v3.1.0",
    rolledBackTo: "checkout-api v3.0.5",
    detectedAt: "2024-01-14 18:30",
    completedAt: "2024-01-14 18:30:23",
    type: "code",
    status: "completed",
  },
];

const thresholds = [
  { metric: "Error rate", warn: "2%", rollback: "5%", window: "5 min" },
  { metric: "P99 latency", warn: "800 ms", rollback: "2,000 ms", window: "2 min" },
  { metric: "Payment success rate", warn: "97%", rollback: "95%", window: "10 min" },
  { metric: "Memory usage", warn: "75%", rollback: "90%", window: "3 min" },
  { metric: "CPU usage", warn: "70%", rollback: "85%", window: "5 min" },
];

function AdminAutoRollbackPage() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isViewingSignals, setIsViewingSignals] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleConfigureThresholds = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Thresholds configured successfully");
    } catch (error) {
      toast.error("Failed to configure thresholds");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleManualRollback = async () => {
    if (!confirm("Are you sure you want to trigger a manual rollback?")) {
      return;
    }
    setIsRollingBack(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Manual rollback triggered successfully");
    } catch (error) {
      toast.error("Failed to trigger rollback");
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleViewSignals = async () => {
    setIsViewingSignals(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Anomaly signals loaded");
    } catch (error) {
      toast.error("Failed to load signals");
    } finally {
      setIsViewingSignals(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Rollback report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Auto Rollback Intelligence</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleConfigureThresholds} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Thresholds"}
          </Button>
          <Button variant="outline" onClick={handleManualRollback} disabled={isRollingBack}>
            {isRollingBack ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isRollingBack ? "Rolling back..." : "Manual Rollback"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Rollbacks (30d)"
          value="5"
          icon={RotateCcw}
          change="Code · Config · DB"
          changeType="neutral"
        />
        <StatCard
          title="Avg Recovery Time"
          value="18 s"
          icon={Clock}
          change="-4 s vs last month"
          changeType="positive"
        />
        <StatCard
          title="Incidents Prevented"
          value="5"
          icon={Shield}
          change="Zero-downtime recoveries"
          changeType="positive"
        />
        <StatCard
          title="False Positives"
          value="0"
          icon={CheckCircle}
          change="All triggers valid"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rollback Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Code Rollback</p>
              <p className="text-xs text-muted-foreground">
                Deploys the previous healthy container image when error-rate or latency thresholds
                are breached. Completes within seconds via blue/green swap.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Config Rollback</p>
              <p className="text-xs text-muted-foreground">
                Reverts feature flags, rate-limit policies, and environment variables to the last
                known-good snapshot stored in Global Config Sync.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">DB Rollback</p>
              <p className="text-xs text-muted-foreground">
                Re-applies the previous migration state using point-in-time recovery. Triggers only
                when anomalous query patterns or data corruption is detected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rollback Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Metric</th>
                  <th className="pb-2 font-medium">Warn</th>
                  <th className="pb-2 font-medium">Rollback Trigger</th>
                  <th className="pb-2 font-medium">Window</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {thresholds.map((t) => (
                  <tr key={t.metric} className="py-2">
                    <td className="py-2 font-medium">{t.metric}</td>
                    <td className="py-2 text-accent">{t.warn}</td>
                    <td className="py-2 text-destructive">{t.rollback}</td>
                    <td className="py-2 text-muted-foreground">{t.window}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Rollback History"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Trigger", accessorKey: "trigger" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.type}</code>
            ),
          },
          { header: "Rolled Back To", accessorKey: "rolledBackTo" },
          { header: "Detected", accessorKey: "detectedAt" },
          { header: "Completed", accessorKey: "completedAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={rollbackEvents}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleViewSignals} disabled={isViewingSignals}>
          {isViewingSignals ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {isViewingSignals ? "Loading..." : "View Anomaly Signals"}
        </Button>
        <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Rollback Report"}
        </Button>
      </div>
    </div>
  );
}

export default AdminAutoRollbackPage;
