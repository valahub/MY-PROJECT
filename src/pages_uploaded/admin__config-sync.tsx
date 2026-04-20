
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Settings2, RefreshCw, Clock, CheckCircle, AlertTriangle, Loader2, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminConfigSyncPage,
  head: () => ({ meta: [{ title: "Global Config Sync — Admin — ERP Vala" }] }),
});

const configChanges = [
  {
    id: "CFG-001",
    key: "payments.retry_max_attempts",
    oldValue: "3",
    newValue: "5",
    changedBy: "admin@erpvala.com",
    propagatedTo: "12/12 nodes",
    propagationTime: "210 ms",
    changedAt: "2024-01-18 10:00",
    status: "synced",
  },
  {
    id: "CFG-002",
    key: "fraud.block_score_threshold",
    oldValue: "40",
    newValue: "30",
    changedBy: "security@erpvala.com",
    propagatedTo: "12/12 nodes",
    propagationTime: "185 ms",
    changedAt: "2024-01-18 09:15",
    status: "synced",
  },
  {
    id: "CFG-003",
    key: "feature.new_checkout_flow",
    oldValue: "false",
    newValue: "true",
    changedBy: "admin@erpvala.com",
    propagatedTo: "11/12 nodes",
    propagationTime: "—",
    changedAt: "2024-01-18 08:30",
    status: "partial",
  },
  {
    id: "CFG-004",
    key: "email.smtp_host",
    oldValue: "smtp.sendgrid.net",
    newValue: "smtp2.sendgrid.net",
    changedBy: "ops@erpvala.com",
    propagatedTo: "12/12 nodes",
    propagationTime: "198 ms",
    changedAt: "2024-01-17 16:00",
    status: "synced",
  },
  {
    id: "CFG-005",
    key: "rate_limit.api.default_rpm",
    oldValue: "1000",
    newValue: "2000",
    changedBy: "admin@erpvala.com",
    propagatedTo: "12/12 nodes",
    propagationTime: "220 ms",
    changedAt: "2024-01-16 11:45",
    status: "synced",
  },
];

const nodes = [
  { node: "api-us-east-1a", version: "v112", lastPull: "2024-01-18 15:00:01", status: "synced" },
  { node: "api-us-east-1b", version: "v112", lastPull: "2024-01-18 15:00:01", status: "synced" },
  { node: "api-eu-west-1a", version: "v112", lastPull: "2024-01-18 15:00:00", status: "synced" },
  { node: "api-eu-west-1b", version: "v112", lastPull: "2024-01-18 15:00:00", status: "synced" },
  { node: "api-ap-sea-1a", version: "v111", lastPull: "2024-01-18 14:58:10", status: "stale" },
  { node: "worker-us-1", version: "v112", lastPull: "2024-01-18 15:00:01", status: "synced" },
];

function AdminConfigSyncPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingStale, setIsViewingStale] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("All nodes synced successfully");
    } catch (error) {
      toast.error("Failed to sync nodes");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditConfig = async () => {
    setIsEditing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Config editor opened");
    } catch (error) {
      toast.error("Failed to open config editor");
    } finally {
      setIsEditing(false);
    }
  };

  const handleViewStale = async () => {
    setIsViewingStale(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Stale nodes loaded");
    } catch (error) {
      toast.error("Failed to load stale nodes");
    } finally {
      setIsViewingStale(false);
    }
  };

  const handleExportHistory = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Config history exported successfully");
    } catch (error) {
      toast.error("Failed to export config history");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Global Config Sync</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleForceSync} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isSyncing ? "Syncing..." : "Force Sync All Nodes"}
          </Button>
          <Button onClick={handleEditConfig} disabled={isEditing}>
            {isEditing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings2 className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Opening..." : "Edit Config"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Config Version"
          value="v112"
          icon={Settings2}
          change="Latest deployed"
          changeType="positive"
        />
        <StatCard
          title="Nodes in Sync"
          value="11/12"
          icon={CheckCircle}
          change="1 stale — auto-retrying"
          changeType="neutral"
        />
        <StatCard
          title="Avg Propagation"
          value="203 ms"
          icon={Clock}
          change="Across all regions"
          changeType="positive"
        />
        <StatCard
          title="Changes (30d)"
          value="28"
          icon={RefreshCw}
          change="All audited"
          changeType="neutral"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Propagation Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Central Config Store</p>
              <p className="text-xs text-muted-foreground">
                All configuration lives in a versioned, strongly-consistent key-value store. Every
                change creates a new immutable version with a full diff and author audit trail.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Push + Pull Sync</p>
              <p className="text-xs text-muted-foreground">
                New versions are pushed to all nodes via a fan-out pub/sub channel. Nodes also poll
                every 30 s as a fallback to catch missed push events.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Rollback Support</p>
              <p className="text-xs text-muted-foreground">
                Any version can be instantly re-promoted as the current config, propagating to all
                nodes with the same sub-second latency as a normal change.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Recent Config Changes"
        columns={[
          { header: "ID", accessorKey: "id" },
          {
            header: "Key",
            accessorKey: "key",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.key}</code>
            ),
          },
          { header: "Old Value", accessorKey: "oldValue" },
          { header: "New Value", accessorKey: "newValue" },
          { header: "Changed By", accessorKey: "changedBy" },
          { header: "Propagated To", accessorKey: "propagatedTo" },
          { header: "Propagation Time", accessorKey: "propagationTime" },
          { header: "Changed At", accessorKey: "changedAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={configChanges}
      />

      <DataTable
        title="Node Sync Status"
        columns={[
          { header: "Node", accessorKey: "node" },
          { header: "Config Version", accessorKey: "version" },
          { header: "Last Pull", accessorKey: "lastPull" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={nodes}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleViewStale} disabled={isViewingStale}>
          {isViewingStale ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {isViewingStale ? "Loading..." : "View Stale Nodes"}
        </Button>
        <Button variant="outline" onClick={handleExportHistory} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Config History"}
        </Button>
      </div>
    </div>
  );
}
