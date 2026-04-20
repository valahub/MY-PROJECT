
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { GitMerge, CheckCircle, ArrowLeftRight, RotateCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminDeploymentsPage,
  head: () => ({
    meta: [{ title: "Deployments — Admin — ERP Vala" }],
  }),
});

const deployments = [
  {
    id: "DEP-001",
    version: "v2.14.0",
    slot: "green",
    deployedBy: "ci@erpvala.com",
    deployedAt: "2024-01-18 14:00",
    healthChecks: "12/12",
    traffic: "100%",
    status: "active",
  },
  {
    id: "DEP-002",
    version: "v2.13.5",
    slot: "blue",
    deployedBy: "ci@erpvala.com",
    deployedAt: "2024-01-15 10:30",
    healthChecks: "12/12",
    traffic: "0%",
    status: "inactive",
  },
  {
    id: "DEP-003",
    version: "v2.13.4",
    slot: "blue",
    deployedBy: "ci@erpvala.com",
    deployedAt: "2024-01-12 09:00",
    healthChecks: "12/12",
    traffic: "0%",
    status: "archived",
  },
  {
    id: "DEP-004",
    version: "v2.13.3",
    slot: "green",
    deployedBy: "ci@erpvala.com",
    deployedAt: "2024-01-10 16:20",
    healthChecks: "12/12",
    traffic: "0%",
    status: "archived",
  },
  {
    id: "DEP-005",
    version: "v2.13.2",
    slot: "blue",
    deployedBy: "ci@erpvala.com",
    deployedAt: "2024-01-08 11:10",
    healthChecks: "11/12",
    traffic: "0%",
    status: "archived",
  },
];

function AdminDeploymentsPage() {
  const [currentSlot, setCurrentSlot] = useState<"blue" | "green">("green");
  const [isPromoting, setIsPromoting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  const promote = async () => {
    setIsPromoting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const next = currentSlot === "green" ? "blue" : "green";
      setCurrentSlot(next);
      toast.success(`Traffic switched to ${next} slot (v2.13.5). Zero downtime.`);
    } catch (error) {
      toast.error("Failed to promote deployment");
    } finally {
      setIsPromoting(false);
    }
  };

  const rollback = async () => {
    if (!confirm("Are you sure you want to rollback to previous deployment?")) {
      return;
    }
    setIsRollingBack(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Rolled back to previous deployment. Traffic restored.");
    } catch (error) {
      toast.error("Failed to rollback deployment");
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleTableRollback = async (version: string, id: string) => {
    if (!confirm(`Are you sure you want to rollback to ${version}?`)) {
      return;
    }
    setRollingBackId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Rolled back to ${version}. Traffic restored.`);
    } catch (error) {
      toast.error("Failed to rollback deployment");
    } finally {
      setRollingBackId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zero-Downtime Deployments</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-destructive border-destructive/50 hover:bg-destructive hover:text-white"
            onClick={rollback}
            disabled={isRollingBack}
          >
            {isRollingBack ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isRollingBack ? "Rolling back..." : "Rollback"}
          </Button>
          <Button onClick={promote} disabled={isPromoting}>
            {isPromoting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="mr-2 h-4 w-4" />
            )}
            {isPromoting ? "Promoting..." : "Promote & Switch Traffic"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Slot"
          value={currentSlot.toUpperCase()}
          icon={GitMerge}
          change="v2.14.0"
          changeType="positive"
        />
        <StatCard
          title="Uptime"
          value="99.98%"
          icon={CheckCircle}
          change="Last 30 days"
          changeType="positive"
        />
        <StatCard
          title="Last Deploy"
          value="4h ago"
          icon={ArrowLeftRight}
          change="v2.14.0 to green"
          changeType="neutral"
        />
        <StatCard
          title="Last Rollback"
          value="12d ago"
          icon={RotateCcw}
          change="v2.12.1 → v2.11.8"
          changeType="neutral"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <span
                className={`inline-flex items-center gap-2 ${currentSlot === "blue" ? "text-primary" : "text-success"}`}
              >
                <span className="h-3 w-3 rounded-full bg-current" />
                {currentSlot === "blue" ? "Blue" : "Green"} — Active (
                {currentSlot === "blue" ? "v2.13.5" : "v2.14.0"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Traffic", value: "100%" },
                { label: "Instances", value: "8" },
                { label: "Health Checks", value: "12/12 passing" },
                { label: "Avg Response", value: "82ms" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between text-sm border-b pb-1 last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <span className={`inline-flex items-center gap-2 text-muted-foreground`}>
                <span className="h-3 w-3 rounded-full bg-current" />
                {currentSlot === "blue" ? "Green" : "Blue"} — Standby (
                {currentSlot === "blue" ? "v2.14.0" : "v2.13.5"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Traffic", value: "0%" },
                { label: "Instances", value: "8 (warm)" },
                { label: "Health Checks", value: "12/12 passing" },
                { label: "Ready to Promote", value: "Yes" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between text-sm border-b pb-1 last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="Deployment History"
        columns={[
          { header: "Version", accessorKey: "version" },
          {
            header: "Slot",
            accessorKey: "slot",
            cell: ({ row }) => (
              <span
                className={`text-xs font-bold uppercase ${row.original.slot === "blue" ? "text-primary" : "text-success"}`}
              >
                {row.original.slot}
              </span>
            ),
          },
          { header: "Deployed By", accessorKey: "deployedBy" },
          { header: "Deployed At", accessorKey: "deployedAt" },
          { header: "Health", accessorKey: "healthChecks" },
          { header: "Traffic", accessorKey: "traffic" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) =>
              row.original.status === "archived" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTableRollback(row.original.version, row.original.id)}
                  disabled={rollingBackId === row.original.id}
                >
                  {rollingBackId === row.original.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {rollingBackId === row.original.id ? "Rolling back..." : "Rollback"}
                </Button>
              ) : null,
          },
        ]}
        data={deployments}
      />
    </div>
  );
}
