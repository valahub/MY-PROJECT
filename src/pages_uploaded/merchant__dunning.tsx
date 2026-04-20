
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, AlertTriangle, Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: MerchantDunningPage,
  head: () => ({ meta: [{ title: "Dunning — Merchant — ERP Vala" }] }),
});

const queue = [
  {
    id: "DUN-101",
    customer: "alice@web.com",
    invoice: "INV-2024-204",
    amount: "$99.00",
    attempt: 1,
    nextRetry: "2024-01-19 09:00",
    stage: "retry_day_1",
    status: "pending",
  },
  {
    id: "DUN-102",
    customer: "sam@test.com",
    invoice: "INV-2024-206",
    amount: "$29.00",
    attempt: 2,
    nextRetry: "2024-01-21 09:00",
    stage: "retry_day_3",
    status: "pending",
  },
  {
    id: "DUN-103",
    customer: "kim@startup.io",
    invoice: "INV-2024-209",
    amount: "$149.00",
    attempt: 3,
    nextRetry: "Grace period",
    stage: "grace_period",
    status: "past_due",
  },
];

function MerchantDunningPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Schedule saved successfully");
    } catch (error) {
      toast.error("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Failed Payment Recovery</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="In Recovery"
          value="14"
          icon={RefreshCw}
          change="$2,340 at risk"
          changeType="neutral"
        />
        <StatCard title="Recovery Rate" value="68%" icon={TrendingUp} changeType="positive" />
        <StatCard
          title="Auto Cancel"
          value="3"
          icon={AlertTriangle}
          change="This month"
          changeType="negative"
        />
        <StatCard
          title="Dunning Emails"
          value="42"
          icon={Mail}
          change="Sent (7d)"
          changeType="neutral"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retry Schedule (Customizable)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border p-3">
              <label className="text-xs text-muted-foreground">Attempt 1</label>
              <Input defaultValue="Day 1" />
            </div>
            <div className="rounded-lg border p-3">
              <label className="text-xs text-muted-foreground">Attempt 2</label>
              <Input defaultValue="Day 3" />
            </div>
            <div className="rounded-lg border p-3">
              <label className="text-xs text-muted-foreground">Attempt 3</label>
              <Input defaultValue="Day 7" />
            </div>
            <div className="rounded-lg border p-3">
              <label className="text-xs text-muted-foreground">Auto-cancel</label>
              <Input defaultValue="Day 10" />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSaveSchedule} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSaving ? "Saving..." : "Save Schedule"}
          </Button>
        </CardContent>
      </Card>

      <DataTable
        title="Active Recovery Queue"
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
        data={queue}
      />
    </div>
  );
}
