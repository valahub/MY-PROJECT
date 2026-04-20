
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { Webhook, CheckCircle, XCircle, Clock, Loader2, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminWebhooksPage,
  head: () => ({ meta: [{ title: "Webhooks — Admin — ERP Vala" }] }),
});

const webhookEndpoints = [
  {
    id: "WH-001",
    url: "https://acme.com/webhooks/paddle",
    merchant: "Acme Corp",
    events: 12,
    status: "active",
    lastDelivery: "2024-01-18 14:30",
    successRate: "99.2%",
  },
  {
    id: "WH-002",
    url: "https://beta.io/api/webhooks",
    merchant: "Beta Inc",
    events: 8,
    status: "active",
    lastDelivery: "2024-01-18 14:15",
    successRate: "97.8%",
  },
  {
    id: "WH-003",
    url: "https://gamma.dev/hooks",
    merchant: "Gamma LLC",
    events: 5,
    status: "inactive",
    lastDelivery: "2024-01-15 09:00",
    successRate: "85.0%",
  },
  {
    id: "WH-004",
    url: "https://delta.app/webhook",
    merchant: "Delta Co",
    events: 10,
    status: "active",
    lastDelivery: "2024-01-18 13:45",
    successRate: "100%",
  },
];

const recentDeliveries = [
  {
    id: "DEL-001",
    endpoint: "acme.com",
    event: "subscription.created",
    status: "completed",
    responseCode: 200,
    duration: "120ms",
    timestamp: "2024-01-18 14:30",
  },
  {
    id: "DEL-002",
    endpoint: "beta.io",
    event: "payment.success",
    status: "completed",
    responseCode: 200,
    duration: "85ms",
    timestamp: "2024-01-18 14:15",
  },
  {
    id: "DEL-003",
    endpoint: "gamma.dev",
    event: "subscription.cancelled",
    status: "canceled",
    responseCode: 500,
    duration: "3200ms",
    timestamp: "2024-01-18 14:00",
  },
  {
    id: "DEL-004",
    endpoint: "delta.app",
    event: "license.created",
    status: "completed",
    responseCode: 200,
    duration: "95ms",
    timestamp: "2024-01-18 13:45",
  },
  {
    id: "DEL-005",
    endpoint: "acme.com",
    event: "payment.failed",
    status: "completed",
    responseCode: 200,
    duration: "110ms",
    timestamp: "2024-01-18 13:30",
  },
];

function AdminWebhooksPage() {
  const [isViewingDeliveries, setIsViewingDeliveries] = useState(false);

  const handleViewDeliveries = async () => {
    setIsViewingDeliveries(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Navigating to deliveries");
    } catch (error) {
      toast.error("Failed to navigate");
    } finally {
      setIsViewingDeliveries(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <Button onClick={handleViewDeliveries} disabled={isViewingDeliveries}>
          {isViewingDeliveries ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {isViewingDeliveries ? "Loading..." : "View All Deliveries"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Endpoints" value="18" icon={Webhook} />
        <StatCard
          title="Delivered (24h)"
          value="1,234"
          icon={CheckCircle}
          change="98.5% success"
          changeType="positive"
        />
        <StatCard
          title="Failed (24h)"
          value="19"
          icon={XCircle}
          change="1.5% failure"
          changeType="negative"
        />
        <StatCard
          title="Avg Response"
          value="145ms"
          icon={Clock}
          change="-12ms vs yesterday"
          changeType="positive"
        />
      </div>

      <DataTable
        title="Webhook Endpoints"
        columns={[
          {
            header: "URL",
            accessorKey: "url",
            cell: ({ row }) => <span className="text-xs font-mono">{row.original.url}</span>,
          },
          { header: "Merchant", accessorKey: "merchant" },
          { header: "Events", accessorKey: "events" },
          { header: "Success Rate", accessorKey: "successRate" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={webhookEndpoints}
      />

      <DataTable
        title="Recent Deliveries"
        columns={[
          { header: "Endpoint", accessorKey: "endpoint" },
          {
            header: "Event",
            accessorKey: "event",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.event}</code>
            ),
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "HTTP Code", accessorKey: "responseCode" },
          { header: "Duration", accessorKey: "duration" },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={recentDeliveries}
      />
    </div>
  );
}

export default AdminWebhooksPage;
