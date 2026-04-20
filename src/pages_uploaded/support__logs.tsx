
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Activity, Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

({
  component: SupportLogsPage,
  head: () => ({ meta: [{ title: "Logs — Support — ERP Vala" }] }),
});

type SupportLog = {
  id: string;
  action: string;
  actor: string;
  target: string;
  status: "success" | "pending" | "failed" | "recovered";
  channel: "ticket" | "billing" | "license" | "subscription";
  latencyMs: number;
  timestamp: string;
};

const logs: SupportLog[] = [
  {
    id: "LOG-001",
    action: "Ticket assigned",
    actor: "System",
    target: "TK-003 → Sarah",
    status: "success",
    channel: "ticket",
    latencyMs: 82,
    timestamp: "2024-01-18 15:00",
  },
  {
    id: "LOG-002",
    action: "Refund processed",
    actor: "Tom",
    target: "PAY-567 ($49.00)",
    status: "recovered",
    channel: "billing",
    latencyMs: 410,
    timestamp: "2024-01-18 14:45",
  },
  {
    id: "LOG-003",
    action: "Ticket escalated",
    actor: "Sarah",
    target: "TK-003 → Engineering",
    status: "pending",
    channel: "ticket",
    latencyMs: 154,
    timestamp: "2024-01-18 13:30",
  },
  {
    id: "LOG-004",
    action: "License reactivated",
    actor: "Mike",
    target: "LIC-123 for john@example.com",
    status: "success",
    channel: "license",
    latencyMs: 97,
    timestamp: "2024-01-18 12:15",
  },
  {
    id: "LOG-005",
    action: "Subscription extended",
    actor: "Sarah",
    target: "SUB-789 (+7 days grace)",
    status: "failed",
    channel: "subscription",
    latencyMs: 620,
    timestamp: "2024-01-18 11:00",
  },
  {
    id: "LOG-006",
    action: "Ticket resolved",
    actor: "Tom",
    target: "TK-004 (invoice copy sent)",
    status: "success",
    channel: "ticket",
    latencyMs: 76,
    timestamp: "2024-01-18 11:00",
  },
];

function SupportLogsPage() {
  const recoveredCount = logs.filter((log) => log.status === "recovered").length;
  const failedCount = logs.filter((log) => log.status === "failed").length;
  const avgLatencyMs = Math.round(
    logs.reduce((total, log) => total + log.latencyMs, 0) / Math.max(logs.length, 1),
  );

  const runSelfHealingSweep = () => {
    toast.success("Self-healing sweep dispatched. Failed operations queued for retry.");
  };

  const replayFailedActions = () => {
    if (failedCount === 0) {
      toast.info("No failed operations to replay.");
      return;
    }
    toast.success(`Replay started for ${failedCount} failed action(s).`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Support Activity Logs</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={replayFailedActions}>
            <RefreshCw className="mr-2 h-4 w-4" /> Replay Failed
          </Button>
          <Button onClick={runSelfHealingSweep}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Run Healing Sweep
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Events (24h)" value={String(logs.length)} icon={Activity} />
        <StatCard title="Recovered" value={String(recoveredCount)} icon={ShieldCheck} />
        <StatCard title="Failed" value={String(failedCount)} icon={RefreshCw} />
        <StatCard title="Avg Latency" value={`${avgLatencyMs}ms`} icon={Clock3} />
      </div>

      <DataTable
        title="Support Action Timeline"
        columns={[
          { accessorKey: "id", header: "Log ID" },
          { accessorKey: "action", header: "Action" },
          { accessorKey: "actor", header: "Actor" },
          {
            accessorKey: "channel",
            header: "Channel",
            cell: ({ row }) => (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase tracking-wide">
                {row.original.channel}
              </span>
            ),
          },
          {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { accessorKey: "target", header: "Target" },
          { accessorKey: "latencyMs", header: "Latency (ms)" },
          { accessorKey: "timestamp", header: "Time" },
        ]}
        data={logs}
        searchKey="action"
      />
    </div>
  );
}
