
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Zap, AlertTriangle, CheckCircle, ArrowRightLeft, RotateCcw, Loader2, Plus } from "lucide-react";
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
  component: AdminGatewaysPage,
  head: () => ({ meta: [{ title: "Payment Gateways — Admin — ERP Vala" }] }),
});

const gatewaySuccessRate = [
  { hour: "08:00", stripe: 99.4, braintree: 98.7, paypal: 97.2, adyen: 99.1 },
  { hour: "09:00", stripe: 99.6, braintree: 98.9, paypal: 97.5, adyen: 99.3 },
  { hour: "10:00", stripe: 99.3, braintree: 98.5, paypal: 96.8, adyen: 99.2 },
  { hour: "11:00", stripe: 99.7, braintree: 99.1, paypal: 97.9, adyen: 99.5 },
  { hour: "12:00", stripe: 99.5, braintree: 98.8, paypal: 97.4, adyen: 99.4 },
  { hour: "13:00", stripe: 99.8, braintree: 99.2, paypal: 98.0, adyen: 99.6 },
  { hour: "14:00", stripe: 99.6, braintree: 99.0, paypal: 97.7, adyen: 99.4 },
];

const gateways = [
  {
    id: "GW-001",
    name: "Stripe",
    region: "Global",
    successRate: "99.6%",
    avgResponse: "142ms",
    txn24h: "18,450",
    cost: "$0.30 + 2.9%",
    weight: 60,
    status: "active",
  },
  {
    id: "GW-002",
    name: "Braintree",
    region: "US / EU",
    successRate: "99.0%",
    avgResponse: "178ms",
    txn24h: "6,820",
    cost: "$0.30 + 2.59%",
    weight: 25,
    status: "active",
  },
  {
    id: "GW-003",
    name: "Adyen",
    region: "EU / APAC",
    successRate: "99.4%",
    avgResponse: "165ms",
    txn24h: "3,210",
    cost: "Interchange + 0.3%",
    weight: 10,
    status: "active",
  },
  {
    id: "GW-004",
    name: "PayPal",
    region: "Global",
    successRate: "97.7%",
    avgResponse: "295ms",
    txn24h: "1,540",
    cost: "$0.49 + 3.49%",
    weight: 5,
    status: "active",
  },
  {
    id: "GW-005",
    name: "Checkout.com",
    region: "Standby",
    successRate: "—",
    avgResponse: "—",
    txn24h: "0",
    cost: "Interchange +0.2%",
    weight: 0,
    status: "inactive",
  },
];

const routingPolicies = [
  {
    id: "POL-001",
    name: "Default routing",
    condition: "All transactions",
    primary: "Stripe",
    fallback: "Braintree",
    strategy: "Success rate weighted",
    status: "active",
  },
  {
    id: "POL-002",
    name: "EU geo routing",
    condition: "Billing country: EU",
    primary: "Adyen",
    fallback: "Stripe",
    strategy: "Geo + cost optimised",
    status: "active",
  },
  {
    id: "POL-003",
    name: "High-value routing",
    condition: "Amount > $500",
    primary: "Stripe",
    fallback: "Adyen",
    strategy: "Success rate priority",
    status: "active",
  },
  {
    id: "POL-004",
    name: "PayPal wallet",
    condition: "Payment method: PayPal",
    primary: "PayPal",
    fallback: "Stripe",
    strategy: "Method match",
    status: "active",
  },
  {
    id: "POL-005",
    name: "Cost optimised (low value)",
    condition: "Amount < $20",
    primary: "Braintree",
    fallback: "Stripe",
    strategy: "Lowest cost",
    status: "inactive",
  },
];

const failoverEvents = [
  {
    id: "FOV-028",
    from: "PayPal",
    to: "Stripe",
    reason: "Timeout > 5s",
    txnId: "TXN-88760",
    amount: "$149.00",
    retryOutcome: "completed",
    timestamp: "2024-01-18 13:42",
  },
  {
    id: "FOV-027",
    from: "Braintree",
    to: "Stripe",
    reason: "5xx error (gateway down)",
    txnId: "TXN-88621",
    amount: "$299.00",
    retryOutcome: "completed",
    timestamp: "2024-01-18 11:17",
  },
  {
    id: "FOV-026",
    from: "Adyen",
    to: "Stripe",
    reason: "Declined — try alternate",
    txnId: "TXN-88540",
    amount: "$89.00",
    retryOutcome: "completed",
    timestamp: "2024-01-18 09:55",
  },
  {
    id: "FOV-025",
    from: "Stripe",
    to: "Braintree",
    reason: "Elevated 5xx (2 min window)",
    txnId: "TXN-88410",
    amount: "$599.00",
    retryOutcome: "completed",
    timestamp: "2024-01-17 22:30",
  },
  {
    id: "FOV-024",
    from: "PayPal",
    to: "Stripe",
    reason: "Connection refused",
    txnId: "TXN-88290",
    amount: "$49.00",
    retryOutcome: "failed",
    timestamp: "2024-01-17 19:11",
  },
];

