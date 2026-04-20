
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Database, Clock, Zap, Loader2, RotateCcw, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminSearchEnginePage,
  head: () => ({ meta: [{ title: "Search Engine — Admin — ERP Vala" }] }),
});

const indexes = [
  {
    id: "IDX-001",
    name: "products",
    docs: "1,847,203",
    size: "4.2 GB",
    lastIndexed: "2024-01-18 14:00",
    avgQueryMs: "12ms",
    status: "active",
  },
  {
    id: "IDX-002",
    name: "users",
    docs: "18,234",
    size: "240 MB",
    lastIndexed: "2024-01-18 13:50",
    avgQueryMs: "8ms",
    status: "active",
  },
  {
    id: "IDX-003",
    name: "orders",
    docs: "4,120,987",
    size: "9.1 GB",
    lastIndexed: "2024-01-18 14:05",
    avgQueryMs: "18ms",
    status: "active",
  },
  {
    id: "IDX-004",
    name: "blog_posts",
    docs: "3,482",
    size: "18 MB",
    lastIndexed: "2024-01-17 22:00",
    avgQueryMs: "5ms",
    status: "active",
  },
  {
    id: "IDX-005",
    name: "invoices_archive",
    docs: "9,210,450",
    size: "21 GB",
    lastIndexed: "2024-01-15 03:00",
    avgQueryMs: "45ms",
    status: "pending",
  },
];

const recentQueries = [
  {
    id: "Q-001",
    query: "react dashboard template",
    index: "products",
    results: 234,
    latency: "11ms",
    timestamp: "14:35",
  },
  {
    id: "Q-002",
    query: "john@example.com",
    index: "users",
    results: 1,
    latency: "7ms",
    timestamp: "14:34",
  },
  {
    id: "Q-003",
    query: "subscription cancelled",
    index: "orders",
    results: 1842,
    latency: "22ms",
    timestamp: "14:33",
  },
  {
    id: "Q-004",
    query: "invoice 2024",
    index: "invoices_archive",
    results: 48210,
    latency: "51ms",
    timestamp: "14:32",
  },
];

function AdminSearchEnginePage() {
  const [testQuery, setTestQuery] = useState("");
  const [isReIndexing, setIsReIndexing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [reIndexingId, setReIndexingId] = useState<string | null>(null);

  const handleFullReIndex = async () => {
    if (!confirm("Are you sure you want to run a full re-index? This may take several minutes.")) {
      return;
    }
    setIsReIndexing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Full re-index queued successfully");
    } catch (error) {
      toast.error("Failed to queue re-index");
    } finally {
      setIsReIndexing(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Index sync started");
    } catch (error) {
      toast.error("Failed to start sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunQuery = async () => {
    if (!testQuery.trim()) {
      toast.error("Please enter a query");
      return;
    }
    setIsRunningQuery(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Query "${testQuery}" returned 42 results in 9ms`);
    } catch (error) {
      toast.error("Failed to run query");
    } finally {
      setIsRunningQuery(false);
    }
  };

  const handleReIndex = async (name: string, id: string) => {
    setReIndexingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Re-indexing ${name}...`);
    } catch (error) {
      toast.error("Failed to re-index");
    } finally {
      setReIndexingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Search Engine</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleFullReIndex} disabled={isReIndexing}>
            {isReIndexing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isReIndexing ? "Queuing..." : "Full Re-Index"}
          </Button>
          <Button onClick={handleSyncNow} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value="15.2M"
          icon={Database}
          change="+12K since last sync"
          changeType="positive"
        />
        <StatCard
          title="Avg Query Time"
          value="12ms"
          icon={Clock}
          change="-3ms vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Cache Hit Rate"
          value="84%"
          icon={Zap}
          change="Warm cache active"
          changeType="positive"
        />
        <StatCard
          title="Active Indexes"
          value="5"
          icon={Search}
          change="All healthy"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query Test Console</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Type a test query (e.g. 'react admin template')..."
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleRunQuery} disabled={isRunningQuery}>
              {isRunningQuery ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isRunningQuery ? "Running..." : "Run Query"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Supports full-text, filters (field:value), range queries (price:[10 TO 100]), and
            boolean operators.
          </p>
        </CardContent>
      </Card>

      <DataTable
        title="Search Indexes"
        columns={[
          {
            header: "Index",
            accessorKey: "name",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.name}</code>
            ),
          },
          { header: "Documents", accessorKey: "docs" },
          { header: "Size", accessorKey: "size" },
          { header: "Last Indexed", accessorKey: "lastIndexed" },
          { header: "Avg Latency", accessorKey: "avgQueryMs" },
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
                onClick={() => handleReIndex(row.original.name, row.original.id)}
                disabled={reIndexingId === row.original.id}
              >
                {reIndexingId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 h-3 w-3" />
                )}
                {reIndexingId === row.original.id ? "Re-indexing..." : "Re-index"}
              </Button>
            ),
          },
        ]}
        data={indexes}
      />

      <DataTable
        title="Recent Queries (Live)"
        columns={[
          {
            header: "Query",
            accessorKey: "query",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.query}</span>,
          },
          {
            header: "Index",
            accessorKey: "index",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.index}</code>
            ),
          },
          { header: "Results", accessorKey: "results" },
          { header: "Latency", accessorKey: "latency" },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={recentQueries}
      />
    </div>
  );
}

export default AdminSearchEnginePage;
