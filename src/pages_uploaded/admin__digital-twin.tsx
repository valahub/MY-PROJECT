
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Copy, Play, CheckCircle, AlertTriangle, Clock, RefreshCw, Loader2, Plus, Settings, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminDigitalTwinPage,
  head: () => ({ meta: [{ title: "Digital Twin — Admin — ERP Vala" }] }),
});

const simulations = [
  {
    id: "SIM-001",
    change: "Subscription pricing +20%",
    initiatedBy: "admin@erpvala.com",
    startedAt: "2024-01-18 09:00",
    duration: "4m 12s",
    impactedServices: 7,
    status: "passed",
  },
  {
    id: "SIM-002",
    change: "Payment gateway migration",
    initiatedBy: "ops@erpvala.com",
    startedAt: "2024-01-17 14:30",
    duration: "11m 02s",
    impactedServices: 14,
    status: "failed",
  },
  {
    id: "SIM-003",
    change: "Database schema v3.4",
    initiatedBy: "admin@erpvala.com",
    startedAt: "2024-01-17 08:00",
    duration: "6m 45s",
    impactedServices: 5,
    status: "passed",
  },
  {
    id: "SIM-004",
    change: "Rate-limit policy update",
    initiatedBy: "admin@erpvala.com",
    startedAt: "2024-01-16 11:15",
    duration: "1m 55s",
    impactedServices: 3,
    status: "passed",
  },
  {
    id: "SIM-005",
    change: "Webhook retry logic v2",
    initiatedBy: "dev@erpvala.com",
    startedAt: "2024-01-16 10:00",
    duration: "3m 30s",
    impactedServices: 2,
    status: "running",
  },
];

const mirrorHealth = [
  { service: "Billing API", syncLag: "0 ms", lastSync: "2024-01-18 15:00:01", status: "healthy" },
  { service: "Auth Service", syncLag: "2 ms", lastSync: "2024-01-18 15:00:01", status: "healthy" },
  {
    service: "Subscription Engine",
    syncLag: "5 ms",
    lastSync: "2024-01-18 15:00:00",
    status: "healthy",
  },
  {
    service: "Webhook Dispatcher",
    syncLag: "18 ms",
    lastSync: "2024-01-18 14:59:58",
    status: "degraded",
  },
  {
    service: "Notification Bus",
    syncLag: "1 ms",
    lastSync: "2024-01-18 15:00:01",
    status: "healthy",
  },
];

function AdminDigitalTwinPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewingLogs, setIsViewingLogs] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleSyncMirror = async () => {
    setIsSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Mirror synced successfully");
    } catch (error) {
      toast.error("Failed to sync mirror");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNewSimulation = async () => {
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Simulation wizard opened");
    } catch (error) {
      toast.error("Failed to open simulation wizard");
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewLogs = async () => {
    setIsViewingLogs(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Simulation logs loaded");
    } catch (error) {
      toast.error("Failed to load logs");
    } finally {
      setIsViewingLogs(false);
    }
  };

  const handleConfigureSettings = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Twin settings configured successfully");
    } catch (error) {
      toast.error("Failed to configure settings");
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Digital Twin System</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncMirror} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isSyncing ? "Syncing..." : "Sync Mirror"}
          </Button>
          <Button onClick={handleNewSimulation} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "New Simulation"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Mirror Sync Lag"
          value="3 ms"
          icon={Copy}
          change="Avg across services"
          changeType="positive"
        />
        <StatCard
          title="Simulations (30d)"
          value="42"
          icon={Play}
          change="+8 vs prior month"
          changeType="positive"
        />
        <StatCard
          title="Pass Rate"
          value="92%"
          icon={CheckCircle}
          change="11 passed, 1 failed"
          changeType="positive"
        />
        <StatCard
          title="Blocked Deploys"
          value="3"
          icon={AlertTriangle}
          change="Caught before prod"
          changeType="neutral"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">1. Mirror Production</p>
              <p className="text-xs text-muted-foreground">
                All production state (DB snapshots, config, traffic patterns) is continuously
                replicated into an isolated twin environment with near-zero lag.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">2. Simulate Changes</p>
              <p className="text-xs text-muted-foreground">
                Proposed code, config, or schema changes are deployed to the twin first. Real
                traffic patterns are replayed to validate behaviour.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">3. Gate Deployment</p>
              <p className="text-xs text-muted-foreground">
                Only simulations that pass all health, performance, and data-integrity checks are
                promoted to production deployment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Simulation History"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Change", accessorKey: "change" },
          { header: "Initiated By", accessorKey: "initiatedBy" },
          { header: "Started", accessorKey: "startedAt" },
          { header: "Duration", accessorKey: "duration" },
          { header: "Services Impacted", accessorKey: "impactedServices" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={simulations}
      />

      <DataTable
        title="Mirror Health"
        columns={[
          { header: "Service", accessorKey: "service" },
          {
            header: "Sync Lag",
            accessorKey: "syncLag",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.syncLag}</span>,
          },
          { header: "Last Sync", accessorKey: "lastSync" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={mirrorHealth}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleViewLogs} disabled={isViewingLogs}>
          {isViewingLogs ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isViewingLogs ? "Loading..." : "Simulation Logs"}
        </Button>
        <Button variant="outline" onClick={handleConfigureSettings} disabled={isConfiguring}>
          {isConfiguring ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          {isConfiguring ? "Configuring..." : "Configure Twin Settings"}
        </Button>
      </div>
    </div>
  );
}

export default AdminDigitalTwinPage;
