
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Key, RotateCcw, AlertTriangle, ShieldCheck, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

({
  component: AdminSecretsPage,
  head: () => ({ meta: [{ title: "Secrets Management — Admin — ERP Vala" }] }),
});

const secrets = [
  {
    id: "SEC-001",
    name: "stripe_live_secret_key",
    type: "API Key",
    backend: "Vault",
    lastRotated: "2024-01-01",
    expiresAt: "2024-04-01",
    daysLeft: "73",
    status: "active",
  },
  {
    id: "SEC-002",
    name: "db_master_password",
    type: "Credential",
    backend: "Vault",
    lastRotated: "2024-01-15",
    expiresAt: "2024-07-15",
    daysLeft: "178",
    status: "active",
  },
  {
    id: "SEC-003",
    name: "jwt_signing_secret",
    type: "Symmetric Key",
    backend: "Vault",
    lastRotated: "2023-12-01",
    expiresAt: "2024-03-01",
    daysLeft: "42",
    status: "pending",
  },
  {
    id: "SEC-004",
    name: "sendgrid_api_key",
    type: "API Key",
    backend: "Vault",
    lastRotated: "2023-11-15",
    expiresAt: "2024-02-15",
    daysLeft: "18",
    status: "pending",
  },
  {
    id: "SEC-005",
    name: "cloudflare_api_token",
    type: "API Key",
    backend: "Vault",
    lastRotated: "2024-01-10",
    expiresAt: "2024-07-10",
    daysLeft: "173",
    status: "active",
  },
  {
    id: "SEC-006",
    name: "legacy_webhook_secret_v1",
    type: "Shared Secret",
    backend: "Vault",
    lastRotated: "2023-06-01",
    expiresAt: "2024-01-10",
    daysLeft: "0",
    status: "expired",
  },
];

const rotationPolicies = [
  {
    type: "API Key",
    frequency: "Every 90 days",
    autoRotate: "Yes",
    notification: "14 days before",
  },
  {
    type: "DB Credential",
    frequency: "Every 180 days",
    autoRotate: "Yes",
    notification: "30 days before",
  },
  {
    type: "JWT Secret",
    frequency: "Every 90 days",
    autoRotate: "No",
    notification: "14 days before",
  },
  {
    type: "Symmetric Key",
    frequency: "Every 365 days",
    autoRotate: "No",
    notification: "60 days before",
  },
];

function AdminSecretsPage() {
  const [isRotatingExpiring, setIsRotatingExpiring] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const handleRotateExpiring = async () => {
    if (!confirm("Are you sure you want to rotate all expiring secrets?")) {
      return;
    }
    setIsRotatingExpiring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("All pending secrets rotation started");
    } catch (error) {
      toast.error("Failed to start rotation");
    } finally {
      setIsRotatingExpiring(false);
    }
  };

  const handleAddSecret = async () => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Secret added to Vault");
    } catch (error) {
      toast.error("Failed to add secret");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRotate = async (name: string, id: string) => {
    setRotatingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`${name} rotation initiated`);
    } catch (error) {
      toast.error("Failed to initiate rotation");
    } finally {
      setRotatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Secrets Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRotateExpiring}
            disabled={isRotatingExpiring}
          >
            {isRotatingExpiring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isRotatingExpiring ? "Rotating..." : "Rotate Expiring"}
          </Button>
          <Button onClick={handleAddSecret} disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAdding ? "Adding..." : "Add Secret"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Secrets"
          value="6"
          icon={Key}
          change="Vault-backed"
          changeType="neutral"
        />
        <StatCard
          title="Expiring Soon"
          value="2"
          icon={RotateCcw}
          change="Within 60 days"
          changeType="negative"
        />
        <StatCard
          title="Expired"
          value="1"
          icon={AlertTriangle}
          change="Needs immediate rotation"
          changeType="negative"
        />
        <StatCard
          title="Auto-Rotate"
          value="2"
          icon={ShieldCheck}
          change="Automated rotation active"
          changeType="positive"
        />
      </div>

      <DataTable
        title="Secret Registry"
        columns={[
          {
            header: "Name",
            accessorKey: "name",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.name}</code>
            ),
          },
          { header: "Type", accessorKey: "type" },
          { header: "Backend", accessorKey: "backend" },
          { header: "Last Rotated", accessorKey: "lastRotated" },
          { header: "Expires", accessorKey: "expiresAt" },
          {
            header: "Days Left",
            accessorKey: "daysLeft",
            cell: ({ row }) => {
              const d = parseInt(row.original.daysLeft);
              const color =
                d === 0
                  ? "text-destructive font-bold"
                  : d < 30
                    ? "text-accent font-bold"
                    : "text-success";
              return (
                <span className={`font-mono ${color}`}>
                  {row.original.daysLeft === "0" ? "EXPIRED" : row.original.daysLeft + "d"}
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
                onClick={() => handleRotate(row.original.name, row.original.id)}
                disabled={rotatingId === row.original.id}
              >
                {rotatingId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 h-3 w-3" />
                )}
                {rotatingId === row.original.id ? "Rotating..." : "Rotate"}
              </Button>
            ),
          },
        ]}
        data={secrets}
      />

      <DataTable
        title="Rotation Policies"
        columns={[
          { header: "Type", accessorKey: "type" },
          { header: "Frequency", accessorKey: "frequency" },
          { header: "Auto-Rotate", accessorKey: "autoRotate" },
          { header: "Notification Window", accessorKey: "notification" },
        ]}
        data={rotationPolicies}
      />

      <Card>
        <CardHeader>
          <CardTitle>Vault Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Backend",
                desc: "HashiCorp Vault with Shamir's Secret Sharing for unseal. HA mode with 3-node cluster.",
              },
              {
                title: "Access Control",
                desc: "AppRole authentication per service. Least-privilege policies. All access logged.",
              },
              {
                title: "Encryption",
                desc: "AES-256-GCM at rest. TLS 1.3 in transit. Keys never leave Vault in plaintext.",
              },
              {
                title: "Audit Log",
                desc: "All secret reads/writes/rotations emit audit events forwarded to the immutable audit trail.",
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
