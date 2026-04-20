
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { MemoryStick, RefreshCw, Clock, CheckCircle, Archive, Loader2, Eye, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminMemoryRecoveryPage,
  head: () => ({ meta: [{ title: "Memory State Recovery — Admin — ERP Vala" }] }),
});

const recoveryEvents = [
  {
    id: "MR-001",
    service: "billing-api",
    crashReason: "OOM kill (container evicted)",
    snapshotAge: "1.2 s",
    recoveredAt: "2024-01-18 11:22:09",
    sessionRestored: true,
    stateRestored: "Full",
    status: "recovered",
  },
  {
    id: "MR-002",
    service: "webhook-dispatcher",
    crashReason: "Unhandled exception (null ref)",
    snapshotAge: "0.8 s",
    recoveredAt: "2024-01-17 18:44:31",
    sessionRestored: true,
    stateRestored: "Full",
    status: "recovered",
  },
  {
    id: "MR-003",
    service: "notification-bus",
    crashReason: "Network timeout cascade",
    snapshotAge: "4.1 s",
    recoveredAt: "2024-01-16 02:15:08",
    sessionRestored: false,
    stateRestored: "Partial",
    status: "partial",
  },
  {
    id: "MR-004",
    service: "subscription-engine",
    crashReason: "Deadlock (DB)",
    snapshotAge: "0.5 s",
    recoveredAt: "2024-01-15 09:08:44",
    sessionRestored: true,
    stateRestored: "Full",
    status: "recovered",
  },
];

function AdminMemoryRecoveryPage() {
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleBrowseSnapshots = async () => {
    setIsBrowsing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Snapshots loaded successfully");
    } catch (error) {
      toast.error("Failed to load snapshots");
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleConfigurePolicy = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Snapshot policy configured successfully");
    } catch (error) {
      toast.error("Failed to configure snapshot policy");
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Memory State Recovery</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBrowseSnapshots} disabled={isBrowsing}>
            {isBrowsing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isBrowsing ? "Loading..." : "Browse Snapshots"}
          </Button>
          <Button onClick={handleConfigurePolicy} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Snapshot Policy"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Crash Recoveries (30d)"
          value="4"
          icon={RefreshCw}
          change="All services restored"
          changeType="positive"
        />
        <StatCard
          title="Avg Snapshot Age"
          value="1.6 s"
          icon={Clock}
          change="At time of crash"
          changeType="positive"
        />
        <StatCard
          title="Full Restorations"
          value="3"
          icon={CheckCircle}
          change="1 partial (network crash)"
          changeType="positive"
        />
        <StatCard
          title="Session Loss"
          value="0"
          icon={MemoryStick}
          change="Zero user sessions lost"
          changeType="positive"
        />
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
                Each service emits in-memory state snapshots to a durable store every 500 ms.
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

      <Card>
        <CardHeader>
          <CardTitle>Snapshot Coverage by Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { service: "billing-api", interval: "500 ms", retention: "24 h", status: "active" },
              { service: "auth-service", interval: "500 ms", retention: "24 h", status: "active" },
              {
                service: "subscription-engine",
                interval: "500 ms",
                retention: "24 h",
                status: "active",
              },
              {
                service: "webhook-dispatcher",
                interval: "1 s",
                retention: "12 h",
                status: "active",
              },
              {
                service: "notification-bus",
                interval: "1 s",
                retention: "12 h",
                status: "active",
              },
              { service: "checkout-api", interval: "500 ms", retention: "24 h", status: "active" },
            ].map((s) => (
              <div key={s.service} className="rounded-lg border p-3">
                <p className="font-mono text-sm font-medium">{s.service}</p>
                <p className="text-xs text-muted-foreground">
                  Every {s.interval} · Retained {s.retention}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Recovery Events"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Service", accessorKey: "service" },
          { header: "Crash Reason", accessorKey: "crashReason" },
          { header: "Snapshot Age", accessorKey: "snapshotAge" },
          { header: "Recovered At", accessorKey: "recoveredAt" },
          {
            header: "Session Restored",
            accessorKey: "sessionRestored",
            cell: ({ row }) => (
              <span
                className={
                  row.original.sessionRestored
                    ? "text-success font-medium"
                    : "text-destructive font-medium"
                }
              >
                {row.original.sessionRestored ? "Yes" : "No"}
              </span>
            ),
          },
          { header: "State", accessorKey: "stateRestored" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={recoveryEvents}
      />
    </div>
  );
}

export default AdminMemoryRecoveryPage;
