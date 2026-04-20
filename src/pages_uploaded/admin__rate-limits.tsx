
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gauge, Ban, Shield, Activity, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminRateLimitsPage,
  head: () => ({ meta: [{ title: "Rate Limits — Admin — ERP Vala" }] }),
});

const blocked = [
  {
    id: "BLK-001",
    ip: "203.0.113.42",
    reason: "Brute force login (12 attempts)",
    attempts: 12,
    blockedAt: "2024-01-18 14:22",
    expires: "2024-01-18 15:22",
    status: "active",
  },
  {
    id: "BLK-002",
    ip: "198.51.100.7",
    reason: "API rate limit exceeded",
    attempts: 5230,
    blockedAt: "2024-01-18 13:45",
    expires: "2024-01-18 14:45",
    status: "active",
  },
  {
    id: "BLK-003",
    ip: "192.0.2.18",
    reason: "Suspicious checkout pattern",
    attempts: 47,
    blockedAt: "2024-01-18 12:10",
    expires: "Permanent",
    status: "active",
  },
  {
    id: "BLK-004",
    ip: "203.0.113.99",
    reason: "Brute force login",
    attempts: 8,
    blockedAt: "2024-01-17 22:15",
    expires: "Expired",
    status: "inactive",
  },
];

function AdminRateLimitsPage() {
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("IP blocked successfully");
    } catch (error) {
      toast.error("Failed to block IP");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rate Limits & Abuse Control</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Requests (1h)" value="245K" icon={Activity} />
        <StatCard
          title="Throttled"
          value="1,842"
          icon={Gauge}
          change="0.7% of total"
          changeType="neutral"
        />
        <StatCard title="Blocked IPs" value="34" icon={Ban} />
        <StatCard
          title="Blocked Logins"
          value="89"
          icon={Shield}
          change="Brute force"
          changeType="negative"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Rate Limits by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Free</p>
              <p className="text-2xl font-bold">
                100<span className="text-sm text-muted-foreground">/min</span>
              </p>
              <p className="text-xs text-muted-foreground">1,000 / hour</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Pro</p>
              <p className="text-2xl font-bold">
                1,000<span className="text-sm text-muted-foreground">/min</span>
              </p>
              <p className="text-xs text-muted-foreground">100,000 / hour</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Enterprise</p>
              <p className="text-2xl font-bold">
                10,000<span className="text-sm text-muted-foreground">/min</span>
              </p>
              <p className="text-xs text-muted-foreground">Unlimited</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brute Force Protection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between rounded-md border p-3">
            <span>Max failed login attempts</span>
            <span className="font-medium">5</span>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>Lockout duration</span>
            <span className="font-medium">15 minutes</span>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>CAPTCHA threshold</span>
            <span className="font-medium">3 attempts</span>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>Permanent ban threshold</span>
            <span className="font-medium">25 attempts</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual IP Block</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Enter IP address (e.g. 203.0.113.1)" />
          <Button onClick={handleBlock} disabled={isBlocking}>
            {isBlocking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isBlocking ? "Blocking..." : "Block"}
          </Button>
        </CardContent>
      </Card>

      <DataTable
        title="Blocked IPs"
        columns={[
          {
            header: "IP",
            accessorKey: "ip",
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip}</span>,
          },
          { header: "Reason", accessorKey: "reason" },
          { header: "Attempts", accessorKey: "attempts" },
          { header: "Blocked At", accessorKey: "blockedAt" },
          { header: "Expires", accessorKey: "expires" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={blocked}
      />
    </div>
  );
}
