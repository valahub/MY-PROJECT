
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, AlertTriangle, Clock, Wrench, Loader2, Settings, FileText, History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminApiSelfTestPage,
  head: () => ({ meta: [{ title: "API Self-Test — Admin — ERP Vala" }] }),
});

const testResults = [
  {
    id: "AT-001",
    endpoint: "POST /v1/subscriptions",
    method: "POST",
    lastTestedAt: "2024-01-18 15:00:02",
    responseTime: "142 ms",
    httpStatus: 201,
    assertion: "body.id present",
    autoFixTriggered: false,
    status: "passed",
  },
  {
    id: "AT-002",
    endpoint: "GET /v1/invoices/:id",
    method: "GET",
    lastTestedAt: "2024-01-18 15:00:02",
    responseTime: "58 ms",
    httpStatus: 200,
    assertion: "body.amount > 0",
    autoFixTriggered: false,
    status: "passed",
  },
  {
    id: "AT-003",
    endpoint: "POST /v1/payments/charge",
    method: "POST",
    lastTestedAt: "2024-01-18 14:58:01",
    responseTime: "2,412 ms",
    httpStatus: 504,
    assertion: "status = 200",
    autoFixTriggered: true,
    status: "failed",
  },
  {
    id: "AT-004",
    endpoint: "GET /v1/products",
    method: "GET",
    lastTestedAt: "2024-01-18 15:00:02",
    responseTime: "32 ms",
    httpStatus: 200,
    assertion: "body.items.length > 0",
    autoFixTriggered: false,
    status: "passed",
  },
  {
    id: "AT-005",
    endpoint: "POST /v1/webhooks/dispatch",
    method: "POST",
    lastTestedAt: "2024-01-18 15:00:01",
    responseTime: "88 ms",
    httpStatus: 202,
    assertion: "body.queued = true",
    autoFixTriggered: false,
    status: "passed",
  },
  {
    id: "AT-006",
    endpoint: "GET /v1/licenses/:key/validate",
    method: "GET",
    lastTestedAt: "2024-01-18 15:00:02",
    responseTime: "44 ms",
    httpStatus: 200,
    assertion: "body.valid = true",
    autoFixTriggered: false,
    status: "passed",
  },
  {
    id: "AT-007",
    endpoint: "DELETE /v1/subscriptions/:id",
    method: "DELETE",
    lastTestedAt: "2024-01-18 14:55:00",
    responseTime: "301 ms",
    httpStatus: 429,
    assertion: "status = 200",
    autoFixTriggered: true,
    status: "failed",
  },
];

const autoFixLog = [
  {
    id: "FX-001",
    endpoint: "POST /v1/payments/charge",
    action: "Restarted payment-gateway worker pod",
    triggeredAt: "2024-01-18 14:58:10",
    resolvedAt: "2024-01-18 14:58:42",
    status: "resolved",
  },
  {
    id: "FX-002",
    endpoint: "DELETE /v1/subscriptions/:id",
    action: "Flushed rate-limit counter for test key",
    triggeredAt: "2024-01-18 14:55:08",
    resolvedAt: "2024-01-18 14:55:20",
    status: "resolved",
  },
];

function AdminApiSelfTestPage() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleConfigureSuite = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Test suite configured successfully");
    } catch (error) {
      toast.error("Failed to configure test suite");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleRunFullTest = async () => {
    setIsRunningTests(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Full test suite completed");
    } catch (error) {
      toast.error("Failed to run test suite");
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleViewHistory = async () => {
    setIsViewingHistory(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Test history loaded");
    } catch (error) {
      toast.error("Failed to load test history");
    } finally {
      setIsViewingHistory(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Test report exported successfully");
    } catch (error) {
      toast.error("Failed to export test report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Self-Test</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleConfigureSuite} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Test Suite"}
          </Button>
          <Button onClick={handleRunFullTest} disabled={isRunningTests}>
            {isRunningTests ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            {isRunningTests ? "Running..." : "Run Full Test Suite"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Endpoints Monitored"
          value="48"
          icon={Activity}
          change="Tested every 60 s"
          changeType="neutral"
        />
        <StatCard
          title="Pass Rate"
          value="95.8%"
          icon={CheckCircle}
          change="46/48 passing"
          changeType="positive"
        />
        <StatCard
          title="Failing Now"
          value="2"
          icon={AlertTriangle}
          change="Auto-fix triggered"
          changeType="negative"
        />
        <StatCard
          title="Auto-Fixes (30d)"
          value="7"
          icon={Wrench}
          change="All resolved < 60 s"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Continuous Testing</p>
              <p className="text-xs text-muted-foreground">
                Every registered endpoint is called with a synthetic test payload every 60 seconds
                from multiple regions. Response time, status code, and response body assertions are
                checked.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Failure Detection</p>
              <p className="text-xs text-muted-foreground">
                Two consecutive failures trigger an alert. Three consecutive failures trigger an
                auto-fix action. All failures are correlated with deployment and config changes.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Auto-Fix Actions</p>
              <p className="text-xs text-muted-foreground">
                Preconfigured remediation playbooks run automatically: pod restart, cache flush,
                circuit-breaker reset, or rollback trigger. A human is notified for every action
                taken.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Endpoint Test Results"
        columns={[
          { header: "ID", accessorKey: "id" },
          {
            header: "Endpoint",
            accessorKey: "endpoint",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {row.original.endpoint}
              </code>
            ),
          },
          { header: "Last Tested", accessorKey: "lastTestedAt" },
          {
            header: "Response Time",
            accessorKey: "responseTime",
            cell: ({ row }) => (
              <span className="font-mono text-xs">{row.original.responseTime}</span>
            ),
          },
          {
            header: "HTTP",
            accessorKey: "httpStatus",
            cell: ({ row }) => {
              const code = row.original.httpStatus;
              const color =
                code >= 500 ? "text-destructive" : code >= 400 ? "text-accent" : "text-success";
              return <span className={`font-mono font-bold text-xs ${color}`}>{code}</span>;
            },
          },
          { header: "Assertion", accessorKey: "assertion" },
          {
            header: "Auto-Fix",
            accessorKey: "autoFixTriggered",
            cell: ({ row }) => (
              <span
                className={
                  row.original.autoFixTriggered
                    ? "text-accent font-medium"
                    : "text-muted-foreground"
                }
              >
                {row.original.autoFixTriggered ? "Triggered" : "—"}
              </span>
            ),
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={testResults}
      />

      <DataTable
        title="Auto-Fix Log"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Endpoint", accessorKey: "endpoint" },
          { header: "Action Taken", accessorKey: "action" },
          { header: "Triggered", accessorKey: "triggeredAt" },
          { header: "Resolved", accessorKey: "resolvedAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={autoFixLog}
      />

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleViewHistory} disabled={isViewingHistory}>
          {isViewingHistory ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <History className="mr-2 h-4 w-4" />
          )}
          {isViewingHistory ? "Loading..." : "Test History"}
        </Button>
        <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Test Report"}
        </Button>
      </div>
    </div>
  );
}

export default AdminApiSelfTestPage;
