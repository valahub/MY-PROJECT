
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Eye, Timer, Loader2, ExternalLink, Search, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminObservabilityPage,
  head: () => ({ meta: [{ title: "Observability — Admin — ERP Vala" }] }),
});

const traces = [
  {
    id: "TRC-001",
    traceId: "a1b2c3d4e5f6",
    service: "api-gateway",
    operation: "POST /api/v3/subscriptions",
    duration: "142ms",
    spans: 8,
    status: "completed",
    timestamp: "2024-01-18 14:35:01",
  },
  {
    id: "TRC-002",
    traceId: "f6e5d4c3b2a1",
    service: "billing-service",
    operation: "charge_renewal",
    duration: "890ms",
    spans: 12,
    status: "completed",
    timestamp: "2024-01-18 14:34:58",
  },
  {
    id: "TRC-003",
    traceId: "1a2b3c4d5e6f",
    service: "search-service",
    operation: "GET /api/v3/search",
    duration: "2340ms",
    spans: 5,
    status: "pending",
    timestamp: "2024-01-18 14:34:55",
  },
  {
    id: "TRC-004",
    traceId: "abcdef123456",
    service: "auth-service",
    operation: "POST /api/v3/auth/token",
    duration: "45ms",
    spans: 3,
    status: "completed",
    timestamp: "2024-01-18 14:34:52",
  },
  {
    id: "TRC-005",
    traceId: "654321fedcba",
    service: "webhook-worker",
    operation: "deliver_webhook",
    duration: "320ms",
    spans: 4,
    status: "canceled",
    timestamp: "2024-01-18 14:34:48",
  },
];

const alerts = [
  {
    id: "ALT-001",
    name: "High P95 Latency",
    service: "billing-service",
    threshold: "> 1s",
    current: "1.2s",
    severity: "high",
    status: "active",
  },
  {
    id: "ALT-002",
    name: "Error Rate Spike",
    service: "webhook-worker",
    threshold: "> 2%",
    current: "3.1%",
    severity: "high",
    status: "active",
  },
  {
    id: "ALT-003",
    name: "DLQ Depth",
    service: "event-bus",
    threshold: "> 100",
    current: "142",
    severity: "medium",
    status: "active",
  },
  {
    id: "ALT-004",
    name: "CPU Usage",
    service: "search-service",
    threshold: "> 85%",
    current: "72%",
    severity: "low",
    status: "cleared",
  },
];

const serviceMetrics = [
  {
    service: "api-gateway",
    p50: "28ms",
    p95: "145ms",
    p99: "380ms",
    errorRate: "0.1%",
    rps: "1,240",
    status: "active",
  },
  {
    service: "billing-service",
    p50: "340ms",
    p95: "1.2s",
    p99: "2.1s",
    errorRate: "0.3%",
    rps: "42",
    status: "active",
  },
  {
    service: "auth-service",
    p50: "18ms",
    p95: "60ms",
    p99: "120ms",
    errorRate: "0.05%",
    rps: "890",
    status: "active",
  },
  {
    service: "search-service",
    p50: "12ms",
    p95: "45ms",
    p99: "200ms",
    errorRate: "0.2%",
    rps: "340",
    status: "active",
  },
  {
    service: "webhook-worker",
    p50: "180ms",
    p95: "420ms",
    p99: "1.4s",
    errorRate: "3.1%",
    rps: "28",
    status: "active",
  },
];

