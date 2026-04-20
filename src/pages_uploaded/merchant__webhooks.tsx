import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import {
  deleteWebhookEndpoint,
  getUiErrorMessage,
  getWebhookDeliveries,
  getWebhookEndpoints,
  type WebhookDelivery,
  type WebhookEndpoint,
} from "@/lib/ui-actions-api";

({ component: MerchantWebhooks });

const epCols = [
  { key: "url", header: "Endpoint URL" },
  { key: "events", header: "Events" },
  {
    key: "status",
    header: "Status",
    render: (e: WebhookEndpoint) => (
      <StatusBadge status={e.status === "disabled" ? "inactive" : e.status} />
    ),
  },
  { key: "lastDelivery", header: "Last Delivery" },
  { key: "successRate", header: "Success Rate" },
];

const delCols = [
  { key: "event", header: "Event" },
  { key: "endpoint", header: "Endpoint" },
  {
    key: "status",
    header: "Status",
    render: (d: WebhookDelivery) => <StatusBadge status={d.status} />,
  },
  { key: "code", header: "Code" },
  { key: "time", header: "Time" },
];

function MerchantWebhooks() {
  const navigate = useNavigate();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const didShowRefreshError = useRef(false);

  const loadAll = async () => {
    try {
      const [nextEndpoints, nextDeliveries] = await Promise.all([
        getWebhookEndpoints(),
        getWebhookDeliveries(),
      ]);
      setEndpoints(nextEndpoints);
      setRecentDeliveries(nextDeliveries);
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Failed to load webhooks."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    const timer = window.setInterval(() => {
      void getWebhookDeliveries()
        .then(setRecentDeliveries)
        .catch((error) => {
          console.error("Webhook delivery refresh failed", error);
          if (!didShowRefreshError.current) {
            didShowRefreshError.current = true;
            toast.error("Delivery log refresh failed. Retrying...");
          }
        });
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const handleDelete = async (endpoint: WebhookEndpoint) => {
    try {
      const result = await deleteWebhookEndpoint(endpoint.id);
      setEndpoints(result.endpoints);
      setRecentDeliveries(result.deliveries);
      toast.success("Webhook endpoint deleted");
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Failed to delete webhook endpoint"));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <Link to="/merchant/webhooks/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
            </Button>
          </Link>
        </div>
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          Loading webhooks...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <Link to="/merchant/webhooks/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Endpoint
          </Button>
        </Link>
      </div>
      <h2 className="text-lg font-semibold">Endpoints</h2>
      <DataTable
        columns={epCols}
        data={endpoints}
        searchable={false}
        onEdit={(e) => {
          navigate({ to: "/merchant/webhooks/create", search: { endpointId: e.id } });
        }}
        onDelete={handleDelete}
        getItemLabel={(e) => e.url}
      />
      <h2 className="text-lg font-semibold">Recent Deliveries</h2>
      <DataTable
        columns={delCols}
        data={recentDeliveries}
        searchable={false}
        onRowClick={(delivery) => {
          if (delivery.status === "failed")
            toast.error(`Delivery ${delivery.id} failed. Retry from endpoint settings.`);
        }}
      />
    </div>
  );
}
