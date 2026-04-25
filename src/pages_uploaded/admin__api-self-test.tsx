
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Activity, CheckCircle, AlertTriangle, Clock, Wrench, Loader2, Settings, FileText, History, Plus, Play, StopCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiSelfTestService, type ApiTest, type TestResult, type FailureRecord, type DependencyHealth, type ApiSelfTestKPI } from "@/lib/api/admin-services";

({
  component: AdminApiSelfTestPage,
  head: () => ({ meta: [{ title: "API Self-Test — Admin — ERP Vala" }] }),
});

function AdminApiSelfTestPage() {
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ApiTest | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [tests, setTests] = useState<ApiTest[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [failures, setFailures] = useState<FailureRecord[]>([]);
  const [dependencies, setDependencies] = useState<DependencyHealth[]>([]);
  const [kpi, setKpi] = useState<ApiSelfTestKPI | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setTests(apiSelfTestService.listTests());
      setResults(apiSelfTestService.listResults());
      setFailures(apiSelfTestService.listFailures());
      setDependencies(apiSelfTestService.listDependencies());
      setKpi(apiSelfTestService.getKPI());
    } catch (error) {
      toast.error("Failed to load API self-test data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTest = async () => {
    const endpoint = prompt("Enter endpoint (e.g., /api/auth/login):");
    if (!endpoint) return;

    const method = prompt("Enter method (GET, POST, PUT, DELETE, PATCH):") as "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    if (!method) return;

    const region = prompt("Enter region (e.g., us-east-1):") || "us-east-1";
    const testInterval = parseInt(prompt("Enter test interval in seconds (e.g., 60):") || "60");
    const expectedStatusCode = parseInt(prompt("Enter expected status code (e.g., 200):") || "200");
    const maxResponseTime = parseInt(prompt("Enter max response time in ms (e.g., 500):") || "500");

    try {
      setIsAdding(true);
      await apiSelfTestService.createTest({
        endpoint,
        method,
        region,
        testInterval,
        expectedStatusCode,
        maxResponseTime,
      }, "admin");
      toast.success("API test created successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to create API test");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRunTest = async (testId: string) => {
    try {
      await apiSelfTestService.executeTest(testId);
      toast.success("Test executed successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to execute test");
    }
  };

  const handleStartScheduledTests = () => {
    apiSelfTestService.startScheduledTests();
    setIsRunning(true);
    toast.success("Scheduled tests started");
  };

  const handleStopScheduledTests = () => {
    apiSelfTestService.stopScheduledTests();
    setIsRunning(false);
    toast.success("Scheduled tests stopped");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatTime = (ms: number) => {
    return `${ms}ms`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Self-Test</h1>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button variant="outline" onClick={handleStartScheduledTests}>
              <Play className="mr-2 h-4 w-4" />
              Start Scheduled Tests
            </Button>
          ) : (
            <Button variant="outline" onClick={handleStopScheduledTests}>
              <StopCircle className="mr-2 h-4 w-4" />
              Stop Scheduled Tests
            </Button>
          )}
          <Button onClick={handleAddTest} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAdding ? "Adding..." : "Add Test"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tests" value={kpi?.totalTests?.toString() || "0"} icon={Activity} />
        <StatCard title="Active Tests" value={kpi?.activeTests?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Passed Tests" value={kpi?.passedTests?.toString() || "0"} icon={CheckCircle} />
        <StatCard title="Failed Tests" value={kpi?.failedTests?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Avg Response Time" value={`${kpi?.avgResponseTime?.toFixed(0) || 0}ms`} icon={Clock} />
        <StatCard title="P95 Latency" value={`${kpi?.p95Latency?.toFixed(0) || 0}ms`} icon={Clock} />
        <StatCard title="Active Failures" value={kpi?.activeFailures?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Healthy Dependencies" value={kpi?.healthyDependencies?.toString() || "0"} icon={CheckCircle} />
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
                Every registered endpoint is called with a synthetic test payload at configured intervals.
                Response time, status code, and response body assertions are checked.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Failure Detection</p>
              <p className="text-xs text-muted-foreground">
                Three consecutive failures trigger an auto-fix action. All failures are correlated with
                deployment and config changes.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Auto-Fix Actions</p>
              <p className="text-xs text-muted-foreground">
                Preconfigured remediation playbooks run automatically: pod restart, cache flush,
                circuit-breaker reset, or rollback trigger.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="API Tests"
        columns={[
          { header: "ID", accessorKey: "id" },
          {
            header: "Endpoint",
            accessorKey: "endpoint",
            cell: ({ row }: { row: { original: ApiTest } }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.endpoint}</code>
            ),
          },
          {
            header: "Method",
            accessorKey: "method",
            cell: ({ row }: { row: { original: ApiTest } }) => (
              <span className="font-mono text-xs">{row.original.method}</span>
            ),
          },
          { header: "Region", accessorKey: "region" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: { original: ApiTest } }) => (
              <span className={
                row.original.status === "passed" ? "text-green-600" :
                row.original.status === "failed" ? "text-red-600" :
                row.original.status === "running" ? "text-yellow-600" :
                "text-muted-foreground"
              }>
                {row.original.status.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Interval",
            accessorKey: "testInterval",
            cell: ({ row }: { row: { original: ApiTest } }) => `${row.original.testInterval}s`,
          },
          {
            header: "Active",
            accessorKey: "isActive",
            cell: ({ row }: { row: { original: ApiTest } }) => (
              row.original.isActive ? <CheckCircle className="h-4 w-4 text-green-600" /> : <span className="text-muted-foreground">—</span>
            ),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: ApiTest } }) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRunTest(row.original.id)}>
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            ),
          },
        ]}
        data={tests}
      />

      <DataTable
        title="Test Results"
        columns={[
          { header: "ID", accessorKey: "id" },
          {
            header: "Endpoint",
            accessorKey: "endpoint",
            cell: ({ row }: { row: { original: TestResult } }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.endpoint}</code>
            ),
          },
          { header: "Region", accessorKey: "region" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: { original: TestResult } }) => (
              <span className={
                row.original.status === "passed" ? "text-green-600" :
                row.original.status === "failed" ? "text-red-600" :
                "text-muted-foreground"
              }>
                {row.original.status.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Status Code",
            accessorKey: "statusCode",
            cell: ({ row }: { row: { original: TestResult } }) => (
              <span className="font-mono">{row.original.statusCode}</span>
            ),
          },
          {
            header: "Response Time",
            accessorKey: "responseTime",
            cell: ({ row }: { row: { original: TestResult } }) => formatTime(row.original.responseTime),
          },
          {
            header: "Validated",
            accessorKey: "validationPassed",
            cell: ({ row }: { row: { original: TestResult } }) => (
              row.original.validationPassed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />
            ),
          },
          {
            header: "Executed At",
            accessorKey: "executedAt",
            cell: ({ row }: { row: { original: TestResult } }) => formatDate(row.original.executedAt),
          },
        ]}
        data={results}
      />

      <DataTable
        title="Failure Records"
        columns={[
          { header: "ID", accessorKey: "id" },
          {
            header: "Endpoint",
            accessorKey: "endpoint",
            cell: ({ row }: { row: { original: FailureRecord } }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.endpoint}</code>
            ),
          },
          { header: "Region", accessorKey: "region" },
          {
            header: "Failure Type",
            accessorKey: "failureType",
            cell: ({ row }: { row: { original: FailureRecord } }) => (
              <span className="font-medium">{row.original.failureType.replace("_", " ").toUpperCase()}</span>
            ),
          },
          {
            header: "Failure Count",
            accessorKey: "failureCount",
            cell: ({ row }: { row: { original: FailureRecord } }) => (
              <span className="font-medium">{row.original.failureCount}</span>
            ),
          },
          {
            header: "Fix Action",
            accessorKey: "fixAction",
            cell: ({ row }: { row: { original: FailureRecord } }) => (
              row.original.fixAction ? <span className="text-blue-600">{row.original.fixAction.replace("_", " ").toUpperCase()}</span> : <span className="text-muted-foreground">—</span>
            ),
          },
          {
            header: "Fix Result",
            accessorKey: "fixResult",
            cell: ({ row }: { row: { original: FailureRecord } }) => (
              row.original.fixResult === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> :
              row.original.fixResult === "failed" ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
              <span className="text-muted-foreground">—</span>
            ),
          },
          {
            header: "Last Failure",
            accessorKey: "lastFailureAt",
            cell: ({ row }: { row: { original: FailureRecord } }) => formatDate(row.original.lastFailureAt),
          },
        ]}
        data={failures}
      />

      <DataTable
        title="Dependency Health"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Name", accessorKey: "name" },
          { header: "Type", accessorKey: "type" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }: { row: { original: DependencyHealth } }) => (
              <span className={
                row.original.status === "healthy" ? "text-green-600" :
                row.original.status === "degraded" ? "text-yellow-600" :
                "text-red-600"
              }>
                {row.original.status.toUpperCase()}
              </span>
            ),
          },
          {
            header: "Latency",
            accessorKey: "latency",
            cell: ({ row }: { row: { original: DependencyHealth } }) => formatTime(row.original.latency),
          },
          {
            header: "Uptime",
            accessorKey: "uptime",
            cell: ({ row }: { row: { original: DependencyHealth } }) => `${row.original.uptime.toFixed(1)}%`,
          },
          {
            header: "Last Check",
            accessorKey: "lastCheckAt",
            cell: ({ row }: { row: { original: DependencyHealth } }) => formatDate(row.original.lastCheckAt),
          },
        ]}
        data={dependencies}
      />
    </div>
  );
}

export default AdminApiSelfTestPage;
