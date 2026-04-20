
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Building2, Database, ShieldCheck, AlertTriangle, Loader2, Download, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminTenantsPage,
  head: () => ({ meta: [{ title: "Multi-Tenancy — Admin — ERP Vala" }] }),
});

const tenants = [
  {
    id: "TNT-001",
    name: "Acme Corp",
    plan: "Enterprise",
    isolation: "schema",
    storageUsed: "18.4 GB",
    storageLimit: "50 GB",
    apiCalls: "2.1M / 5M",
    status: "active",
    createdAt: "2023-06-01",
  },
  {
    id: "TNT-002",
    name: "Beta Inc",
    plan: "Pro",
    isolation: "row",
    storageUsed: "4.2 GB",
    storageLimit: "10 GB",
    apiCalls: "820K / 2M",
    status: "active",
    createdAt: "2023-08-15",
  },
  {
    id: "TNT-003",
    name: "Gamma LLC",
    plan: "Pro",
    isolation: "row",
    storageUsed: "9.8 GB",
    storageLimit: "10 GB",
    apiCalls: "1.95M / 2M",
    status: "active",
    createdAt: "2023-09-01",
  },
  {
    id: "TNT-004",
    name: "Delta Co",
    plan: "Starter",
    isolation: "row",
    storageUsed: "0.8 GB",
    storageLimit: "2 GB",
    apiCalls: "45K / 200K",
    status: "active",
    createdAt: "2024-01-05",
  },
  {
    id: "TNT-005",
    name: "Sigma Global",
    plan: "Enterprise",
    isolation: "db",
    storageUsed: "210 GB",
    storageLimit: "500 GB",
    apiCalls: "8.4M / 20M",
    status: "active",
    createdAt: "2023-01-10",
  },
  {
    id: "TNT-006",
    name: "Omega Startup",
    plan: "Starter",
    isolation: "row",
    storageUsed: "1.9 GB",
    storageLimit: "2 GB",
    apiCalls: "195K / 200K",
    status: "pending",
    createdAt: "2024-01-17",
  },
];

const isolationDefs = [
  {
    level: "Row-Level",
    desc: "Shared DB, shared schema. tenant_id column on every table. Fast provisioning, lower cost.",
    plans: "Starter, Pro",
  },
  {
    level: "Schema-Level",
    desc: "Shared DB server, dedicated Postgres schema per tenant. Stronger isolation, easier backup per tenant.",
    plans: "Pro, Enterprise",
  },
  {
    level: "DB-Level",
    desc: "Dedicated database instance per tenant. Maximum isolation, compliance-ready (HIPAA, FedRAMP).",
    plans: "Enterprise (Large)",
  },
];

function AdminTenantsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Tenant data exported successfully");
    } catch (error) {
      toast.error("Failed to export tenant data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleProvisionTenant = async () => {
    setIsProvisioning(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Tenant provisioning initiated");
    } catch (error) {
      toast.error("Failed to provision tenant");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleManageTenant = async (id: string) => {
    setManagingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Managing tenant ${id}`);
    } catch (error) {
      toast.error("Failed to open tenant management");
    } finally {
      setManagingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Multi-Tenancy Engine</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button onClick={handleProvisionTenant} disabled={isProvisioning}>
            {isProvisioning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isProvisioning ? "Provisioning..." : "Provision Tenant"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value="342"
          icon={Building2}
          change="+8 this month"
          changeType="positive"
        />
        <StatCard
          title="DB Schemas"
          value="28"
          icon={Database}
          change="Schema-isolated tenants"
          changeType="neutral"
        />
        <StatCard
          title="Compliance Ready"
          value="5"
          icon={ShieldCheck}
          change="Dedicated DB isolation"
          changeType="positive"
        />
        <StatCard
          title="Near Limits"
          value="3"
          icon={AlertTriangle}
          change="Storage or API cap"
          changeType="negative"
        />
      </div>

      <DataTable
        title="Tenant Registry"
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "Plan", accessorKey: "plan" },
          {
            header: "Isolation",
            accessorKey: "isolation",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {row.original.isolation}
              </code>
            ),
          },
          { header: "Storage", accessorKey: "storageUsed" },
          { header: "API Calls", accessorKey: "apiCalls" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Created", accessorKey: "createdAt" },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleManageTenant(row.original.id)}
                disabled={managingId === row.original.id}
              >
                {managingId === row.original.id ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
                {managingId === row.original.id ? "Managing..." : "Manage"}
              </Button>
            ),
          },
        ]}
        data={tenants}
      />

      <Card>
        <CardHeader>
          <CardTitle>Isolation Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {isolationDefs.map((d) => (
              <div key={d.level} className="rounded-lg border p-4 space-y-2">
                <p className="font-medium">{d.level}</p>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
                <p className="text-xs font-medium text-primary">Plans: {d.plans}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Tenant Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { plan: "Starter", storage: "2 GB", api: "200K/mo", seats: "3" },
              { plan: "Pro", storage: "10 GB", api: "2M/mo", seats: "25" },
              {
                plan: "Enterprise",
                storage: "Custom",
                api: "Custom",
                seats: "Unlimited",
              },
            ].map((p) => (
              <div key={p.plan} className="rounded-lg border p-4 space-y-1">
                <p className="font-semibold">{p.plan}</p>
                <p className="text-xs text-muted-foreground">Storage: {p.storage}</p>
                <p className="text-xs text-muted-foreground">API calls: {p.api}</p>
                <p className="text-xs text-muted-foreground">Seats: {p.seats}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
