
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, Cpu, Zap, AlertTriangle, Loader2, Settings, Search } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminCostGovernorPage,
  head: () => ({ meta: [{ title: "Auto Cost Governor — Admin — ERP Vala" }] }),
});

const costTrend = [
  { month: "Jul", budget: 12000, actual: 11800, optimized: 9400 },
  { month: "Aug", budget: 12000, actual: 12100, optimized: 9700 },
  { month: "Sep", budget: 13000, actual: 12900, optimized: 10200 },
  { month: "Oct", budget: 13000, actual: 11500, optimized: 9100 },
  { month: "Nov", budget: 14000, actual: 13800, optimized: 10900 },
  { month: "Dec", budget: 14000, actual: 13200, optimized: 10400 },
];

const wasteItems = [
  {
    id: "WS-001",
    resource: "Idle read replica (us-east-1)",
    type: "database",
    wasteCost: "$620/mo",
    action: "Terminate replica",
    savingsPct: "100%",
    autoFix: "approved",
    status: "resolved",
  },
  {
    id: "WS-002",
    resource: "Over-provisioned K8s node pool",
    type: "compute",
    wasteCost: "$1,240/mo",
    action: "Downsize from 16× to 8× vCPU nodes",
    savingsPct: "50%",
    autoFix: "pending-approval",
    status: "pending",
  },
  {
    id: "WS-003",
    resource: "Unused object storage bucket (> 6 mo)",
    type: "storage",
    wasteCost: "$180/mo",
    action: "Archive to cold storage",
    savingsPct: "85%",
    autoFix: "approved",
    status: "resolved",
  },
  {
    id: "WS-004",
    resource: "Orphaned static IP addresses (×4)",
    type: "network",
    wasteCost: "$48/mo",
    action: "Release unused IPs",
    savingsPct: "100%",
    autoFix: "approved",
    status: "resolved",
  },
  {
    id: "WS-005",
    resource: "Log retention > 365 days",
    type: "storage",
    wasteCost: "$340/mo",
    action: "Enforce 90-day retention policy",
    savingsPct: "75%",
    autoFix: "pending-approval",
    status: "pending",
  },
];

const NAVY = "#00205C";
const PRIMARY = "#EB0045";
const SUCCESS = "#2ED9C3";

function AdminCostGovernorPage() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleConfigureAlerts = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Budget alerts configured successfully");
    } catch (error) {
      toast.error("Failed to configure budget alerts");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Waste scan completed successfully");
    } catch (error) {
      toast.error("Failed to run waste scan");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Auto Cost Governor</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleConfigureAlerts} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Budget Alerts"}
          </Button>
          <Button onClick={handleRunScan} disabled={isScanning}>
            {isScanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {isScanning ? "Scanning..." : "Run Waste Scan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Spend"
          value="$13,200"
          icon={DollarSign}
          change="-$600 vs budget"
          changeType="positive"
        />
        <StatCard
          title="Waste Detected"
          value="$2,428"
          icon={AlertTriangle}
          change="17% of total spend"
          changeType="negative"
        />
        <StatCard
          title="Savings Applied"
          value="$1,188"
          icon={TrendingDown}
          change="This month (auto-fixed)"
          changeType="positive"
        />
        <StatCard
          title="Pending Actions"
          value="2"
          icon={Cpu}
          change="Awaiting approval"
          changeType="neutral"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual vs Optimized (6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill={NAVY} radius={[4, 4, 0, 0]} opacity={0.4} />
              <Bar dataKey="actual" name="Actual" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              <Bar dataKey="optimized" name="Optimized" fill={SUCCESS} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governance Guardrails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Budget Alerts</p>
              <p className="text-xs text-muted-foreground">
                Notify at 80% and 95% of monthly budget. Auto-pause non-critical background jobs at
                100%.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Auto-Fix Scope</p>
              <p className="text-xs text-muted-foreground">
                Low-risk optimisations (idle resources, orphaned assets) execute automatically.
                Structural changes (resize, delete) require human approval.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Rollback Safety</p>
              <p className="text-xs text-muted-foreground">
                All resource changes are logged and reversible. A 24-hour soft-delete grace period
                applies before permanent removal.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Blast Radius Limit</p>
              <p className="text-xs text-muted-foreground">
                No single automated action may affect more than 20% of a service's compute capacity
                without explicit approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Waste Items"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Resource", accessorKey: "resource" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.type}</code>
            ),
          },
          { header: "Waste Cost", accessorKey: "wasteCost" },
          { header: "Action", accessorKey: "action" },
          { header: "Savings", accessorKey: "savingsPct" },
          {
            header: "Auto-Fix",
            accessorKey: "autoFix",
            cell: ({ row }) => <StatusBadge status={row.original.autoFix} />,
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={wasteItems}
      />
    </div>
  );
}

export default AdminCostGovernorPage;
