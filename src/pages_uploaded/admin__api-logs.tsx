
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Code, Activity, Clock, AlertTriangle, Filter, Download, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminApiLogsPage,
  head: () => ({ meta: [{ title: "API Logs — Admin — ERP Vala" }] }),
});

const apiLogs = [
  {
    id: "API-001",
    method: "GET",
    path: "/v1/products",
    merchant: "Acme Corp",
    status: 200,
    duration: "45ms",
    timestamp: "2024-01-18 14:32:15",
    ip: "203.0.113.1",
  },
  {
    id: "API-002",
    method: "POST",
    path: "/v1/subscriptions",
    merchant: "Beta Inc",
    status: 201,
    duration: "230ms",
    timestamp: "2024-01-18 14:31:42",
    ip: "198.51.100.5",
  },
  {
    id: "API-003",
    method: "GET",
    path: "/v1/licenses/validate",
    merchant: "Gamma LLC",
    status: 200,
    duration: "18ms",
    timestamp: "2024-01-18 14:31:10",
    ip: "192.0.2.100",
  },
  {
    id: "API-004",
    method: "POST",
    path: "/v1/payments",
    merchant: "Acme Corp",
    status: 402,
    duration: "180ms",
    timestamp: "2024-01-18 14:30:55",
    ip: "203.0.113.1",
  },
  {
    id: "API-005",
    method: "DELETE",
    path: "/v1/subscriptions/sub_123",
    merchant: "Delta Co",
    status: 200,
    duration: "95ms",
    timestamp: "2024-01-18 14:30:20",
    ip: "172.16.0.50",
  },
  {
    id: "API-006",
    method: "GET",
    path: "/v1/transactions",
    merchant: "Beta Inc",
    status: 429,
    duration: "5ms",
    timestamp: "2024-01-18 14:29:50",
    ip: "198.51.100.5",
  },
  {
    id: "API-007",
    method: "PATCH",
    path: "/v1/products/prod_456",
    merchant: "Acme Corp",
    status: 200,
    duration: "120ms",
    timestamp: "2024-01-18 14:29:15",
    ip: "203.0.113.1",
  },
];

function AdminApiLogsPage() {
  const [isFiltering, setIsFiltering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleFilter = async () => {
    setIsFiltering(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Filter applied successfully");
    } catch (error) {
      toast.error("Failed to apply filter");
    } finally {
      setIsFiltering(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("API logs exported successfully");
    } catch (error) {
      toast.error("Failed to export logs");
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    setViewingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Log ${id} details loaded`);
    } catch (error) {
      toast.error("Failed to load log details");
    } finally {
      setViewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Logs</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleFilter} disabled={isFiltering}>
            {isFiltering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Filter className="mr-2 h-4 w-4" />
            )}
            {isFiltering ? "Filtering..." : "Filter"}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Requests (24h)"
          value="45,678"
          icon={Code}
          change="+8.2% vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Avg Latency"
          value="68ms"
          icon={Clock}
          change="-5ms improvement"
          changeType="positive"
        />
        <StatCard
          title="Success Rate"
          value="99.1%"
          icon={Activity}
          change="0.9% errors"
          changeType="neutral"
        />
        <StatCard
          title="Rate Limited"
          value="23"
          icon={AlertTriangle}
          change="0.05% of requests"
          changeType="neutral"
        />
      </div>

      <DataTable
        title="Recent API Requests"
        columns={[
          {
            header: "Method",
            accessorKey: "method",
            cell: ({ row }) => {
              const m = row.original.method;
              const color =
                m === "GET"
                  ? "text-info"
                  : m === "POST"
                    ? "text-success"
                    : m === "DELETE"
                      ? "text-destructive"
                      : "text-accent";
              return <span className={`font-mono text-xs font-bold ${color}`}>{m}</span>;
            },
          },
          {
            header: "Path",
            accessorKey: "path",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.path}</code>
            ),
          },
          { header: "Merchant", accessorKey: "merchant" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => {
              const s = row.original.status;
              const color = s < 300 ? "text-success" : s < 400 ? "text-accent" : "text-destructive";
              return <span className={`font-mono font-bold ${color}`}>{s}</span>;
            },
          },
          { header: "Duration", accessorKey: "duration" },
          {
            header: "IP",
            accessorKey: "ip",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip}</span>,
          },
          { header: "Time", accessorKey: "timestamp" },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(row.original.id)}
                disabled={viewingId === row.original.id}
              >
                {viewingId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Eye className="mr-1 h-3 w-3" />
                )}
                {viewingId === row.original.id ? "Loading..." : "View"}
              </Button>
            ),
          },
        ]}
        data={apiLogs}
      />
    </div>
  );
}