function AdminObservabilityPage() {
  const [isOpeningAPM, setIsOpeningAPM] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [silencingId, setSilencingId] = useState<string | null>(null);

  const handleOpenAPM = async () => {
    setIsOpeningAPM(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("APM dashboard opened");
    } catch (error) {
      toast.error("Failed to open APM dashboard");
    } finally {
      setIsOpeningAPM(false);
    }
  };

  const handleSearchTraces = async () => {
    setIsSearching(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Trace search opened");
    } catch (error) {
      toast.error("Failed to open trace search");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSilenceAlert = async (id: string) => {
    setSilencingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Alert silenced for 1h");
    } catch (error) {
      toast.error("Failed to silence alert");
    } finally {
      setSilencingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Observability</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenAPM} disabled={isOpeningAPM}>
            {isOpeningAPM ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            {isOpeningAPM ? "Opening..." : "Open APM"}
          </Button>
          <Button onClick={handleSearchTraces} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {isSearching ? "Searching..." : "Search Traces"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Response Time"
          value="82ms"
          icon={Timer}
          change="-8ms vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Error Rate (24h)"
          value="0.21%"
          icon={AlertTriangle}
          change="+0.05% vs avg"
          changeType="negative"
        />
        <StatCard
          title="Traces (24h)"
          value="2.1M"
          icon={Activity}
          change="Sampled at 1%"
          changeType="neutral"
        />
        <StatCard
          title="Active Alerts"
          value="3"
          icon={Eye}
          change="2 high · 1 medium"
          changeType="negative"
        />
      </div>

      <DataTable
        title="Active Alerts"
        columns={[
          { header: "Alert", accessorKey: "name" },
          { header: "Service", accessorKey: "service" },
          { header: "Threshold", accessorKey: "threshold" },
          {
            header: "Current Value",
            accessorKey: "current",
            cell: ({ row }) => (
              <span
                className={row.original.status === "active" ? "text-destructive font-bold" : ""}
              >
                {row.original.current}
              </span>
            ),
          },
          {
            header: "Severity",
            accessorKey: "severity",
            cell: ({ row }) => <StatusBadge status={row.original.severity} />,
          },
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
                onClick={() => handleSilenceAlert(row.original.id)}
                disabled={silencingId === row.original.id}
              >
                {silencingId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <VolumeX className="mr-1 h-3 w-3" />
                )}
                {silencingId === row.original.id ? "Silencing..." : "Silence"}
              </Button>
            ),
          },
        ]}
        data={alerts}
      />

      <DataTable
        title="Service Metrics"
        columns={[
          { header: "Service", accessorKey: "service" },
          { header: "P50", accessorKey: "p50" },
          { header: "P95", accessorKey: "p95" },
          { header: "P99", accessorKey: "p99" },
          {
            header: "Error Rate",
            accessorKey: "errorRate",
            cell: ({ row }) => {
              const r = parseFloat(row.original.errorRate);
              const color = r > 2 ? "text-destructive font-bold" : r > 0.5 ? "text-accent" : "";
              return <span className={color}>{row.original.errorRate}</span>;
            },
          },
          { header: "RPS", accessorKey: "rps" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={serviceMetrics}
      />

      <DataTable
        title="Recent Traces"
        columns={[
          {
            header: "Trace ID",
            accessorKey: "traceId",
            cell: ({ row }) => <code className="text-xs font-mono">{row.original.traceId}</code>,
          },
          { header: "Service", accessorKey: "service" },
          { header: "Operation", accessorKey: "operation" },
          {
            header: "Duration",
            accessorKey: "duration",
            cell: ({ row }) => {
              const ms = parseInt(row.original.duration);
              const color = ms > 1000 ? "text-destructive" : ms > 500 ? "text-accent" : "";
              return <span className={`font-mono ${color}`}>{row.original.duration}</span>;
            },
          },
          { header: "Spans", accessorKey: "spans" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={traces}
      />

      <Card>
        <CardHeader>
          <CardTitle>Observability Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { tool: "OpenTelemetry", role: "Instrumentation (traces, metrics, logs)" },
              { tool: "Jaeger / Tempo", role: "Distributed trace storage + UI" },
              { tool: "Prometheus", role: "Metrics collection + alerting rules" },
              { tool: "Grafana", role: "Dashboards, alerts, log exploration" },
            ].map((item) => (
              <div key={item.tool} className="rounded-lg border p-4 space-y-1">
                <p className="text-sm font-bold">{item.tool}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
