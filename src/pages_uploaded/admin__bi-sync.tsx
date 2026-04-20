
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, Cloud, CheckCircle, XCircle, Clock, Loader2, Play, Settings, FileText, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminBiSyncPage,
  head: () => ({ meta: [{ title: "BI Sync — Admin — ERP Vala" }] }),
});

const syncVolume = [
  { day: "Mon", records: 2100000 },
  { day: "Tue", records: 2350000 },
  { day: "Wed", records: 2280000 },
  { day: "Thu", records: 2410000 },
  { day: "Fri", records: 2390000 },
  { day: "Sat", records: 1870000 },
  { day: "Sun", records: 1620000 },
];

const etlJobs = [
  {
    id: "ETL-001",
    name: "transactions_fact",
    target: "Redshift — fact_transactions",
    schedule: "Hourly",
    lastRun: "2024-01-18 14:00",
    duration: "4m 12s",
    records: "128,450",
    status: "completed",
  },
  {
    id: "ETL-002",
    name: "subscriptions_fact",
    target: "Redshift — fact_subscriptions",
    schedule: "Hourly",
    lastRun: "2024-01-18 14:00",
    duration: "2m 38s",
    records: "42,100",
    status: "completed",
  },
  {
    id: "ETL-003",
    name: "customers_dim",
    target: "Redshift — dim_customers",
    schedule: "Daily 02:00",
    lastRun: "2024-01-18 02:00",
    duration: "8m 04s",
    records: "98,234",
    status: "completed",
  },
  {
    id: "ETL-004",
    name: "products_dim",
    target: "BigQuery — dim_products",
    schedule: "Daily 02:00",
    lastRun: "2024-01-18 02:00",
    duration: "3m 17s",
    records: "21,847",
    status: "completed",
  },
  {
    id: "ETL-005",
    name: "revenue_cohort",
    target: "Redshift — rpt_cohort_revenue",
    schedule: "Daily 03:00",
    lastRun: "2024-01-18 03:00",
    duration: "14m 50s",
    records: "Aggregated",
    status: "completed",
  },
  {
    id: "ETL-006",
    name: "fraud_signals_dim",
    target: "BigQuery — dim_fraud_signals",
    schedule: "Hourly",
    lastRun: "2024-01-18 14:00",
    duration: "—",
    records: "—",
    status: "failed",
  },
  {
    id: "ETL-007",
    name: "invoices_fact",
    target: "Redshift — fact_invoices",
    schedule: "Hourly",
    lastRun: "2024-01-18 14:00",
    duration: "—",
    records: "—",
    status: "pending",
  },
];

const connectors = [
  {
    id: "CON-001",
    name: "Power BI",
    type: "BI Tool",
    warehouse: "Redshift",
    lastSync: "2024-01-18 14:05",
    datasets: 12,
    status: "active",
  },
  {
    id: "CON-002",
    name: "Tableau Online",
    type: "BI Tool",
    warehouse: "Redshift",
    lastSync: "2024-01-18 14:05",
    datasets: 8,
    status: "active",
  },
  {
    id: "CON-003",
    name: "Amazon Redshift",
    type: "Warehouse",
    warehouse: "Primary",
    lastSync: "2024-01-18 14:00",
    datasets: 34,
    status: "active",
  },
  {
    id: "CON-004",
    name: "Google BigQuery",
    type: "Warehouse",
    warehouse: "Secondary",
    lastSync: "2024-01-18 14:00",
    datasets: 18,
    status: "active",
  },
  {
    id: "CON-005",
    name: "Looker Studio",
    type: "BI Tool",
    warehouse: "BigQuery",
    lastSync: "2024-01-17 22:00",
    datasets: 5,
    status: "inactive",
  },
];

const schemaModels = [
  {
    table: "fact_transactions",
    type: "Fact",
    rows: "48.2M",
    grain: "Per transaction",
    refresh: "Hourly",
  },
  {
    table: "fact_subscriptions",
    type: "Fact",
    rows: "12.4M",
    grain: "Per subscription event",
    refresh: "Hourly",
  },
  {
    table: "fact_invoices",
    type: "Fact",
    rows: "8.9M",
    grain: "Per invoice line",
    refresh: "Hourly",
  },
  {
    table: "dim_customers",
    type: "Dimension",
    rows: "98.2K",
    grain: "Per customer",
    refresh: "Daily",
  },
  {
    table: "dim_products",
    type: "Dimension",
    rows: "21.8K",
    grain: "Per product version",
    refresh: "Daily",
  },
  {
    table: "dim_date",
    type: "Dimension",
    rows: "3.6K",
    grain: "Per calendar day",
    refresh: "Static",
  },
  {
    table: "rpt_cohort_revenue",
    type: "Report",
    rows: "Aggregated",
    grain: "Cohort × Month",
    refresh: "Daily",
  },
  {
    table: "rpt_merchant_summary",
    type: "Report",
    rows: "Aggregated",
    grain: "Merchant × Day",
    refresh: "Daily",
  },
];

