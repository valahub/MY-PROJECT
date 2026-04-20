
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Database, HardDrive, Clock, CheckCircle, Loader2, Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminBackupPage,
  head: () => ({ meta: [{ title: "Backup & Restore — Admin — ERP Vala" }] }),
});

const backups = [
  {
    id: "BK-001",
    type: "Full",
    size: "2.4 GB",
    status: "completed",
    created: "2024-01-18 03:00",
    duration: "12m 34s",
  },
  {
    id: "BK-002",
    type: "Incremental",
    size: "180 MB",
    status: "completed",
    created: "2024-01-17 03:00",
    duration: "2m 15s",
  },
  {
    id: "BK-003",
    type: "Full",
    size: "2.3 GB",
    status: "completed",
    created: "2024-01-16 03:00",
    duration: "11m 58s",
  },
  {
    id: "BK-004",
    type: "Incremental",
    size: "210 MB",
    status: "completed",
    created: "2024-01-15 03:00",
    duration: "2m 42s",
  },
  {
    id: "BK-005",
    type: "Full",
    size: "2.3 GB",
    status: "completed",
    created: "2024-01-14 03:00",
    duration: "12m 01s",
  },
];

function AdminBackupPage() {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleRestoreFromBackup = async () => {
    setIsRestoring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Restore initiated successfully");
    } catch (error) {
      toast.error("Failed to initiate restore");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Backup creation initiated");
    } catch (error) {
      toast.error("Failed to create backup");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (id: string) => {
    setRestoringId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Backup ${id} restored successfully`);
    } catch (error) {
      toast.error("Failed to restore backup");
    } finally {
      setRestoringId(null);
    }
  };

  const handleDownloadBackup = async (id: string) => {
    setDownloadingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Backup ${id} downloaded`);
    } catch (error) {
      toast.error("Failed to download backup");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Backup & Restore</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRestoreFromBackup} disabled={isRestoring}>
            {isRestoring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isRestoring ? "Restoring..." : "Restore from Backup"}
          </Button>
          <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
            {isCreatingBackup ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isCreatingBackup ? "Creating..." : "Create Backup Now"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Last Backup"
          value="6h ago"
          icon={Clock}
          change="Auto scheduled"
          changeType="positive"
        />
        <StatCard title="Total Size" value="14.2 GB" icon={HardDrive} />
        <StatCard title="Backups (30d)" value="45" icon={Database} />
        <StatCard title="Success Rate" value="100%" icon={CheckCircle} changeType="positive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Full Backup</p>
              <p className="text-sm text-muted-foreground">Every Sunday & Wednesday at 03:00 UTC</p>
              <p className="mt-2 text-xs text-muted-foreground">Retention: 30 days</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Incremental Backup</p>
              <p className="text-sm text-muted-foreground">Daily at 03:00 UTC (non-full days)</p>
              <p className="mt-2 text-xs text-muted-foreground">Retention: 14 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Backups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {backups.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-4">
                  <StatusBadge status={b.status} />
                  <div>
                    <p className="text-sm font-medium">{b.type} Backup</p>
                    <p className="text-xs text-muted-foreground">
                      {b.created} · {b.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{b.size}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreBackup(b.id)}
                    disabled={restoringId === b.id}
                  >
                    {restoringId === b.id ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : null}
                    {restoringId === b.id ? "Restoring..." : "Restore"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadBackup(b.id)}
                    disabled={downloadingId === b.id}
                  >
                    {downloadingId === b.id ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-3 w-3" />
                    )}
                    {downloadingId === b.id ? "Downloading..." : "Download"}
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

export default AdminBackupPage;
