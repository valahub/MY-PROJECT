import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Receipt,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Mock data (Paddle-style billing master) ────────────────────────────────
const revenueSeries = [
  { month: "Jul", mrr: 78400, arr: 940800, oneTime: 12300 },
  { month: "Aug", mrr: 82100, arr: 985200, oneTime: 14800 },
  { month: "Sep", mrr: 89500, arr: 1074000, oneTime: 11200 },
  { month: "Oct", mrr: 94200, arr: 1130400, oneTime: 16500 },
  { month: "Nov", mrr: 102800, arr: 1233600, oneTime: 18900 },
  { month: "Dec", mrr: 118400, arr: 1420800, oneTime: 22400 },
  { month: "Jan", mrr: 124500, arr: 1494000, oneTime: 19800 },
];

const churnSeries = [
  { month: "Jul", new: 142, churn: 38 },
  { month: "Aug", new: 168, churn: 41 },
  { month: "Sep", new: 195, churn: 35 },
  { month: "Oct", new: 211, churn: 49 },
  { month: "Nov", new: 248, churn: 52 },
  { month: "Dec", new: 289, churn: 44 },
  { month: "Jan", new: 312, churn: 47 },
];

const gatewayBreakdown = [
  { gateway: "Card", volume: 84200 },
  { gateway: "PayPal", volume: 22100 },
  { gateway: "Apple Pay", volume: 9800 },
  { gateway: "Google Pay", volume: 5400 },
  { gateway: "Wire", volume: 3000 },
];

const transactions = [
  { id: "TXN-9821", customer: "john@example.com", amount: "$299.00", gateway: "Card", status: "paid", date: "2024-01-15 14:22" },
  { id: "TXN-9820", customer: "jane@startup.io", amount: "$49.00", gateway: "PayPal", status: "paid", date: "2024-01-15 13:08" },
  { id: "TXN-9819", customer: "bob@corp.com", amount: "$149.00", gateway: "Card", status: "pending", date: "2024-01-15 12:51" },
  { id: "TXN-9818", customer: "alice@web.com", amount: "$99.00", gateway: "Card", status: "past_due", date: "2024-01-15 11:30" },
  { id: "TXN-9817", customer: "mike@dev.com", amount: "$599.00", gateway: "Apple Pay", status: "paid", date: "2024-01-15 10:14" },
  { id: "TXN-9816", customer: "sara@team.io", amount: "$199.00", gateway: "Card", status: "refunded", date: "2024-01-15 09:02" },
];

const subscriptions = [
  { id: "SUB-4421", customer: "Acme Corp", plan: "Enterprise", mrr: "$2,499", status: "active", renewal: "2024-02-12" },
  { id: "SUB-4420", customer: "Beta Inc", plan: "Pro", mrr: "$199", status: "active", renewal: "2024-02-09" },
  { id: "SUB-4419", customer: "Gamma LLC", plan: "Pro", mrr: "$199", status: "past_due", renewal: "2024-01-28" },
  { id: "SUB-4418", customer: "Delta Co", plan: "Starter", mrr: "$49", status: "active", renewal: "2024-02-04" },
  { id: "SUB-4417", customer: "Echo Ltd", plan: "Pro", mrr: "$199", status: "canceled", renewal: "—" },
];

const dunningQueue = [
  { invoice: "INV-2024-004", customer: "alice@web.com", amount: "$99.00", attempts: 2, nextRetry: "2024-01-19 09:00", status: "pending" },
  { invoice: "INV-2024-006", customer: "sam@test.com", amount: "$29.00", attempts: 3, nextRetry: "Grace period", status: "past_due" },
  { invoice: "INV-2024-009", customer: "lee@app.io", amount: "$199.00", attempts: 1, nextRetry: "2024-01-19 14:30", status: "pending" },
];

function AdminBillingPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Billing data exported successfully");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Paddle</h1>
            <Badge variant="secondary" className="gap-1">
              <Activity className="h-3 w-3" /> Master Billing
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Billing, subscriptions, payments & global control for all modules
          </p>
        </div>
        <Button variant="outline" onClick={handleExportAll} disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {isExporting ? "Exporting..." : "Export All"}
        </Button>
      </div>

      {/* Top KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="MRR" value="$124,500" icon={DollarSign} change="+5.2% MoM" changeType="positive" />
        <StatCard title="ARR" value="$1.49M" icon={TrendingUp} change="+18.2% YoY" changeType="positive" />
        <StatCard title="Active Subs" value="2,184" icon={CreditCard} change="+312 new" changeType="positive" />
        <StatCard title="Churn (30d)" value="2.1%" icon={TrendingDown} change="-0.4% vs prev" changeType="positive" />
      </div>

      {/* Secondary KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Invoices Issued" value="892" icon={Receipt} />
        <StatCard title="Pending Payments" value="34" icon={ArrowUpDown} change="$8,450 outstanding" changeType="neutral" />
        <StatCard title="Dunning Queue" value="3" icon={RefreshCw} change="Auto-retrying" changeType="neutral" />
        <StatCard title="Failed (24h)" value="7" icon={AlertTriangle} change="0.8% failure rate" changeType="negative" />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>MRR vs one-time revenue (last 7 months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" fill="url(#mrrGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="oneTime" stroke="hsl(var(--accent-foreground))" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gateway Volume</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gatewayBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="gateway" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subscription health + churn */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Net New Subscribers</CardTitle>
            <CardDescription>New vs churned per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Line type="monotone" dataKey="new" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="churn" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Health</CardTitle>
            <CardDescription>Status distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Active
                </span>
                <span className="font-medium">2,184 (87%)</span>
              </div>
              <Progress value={87} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Past Due
                </span>
                <span className="font-medium">142 (5.7%)</span>
              </div>
              <Progress value={5.7} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" /> Trial
                </span>
                <span className="font-medium">128 (5.1%)</span>
              </div>
              <Progress value={5.1} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" /> Canceled
                </span>
                <span className="font-medium">55 (2.2%)</span>
              </div>
              <Progress value={2.2} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Transactions / Subscriptions / Dunning */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="dunning">Dunning Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <DataTable
            title="Recent Transactions"
            columns={[
              { header: "Transaction", accessorKey: "id" },
              { header: "Customer", accessorKey: "customer" },
              { header: "Amount", accessorKey: "amount" },
              { header: "Gateway", accessorKey: "gateway" },
              {
                header: "Status",
                accessorKey: "status",
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
              { header: "Date", accessorKey: "date" },
            ]}
            data={transactions}
          />
        </TabsContent>

        <TabsContent value="subscriptions">
          <DataTable
            title="Active Subscriptions"
            columns={[
              { header: "Sub ID", accessorKey: "id" },
              { header: "Customer", accessorKey: "customer" },
              { header: "Plan", accessorKey: "plan" },
              { header: "MRR", accessorKey: "mrr" },
              {
                header: "Status",
                accessorKey: "status",
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
              { header: "Renewal", accessorKey: "renewal" },
            ]}
            data={subscriptions}
          />
        </TabsContent>

        <TabsContent value="dunning">
          <DataTable
            title="Payment Retry Queue"
            columns={[
              { header: "Invoice", accessorKey: "invoice" },
              { header: "Customer", accessorKey: "customer" },
              { header: "Amount", accessorKey: "amount" },
              { header: "Attempts", accessorKey: "attempts" },
              { header: "Next Retry", accessorKey: "nextRetry" },
              {
                header: "Status",
                accessorKey: "status",
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
            ]}
            data={dunningQueue}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminBillingPage;
