
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Flag, ToggleLeft, Percent, ShieldOff, Loader2, Plus, Upload, Download, Power } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminFeatureFlagsPage,
  head: () => ({ meta: [{ title: "Feature Flags — Admin — ERP Vala" }] }),
});

const flags = [
  {
    id: "FF-001",
    name: "new_checkout_flow",
    description: "Redesigned multi-step checkout experience",
    targeting: "tenant:acme,beta:true",
    rollout: "25%",
    status: "active",
    updatedAt: "2024-01-18 10:00",
  },
  {
    id: "FF-002",
    name: "ai_fraud_detection",
    description: "ML-powered real-time fraud scoring",
    targeting: "all",
    rollout: "100%",
    status: "active",
    updatedAt: "2024-01-17 14:30",
  },
  {
    id: "FF-003",
    name: "multi_currency_v2",
    description: "Next-gen currency conversion engine",
    targeting: "plan:enterprise",
    rollout: "10%",
    status: "pending",
    updatedAt: "2024-01-17 09:15",
  },
  {
    id: "FF-004",
    name: "legacy_billing_api",
    description: "Old billing API for backward compatibility",
    targeting: "all",
    rollout: "0%",
    status: "disabled",
    updatedAt: "2024-01-10 16:00",
  },
  {
    id: "FF-005",
    name: "bulk_invoice_export",
    description: "Batch PDF invoice generation",
    targeting: "user:admin,user:support",
    rollout: "100%",
    status: "active",
    updatedAt: "2024-01-15 11:20",
  },
  {
    id: "FF-006",
    name: "event_bus_v2",
    description: "Kafka-backed async event pipeline",
    targeting: "tenant:internal",
    rollout: "50%",
    status: "pending",
    updatedAt: "2024-01-18 08:00",
  },
];

function AdminFeatureFlagsPage() {
  const [list, setList] = useState(flags);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);
  const [isKillingAll, setIsKillingAll] = useState(false);

  const toggle = async (id: string) => {
    setTogglingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setList((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: f.status === "active" ? "disabled" : "active" } : f,
        ),
      );
      toast.success("Flag updated");
    } catch (error) {
      toast.error("Failed to update flag");
    } finally {
      setTogglingId(null);
    }
  };

  const rollback = async (id: string) => {
    setRollingBackId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setList((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "disabled", rollout: "0%" } : f)),
      );
      toast.success("Flag rolled back to 0%");
    } catch (error) {
      toast.error("Failed to rollback flag");
    } finally {
      setRollingBackId(null);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Flags imported successfully");
    } catch (error) {
      toast.error("Failed to import flags");
    } finally {
      setIsImporting(false);
    }
  };

  const handleNewFlag = async () => {
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Flag created successfully");
    } catch (error) {
      toast.error("Failed to create flag");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveSnapshot = async () => {
    setIsSavingSnapshot(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Snapshot saved");
    } catch (error) {
      toast.error("Failed to save snapshot");
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const handleRestoreSnapshot = async () => {
    if (!confirm("Are you sure you want to restore the last snapshot?")) {
      return;
    }
    setIsRestoringSnapshot(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Snapshot restored");
    } catch (error) {
      toast.error("Failed to restore snapshot");
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  const handleKillAll = async () => {
    if (!confirm("Are you sure you want to disable all flags? This is an emergency action.")) {
      return;
    }
    setIsKillingAll(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setList((prev) => prev.map((f) => ({ ...f, status: "disabled", rollout: "0%" })));
      toast.warning("All flags disabled");
    } catch (error) {
      toast.error("Failed to disable all flags");
    } finally {
      setIsKillingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} disabled={isImporting}>
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isImporting ? "Importing..." : "Import Flags"}
          </Button>
          <Button onClick={handleNewFlag} disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "New Flag"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Flags" value="24" icon={Flag} />
        <StatCard
          title="Enabled"
          value="18"
          icon={ToggleLeft}
          change="75% active"
          changeType="positive"
        />
        <StatCard
          title="In Rollout"
          value="4"
          icon={Percent}
          change="Gradual deployment"
          changeType="neutral"
        />
        <StatCard
          title="Kill-Switched"
          value="2"
          icon={ShieldOff}
          change="Safe rollback applied"
          changeType="negative"
        />
      </div>

      <DataTable
        title="Flag Registry"
        columns={[
          {
            header: "Name",
            accessorKey: "name",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.name}</code>
            ),
          },
          { header: "Description", accessorKey: "description" },
          {
            header: "Targeting",
            accessorKey: "targeting",
            cell: ({ row }) => (
              <span className="text-xs font-mono text-muted-foreground">
                {row.original.targeting}
              </span>
            ),
          },
          { header: "Rollout", accessorKey: "rollout" },
          {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
          },
          { header: "Updated", accessorKey: "updatedAt" },
          {
            header: "Actions",
            accessorKey: "id",
            cell: ({ row }) => (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggle(row.original.id)}
                  disabled={togglingId === row.original.id}
                >
                  {togglingId === row.original.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Power className="mr-1 h-3 w-3" />
                  )}
                  {togglingId === row.original.id ? "Toggling..." : "Toggle"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => rollback(row.original.id)}
                  disabled={rollingBackId === row.original.id}
                >
                  {rollingBackId === row.original.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {rollingBackId === row.original.id ? "Rolling back..." : "Rollback"}
                </Button>
              </div>
            ),
          },
        ]}
        data={list}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rollout Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: "Canary",
                  desc: "5% → 25% → 50% → 100% staged promotion",
                },
                {
                  label: "Ring-based",
                  desc: "Internal → Beta tenants → Pro → All",
                },
                {
                  label: "Percentage",
                  desc: "Random user/tenant hash bucketing",
                },
                {
                  label: "Targeting",
                  desc: "Explicit tenant_id / user_id / plan allowlist",
                },
              ].map((p) => (
                <div key={p.label} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Kill-switch all active flags or revert to a previous snapshot for instant rollback.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSaveSnapshot}
                disabled={isSavingSnapshot}
              >
                {isSavingSnapshot ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isSavingSnapshot ? "Saving..." : "Save Current Snapshot"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRestoreSnapshot}
                disabled={isRestoringSnapshot}
              >
                {isRestoringSnapshot ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isRestoringSnapshot ? "Restoring..." : "Restore Last Snapshot"}
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/50 hover:bg-destructive hover:text-white"
                onClick={handleKillAll}
                disabled={isKillingAll}
              >
                {isKillingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldOff className="mr-2 h-4 w-4" />
                )}
                {isKillingAll ? "Disabling..." : "Kill All Flags"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminFeatureFlagsPage;
