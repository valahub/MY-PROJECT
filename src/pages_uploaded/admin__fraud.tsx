
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { AlertTriangle, ShieldAlert, Ban, Eye, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminFraudPage,
  head: () => ({ meta: [{ title: "Fraud & Risk — Admin — ERP Vala" }] }),
});

const fraudAlerts = [
  {
    id: "FR-001",
    type: "Velocity Check",
    customer: "user@suspicious.com",
    riskScore: 92,
    amount: "$1,200.00",
    country: "NG",
    status: "blocked",
    timestamp: "2024-01-18 14:23",
  },
  {
    id: "FR-002",
    type: "Card Testing",
    customer: "test@example.com",
    riskScore: 88,
    amount: "$1.00",
    country: "RU",
    status: "blocked",
    timestamp: "2024-01-18 13:45",
  },
  {
    id: "FR-003",
    type: "Chargeback Pattern",
    customer: "buyer@mail.com",
    riskScore: 75,
    amount: "$450.00",
    country: "US",
    status: "pending",
    timestamp: "2024-01-18 12:10",
  },
  {
    id: "FR-004",
    type: "IP Mismatch",
    customer: "john@corp.com",
    riskScore: 62,
    amount: "$89.00",
    country: "DE",
    status: "pending",
    timestamp: "2024-01-18 11:30",
  },
  {
    id: "FR-005",
    type: "Duplicate Payment",
    customer: "jane@startup.io",
    riskScore: 45,
    amount: "$299.00",
    country: "US",
    status: "cleared",
    timestamp: "2024-01-18 10:05",
  },
];

const blockedIPs = [
  { ip: "192.168.1.100", reason: "Card testing", blockedAt: "2024-01-15", attempts: 47 },
  { ip: "10.0.0.55", reason: "Velocity abuse", blockedAt: "2024-01-14", attempts: 23 },
  { ip: "172.16.0.1", reason: "Chargeback fraud", blockedAt: "2024-01-10", attempts: 12 },
];

function AdminFraudPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfigureRules = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Rules configured successfully");
    } catch (error) {
      toast.error("Failed to configure rules");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleUnblock = async (ip: string) => {
    setUnblockingId(ip);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`IP ${ip} unblocked successfully`);
    } catch (error) {
      toast.error("Failed to unblock IP");
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fraud & Risk</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
          <Button onClick={handleConfigureRules} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Rules"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fraud Alerts (24h)"
          value="12"
          icon={AlertTriangle}
          change="+3 vs yesterday"
          changeType="negative"
        />
        <StatCard
          title="Blocked Transactions"
          value="8"
          icon={Ban}
          change="$4,230 prevented"
          changeType="positive"
        />
        <StatCard
          title="Avg Risk Score"
          value="34"
          icon={ShieldAlert}
          change="Low risk"
          changeType="positive"
        />
        <StatCard
          title="Under Review"
          value="4"
          icon={Eye}
          change="Needs attention"
          changeType="neutral"
        />
      </div>

      <DataTable
        title="Fraud Alerts"
        columns={[
          { header: "Type", accessorKey: "type" },
          { header: "Customer", accessorKey: "customer" },
          {
            header: "Risk Score",
            accessorKey: "riskScore",
            cell: ({ row }) => {
              const score = row.original.riskScore;
              const color =
                score >= 80 ? "text-destructive" : score >= 60 ? "text-accent" : "text-success";
              return <span className={`font-mono font-bold ${color}`}>{score}</span>;
            },
          },
          { header: "Amount", accessorKey: "amount" },
          { header: "Country", accessorKey: "country" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={fraudAlerts}
      />

      <Card>
        <CardHeader>
          <CardTitle>Blocked IPs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {blockedIPs.map((ip) => (
              <div key={ip.ip} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-mono font-medium">{ip.ip}</p>
                  <p className="text-xs text-muted-foreground">
                    {ip.reason} · {ip.attempts} attempts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Blocked {ip.blockedAt}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(ip.ip)}
                    disabled={unblockingId === ip.ip}
                  >
                    {unblockingId === ip.ip ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : null}
                    {unblockingId === ip.ip ? "Unblocking..." : "Unblock"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
