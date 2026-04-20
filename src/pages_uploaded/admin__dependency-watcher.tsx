
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Link2, AlertTriangle, CheckCircle, RefreshCw, Shuffle, Loader2, Settings, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminDependencyWatcherPage,
  head: () => ({ meta: [{ title: "Dependency Watcher — Admin — ERP Vala" }] }),
});

const dependencies = [
  {
    id: "DEP-001",
    name: "Stripe Payment Gateway",
    type: "payment",
    url: "https://api.stripe.com",
    latency: "82 ms",
    uptime: "99.99%",
    lastChecked: "2024-01-18 15:00:02",
    fallback: "Braintree",
    fallbackActive: false,
    status: "healthy",
  },
  {
    id: "DEP-002",
    name: "SendGrid Email API",
    type: "email",
    url: "https://api.sendgrid.com",
    latency: "54 ms",
    uptime: "99.95%",
    lastChecked: "2024-01-18 15:00:01",
    fallback: "Mailgun",
    fallbackActive: false,
    status: "healthy",
  },
  {
    id: "DEP-003",
    name: "Twilio SMS",
    type: "sms",
    url: "https://api.twilio.com",
    latency: "—",
    uptime: "94.2%",
    lastChecked: "2024-01-18 14:42:00",
    fallback: "AWS SNS",
    fallbackActive: true,
    status: "degraded",
  },
  {
    id: "DEP-004",
    name: "Maxmind GeoIP",
    type: "enrichment",
    url: "https://geoip.maxmind.com",
    latency: "12 ms",
    uptime: "100%",
    lastChecked: "2024-01-18 15:00:02",
    fallback: "Local DB cache",
    fallbackActive: false,
    status: "healthy",
  },
  {
    id: "DEP-005",
    name: "AWS S3 (file storage)",
    type: "storage",
    url: "https://s3.amazonaws.com",
    latency: "38 ms",
    uptime: "99.999%",
    lastChecked: "2024-01-18 15:00:02",
    fallback: "GCS bucket",
    fallbackActive: false,
    status: "healthy",
  },
  {
    id: "DEP-006",
    name: "HaveIBeenPwned API",
    type: "security",
    url: "https://api.pwnedpasswords.com",
    latency: "—",
    uptime: "0%",
    lastChecked: "2024-01-18 12:00:00",
    fallback: "Disabled — local check",
    fallbackActive: true,
    status: "down",
  },
];

const failoverLog = [
  {
    id: "FL-001",
    dependency: "Twilio SMS",
    failedAt: "2024-01-18 14:42:00",
    fallbackActivated: "AWS SNS",
    restoredAt: "—",
    status: "active",
  },
  {
    id: "FL-002",
    dependency: "HaveIBeenPwned API",
    failedAt: "2024-01-18 12:00:00",
    fallbackActivated: "Local check (disabled feature)",
    restoredAt: "—",
    status: "active",
  },
  {
    id: "FL-003",
    dependency: "Stripe Payment Gateway",
    failedAt: "2024-01-10 03:15:00",
    fallbackActivated: "Braintree",
    restoredAt: "2024-01-10 03:27:00",
    status: "resolved",
  },
];

function AdminDependencyWatcherPage() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleConfigureFallbacks = async () => {
    setIsConfiguring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Fallbacks configured successfully");
    } catch (error) {
      toast.error("Failed to configure fallbacks");
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleForceHealthCheck = async () => {
    setIsChecking(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Health check completed successfully");
    } catch (error) {
      toast.error("Failed to run health check");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dependency Watcher</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleConfigureFallbacks} disabled={isConfiguring}>
            {isConfiguring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}
            {isConfiguring ? "Configuring..." : "Configure Fallbacks"}
          </Button>
          <Button onClick={handleForceHealthCheck} disabled={isChecking}>
            {isChecking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            {isChecking ? "Checking..." : "Force Health Check"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Dependencies Monitored"
          value="6"
          icon={Link2}
          change="Third-party APIs"
          changeType="neutral"
        />
        <StatCard
          title="Healthy"
          value="4"
          icon={CheckCircle}
          change="66% fully operational"
          changeType="positive"
        />
        <StatCard
          title="Degraded / Down"
          value="2"
          icon={AlertTriangle}
          change="Fallbacks active"
          changeType="negative"
        />
        <StatCard
          title="Fallbacks Active"
          value="2"
          icon={Shuffle}
          change="Automatic switchover"
          changeType="neutral"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fallback Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Continuous Health Checks</p>
              <p className="text-xs text-muted-foreground">
                Each registered dependency is probed every 30 s with a lightweight health endpoint
                or synthetic request. Latency and status codes are tracked.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Automatic Failover</p>
              <p className="text-xs text-muted-foreground">
                If a dependency fails 2 consecutive checks, traffic is automatically routed to its
                configured fallback provider with zero code changes required.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Auto-Restore</p>
              <p className="text-xs text-muted-foreground">
                When the primary dependency recovers, traffic is gradually shifted back (10% → 50% →
                100% over 5 minutes) to validate stability before full restoration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Dependency Status"
        columns={[
          { header: "Name", accessorKey: "name" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.type}</code>
            ),
          },
          {
            header: "Latency",
            accessorKey: "latency",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.latency}</span>,
          },
          { header: "Uptime", accessorKey: "uptime" },
          { header: "Last Checked", accessorKey: "lastChecked" },
          { header: "Fallback", accessorKey: "fallback" },
          {
            header: "Fallback Active",
            accessorKey: "fallbackActive",
            cell: ({ row }) => (
              <span
                className={
                  row.original.fallbackActive ? "text-accent font-medium" : "text-muted-foreground"
                }
              >
                {row.original.fallbackActive ? "Yes" : "No"}
              </span>
            ),
          },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={dependencies}
      />

      <DataTable
        title="Failover Log"
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Dependency", accessorKey: "dependency" },
          { header: "Failed At", accessorKey: "failedAt" },
          { header: "Fallback Activated", accessorKey: "fallbackActivated" },
          { header: "Restored At", accessorKey: "restoredAt" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={failoverLog}
      />
    </div>
  );
}
