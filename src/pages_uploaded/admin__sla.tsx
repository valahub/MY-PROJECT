
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Zap, AlertTriangle, Bell, CheckCircle, Clock, Loader2, Download, Settings, Plus, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

({
  component: AdminSlaPage,
  head: () => ({ meta: [{ title: "SLA Monitoring — Admin — ERP Vala" }] }),
});

const latencyTrend = [
  { time: "00:00", p50: 48, p95: 112, p99: 198 },
  { time: "02:00", p50: 51, p95: 118, p99: 204 },
  { time: "04:00", p50: 44, p95: 105, p99: 187 },
  { time: "06:00", p50: 52, p95: 125, p99: 220 },
  { time: "08:00", p50: 67, p95: 158, p99: 289 },
  { time: "10:00", p50: 72, p95: 165, p99: 302 },
  { time: "12:00", p50: 69, p95: 155, p99: 278 },
  { time: "14:00", p50: 58, p95: 142, p99: 251 },
  { time: "16:00", p50: 63, p95: 149, p99: 264 },
  { time: "18:00", p50: 55, p95: 130, p99: 235 },
  { time: "20:00", p50: 47, p95: 115, p99: 205 },
  { time: "22:00", p50: 43, p95: 108, p99: 192 },
];

const errorRateTrend = [
  { time: "00:00", rate: 0.04 },
  { time: "02:00", rate: 0.03 },
  { time: "04:00", rate: 0.02 },
  { time: "06:00", rate: 0.05 },
  { time: "08:00", rate: 0.12 },
  { time: "10:00", rate: 0.09 },
  { time: "12:00", rate: 0.07 },
  { time: "14:00", rate: 0.08 },
  { time: "16:00", rate: 0.11 },
  { time: "18:00", rate: 0.06 },
  { time: "20:00", rate: 0.04 },
  { time: "22:00", rate: 0.03 },
];

const services = [
  {
    service: "API Gateway",
    uptime: "99.98%",
    p95: "142ms",
    p99: "251ms",
    errorRate: "0.07%",
    status: "active",
  },
  {
    service: "Database (Primary)",
    uptime: "99.99%",
    p95: "8ms",
    p99: "15ms",
    errorRate: "0.00%",
    status: "active",
  },
  {
    service: "Payments",
    uptime: "99.95%",
    p95: "320ms",
    p99: "590ms",
    errorRate: "0.12%",
    status: "active",
  },
  {
    service: "Auth Service",
    uptime: "100.00%",
    p95: "24ms",
    p99: "41ms",
    errorRate: "0.00%",
    status: "active",
  },
  {
    service: "Webhooks",
    uptime: "99.87%",
    p95: "185ms",
    p99: "412ms",
    errorRate: "0.34%",
    status: "pending",
  },
  {
    service: "Email / Notifications",
    uptime: "99.92%",
    p95: "210ms",
    p99: "460ms",
    errorRate: "0.15%",
    status: "active",
  },
];

const incidents = [
  {
    id: "INC-041",
    service: "Payments",
    severity: "critical",
    title: "Stripe webhook delivery delay",
    startedAt: "2024-01-18 10:32",
    resolvedAt: "2024-01-18 11:14",
    duration: "42 min",
    status: "resolved",
  },
  {
    id: "INC-040",
    service: "Webhooks",
    severity: "high",
    title: "Elevated 5xx rate on webhook delivery",
    startedAt: "2024-01-17 22:05",
    resolvedAt: "2024-01-17 22:48",
    duration: "43 min",
    status: "resolved",
  },
  {
    id: "INC-039",
    service: "API Gateway",
    severity: "medium",
    title: "p99 latency spike — downstream DB query",
    startedAt: "2024-01-15 14:20",
    resolvedAt: "2024-01-15 14:35",
    duration: "15 min",
    status: "resolved",
  },
  {
    id: "INC-042",
    service: "Webhooks",
    severity: "high",
    title: "Webhook retry queue growing beyond threshold",
    startedAt: "2024-01-18 16:10",
    resolvedAt: "—",
    duration: "Ongoing",
    status: "active",
  },
];