const INFO = "#00A7E1";

function AdminBiSyncPage() {
  const [isRunningJobs, setIsRunningJobs] = useState(false);
  const [isConfiguringConnectors, setIsConfiguringConnectors] = useState(false);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isViewingLogs, setIsViewingLogs] = useState(false);
  const [isManagingSchedules, setIsManagingSchedules] = useState(false);

  const handleRunAllJobs = async () => {
    setIsRunningJobs(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("All ETL jobs triggered successfully");
    } catch (error) {
      toast.error("Failed to run jobs");
    } finally {
      setIsRunningJobs(false);
    }
  };

  const handleConfigureConnectors = async () => {
    setIsConfiguringConnectors(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Connectors configured successfully");
    } catch (error) {
      toast.error("Failed to configure connectors");
    } finally {
      setIsConfiguringConnectors(false);
    }
  };

  const handleAddJob = async () => {
    setIsAddingJob(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("ETL job added successfully");
    } catch (error) {
      toast.error("Failed to add ETL job");
    } finally {
      setIsAddingJob(false);
    }
  };

  const handleViewLogs = async () => {
    setIsViewingLogs(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Sync logs loaded");
    } catch (error) {
      toast.error("Failed to load sync logs");
    } finally {
      setIsViewingLogs(false);
    }
  };

  const handleManageSchedules = async () => {
    setIsManagingSchedules(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Schedule management opened");
    } catch (error) {
      toast.error("Failed to open schedule management");
    } finally {
      setIsManagingSchedules(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">BI Sync / Data Warehousing</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunAllJobs} disabled={isRunningJobs}>
            {isRunningJobs ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isRunningJobs ? "Running..." : "Run All Jobs"}
          </Button>
          <Button onClick={handleConfigureConnectors} disabled={isConfiguringConnectors}>
            {isConfiguringConnectors ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguringConnectors ? "Configuring..." : "Configure Connectors"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Last Full Sync"
          value="2 min ago"
          icon={RefreshCw}
          change="2024-01-18 14:00"
          changeType="neutral"
        />
        <StatCard
          title="Records Synced (24h)"
          value="2.4M"
          icon={Database}
          change="+5.2% vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Active Connectors"
          value="4"
          icon={Cloud}
          change="Power BI, Tableau, Redshift, BQ"
          changeType="neutral"
        />
        <StatCard
          title="Failed Jobs"
          value="2"
          icon={XCircle}
          change="Needs attention"
          changeType="negative"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records Synced per Day (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={syncVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString(), "Records"] as [string, string]}
              />
              <Bar dataKey="records" name="Records" fill={INFO} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <DataTable
        title="ETL Job History"
        columns={[
          {
            header: "Job",
            accessorKey: "name",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.name}</code>
            ),
          },
          { header: "Target Table", accessorKey: "target" },
          { header: "Schedule", accessorKey: "schedule" },
          { header: "Last Run", accessorKey: "lastRun" },
          { header: "Duration", accessorKey: "duration" },
          { header: "Records", accessorKey: "records" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={etlJobs}
      />

      <DataTable
        title="Connector Health"
        columns={[
          { header: "Connector", accessorKey: "name" },
          { header: "Type", accessorKey: "type" },
          { header: "Warehouse", accessorKey: "warehouse" },
          { header: "Last Sync", accessorKey: "lastSync" },
          { header: "Datasets", accessorKey: "datasets" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={connectors}
      />

      <DataTable
        title="Warehouse Schema (OLAP)"
        columns={[
          {
            header: "Table",
            accessorKey: "table",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.table}</code>
            ),
          },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => {
              const colors: Record<string, string> = {
                Fact: "text-blue-600",
                Dimension: "text-purple-600",
                Report: "text-emerald-600",
              };
              return (
                <span className={`text-xs font-medium ${colors[row.original.type] ?? ""}`}>
                  {row.original.type}
                </span>
              );
            },
          },
          { header: "Row Count", accessorKey: "rows" },
          { header: "Grain", accessorKey: "grain" },
          { header: "Refresh", accessorKey: "refresh" },
        ]}
        data={schemaModels}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleAddJob} disabled={isAddingJob}>
          {isAddingJob ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          {isAddingJob ? "Adding..." : "Add ETL Job"}
        </Button>
        <Button variant="outline" onClick={handleViewLogs} disabled={isViewingLogs}>
          {isViewingLogs ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isViewingLogs ? "Loading..." : "View Sync Logs"}
        </Button>
        <Button variant="outline" onClick={handleManageSchedules} disabled={isManagingSchedules}>
          {isManagingSchedules ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="mr-2 h-4 w-4" />
          )}
          {isManagingSchedules ? "Opening..." : "Manage Schedules"}
        </Button>
      </div>
    </div>
  );
}

export default AdminBiSyncPage;
