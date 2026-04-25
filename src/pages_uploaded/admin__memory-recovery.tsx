
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MemoryStick, RefreshCw, Clock, CheckCircle, Archive, Loader2, Eye, Settings, Plus, Play, StopCircle, AlertTriangle, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { memoryRecoveryService, type Snapshot, type RecoveryEvent, type FailurePattern, type SnapshotConfig, type RecoveryKPI } from "@/lib/api/admin-services";

({
  component: AdminMemoryRecoveryPage,
  head: () => ({ meta: [{ title: "Memory State Recovery — Admin — ERP Vala" }] }),
});

function AdminMemoryRecoveryPage() {
  const [loading, setLoading] = useState(true);
  const [isAddingConfig, setIsAddingConfig] = useState(false);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<RecoveryEvent | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [recoveryEvents, setRecoveryEvents] = useState<RecoveryEvent[]>([]);
  const [failurePatterns, setFailurePatterns] = useState<FailurePattern[]>([]);
  const [snapshotConfigs, setSnapshotConfigs] = useState<SnapshotConfig[]>([]);
  const [kpi, setKpi] = useState<RecoveryKPI | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setSnapshots(memoryRecoveryService.listSnapshots());
      setRecoveryEvents(memoryRecoveryService.listRecoveryEvents());
      setFailurePatterns(memoryRecoveryService.listFailurePatterns());
      setSnapshotConfigs(Array.from(memoryRecoveryService["snapshotConfigs"].values()));
      setKpi(memoryRecoveryService.getKPI());
    } catch (error) {
      toast.error("Failed to load memory recovery data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSnapshotConfig = async () => {
    const service = prompt("Enter service name (e.g., billing):");
    if (!service) return;

    const frequency = parseInt(prompt("Enter frequency in ms (e.g., 30000):") || "30000");
    const retentionWindow = parseInt(prompt("Enter retention window in seconds (e.g., 86400):") || "86400");
    const priority = prompt("Enter priority (low, medium, high, critical):") as "low" | "medium" | "high" | "critical" || "medium";
    const adaptive = confirm("Enable adaptive frequency?");
    const loadAware = confirm("Enable load-aware snapshots?");

    try {
      setIsAddingConfig(true);
      memoryRecoveryService.setSnapshotConfig(service, frequency, retentionWindow, priority, adaptive, loadAware);
      toast.success("Snapshot config created successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to create snapshot config");
    } finally {
      setIsAddingConfig(false);
    }
  };

  const handleStartScheduler = () => {
    memoryRecoveryService.startSnapshotScheduler();
    setIsSchedulerRunning(true);
    toast.success("Snapshot scheduler started");
  };

  const handleStopScheduler = () => {
    memoryRecoveryService.stopSnapshotScheduler();
    setIsSchedulerRunning(false);
    toast.success("Snapshot scheduler stopped");
  };

  const handleCreateSnapshot = async (service: string) => {
    try {
      await memoryRecoveryService.createSnapshot(service);
      toast.success("Snapshot created successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to create snapshot");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Memory State Recovery</h1>
        <div className="flex gap-2">
          {!isSchedulerRunning ? (
            <Button variant="outline" onClick={handleStartScheduler}>
              <Play className="mr-2 h-4 w-4" />
              Start Snapshot Scheduler
            </Button>
          ) : (
            <Button variant="outline" onClick={handleStopScheduler}>
              <StopCircle className="mr-2 h-4 w-4" />
              Stop Snapshot Scheduler
            </Button>
          )}
          <Button onClick={handleAddSnapshotConfig} disabled={isAddingConfig}>
            {isAddingConfig ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAddingConfig ? "Adding..." : "Add Snapshot Config"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Snapshots" value={kpi?.totalSnapshots?.toString() || "0"} icon={Archive} />
        <StatCard title="Active Snapshots" value={kpi?.activeSnapshots?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Recovery Events" value={kpi?.totalRecoveryEvents?.toString() || "0"} icon={RefreshCw} />
        <StatCard title="Full Recoveries" value={kpi?.fullRecoveries?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Partial Recoveries" value={kpi?.partialRecoveries?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Failed Recoveries" value={kpi?.failedRecoveries?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Avg Snapshot Age" value={`${kpi?.avgSnapshotAge?.toFixed(0) || 0}s`} icon={Clock} />
        <StatCard title="Avg Recovery Time" value={`${kpi?.avgRecoveryTime?.toFixed(0) || 0}s`} icon={Clock} />
        <StatCard title="Services Covered" value={kpi?.servicesWithCoverage?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Services Missing" value={kpi?.servicesWithoutCoverage?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Patterns Detected" value={kpi?.patternsDetected?.toString() || "0"} icon={Activity} />
        <StatCard title="Auto Fixes Applied" value={kpi?.autoFixesApplied?.toString() || "0"} icon={Settings} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How State Recovery Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">1. Continuous Snapshots</p>
              <p className="text-xs text-muted-foreground">
                Each service emits in-memory state snapshots to a durable store at configured intervals.
                Snapshots include active sessions, in-flight tasks, and queue offsets.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">2. Crash Detection</p>
              <p className="text-xs text-muted-foreground">
                The supervisor process detects a crash within 1–3 s via health-check failure or
                process exit signal.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">3. Restore State</p>
              <p className="text-xs text-muted-foreground">
                On restart, the service loads the latest snapshot from the durable store and replays
                any events that arrived during the downtime window.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">4. Resume Sessions</p>
              <p className="text-xs text-muted-foreground">
                Active user sessions are transparently reconnected via WebSocket handshake
                resumption. Users see at most a brief spinner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Snapshot Configs"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Service", accessorKey: "service" },
          {
            header: "Frequency",
            accessorKey: "frequency",
            cell: ({ row }: { row: { original: SnapshotConfig } }) => `${row.original.frequency}ms`,
          },
          {
            header: "Retention",
            accessorKey: "retentionWindow",
            cell: ({ row }: { row: { original: SnapshotConfig } }) => `${row.original.retentionWindow}s`,
          },
          {
            header: "Priority",
            accessorKey: "priority",
            cell: ({ row }: { row: { original: SnapshotConfig } }) => (
              <span className={
                row.original.priority === "critical" ? "text-red-600" :
                row.original.priority === "high" ? "text-orange-600" :
                row.original.priority === "medium" ? "text-yellow-600" :
                "text-green-600"
              }>
                {row.original.priority.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Adaptive",
            accessorKey: "adaptive",
            cell: ({ row }: { row: { original: SnapshotConfig } }) => (
              row.original.adaptive ? <CheckCircle className="h-4 w-4 text-green-600" /> : <span className="text-muted-foreground">—</span>
            ),
          },
          {
            header: "Load Aware",
            accessorKey: "loadAware",
            cell: ({ row }: { row: { original: SnapshotConfig } }) => (
              row.original.loadAware ? <CheckCircle className="h-4 w-4 text-green-600" /> : <span className="text-muted-foreground">—</span>
            ),
          },
          {
            header: "",
            accessorKey: "service",
            cell: ({ row }: { row: { original: SnapshotConfig } }) => (
              <Button size="sm" variant="outline" onClick={() => handleCreateSnapshot(row.original.service)}>
                <Play className="h-3 w-3" />
              </Button>
            ),
          },
        ]}
        data={snapshotConfigs}
      />

      <DataTable
        title="Snapshots"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Service", accessorKey: "service" },
          {
            header: "Version",
            accessorKey: "version",
            cell: ({ row }: { row: { original: Snapshot } }) => (
              <span className="font-mono">{row.original.version}</span>
            ),
          },
          {
            header: "Size",
            accessorKey: "size",
            cell: ({ row }: { row: { original: Snapshot } }) => formatBytes(row.original.size),
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: { original: Snapshot } }) => (
              <span className={
                row.original.status === "active" ? "text-green-600" :
                row.original.status === "expired" ? "text-muted-foreground" :
                row.original.status === "corrupted" ? "text-red-600" :
                "text-yellow-600"
              }>
                {row.original.status.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Created At",
            accessorKey: "createdAt",
            cell: ({ row }: { row: { original: Snapshot } }) => formatDate(row.original.createdAt),
          },
          {
            header: "Retention Until",
            accessorKey: "retentionUntil",
            cell: ({ row }: { row: { original: Snapshot } }) => formatDate(row.original.retentionUntil),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: Snapshot } }) => (
              <Button size="sm" variant="outline" onClick={() => setSelectedSnapshot(row.original)}>
                <Eye className="h-3 w-3" />
              </Button>
            ),
          },
        ]}
        data={snapshots}
      />

      <DataTable
        title="Recovery Events"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Service", accessorKey: "service" },
          {
            header: "Failure Type",
            accessorKey: "failureType",
            cell: ({ row }: { row: { original: RecoveryEvent } }) => (
              <span className="font-medium">{row.original.failureType.replace("_", " ").toUpperCase()}</span>
            ),
          },
          { header: "Crash Reason", accessorKey: "crashReason" },
          {
            header: "Snapshot Age",
            accessorKey: "snapshotAge",
            cell: ({ row }: { row: { original: RecoveryEvent } }) => `${row.original.snapshotAge}s`,
          },
          {
            header: "Recovery Status",
            accessorKey: "recoveryStatus",
            cell: ({ row }: { row: { original: RecoveryEvent } }) => (
              <span className={
                row.original.recoveryStatus === "full" ? "text-green-600" :
                row.original.recoveryStatus === "partial" ? "text-yellow-600" :
                row.original.recoveryStatus === "failed" ? "text-red-600" :
                "text-blue-600"
              }>
                {row.original.recoveryStatus.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Session Restored",
            accessorKey: "sessionRestored",
            cell: ({ row }: { row: { original: RecoveryEvent } }) => (
              row.original.sessionRestored ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />
            ),
          },
          {
            header: "Data Consistent",
            accessorKey: "dataConsistent",
            cell: ({ row }: { row: { original: RecoveryEvent } }) => (
              row.original.dataConsistent ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />
            ),
          },
          {
            header: "Retry Count",
            accessorKey: "retryCount",
            cell: ({ row }: { row: { original: RecoveryEvent } }) => (
              <span className="font-medium">{row.original.retryCount}</span>
            ),
          },
          {
            header: "Timestamp",
            accessorKey: "timestamp",
            cell: ({ row }: { row: { original: RecoveryEvent } }) => formatDate(row.original.timestamp),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: RecoveryEvent } }) => (
              <Button size="sm" variant="outline" onClick={() => setSelectedEvent(row.original)}>
                <Eye className="h-3 w-3" />
              </Button>
            ),
          },
        ]}
        data={recoveryEvents}
      />

      <DataTable
        title="Failure Patterns"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Service", accessorKey: "service" },
          {
            header: "Failure Type",
            accessorKey: "failureType",
            cell: ({ row }: { row: { original: FailurePattern } }) => (
              <span className="font-medium">{row.original.failureType.replace("_", " ").toUpperCase()}</span>
            ),
          },
          { header: "Pattern", accessorKey: "pattern" },
          {
            header: "Occurrences",
            accessorKey: "occurrenceCount",
            cell: ({ row }: { row: { original: FailurePattern } }) => (
              <span className="font-medium">{row.original.occurrenceCount}</span>
            ),
          },
          {
            header: "Frequency",
            accessorKey: "frequency",
            cell: ({ row }: { row: { original: FailurePattern } }) => `${row.original.frequency.toFixed(1)}/day`,
          },
          {
            header: "Severity",
            accessorKey: "severity",
            cell: ({ row }: { row: { original: FailurePattern } }) => (
              <span className={
                row.original.severity === "critical" ? "text-red-600" :
                row.original.severity === "high" ? "text-orange-600" :
                row.original.severity === "medium" ? "text-yellow-600" :
                "text-green-600"
              }>
                {row.original.severity.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Auto Prevention",
            accessorKey: "autoPreventionEnabled",
            cell: ({ row }: { row: { original: FailurePattern } }) => (
              row.original.autoPreventionEnabled ? <CheckCircle className="h-4 w-4 text-green-600" /> : <span className="text-muted-foreground">—</span>
            ),
          },
        ]}
        data={failurePatterns}
      />

      <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Snapshot Details</DialogTitle>
          </DialogHeader>
          {selectedSnapshot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm">{selectedSnapshot.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service</label>
                  <p className="text-sm">{selectedSnapshot.service}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm font-mono">{selectedSnapshot.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="text-sm">{formatBytes(selectedSnapshot.size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">{selectedSnapshot.status.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Checksum</label>
                  <p className="text-sm font-mono">{selectedSnapshot.checksum}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm">{formatDate(selectedSnapshot.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Retention Until</label>
                  <p className="text-sm">{formatDate(selectedSnapshot.retentionUntil)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                  {JSON.stringify(selectedSnapshot.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recovery Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm">{selectedEvent.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service</label>
                  <p className="text-sm">{selectedEvent.service}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Failure Type</label>
                  <p className="text-sm">{selectedEvent.failureType.replace("_", " ").toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Crash Reason</label>
                  <p className="text-sm">{selectedEvent.crashReason}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Snapshot Age</label>
                  <p className="text-sm">{selectedEvent.snapshotAge}s</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recovery Status</label>
                  <p className="text-sm">{selectedEvent.recoveryStatus.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recovery Action</label>
                  <p className="text-sm">{selectedEvent.recoveryAction.replace("_", " ").toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Root Cause</label>
                  <p className="text-sm">{selectedEvent.rootCause || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Session Restored</label>
                  <p className="text-sm">{selectedEvent.sessionRestored ? "Yes" : "No"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Consistent</label>
                  <p className="text-sm">{selectedEvent.dataConsistent ? "Yes" : "No"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Retry Count</label>
                  <p className="text-sm">{selectedEvent.retryCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  <p className="text-sm">{formatDate(selectedEvent.timestamp)}</p>
                </div>
                {selectedEvent.resolvedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resolved At</label>
                    <p className="text-sm">{formatDate(selectedEvent.resolvedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMemoryRecoveryPage;
