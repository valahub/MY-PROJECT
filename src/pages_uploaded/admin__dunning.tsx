
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Clock, XCircle, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminDunningPage,
  head: () => ({ meta: [{ title: "Dunning — Admin — ERP Vala" }] }),
});

const dunningQueue = [
  {
    id: "DUN-001",
    customer: "alice@web.com",
    invoice: "INV-2024-004",
    amount: "$99.00",
    attempt: 1,
    nextRetry: "2024-01-19 09:00",
    stage: "retry_day_1",
    status: "pending",
  },
  {
    id: "DUN-002",
    customer: "sam@test.com",
    invoice: "INV-2024-006",
    amount: "$29.00",
    attempt: 2,
    nextRetry: "2024-01-21 09:00",
    stage: "retry_day_3",
    status: "pending",
  },
  {
    id: "DUN-003",
    customer: "kim@startup.io",
    invoice: "INV-2024-009",
    amount: "$149.00",
    attempt: 3,
    nextRetry: "2024-01-25 09:00",
    stage: "retry_day_7",
    status: "past_due",
  },
  {
    id: "DUN-004",
    customer: "leo@corp.com",
    invoice: "INV-2024-012",
    amount: "$599.00",
    attempt: 3,
    nextRetry: "Grace period",
    stage: "grace_period",
    status: "past_due",
  },
  {
    id: "DUN-005",
    customer: "max@dev.com",
    invoice: "INV-2024-015",
    amount: "$49.00",
    attempt: 4,
    nextRetry: "—",
    stage: "auto_cancel",
    status: "canceled",
  },
];

function AdminDunningPage() {
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleConfigureSchedule = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Schedule configured successfully");
    } catch (error) {
      toast.error("Failed to configure schedule");
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dunning Management</h1>
        <Button variant="outline" onClick={handleConfigureSchedule} disabled={isConfiguring}>
          {isConfiguring ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          {isConfiguring ? "Configuring..." : "Configure Schedule"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="In Retry"
          value="34"
          icon={RefreshCw}
          change="$8,450 at risk"
          changeType="neutral"
        />
        <StatCard
          title="Grace Period"
          value="12"
          icon={Clock}
          change="3-day grace window"
          changeType="neutral"
        />
        <StatCard
          title="Recovered (30d)"
          value="$24,500"
          icon={AlertTriangle}
          change="68% recovery rate"
          changeType="positive"
        />
        <StatCard
          title="Auto Canceled"
          value="8"
          icon={XCircle}
          change="After 4 attempts"
          changeType="negative"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retry Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Day 1</p>
              <p className="text-xs text-muted-foreground">First retry attempt</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Day 3</p>
              <p className="text-xs text-muted-foreground">Second retry + email</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Day 7</p>
              <p className="text-xs text-muted-foreground">Final retry + warning</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Day 10</p>
              <p className="text-xs text-muted-foreground">Auto cancel + revoke</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Dunning Queue"
        columns={[
          { header: "Customer", accessorKey: "customer" },
          { header: "Invoice", accessorKey: "invoice" },
          { header: "Amount", accessorKey: "amount" },
          { header: "Attempt", accessorKey: "attempt" },
          {
            header: "Stage",
            accessorKey: "stage",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.stage}</code>
            ),
          },
          { header: "Next Retry", accessorKey: "nextRetry" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={dunningQueue}
      />
    </div>
  );
}
