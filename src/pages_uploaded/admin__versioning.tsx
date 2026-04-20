
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { GitBranch, Tag, RotateCcw, Archive, Loader2, Plus, AlertCircle, Undo } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminVersioningPage,
  head: () => ({ meta: [{ title: "Versioning — Admin — ERP Vala" }] }),
});

const apiVersions = [
  {
    id: "API-v3",
    version: "v3",
    released: "2024-01-01",
    deprecated: "—",
    sunsetAt: "—",
    breaking: "No",
    consumers: "8,420",
    status: "active",
  },
  {
    id: "API-v2",
    version: "v2",
    released: "2023-01-01",
    deprecated: "2024-01-01",
    sunsetAt: "2025-01-01",
    breaking: "Yes",
    consumers: "1,204",
    status: "pending",
  },
  {
    id: "API-v1",
    version: "v1",
    released: "2022-01-01",
    deprecated: "2023-06-01",
    sunsetAt: "2024-06-01",
    breaking: "Yes",
    consumers: "43",
    status: "disabled",
  },
];

const fileVersions = [
  {
    id: "FV-001",
    resource: "product:PRD-045",
    version: "v12",
    size: "24 MB",
    author: "merchant@acme.com",
    createdAt: "2024-01-18 10:00",
    status: "active",
  },
  {
    id: "FV-002",
    resource: "product:PRD-045",
    version: "v11",
    size: "23 MB",
    author: "merchant@acme.com",
    createdAt: "2024-01-10 14:20",
    status: "archived",
  },
  {
    id: "FV-003",
    resource: "product:PRD-045",
    version: "v10",
    size: "22 MB",
    author: "merchant@acme.com",
    createdAt: "2023-12-20 09:00",
    status: "archived",
  },
  {
    id: "FV-004",
    resource: "template:INV-001",
    version: "v3",
    size: "128 KB",
    author: "admin@erpvala.com",
    createdAt: "2024-01-15 11:00",
    status: "active",
  },
  {
    id: "FV-005",
    resource: "template:INV-001",
    version: "v2",
    size: "120 KB",
    author: "admin@erpvala.com",
    createdAt: "2024-01-05 09:30",
    status: "archived",
  },
];

function AdminVersioningPage() {
  const [isSendingNotice, setIsSendingNotice] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  const handleSendDeprecationNotice = async () => {
    if (!confirm("Are you sure you want to send deprecation notices to all consumers?")) {
      return;
    }
    setIsSendingNotice(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Deprecation notice sent successfully");
    } catch (error) {
      toast.error("Failed to send deprecation notice");
    } finally {
      setIsSendingNotice(false);
    }
  };

  const handleNewApiVersion = async () => {
    setIsCreatingVersion(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("New API version created successfully");
    } catch (error) {
      toast.error("Failed to create API version");
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleRollback = async (version: string, id: string) => {
    if (!confirm(`Are you sure you want to rollback to ${version}?`)) {
      return;
    }
    setRollingBackId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Rolled back to ${version} successfully`);
    } catch (error) {
      toast.error("Failed to rollback");
    } finally {
      setRollingBackId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Versioning System</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSendDeprecationNotice} disabled={isSendingNotice}>
            {isSendingNotice ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="mr-2 h-4 w-4" />
            )}
            {isSendingNotice ? "Sending..." : "Send Deprecation Notice"}
          </Button>
          <Button onClick={handleNewApiVersion} disabled={isCreatingVersion}>
            {isCreatingVersion ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreatingVersion ? "Creating..." : "New API Version"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="API Versions"
          value="3"
          icon={GitBranch}
          change="v3 is current"
          changeType="neutral"
        />
        <StatCard
          title="Active Consumers"
          value="9,667"
          icon={Tag}
          change="Across all versions"
          changeType="neutral"
        />
        <StatCard
          title="Deprecated"
          value="2"
          icon={Archive}
          change="v1 sunsets Jun 2024"
          changeType="negative"
        />
        <StatCard
          title="Files Versioned"
          value="12,430"
          icon={RotateCcw}
          change="Last 30 days"
          changeType="positive"
        />
      </div>

      <DataTable
        title="API Versions"
        columns={[
          {
            header: "Version",
            accessorKey: "version",
            cell: ({ row }) => (
              <code className="text-sm bg-muted px-2 py-0.5 rounded font-bold">
                {row.original.version}
              </code>
            ),
          },
          { header: "Released", accessorKey: "released" },
          { header: "Deprecated", accessorKey: "deprecated" },
          { header: "Sunset Date", accessorKey: "sunsetAt" },
          { header: "Breaking Change", accessorKey: "breaking" },
          { header: "Consumers", accessorKey: "consumers" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
        ]}
        data={apiVersions}
      />

      <DataTable
        title="File / Artifact Versions"
        columns={[
          { header: "Resource", accessorKey: "resource" },
          {
            header: "Version",
            accessorKey: "version",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.version}</code>
            ),
          },
          { header: "Size", accessorKey: "size" },
          { header: "Author", accessorKey: "author" },
          { header: "Created", accessorKey: "createdAt" },
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
                disabled={row.original.status === "active" || rollingBackId === row.original.id}
                onClick={() => handleRollback(row.original.version, row.original.id)}
              >
                {rollingBackId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Undo className="mr-1 h-3 w-3" />
                )}
                {rollingBackId === row.original.id ? "Rolling back..." : "Rollback"}
              </Button>
            ),
          },
        ]}
        data={fileVersions}
      />

      <Card>
        <CardHeader>
          <CardTitle>Versioning Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "API Lifecycle",
                desc: "New major version released with 12-month overlap. Deprecation notice sent 6 months before sunset. Version header: X-API-Version.",
              },
              {
                title: "Backward Compatibility",
                desc: "Minor versions are strictly backward-compatible. Breaking changes always result in a new major version.",
              },
              {
                title: "File Rollback",
                desc: "Up to 50 versions retained per artifact. One-click rollback restores previous version atomically.",
              },
              {
                title: "Consumer Migration",
                desc: "Migration guides auto-generated on version creation. In-app banners shown to consumers approaching sunset.",
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