const SECONDARY = "#0033A1";
const INFO = "#00A7E1";
const SUCCESS = "#2ED9C3";
const PRIMARY = "#EB0045";

function AdminGatewaysPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingPolicies, setIsEditingPolicies] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddGateway = async () => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Gateway added successfully");
    } catch (error) {
      toast.error("Failed to add gateway");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditPolicies = async () => {
    setIsEditingPolicies(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Routing policies updated successfully");
    } catch (error) {
      toast.error("Failed to update routing policies");
    } finally {
      setIsEditingPolicies(false);
    }
  };

  const handleSimulateFailover = async () => {
    setIsSimulating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Failover simulation completed");
    } catch (error) {
      toast.error("Failed to simulate failover");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Multi-Gateway Failover Routing</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
          <Button onClick={handleAddGateway} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAdding ? "Adding..." : "Add Gateway"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Gateways"
          value="4"
          icon={Globe}
          change="1 on standby"
          changeType="neutral"
        />
        <StatCard
          title="Success Rate (24h)"
          value="99.2%"
          icon={CheckCircle}
          change="Weighted avg across gateways"
          changeType="positive"
        />
        <StatCard
          title="Failover Events (24h)"
          value="3"
          icon={ArrowRightLeft}
          change="All recovered successfully"
          changeType="positive"
        />
        <StatCard
          title="Avg Response"
          value="165ms"
          icon={Zap}
          change="-12ms vs yesterday"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gateway Success Rate % (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={gatewaySuccessRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} domain={[96, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey="stripe" name="Stripe" fill={SECONDARY} radius={[2, 2, 0, 0]} />
              <Bar dataKey="braintree" name="Braintree" fill={INFO} radius={[2, 2, 0, 0]} />
              <Bar dataKey="adyen" name="Adyen" fill={SUCCESS} radius={[2, 2, 0, 0]} />
              <Bar dataKey="paypal" name="PayPal" fill={PRIMARY} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <DataTable
        title="Gateway Health"
        columns={[
          { header: "Gateway", accessorKey: "name" },
          { header: "Region", accessorKey: "region" },
          { header: "Success Rate", accessorKey: "successRate" },
          { header: "Avg Response", accessorKey: "avgResponse" },
          { header: "Txns (24h)", accessorKey: "txn24h" },
          { header: "Cost", accessorKey: "cost" },
          {
            header: "Route Weight",
            accessorKey: "weight",
            cell: ({ row }) => <span className="font-mono">{row.original.weight}%</span>,
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={gateways}
      />

      <DataTable
        title="Routing Policies"
        columns={[
          { header: "Policy", accessorKey: "name" },
          { header: "Condition", accessorKey: "condition" },
          { header: "Primary", accessorKey: "primary" },
          { header: "Fallback", accessorKey: "fallback" },
          { header: "Strategy", accessorKey: "strategy" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={routingPolicies}
      />

      <DataTable
        title="Failover Event Log"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "From", accessorKey: "from" },
          { header: "To", accessorKey: "to" },
          { header: "Reason", accessorKey: "reason" },
          { header: "Transaction", accessorKey: "txnId" },
          { header: "Amount", accessorKey: "amount" },
          {
            header: "Retry Outcome",
            accessorKey: "retryOutcome",
            cell: ({ row }) => <StatusBadge status={row.original.retryOutcome} />,
          },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={failoverEvents}
      />

      <Card>
        <CardHeader>
          <CardTitle>Retry Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="flex justify-between rounded-md border p-3">
              <span className="text-muted-foreground">Max retries per txn</span>
              <span className="font-medium">2</span>
            </div>
            <div className="flex justify-between rounded-md border p-3">
              <span className="text-muted-foreground">Failover timeout</span>
              <span className="font-medium">5s</span>
            </div>
            <div className="flex justify-between rounded-md border p-3">
              <span className="text-muted-foreground">Health check interval</span>
              <span className="font-medium">30s</span>
            </div>
            <div className="flex justify-between rounded-md border p-3">
              <span className="text-muted-foreground">Circuit breaker threshold</span>
              <span className="font-medium">5 failures / min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleEditPolicies} disabled={isEditingPolicies}>
          {isEditingPolicies ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          {isEditingPolicies ? "Editing..." : "Edit Routing Policies"}
        </Button>
        <Button variant="outline" onClick={handleSimulateFailover} disabled={isSimulating}>
          {isSimulating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="mr-2 h-4 w-4" />
          )}
          {isSimulating ? "Simulating..." : "Simulate Failover"}
        </Button>
      </div>
    </div>
  );
}