const alertPolicies = [
  {
    id: "ALT-001",
    name: "API p95 > 500ms",
    service: "API Gateway",
    threshold: "p95 > 500ms",
    channel: "PagerDuty + Slack",
    status: "active",
  },
  {
    id: "ALT-002",
    name: "Error rate > 1%",
    service: "All",
    threshold: "Error rate > 1% (5 min)",
    channel: "Email + Slack",
    status: "active",
  },
  {
    id: "ALT-003",
    name: "Payment timeout",
    service: "Payments",
    threshold: "p99 > 2000ms",
    channel: "PagerDuty + SMS",
    status: "active",
  },
  {
    id: "ALT-004",
    name: "DB replication lag",
    service: "Database",
    threshold: "Lag > 30s",
    channel: "PagerDuty",
    status: "active",
  },
  {
    id: "ALT-005",
    name: "Uptime < 99.9%",
    service: "All",
    threshold: "Uptime < 99.9% (1h)",
    channel: "Email",
    status: "inactive",
  },
];

const PRIMARY = "#EB0045";
const INFO = "#00A7E1";
const SUCCESS = "#2ED9C3";

function AdminSlaPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("SLA report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfigureAlerts = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Alert configuration opened");
    } catch (error) {
      toast.error("Failed to open alert configuration");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleAddAlertPolicy = async () => {
    setIsAddingAlert(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Alert policy created successfully");
    } catch (error) {
      toast.error("Failed to create alert policy");
    } finally {
      setIsAddingAlert(false);
    }
  };

  const handleViewHistory = async () => {
    setIsViewingHistory(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Incident history loaded");
    } catch (error) {
      toast.error("Failed to load incident history");
    } finally {
      setIsViewingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">SLA Monitoring & Alerting</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
          <Button onClick={handleConfigureAlerts} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Alerts"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Uptime (30d)"
          value="99.97%"
          icon={CheckCircle}
          change="+0.01% vs last month"
          changeType="positive"
        />
        <StatCard
          title="Avg p95 Latency"
          value="142ms"
          icon={Zap}
          change="-8ms vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Error Rate (24h)"
          value="0.08%"
          icon={Activity}
          change="Below 0.1% threshold"
          changeType="positive"
        />
        <StatCard
          title="Active Incidents"
          value="1"
          icon={AlertTriangle}
          change="1 critical open"
          changeType="negative"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latency Percentiles (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={latencyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}ms`} />
                <Tooltip formatter={(v) => `${v}ms`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="p50"
                  name="p50"
                  stroke={SUCCESS}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p95"
                  name="p95"
                  stroke={INFO}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p99"
                  name="p99"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Rate % (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={errorRateTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 0.2]} />
                <Tooltip formatter={(v) => [`${v}%`, "Error Rate"] as [string, string]} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  name="Error Rate"
                  stroke={PRIMARY}
                  fill={`${PRIMARY}20`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="Service Uptime"
        columns={[
          { header: "Service", accessorKey: "service" },
          { header: "Uptime (30d)", accessorKey: "uptime" },
          { header: "p95 Latency", accessorKey: "p95" },
          { header: "p99 Latency", accessorKey: "p99" },
          { header: "Error Rate", accessorKey: "errorRate" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={services}
      />

      <DataTable
        title="Incident Log"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Service", accessorKey: "service" },
          {
            header: "Severity",
            accessorKey: "severity",
            cell: ({ row }) => <StatusBadge status={row.original.severity} />,
          },
          { header: "Title", accessorKey: "title" },
          { header: "Started", accessorKey: "startedAt" },
          { header: "Resolved", accessorKey: "resolvedAt" },
          { header: "Duration", accessorKey: "duration" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={incidents}
      />

      <DataTable
        title="Alert Policies"
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "Service", accessorKey: "service" },
          { header: "Threshold", accessorKey: "threshold" },
          { header: "Channel", accessorKey: "channel" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={alertPolicies}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleAddAlertPolicy} disabled={isAddingAlert}>
          {isAddingAlert ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAddingAlert ? "Adding..." : "Add Alert Policy"}
        </Button>
        <Button variant="outline" onClick={handleViewHistory} disabled={isViewingHistory}>
          {isViewingHistory ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isViewingHistory ? "Loading..." : "View Full Incident History"}
        </Button>
      </div>
    </div>
  );
}

export default AdminSlaPage;
