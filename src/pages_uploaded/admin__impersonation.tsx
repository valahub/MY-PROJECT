
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Eye, ShieldCheck, ClipboardList, Loader2, Download, Play, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminImpersonationPage,
  head: () => ({ meta: [{ title: "Admin Tools — Admin — ERP Vala" }] }),
});

const sessions = [
  {
    id: "IMP-001",
    actor: "admin@erpvala.com",
    target: "merchant@acme.com",
    targetRole: "Merchant",
    reason: "Billing issue investigation",
    startedAt: "2024-01-18 14:10",
    endedAt: "2024-01-18 14:25",
    duration: "15m",
    status: "completed",
  },
  {
    id: "IMP-002",
    actor: "support@erpvala.com",
    target: "john@example.com",
    targetRole: "Customer",
    reason: "Account access problem",
    startedAt: "2024-01-18 13:00",
    endedAt: "2024-01-18 13:10",
    duration: "10m",
    status: "completed",
  },
  {
    id: "IMP-003",
    actor: "admin@erpvala.com",
    target: "merchant@beta.io",
    targetRole: "Merchant",
    reason: "Product upload debugging",
    startedAt: "2024-01-18 14:30",
    endedAt: "—",
    duration: "Active",
    status: "active",
  },
];

const bulkActions = [
  {
    id: "BA-001",
    action: "Suspend accounts with risk score > 90",
    affected: "12 accounts",
    initiatedBy: "admin@erpvala.com",
    status: "completed",
    runAt: "2024-01-18 10:00",
  },
  {
    id: "BA-002",
    action: "Revoke expired trial licenses",
    affected: "234 licenses",
    initiatedBy: "system",
    status: "completed",
    runAt: "2024-01-17 03:00",
  },
  {
    id: "BA-003",
    action: "Backfill missing invoice PDFs",
    affected: "1,420 invoices",
    initiatedBy: "admin@erpvala.com",
    status: "pending",
    runAt: "2024-01-18 15:00",
  },
  {
    id: "BA-004",
    action: "Migrate v1 API keys to v2",
    affected: "43 merchants",
    initiatedBy: "admin@erpvala.com",
    status: "completed",
    runAt: "2024-01-16 22:00",
  },
];

function AdminImpersonationPage() {
  const [targetEmail, setTargetEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);

  const startSession = async () => {
    if (!targetEmail || !reason) {
      toast.error("Email and reason are required");
      return;
    }
    setIsStarting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Impersonation session started for ${targetEmail}. Logged to audit trail.`);
      setTargetEmail("");
      setReason("");
    } catch (error) {
      toast.error("Failed to start session");
    } finally {
      setIsStarting(false);
    }
  };

  const handleExportAudit = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Audit log exported successfully");
    } catch (error) {
      toast.error("Failed to export audit log");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEndSession = async (id: string) => {
    setEndingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Session terminated");
    } catch (error) {
      toast.error("Failed to terminate session");
    } finally {
      setEndingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Internal Admin Tools</h1>
        <Button variant="outline" onClick={handleExportAudit} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Audit Log"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Sessions"
          value="1"
          icon={Eye}
          change="Currently impersonating"
          changeType="negative"
        />
        <StatCard
          title="Sessions (30d)"
          value="42"
          icon={UserCog}
          change="All logged"
          changeType="neutral"
        />
        <StatCard
          title="Bulk Jobs (30d)"
          value="18"
          icon={ClipboardList}
          change="Last: 2h ago"
          changeType="neutral"
        />
        <StatCard
          title="Audit Coverage"
          value="100%"
          icon={ShieldCheck}
          change="All actions logged"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start Impersonation Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All impersonation sessions are fully logged to the immutable audit trail. Reason is
            mandatory and displayed to the target user on login.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Target Email</label>
              <Input
                placeholder="user@example.com"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Reason (Mandatory)</label>
              <Input
                placeholder="e.g. Customer support ticket #4521"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={startSession} disabled={isStarting}>
            {isStarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isStarting ? "Starting..." : "Start Impersonation"}
          </Button>
        </CardContent>
      </Card>

      <DataTable
        title="Impersonation Audit"
        columns={[
          { header: "Actor", accessorKey: "actor" },
          { header: "Target", accessorKey: "target" },
          { header: "Role", accessorKey: "targetRole" },
          { header: "Reason", accessorKey: "reason" },
          { header: "Started", accessorKey: "startedAt" },
          { header: "Duration", accessorKey: "duration" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) =>
              row.original.status === "active" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/50"
                  onClick={() => handleEndSession(row.original.id)}
                  disabled={endingId === row.original.id}
                >
                  {endingId === row.original.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <X className="mr-1 h-3 w-3" />
                  )}
                  {endingId === row.original.id ? "Ending..." : "End"}
                </Button>
              ) : null,
          },
        ]}
        data={sessions}
      />

      <DataTable
        title="Bulk Actions Log"
        columns={[
          { header: "Action", accessorKey: "action" },
          { header: "Affected", accessorKey: "affected" },
          { header: "Initiated By", accessorKey: "initiatedBy" },
          { header: "Run At", accessorKey: "runAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={bulkActions}
      />
    </div>
  );
}
