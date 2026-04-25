
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Settings2, RefreshCw, Clock, CheckCircle, AlertTriangle, Loader2, Eye, FileText, Plus, History, RotateCcw, Ban, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { configSyncService, type ConfigChange, type NodeInfo, type ConfigSyncKPI } from "@/lib/api/admin-services";

({
  component: AdminConfigSyncPage,
  head: () => ({ meta: [{ title: "Global Config Sync — Admin — ERP Vala" }] }),
});

function AdminConfigSyncPage() {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedChange, setSelectedChange] = useState<ConfigChange | null>(null);
  const [configChanges, setConfigChanges] = useState<ConfigChange[]>([]);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [kpi, setKpi] = useState<ConfigSyncKPI | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setConfigChanges(configSyncService.listChanges());
      setNodes(configSyncService.listNodes());
      setKpi(configSyncService.getKPI());
    } catch (error) {
      toast.error("Failed to load config sync data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      // Force sync all stale nodes
      for (const node of nodes) {
        if (node.syncStatus === "stale" || node.syncStatus === "failed") {
          configSyncService.updateNodeHealth(node.id, "online", node.latency);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("All nodes synced successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to sync nodes");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddConfig = async () => {
    const configKey = prompt("Enter config key (e.g., database.host):");
    if (!configKey) return;

    const configValueStr = prompt("Enter config value (JSON):");
    if (!configValueStr) return;

    try {
      const configValue = JSON.parse(configValueStr);
      setIsAdding(true);
      await configSyncService.createChange({ configKey, configValue, appliedBy: "admin" }, "admin");
      toast.success("Config change created successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to create config change: " + (error as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleApplyChange = async (id: string) => {
    try {
      await configSyncService.applyChange(id, "admin");
      toast.success("Config change applied successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to apply config change");
    }
  };

  const handleRollback = async (id: string) => {
    const reason = prompt("Enter rollback reason:");
    if (!reason) return;

    try {
      await configSyncService.triggerRollback(id, reason, "admin");
      toast.success("Config rolled back successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to rollback config");
    }
  };

  const handleIsolateNode = async (nodeId: string) => {
    const reason = prompt("Enter isolation reason:");
    if (!reason) return;

    try {
      configSyncService.isolateNode(nodeId, reason);
      toast.success("Node isolated successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to isolate node");
    }
  };

  const handleRejoinNode = async (nodeId: string) => {
    try {
      configSyncService.rejoinNode(nodeId);
      toast.success("Node rejoined successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to rejoin node");
    }
  };

  const handleTimeTravel = async () => {
    const version = prompt("Enter target version (e.g., 1.0.0):");
    if (!version) return;

    try {
      await configSyncService.timeTravel(version, "admin");
      toast.success("Time travel successful");
      loadData();
    } catch (error) {
      toast.error("Failed to time travel");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatLatency = (ms: number) => {
    return `${ms}ms`;
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
          <Button variant="outline" onClick={handleTimeTravel}>
            <History className="mr-2 h-4 w-4" />
            Time Travel
          </Button>
          <Button onClick={handleAddConfig} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAdding ? "Adding..." : "Add Config Change"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Changes" value={kpi?.totalChanges?.toString() || "0"} icon={Settings2} />
        <StatCard title="Pending Changes" value={kpi?.pendingChanges?.toString() || "0"} icon={Clock} />
        <StatCard title="Online Nodes" value={`${kpi?.onlineNodes}/${kpi?.totalNodes}`} icon={CheckCircle} />
        <StatCard title="Stale Nodes" value={kpi?.staleNodes?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Avg Sync Lag" value={`${kpi?.avgSyncLag?.toFixed(0) || 0}ms`} icon={Clock} />
        <StatCard title="Avg Latency" value={`${kpi?.avgLatency?.toFixed(0) || 0}ms`} icon={RefreshCw} />
        <StatCard title="Applied Changes" value={kpi?.appliedChanges?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Rolled Back" value={kpi?.rolledBackChanges?.toString() || "0"} icon={RotateCcw} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Propagation Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Change Impact Analyzer</p>
              <p className="text-xs text-muted-foreground">
                Every config change auto-evaluates affected services, APIs, and risk level before apply.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Safe Apply Guard</p>
              <p className="text-xs text-muted-foreground">
                Config simulation blocks breaking changes and validates dependency chains before propagation.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Auto Rollback</p>
              <p className="text-xs text-muted-foreground">
                Error spikes or service crashes trigger automatic rollback to last stable version.
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
            header: "Config Key",
            accessorKey: "configKey",
            cell: ({ row }: { row: { original: ConfigChange } }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.configKey}</code>
            ),
          },
          {
            header: "Version",
            accessorKey: "version",
            cell: ({ row }: { row: { original: ConfigChange } }) => (
              <span className="font-mono">{row.original.version}</span>
            ),
          },
          {
            header: "Risk Level",
            accessorKey: "riskLevel",
            cell: ({ row }: { row: { original: ConfigChange } }) => (
              <span className={
                row.original.riskLevel === "critical" ? "text-red-600" :
                row.original.riskLevel === "medium" ? "text-yellow-600" :
                "text-green-600"
              }>
                {row.original.riskLevel.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: { original: ConfigChange } }) => (
              <span className={
                row.original.status === "applied" ? "text-green-600" :
                row.original.status === "pending" ? "text-yellow-600" :
                row.original.status === "failed" ? "text-red-600" :
                "text-muted-foreground"
              }>
                {row.original.status.replace("_", " ").toUpperCase()}
              </span>
            ),
          },
          { header: "Applied By", accessorKey: "appliedBy" },
          {
            header: "Applied At",
            accessorKey: "appliedAt",
            cell: ({ row }: { row: { original: ConfigChange } }) => formatDate(row.original.appliedAt),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: ConfigChange } }) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedChange(row.original)}>
                  <Eye className="h-3 w-3" />
                </Button>
                {row.original.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => handleApplyChange(row.original.id)}>
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}
                {row.original.status === "applied" && (
                  <Button size="sm" variant="outline" onClick={() => handleRollback(row.original.id)}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={configChanges}
      />

      <DataTable
        title="Node Sync Status"
        columns={[
          { header: "Node", accessorKey: "name" },
          { header: "Region", accessorKey: "region" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: { original: NodeInfo } }) => (
              <span className={
                row.original.status === "online" ? "text-green-600" :
                row.original.status === "offline" ? "text-red-600" :
                row.original.status === "degraded" ? "text-yellow-600" :
                "text-orange-600"
              }>
                {row.original.status.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Sync Status",
            accessorKey: "syncStatus",
            cell: ({ row }: { row: { original: NodeInfo } }) => (
              <span className={
                row.original.syncStatus === "synced" ? "text-green-600" :
                row.original.syncStatus === "pending" ? "text-yellow-600" :
                row.original.syncStatus === "failed" ? "text-red-600" :
                "text-orange-600"
              }>
                {row.original.syncStatus.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Version",
            accessorKey: "currentVersion",
            cell: ({ row }: { row: { original: NodeInfo } }) => (
              <span className="font-mono">{row.original.currentVersion}</span>
            ),
          },
          {
            header: "Latency",
            accessorKey: "latency",
            cell: ({ row }: { row: { original: NodeInfo } }) => formatLatency(row.original.latency),
          },
          {
            header: "Sync Lag",
            accessorKey: "syncLag",
            cell: ({ row }: { row: { original: NodeInfo } }) => `${row.original.syncLag}ms`,
          },
          {
            header: "Last Sync",
            accessorKey: "lastSyncAt",
            cell: ({ row }: { row: { original: NodeInfo } }) => formatDate(row.original.lastSyncAt),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: NodeInfo } }) => (
              <div className="flex gap-2">
                {row.original.status === "isolated" ? (
                  <Button size="sm" variant="outline" onClick={() => handleRejoinNode(row.original.id)}>
                    <Shield className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleIsolateNode(row.original.id)}>
                    <Ban className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={nodes}
      />

      <Dialog open={!!selectedChange} onOpenChange={() => setSelectedChange(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Config Change Details</DialogTitle>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm">{selectedChange.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm font-mono">{selectedChange.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Config Key</label>
                  <p className="text-sm"><code>{selectedChange.configKey}</code></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Risk Level</label>
                  <p className="text-sm">{selectedChange.riskLevel.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">{selectedChange.status.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applied By</label>
                  <p className="text-sm">{selectedChange.appliedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applied At</label>
                  <p className="text-sm">{formatDate(selectedChange.appliedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signature</label>
                  <p className="text-sm font-mono">{selectedChange.signature}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Affected Services</label>
                <div className="flex gap-2 mt-1">
                  {selectedChange.affectedServices.map((service) => (
                    <span key={service} className="rounded bg-muted px-2 py-1 text-xs">{service}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Affected APIs</label>
                <div className="flex gap-2 mt-1">
                  {selectedChange.affectedAPIs.map((api) => (
                    <span key={api} className="rounded bg-muted px-2 py-1 text-xs">{api}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Previous Value</label>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                  {JSON.stringify(selectedChange.previousValue, null, 2)}
                </pre>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">New Value</label>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                  {JSON.stringify(selectedChange.configValue, null, 2)}
                </pre>
              </div>

              {selectedChange.rollbackVersion && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rollback Info</label>
                  <p className="text-sm">Rolled back to: {selectedChange.rollbackVersion}</p>
                  <p className="text-sm">Reason: {selectedChange.failureReason}</p>
                  <p className="text-sm">At: {formatDate(selectedChange.rollbackAt!)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminConfigSyncPage;
