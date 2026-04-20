
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Plug, RefreshCw, AlertTriangle, CheckCircle, Loader2, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminIntegrationsPage,
  head: () => ({ meta: [{ title: "Integration Hub — Admin — ERP Vala" }] }),
});

const connectors = [
  {
    id: "CON-001",
    name: "Stripe",
    category: "Payments",
    syncDirection: "bidirectional",
    lastSync: "2024-01-18 14:20",
    eventsToday: "4,201",
    errors: "0",
    status: "active",
  },
  {
    id: "CON-002",
    name: "Mailchimp",
    category: "Email Marketing",
    syncDirection: "outbound",
    lastSync: "2024-01-18 14:00",
    eventsToday: "842",
    errors: "0",
    status: "active",
  },
  {
    id: "CON-003",
    name: "Salesforce",
    category: "CRM",
    syncDirection: "bidirectional",
    lastSync: "2024-01-18 13:45",
    eventsToday: "1,204",
    errors: "3",
    status: "active",
  },
  {
    id: "CON-004",
    name: "Slack",
    category: "Notifications",
    syncDirection: "outbound",
    lastSync: "2024-01-18 14:35",
    eventsToday: "234",
    errors: "0",
    status: "active",
  },
  {
    id: "CON-005",
    name: "QuickBooks",
    category: "Accounting",
    syncDirection: "outbound",
    lastSync: "2024-01-17 22:00",
    eventsToday: "0",
    errors: "0",
    status: "inactive",
  },
  {
    id: "CON-006",
    name: "Zapier Webhook",
    category: "Automation",
    syncDirection: "outbound",
    lastSync: "2024-01-18 14:10",
    eventsToday: "124",
    errors: "8",
    status: "active",
  },
  {
    id: "CON-007",
    name: "HubSpot",
    category: "CRM",
    syncDirection: "bidirectional",
    lastSync: "—",
    eventsToday: "0",
    errors: "0",
    status: "pending",
  },
];

const syncLogs = [
  {
    id: "SL-001",
    connector: "Stripe",
    event: "payment.success",
    direction: "inbound",
    attempts: 1,
    status: "completed",
    timestamp: "14:35",
  },
  {
    id: "SL-002",
    connector: "Salesforce",
    event: "contact.update",
    direction: "outbound",
    attempts: 2,
    status: "completed",
    timestamp: "14:34",
  },
  {
    id: "SL-003",
    connector: "Zapier Webhook",
    event: "subscription.created",
    direction: "outbound",
    attempts: 3,
    status: "canceled",
    timestamp: "14:32",
  },
  {
    id: "SL-004",
    connector: "Mailchimp",
    event: "customer.signup",
    direction: "outbound",
    attempts: 1,
    status: "completed",
    timestamp: "14:30",
  },
  {
    id: "SL-005",
    connector: "Slack",
    event: "fraud.alert",
    direction: "outbound",
    attempts: 1,
    status: "completed",
    timestamp: "14:25",
  },
];

function AdminIntegrationsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Sync logs exported successfully");
    } catch (error) {
      toast.error("Failed to export logs");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddConnector = async () => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Connector wizard opened");
    } catch (error) {
      toast.error("Failed to open connector wizard");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSync = async (name: string, id: string) => {
    setSyncingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`${name} sync triggered successfully`);
    } catch (error) {
      toast.error("Failed to trigger sync");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Integration Hub</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportLogs} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export Logs"}
          </Button>
          <Button onClick={handleAddConnector} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAdding ? "Adding..." : "Add Connector"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Connectors"
          value="5"
          icon={Plug}
          change="7 total configured"
          changeType="positive"
        />
        <StatCard
          title="Sync Events (24h)"
          value="6,605"
          icon={RefreshCw}
          change="+14% vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Failures (24h)"
          value="11"
          icon={AlertTriangle}
          change="0.17% error rate"
          changeType="negative"
        />
        <StatCard
          title="APIs Connected"
          value="7"
          icon={CheckCircle}
          change="Across 5 categories"
          changeType="positive"
        />
      </div>

      <DataTable
        title="Connectors"
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "Category", accessorKey: "category" },
          {
            header: "Sync Direction",
            accessorKey: "syncDirection",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {row.original.syncDirection}
              </code>
            ),
          },
          { header: "Last Sync", accessorKey: "lastSync" },
          { header: "Events (24h)", accessorKey: "eventsToday" },
          {
            header: "Errors",
            accessorKey: "errors",
            cell: ({ row }) => {
              const e = parseInt(row.original.errors);
              return (
                <span className={e > 0 ? "text-destructive font-bold" : ""}>
                  {row.original.errors}
                </span>
              );
            },
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
                onClick={() => handleSync(row.original.name, row.original.id)}
                disabled={syncingId === row.original.id}
              >
                {syncingId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3 w-3" />
                )}
                {syncingId === row.original.id ? "Syncing..." : "Sync"}
              </Button>
            ),
          },
        ]}
        data={connectors}
      />

      <DataTable
        title="Sync Log (Recent)"
        columns={[
          { header: "Connector", accessorKey: "connector" },
          {
            header: "Event",
            accessorKey: "event",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.event}</code>
            ),
          },
          { header: "Direction", accessorKey: "direction" },
          { header: "Attempts", accessorKey: "attempts" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Time", accessorKey: "timestamp" },
        ]}
        data={syncLogs}
      />

      <Card>
        <CardHeader>
          <CardTitle>Retry & Dead-Letter Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Automatic Retry",
                desc: "Failed sync events are retried up to 3 times with exponential backoff (5s, 25s, 125s).",
              },
              {
                title: "Dead-Letter Queue",
                desc: "Events that exhaust all retries are moved to the DLQ with full context for manual replay.",
              },
              {
                title: "Circuit Breaker",
                desc: "If a connector fails > 10 times in 5 minutes, it's automatically paused with an alert.",
              },
              {
                title: "Idempotency Keys",
                desc: "All outbound sync events carry a unique idempotency key to prevent duplicate writes on retry.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border p-4 space-y-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
