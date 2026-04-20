
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Globe, RefreshCw, CheckCircle, AlertTriangle, Zap, Loader2, Settings, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminRegionSyncPage,
  head: () => ({ meta: [{ title: "Cross-Region Sync — Admin — ERP Vala" }] }),
});

const regions = [
  {
    id: "us-east-1",
    name: "US East (Virginia)",
    role: "Primary",
    syncLag: "0 ms",
    lastSync: "2024-01-18 15:00:02",
    writeOps: "4,200/s",
    status: "healthy",
  },
  {
    id: "eu-west-1",
    name: "EU West (Ireland)",
    role: "Active",
    syncLag: "12 ms",
    lastSync: "2024-01-18 15:00:01",
    writeOps: "1,800/s",
    status: "healthy",
  },
  {
    id: "ap-southeast-1",
    name: "AP Southeast (Singapore)",
    role: "Active",
    syncLag: "28 ms",
    lastSync: "2024-01-18 15:00:00",
    writeOps: "920/s",
    status: "healthy",
  },
  {
    id: "us-west-2",
    name: "US West (Oregon)",
    role: "Standby",
    syncLag: "5 ms",
    lastSync: "2024-01-18 15:00:01",
    writeOps: "0/s",
    status: "standby",
  },
  {
    id: "ap-northeast-1",
    name: "AP Northeast (Tokyo)",
    role: "Active",
    syncLag: "35 ms",
    lastSync: "2024-01-18 14:59:58",
    writeOps: "640/s",
    status: "degraded",
  },
];

const failoverHistory = [
  {
    id: "FO-001",
    fromRegion: "eu-west-1",
    toRegion: "us-east-1",
    reason: "Network partition (>30 s)",
    triggeredAt: "2024-01-10 03:22",
    recoveredAt: "2024-01-10 03:22:08",
    downtime: "0 ms",
    status: "completed",
  },
  {
    id: "FO-002",
    fromRegion: "ap-northeast-1",
    toRegion: "ap-southeast-1",
    reason: "Datacenter power event",
    triggeredAt: "2023-12-05 18:14",
    recoveredAt: "2023-12-05 18:14:12",
    downtime: "0 ms",
    status: "completed",
  },
];

function AdminRegionSyncPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleForceSync = async () => {
    if (!confirm("Are you sure you want to force sync all regions? This may take several minutes.")) {
      return;
    }
    setIsSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Force sync completed successfully");
    } catch (error) {
      toast.error("Failed to force sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfigure = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Replication configuration opened");
    } catch (error) {
      toast.error("Failed to open configuration");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleSimulateFailover = async () => {
    if (!confirm("Are you sure you want to simulate a failover? This will trigger DNS updates.")) {
      return;
    }
    setIsSimulating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Failover simulation completed");
    } catch (error) {
      toast.error("Failed to simulate failover");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Replication report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cross-Region Auto Sync</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleForceSync} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isSyncing ? "Syncing..." : "Force Sync All"}
          </Button>
          <Button onClick={handleConfigure} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Replication"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Regions"
          value="4"
          icon={Globe}
          change="1 standby"
          changeType="positive"
        />
        <StatCard
          title="Max Sync Lag"
          value="35 ms"
          icon={Zap}
          change="Within SLA (< 100 ms)"
          changeType="positive"
        />
        <StatCard
          title="Failovers (12 mo)"
          value="2"
          icon={RefreshCw}
          change="Zero downtime achieved"
          changeType="positive"
        />
        <StatCard
          title="Replication SLA"
          value="99.99%"
          icon={CheckCircle}
          change="Active-active mode"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Replication Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Active-Active</p>
              <p className="text-xs text-muted-foreground">
                All active regions accept reads and writes. Conflict resolution uses last-write-wins
                with vector clocks for consistency.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Conflict Resolution</p>
              <p className="text-xs text-muted-foreground">
                Automatic CRDT-based merge for commutative operations. Non-commutative conflicts are
                flagged for async reconciliation.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Failover Logic</p>
              <p className="text-xs text-muted-foreground">
                Health checks every 5 s. If a region fails 3 consecutive checks, DNS is updated
                within 8 s to route traffic to the next closest healthy region.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Data Sovereignty</p>
              <p className="text-xs text-muted-foreground">
                EU customer data is pinned to EU regions. GDPR residency rules are enforced at the
                replication layer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Region Status"
        columns={[
          { header: "Region", accessorKey: "id" },
          { header: "Name", accessorKey: "name" },
          {
            header: "Role",
            accessorKey: "role",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.role}</code>
            ),
          },
          {
            header: "Sync Lag",
            accessorKey: "syncLag",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.syncLag}</span>,
          },
          { header: "Last Sync", accessorKey: "lastSync" },
          { header: "Write Ops", accessorKey: "writeOps" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={regions}
      />

      <DataTable
        title="Failover History"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "From Region", accessorKey: "fromRegion" },
          { header: "To Region", accessorKey: "toRegion" },
          { header: "Reason", accessorKey: "reason" },
          { header: "Triggered", accessorKey: "triggeredAt" },
          { header: "Recovered", accessorKey: "recoveredAt" },
          { header: "Downtime", accessorKey: "downtime" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={failoverHistory}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleSimulateFailover} disabled={isSimulating}>
          {isSimulating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="mr-2 h-4 w-4" />
          )}
          {isSimulating ? "Simulating..." : "Simulate Failover"}
        </Button>
        <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Replication Report"}
        </Button>
      </div>
    </div>
  );
}
