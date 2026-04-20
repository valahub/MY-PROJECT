
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, AlertTriangle, TrendingDown, Lock, Loader2, Settings, Download, Eye, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminTrustScoresPage,
  head: () => ({ meta: [{ title: "Trust Score System — Admin — ERP Vala" }] }),
});

const trustEvents = [
  {
    id: "TS-001",
    subject: "user:alice@corp.com",
    type: "user",
    scoreBefore: 88,
    scoreAfter: 72,
    reason: "Login from new device + country change",
    timestamp: "2024-01-18 14:10",
    permissionChange: "MFA required",
    status: "flagged",
  },
  {
    id: "TS-002",
    subject: "device:iph-8f3a2",
    type: "device",
    scoreBefore: 60,
    scoreAfter: 20,
    reason: "3 failed 2FA attempts in 5 min",
    timestamp: "2024-01-18 13:45",
    permissionChange: "Blocked",
    status: "blocked",
  },
  {
    id: "TS-003",
    subject: "user:bob@startup.io",
    type: "user",
    scoreBefore: 45,
    scoreAfter: 65,
    reason: "Completed identity verification",
    timestamp: "2024-01-18 12:00",
    permissionChange: "Elevated to standard",
    status: "active",
  },
  {
    id: "TS-004",
    subject: "user:carol@example.com",
    type: "user",
    scoreBefore: 90,
    scoreAfter: 85,
    reason: "API key used from unusual IP",
    timestamp: "2024-01-18 09:30",
    permissionChange: "API throttled",
    status: "flagged",
  },
  {
    id: "TS-005",
    subject: "device:andr-c1d9f",
    type: "device",
    scoreBefore: 80,
    scoreAfter: 80,
    reason: "Regular trusted device, no change",
    timestamp: "2024-01-18 08:00",
    permissionChange: "None",
    status: "trusted",
  },
];

const scoreBands = [
  { band: "90–100", label: "Fully Trusted", permissions: "Full access, no friction", count: 8420 },
  {
    band: "70–89",
    label: "Trusted",
    permissions: "Full access, soft MFA nudge",
    count: 6130,
  },
  {
    band: "50–69",
    label: "Standard",
    permissions: "MFA required for sensitive actions",
    count: 2840,
  },
  {
    band: "30–49",
    label: "Restricted",
    permissions: "Read-only + manual review for writes",
    count: 540,
  },
  {
    band: "0–29",
    label: "High Risk",
    permissions: "Blocked — requires re-verification",
    count: 84,
  },
];

function AdminTrustScoresPage() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isViewingHighRisk, setIsViewingHighRisk] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleConfigureRules = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Scoring rules configured successfully");
    } catch (error) {
      toast.error("Failed to configure scoring rules");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Trust report exported successfully");
    } catch (error) {
      toast.error("Failed to export trust report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewHighRisk = async () => {
    setIsViewingHighRisk(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("High-risk users loaded");
    } catch (error) {
      toast.error("Failed to load high-risk users");
    } finally {
      setIsViewingHighRisk(false);
    }
  };

  const handleRecalculate = async () => {
    if (!confirm("Are you sure you want to recalculate all scores? This may take several minutes.")) {
      return;
    }
    setIsRecalculating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Bulk recalculation completed successfully");
    } catch (error) {
      toast.error("Failed to recalculate scores");
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trust Score System</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleConfigureRules} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Scoring Rules"}
          </Button>
          <Button onClick={handleExportReport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export Trust Report"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Users Scored"
          value="18,014"
          icon={Users}
          change="Active user base"
          changeType="neutral"
        />
        <StatCard
          title="High-Risk Users"
          value="84"
          icon={AlertTriangle}
          change="Score < 30"
          changeType="negative"
        />
        <StatCard
          title="Blocked Devices"
          value="12"
          icon={Lock}
          change="Auto-blocked today"
          changeType="negative"
        />
        <StatCard
          title="Avg Trust Score"
          value="81"
          icon={ShieldCheck}
          change="+2 vs last week"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { signal: "Known device", impact: "+15" },
              { signal: "Usual login location", impact: "+10" },
              { signal: "MFA enabled & verified", impact: "+20" },
              { signal: "Identity verified (KYC)", impact: "+25" },
              { signal: "New device / country", impact: "−15" },
              { signal: "Failed auth attempts", impact: "−20 per attempt" },
              { signal: "Unusual purchase velocity", impact: "−30" },
              { signal: "Account age > 12 months", impact: "+5" },
              { signal: "Chargeback history", impact: "−40" },
            ].map((s) => (
              <div
                key={s.signal}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="text-sm">{s.signal}</span>
                <span
                  className={`font-mono font-bold text-sm ${s.impact.startsWith("+") ? "text-success" : "text-destructive"}`}
                >
                  {s.impact}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Bands &amp; Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Label</th>
                  <th className="pb-2 font-medium">Permissions</th>
                  <th className="pb-2 font-medium">Users</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scoreBands.map((b) => (
                  <tr key={b.band}>
                    <td className="py-2 font-mono font-medium">{b.band}</td>
                    <td className="py-2">{b.label}</td>
                    <td className="py-2 text-muted-foreground">{b.permissions}</td>
                    <td className="py-2 font-medium">{b.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Recent Score Changes"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Subject", accessorKey: "subject" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.type}</code>
            ),
          },
          { header: "Before", accessorKey: "scoreBefore" },
          {
            header: "After",
            accessorKey: "scoreAfter",
            cell: ({ row }) => {
              const after = row.original.scoreAfter;
              const before = row.original.scoreBefore;
              const color =
                after < before
                  ? "text-destructive"
                  : after > before
                    ? "text-success"
                    : "text-muted-foreground";
              return <span className={`font-mono font-bold ${color}`}>{after}</span>;
            },
          },
          { header: "Reason", accessorKey: "reason" },
          { header: "Permission Change", accessorKey: "permissionChange" },
          { header: "Time", accessorKey: "timestamp" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={trustEvents}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleViewHighRisk} disabled={isViewingHighRisk}>
          {isViewingHighRisk ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {isViewingHighRisk ? "Loading..." : "View High-Risk Users"}
        </Button>
        <Button variant="outline" onClick={handleRecalculate} disabled={isRecalculating}>
          {isRecalculating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isRecalculating ? "Recalculating..." : "Bulk Recalculate Scores"}
        </Button>
      </div>
    </div>
  );
}
