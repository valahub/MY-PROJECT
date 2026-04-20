
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, Server, Zap, Loader2, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminCostOptimizationPage,
  head: () => ({
    meta: [{ title: "Cost Optimization — Admin — ERP Vala" }],
  }),
});

const resourceCosts = [
  {
    id: "RES-001",
    service: "api-gateway",
    type: "Compute",
    instances: "8",
    monthlyCost: "$340",
    utilization: "62%",
    recommendation: "Downscale to 6 instances",
    savingEst: "$85/mo",
    status: "active",
  },
  {
    id: "RES-002",
    service: "search-service",
    type: "Compute",
    instances: "4",
    monthlyCost: "$580",
    utilization: "78%",
    recommendation: "Optimal — no change",
    savingEst: "—",
    status: "active",
  },
  {
    id: "RES-003",
    service: "db-primary",
    type: "Database",
    instances: "1",
    monthlyCost: "$1,240",
    utilization: "48%",
    recommendation: "Switch to smaller instance class",
    savingEst: "$310/mo",
    status: "active",
  },
  {
    id: "RES-004",
    service: "billing-service",
    type: "Compute",
    instances: "3",
    monthlyCost: "$180",
    utilization: "23%",
    recommendation: "Downscale to 2 instances",
    savingEst: "$60/mo",
    status: "active",
  },
  {
    id: "RES-005",
    service: "object-storage",
    type: "Storage",
    instances: "—",
    monthlyCost: "$820",
    utilization: "91%",
    recommendation: "Archive cold data to S3 Glacier",
    savingEst: "$200/mo",
    status: "active",
  },
  {
    id: "RES-006",
    service: "event-bus-kafka",
    type: "Managed Service",
    instances: "3",
    monthlyCost: "$490",
    utilization: "35%",
    recommendation: "Use smaller broker tier",
    savingEst: "$120/mo",
    status: "pending",
  },
];

const scalingRules = [
  {
    service: "api-gateway",
    metric: "CPU > 70%",
    scaleOut: "+2 instances",
    scaleIn: "CPU < 30% for 5m",
    minInstances: "4",
    maxInstances: "20",
    status: "active",
  },
  {
    service: "search-service",
    metric: "Queue depth > 500",
    scaleOut: "+1 instance",
    scaleIn: "Queue < 50 for 10m",
    minInstances: "2",
    maxInstances: "8",
    status: "active",
  },
  {
    service: "billing-service",
    metric: "Renewal queue > 1000",
    scaleOut: "+2 instances",
    scaleIn: "Queue empty for 15m",
    minInstances: "2",
    maxInstances: "10",
    status: "active",
  },
  {
    service: "webhook-worker",
    metric: "DLQ depth > 50",
    scaleOut: "+1 instance",
    scaleIn: "DLQ empty for 5m",
    minInstances: "1",
    maxInstances: "6",
    status: "disabled",
  },
];

function AdminCostOptimizationPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Cost report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyRecommendations = async () => {
    if (!confirm("Are you sure you want to apply all optimization recommendations?")) {
      return;
    }
    setIsApplying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Optimization plan applied successfully");
    } catch (error) {
      toast.error("Failed to apply recommendations");
    } finally {
      setIsApplying(false);
    }
  };

  const handleEditRule = async (service: string) => {
    setEditingId(service);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${service} rule updated successfully`);
    } catch (error) {
      toast.error("Failed to update rule");
    } finally {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cost Optimization</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
          <Button onClick={handleApplyRecommendations} disabled={isApplying}>
            {isApplying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isApplying ? "Applying..." : "Apply Recommendations"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Spend"
          value="$3,650"
          icon={DollarSign}
          change="+3.2% vs last month"
          changeType="negative"
        />
        <StatCard
          title="Potential Savings"
          value="$775/mo"
          icon={TrendingDown}
          change="21% reduction possible"
          changeType="positive"
        />
        <StatCard
          title="Active Resources"
          value="24"
          icon={Server}
          change="Across 6 services"
          changeType="neutral"
        />
        <StatCard
          title="Autoscale Events (24h)"
          value="18"
          icon={Zap}
          change="12 scale-out · 6 scale-in"
          changeType="positive"
        />
      </div>

      <DataTable
        title="Resource Cost Analysis"
        columns={[
          { header: "Service", accessorKey: "service" },
          { header: "Type", accessorKey: "type" },
          { header: "Instances", accessorKey: "instances" },
          { header: "Monthly Cost", accessorKey: "monthlyCost" },
          {
            header: "Utilization",
            accessorKey: "utilization",
            cell: ({ row }) => {
              const u = parseInt(row.original.utilization);
              const color = u < 30 ? "text-destructive" : u > 80 ? "text-accent" : "text-success";
              return <span className={`font-mono ${color}`}>{row.original.utilization}</span>;
            },
          },
          { header: "Recommendation", accessorKey: "recommendation" },
          {
            header: "Est. Saving",
            accessorKey: "savingEst",
            cell: ({ row }) => (
              <span className={row.original.savingEst !== "—" ? "text-success font-medium" : ""}>
                {row.original.savingEst}
              </span>
            ),
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={resourceCosts}
      />

      <DataTable
        title="Autoscaling Rules"
        columns={[
          { header: "Service", accessorKey: "service" },
          {
            header: "Scale-Out Trigger",
            accessorKey: "metric",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.metric}</code>
            ),
          },
          { header: "Scale-Out Action", accessorKey: "scaleOut" },
          { header: "Scale-In Condition", accessorKey: "scaleIn" },
          { header: "Min", accessorKey: "minInstances" },
          { header: "Max", accessorKey: "maxInstances" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          {
            header: "",
            accessorKey: "service",
            cell: ({ row }) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditRule(row.original.service)}
                disabled={editingId === row.original.service}
              >
                {editingId === row.original.service ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                {editingId === row.original.service ? "Updating..." : "Edit"}
              </Button>
            ),
          },
        ]}
        data={scalingRules}
      />

      <Card>
        <CardHeader>
          <CardTitle>Budget Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { threshold: "80% of budget", action: "Email ops team", status: "active" },
              {
                threshold: "95% of budget",
                action: "Page on-call + freeze non-critical resources",
                status: "active",
              },
              {
                threshold: "100% of budget",
                action: "Auto-suspend non-essential services",
                status: "disabled",
              },
            ].map((a) => (
              <div key={a.threshold} className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">{a.threshold}</p>
                <p className="text-xs text-muted-foreground">{a.action}</p>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminCostOptimizationPage;
