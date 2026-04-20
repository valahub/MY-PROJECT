
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Globe, Zap, ShieldAlert, Server, Loader2, Trash2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminCdnEdgePage,
  head: () => ({ meta: [{ title: "CDN & Edge — Admin — ERP Vala" }] }),
});

const cacheRules = [
  {
    id: "CR-001",
    pattern: "/api/products/*",
    ttl: "300s",
    cacheControl: "public, max-age=300",
    hits: "1.2M",
    bypassRate: "2.1%",
    status: "active",
  },
  {
    id: "CR-002",
    pattern: "/marketplace/item/*",
    ttl: "3600s",
    cacheControl: "public, s-maxage=3600",
    hits: "8.4M",
    bypassRate: "0.8%",
    status: "active",
  },
  {
    id: "CR-003",
    pattern: "/api/user/*",
    ttl: "0s",
    cacheControl: "private, no-store",
    hits: "0",
    bypassRate: "100%",
    status: "active",
  },
  {
    id: "CR-004",
    pattern: "/static/*",
    ttl: "86400s",
    cacheControl: "public, max-age=86400, immutable",
    hits: "42M",
    bypassRate: "0.1%",
    status: "active",
  },
];

const wafRules = [
  {
    id: "WAF-001",
    name: "SQL Injection Block",
    type: "SQLI",
    action: "block",
    triggered: "342",
    lastTriggered: "2024-01-18 14:20",
    status: "active",
  },
  {
    id: "WAF-002",
    name: "XSS Prevention",
    type: "XSS",
    action: "block",
    triggered: "89",
    lastTriggered: "2024-01-18 13:10",
    status: "active",
  },
  {
    id: "WAF-003",
    name: "Rate Limit — Auth",
    type: "RATELIMIT",
    action: "challenge",
    triggered: "1240",
    lastTriggered: "2024-01-18 14:35",
    status: "active",
  },
  {
    id: "WAF-004",
    name: "Bad Bot Fingerprint",
    type: "BOT",
    action: "block",
    triggered: "5820",
    lastTriggered: "2024-01-18 14:30",
    status: "active",
  },
  {
    id: "WAF-005",
    name: "Geo-Block: Sanctioned",
    type: "GEO",
    action: "block",
    triggered: "78",
    lastTriggered: "2024-01-17 09:05",
    status: "disabled",
  },
];

const edgeNodes = [
  { region: "us-east-1", location: "Virginia, USA", latency: "12ms", status: "active" },
  { region: "eu-west-1", location: "Dublin, Ireland", latency: "18ms", status: "active" },
  { region: "ap-southeast-1", location: "Singapore", latency: "22ms", status: "active" },
  { region: "ap-northeast-1", location: "Tokyo, Japan", latency: "28ms", status: "active" },
  { region: "sa-east-1", location: "São Paulo, Brazil", latency: "35ms", status: "active" },
  { region: "au-southeast-1", location: "Sydney, Australia", latency: "31ms", status: "pending" },
];

function AdminCdnEdgePage() {
  const [isPurging, setIsPurging] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handlePurgeCache = async () => {
    if (!confirm("Are you sure you want to purge all global cache?")) {
      return;
    }
    setIsPurging(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Global cache purged successfully");
    } catch (error) {
      toast.error("Failed to purge cache");
    } finally {
      setIsPurging(false);
    }
  };

  const handleDeployConfig = async () => {
    setIsDeploying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Edge config deployed successfully");
    } catch (error) {
      toast.error("Failed to deploy config");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">CDN & Edge</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePurgeCache} disabled={isPurging}>
            {isPurging ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isPurging ? "Purging..." : "Purge All Cache"}
          </Button>
          <Button onClick={handleDeployConfig} disabled={isDeploying}>
            {isDeploying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            {isDeploying ? "Deploying..." : "Deploy Config"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cache Hit Rate"
          value="91.4%"
          icon={Zap}
          change="+2.1% vs last week"
          changeType="positive"
        />
        <StatCard
          title="Bandwidth Saved"
          value="4.8 TB"
          icon={Globe}
          change="Last 30 days"
          changeType="positive"
        />
        <StatCard
          title="WAF Blocked"
          value="7,573"
          icon={ShieldAlert}
          change="Last 24h"
          changeType="positive"
        />
        <StatCard
          title="Edge Nodes"
          value="6"
          icon={Server}
          change="5 healthy · 1 provisioning"
          changeType="neutral"
        />
      </div>

      <DataTable
        title="Cache Rules"
        columns={[
          {
            header: "Pattern",
            accessorKey: "pattern",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.pattern}</code>
            ),
          },
          { header: "TTL", accessorKey: "ttl" },
          { header: "Cache-Control", accessorKey: "cacheControl" },
          { header: "Hits", accessorKey: "hits" },
          { header: "Bypass %", accessorKey: "bypassRate" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={cacheRules}
      />

      <DataTable
        title="WAF Rules"
        columns={[
          { header: "Name", accessorKey: "name" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.type}</code>
            ),
          },
          { header: "Action", accessorKey: "action" },
          { header: "Triggered", accessorKey: "triggered" },
          { header: "Last Hit", accessorKey: "lastTriggered" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={wafRules}
      />

      <Card>
        <CardHeader>
          <CardTitle>Edge Node Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {edgeNodes.map((node) => (
              <div
                key={node.region}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{node.location}</p>
                  <p className="text-xs font-mono text-muted-foreground">{node.region}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{node.latency}</p>
                  <StatusBadge status={node.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminCdnEdgePage;
