
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertTriangle, PlayCircle, Loader2, Pause, Plus, Play } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminSchedulerPage,
  head: () => ({ meta: [{ title: "Scheduler — Admin — ERP Vala" }] }),
});

const jobs = [
  {
    id: "JOB-001",
    name: "billing.charge_renewals",
    schedule: "0 2 * * *",
    description: "Charge all subscriptions due for renewal",
    lastRun: "2024-01-18 02:00",
    duration: "4m 12s",
    nextRun: "2024-01-19 02:00",
    status: "active",
  },
  {
    id: "JOB-002",
    name: "cleanup.expired_sessions",
    schedule: "*/30 * * * *",
    description: "Remove expired auth sessions from DB",
    lastRun: "2024-01-18 14:30",
    duration: "0m 08s",
    nextRun: "2024-01-18 15:00",
    status: "active",
  },
  {
    id: "JOB-003",
    name: "reports.daily_mrr",
    schedule: "0 6 * * *",
    description: "Generate and email daily MRR report",
    lastRun: "2024-01-18 06:00",
    duration: "1m 48s",
    nextRun: "2024-01-19 06:00",
    status: "active",
  },
  {
    id: "JOB-004",
    name: "billing.dunning_emails",
    schedule: "0 9 * * *",
    description: "Send dunning emails for past-due accounts",
    lastRun: "2024-01-18 09:00",
    duration: "2m 30s",
    nextRun: "2024-01-19 09:00",
    status: "active",
  },
  {
    id: "JOB-005",
    name: "search.reindex_products",
    schedule: "0 3 * * 0",
    description: "Full re-index of products search index",
    lastRun: "2024-01-14 03:00",
    duration: "18m 24s",
    nextRun: "2024-01-21 03:00",
    status: "active",
  },
  {
    id: "JOB-006",
    name: "cleanup.old_backups",
    schedule: "0 4 * * 1",
    description: "Delete backups older than retention window",
    lastRun: "2024-01-15 04:00",
    duration: "0m 45s",
    nextRun: "2024-01-22 04:00",
    status: "active",
  },
  {
    id: "JOB-007",
    name: "marketplace.payout_calc",
    schedule: "0 0 1 * *",
    description: "Calculate author payouts for the month",
    lastRun: "2024-01-01 00:00",
    duration: "12m 02s",
    nextRun: "2024-02-01 00:00",
    status: "active",
  },
  {
    id: "JOB-008",
    name: "secrets.rotation_check",
    schedule: "0 0 * * *",
    description: "Flag secrets approaching rotation deadline",
    lastRun: "2024-01-18 00:00",
    duration: "0m 03s",
    nextRun: "2024-01-19 00:00",
    status: "disabled",
  },
];

const recentRuns = [
  { jobId: "JOB-001", run: "2024-01-18 02:00", duration: "4m 12s", status: "completed" },
  { jobId: "JOB-002", run: "2024-01-18 14:30", duration: "0m 08s", status: "completed" },
  { jobId: "JOB-003", run: "2024-01-18 06:00", duration: "1m 48s", status: "completed" },
  { jobId: "JOB-004", run: "2024-01-18 09:00", duration: "2m 30s", status: "completed" },
  { jobId: "JOB-002", run: "2024-01-18 14:00", duration: "0m 07s", status: "completed" },
  { jobId: "JOB-001", run: "2024-01-17 02:00", duration: "4m 04s", status: "completed" },
];

function AdminSchedulerPage() {
  const [isPausing, setIsPausing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  const handlePauseAll = async () => {
    if (!confirm("Are you sure you want to pause all jobs?")) {
      return;
    }
    setIsPausing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("All jobs paused");
    } catch (error) {
      toast.error("Failed to pause jobs");
    } finally {
      setIsPausing(false);
    }
  };

  const handleNewJob = async () => {
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("New job created successfully");
    } catch (error) {
      toast.error("Failed to create job");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunNow = async (name: string, id: string) => {
    setRunningId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`${name} triggered manually`);
    } catch (error) {
      toast.error("Failed to trigger job");
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scheduler / Cron Engine</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePauseAll} disabled={isPausing}>
            {isPausing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Pause className="mr-2 h-4 w-4" />
            )}
            {isPausing ? "Pausing..." : "Pause All"}
          </Button>
          <Button onClick={handleNewJob} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "New Job"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value="8"
          icon={Clock}
          change="Across all categories"
          changeType="neutral"
        />
        <StatCard
          title="Successful (24h)"
          value="14"
          icon={CheckCircle}
          change="100% success rate"
          changeType="positive"
        />
        <StatCard
          title="Failed (24h)"
          value="0"
          icon={AlertTriangle}
          change="No failures"
          changeType="positive"
        />
        <StatCard
          title="Next Run"
          value="in 24m"
          icon={PlayCircle}
          change="cleanup.expired_sessions"
          changeType="neutral"
        />
      </div>

      <DataTable
        title="Registered Jobs"
        columns={[
          {
            header: "Job",
            accessorKey: "name",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.name}</code>
            ),
          },
          {
            header: "Schedule",
            accessorKey: "schedule",
            cell: ({ row }) => <code className="text-xs font-mono">{row.original.schedule}</code>,
          },
          { header: "Description", accessorKey: "description" },
          { header: "Last Run", accessorKey: "lastRun" },
          { header: "Duration", accessorKey: "duration" },
          { header: "Next Run", accessorKey: "nextRun" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRunNow(row.original.name, row.original.id)}
                disabled={runningId === row.original.id}
              >
                {runningId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Play className="mr-1 h-3 w-3" />
                )}
                {runningId === row.original.id ? "Running..." : "Run Now"}
              </Button>
            ),
          },
        ]}
        data={jobs}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentRuns.map((run, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={run.status} />
                  <div>
                    <p className="text-sm font-mono font-medium">{run.jobId}</p>
                    <p className="text-xs text-muted-foreground">
                      {run.run} · {run.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
