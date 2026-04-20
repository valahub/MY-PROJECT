import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getUiErrorMessage, getWebhookEndpoints, saveWebhookEndpoint } from "@/lib/ui-actions-api";
import { toast } from "sonner";

({
  component: CreateWebhookPage,
  head: () => ({ meta: [{ title: "Add Webhook Endpoint — Merchant — ERP Vala" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    endpointId: typeof search.endpointId === "string" ? search.endpointId : undefined,
  }),
});

const webhookEvents = [
  { group: "Payments", events: ["payment.success", "payment.failed", "payment.refunded"] },
  {
    group: "Subscriptions",
    events: [
      "subscription.created",
      "subscription.updated",
      "subscription.cancelled",
      "subscription.renewed",
      "subscription.paused",
    ],
  },
  {
    group: "Licenses",
    events: [
      "license.created",
      "license.activated",
      "license.deactivated",
      "license.expired",
      "license.revoked",
    ],
  },
  { group: "Customers", events: ["customer.created", "customer.updated"] },
];

function CreateWebhookPage() {
  const navigate = useNavigate();
  const { endpointId } = Route.useSearch();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingEndpoint, setLoadingEndpoint] = useState(!!endpointId);

  const allEvents = useMemo(() => webhookEvents.flatMap((g) => g.events), []);
  const selectAll = selectedEvents.length > 0 && selectedEvents.length === allEvents.length;

  useEffect(() => {
    if (!endpointId) return;
    void (async () => {
      try {
        const endpoints = await getWebhookEndpoints();
        const existing = endpoints.find((ep) => ep.id === endpointId);
        if (!existing) {
          toast.error("Webhook endpoint not found.");
          navigate({ to: "/merchant/webhooks" });
          return;
        }
        setUrl(existing.url);
        setDescription(existing.description ?? "");
        if (existing.events === "All events") {
          setSelectedEvents(allEvents);
        } else {
          setSelectedEvents(
            existing.events
              .split(",")
              .map((event) => event.trim())
              .filter(Boolean),
          );
        }
      } catch (error) {
        toast.error(getUiErrorMessage(error, "Failed to load endpoint."));
      } finally {
        setLoadingEndpoint(false);
      }
    })();
  }, [endpointId, allEvents, navigate]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const toggleAll = () => {
    if (selectAll) setSelectedEvents([]);
    else setSelectedEvents([...allEvents]);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!url.trim()) next.url = "Endpoint URL is required";
    else {
      try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== "https:") next.url = "URL must use HTTPS";
      } catch {
        next.url = "Enter a valid URL (https://...)";
      }
    }
    if (selectedEvents.length === 0) next.events = "Select at least one event";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await saveWebhookEndpoint({
        endpointId,
        url,
        description,
        selectedEvents,
      });
      toast.success(endpointId ? "Webhook endpoint updated." : "Webhook endpoint created.");
      navigate({ to: "/merchant/webhooks" });
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Could not save endpoint."));
    } finally {
      setSaving(false);
    }
  };

  if (loadingEndpoint) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link to="/merchant/webhooks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Webhook Endpoint</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading endpoint...
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/merchant/webhooks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {endpointId ? "Edit Webhook Endpoint" : "Add Webhook Endpoint"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Endpoint URL *</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/webhooks"
            />
            {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Production webhook for order processing"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Events *</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox id="select-all" checked={selectAll} onCheckedChange={toggleAll} />
              <Label htmlFor="select-all" className="text-sm">
                Select All
              </Label>
            </div>
          </div>
          {errors.events && <p className="text-xs text-destructive">{errors.events}</p>}
        </CardHeader>
        <CardContent className="space-y-6">
          {webhookEvents.map((group) => (
            <div key={group.group}>
              <p className="text-sm font-medium mb-2">{group.group}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.events.map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <Checkbox
                      id={event}
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => toggleEvent(event)}
                    />
                    <Label htmlFor={event} className="text-sm font-mono">
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retry Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Failed deliveries will be retried automatically:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>1st retry: 30 seconds after failure</li>
            <li>2nd retry: 5 minutes after 1st retry</li>
            <li>3rd retry: 30 minutes after 2nd retry</li>
            <li>4th retry: 2 hours after 3rd retry</li>
            <li>5th retry: 24 hours after 4th retry</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link to="/merchant/webhooks">
          <Button variant="outline" disabled={saving}>
            Cancel
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {endpointId ? "Save Changes" : "Create Endpoint"}
        </Button>
      </div>
    </div>
  );
}

export default CreateWebhookPage;
