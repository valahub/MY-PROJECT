
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Lock, Unlock, Shield, Layers, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminEntitlementsPage,
  head: () => ({ meta: [{ title: "Entitlements — Admin — ERP Vala" }] }),
});

const features = [
  {
    id: "FT-001",
    feature: "api_access",
    plan: "Starter",
    limit: "1,000 req/mo",
    access: "enabled",
  },
  { id: "FT-002", feature: "api_access", plan: "Pro", limit: "100,000 req/mo", access: "enabled" },
  { id: "FT-003", feature: "advanced_analytics", plan: "Starter", limit: "—", access: "disabled" },
  {
    id: "FT-004",
    feature: "advanced_analytics",
    plan: "Pro",
    limit: "Unlimited",
    access: "enabled",
  },
  { id: "FT-005", feature: "white_label", plan: "Pro", limit: "—", access: "disabled" },
  {
    id: "FT-006",
    feature: "white_label",
    plan: "Enterprise",
    limit: "Unlimited",
    access: "enabled",
  },
  { id: "FT-007", feature: "team_members", plan: "Starter", limit: "3 users", access: "enabled" },
  { id: "FT-008", feature: "team_members", plan: "Pro", limit: "25 users", access: "enabled" },
];

function AdminEntitlementsPage() {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddFeatureFlag = async () => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Feature flag added successfully");
    } catch (error) {
      toast.error("Failed to add feature flag");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Entitlements</h1>
        <Button onClick={handleAddFeatureFlag} disabled={isAdding}>
          {isAdding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAdding ? "Adding..." : "Add Feature Flag"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Feature Flags" value="42" icon={Layers} />
        <StatCard title="Active Plans" value="6" icon={Shield} />
        <StatCard title="Locked Features" value="18" icon={Lock} />
        <StatCard title="Open Features" value="24" icon={Unlock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API-Level Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "products.read", desc: "List and view products", on: true },
            { name: "products.write", desc: "Create and update products", on: true },
            { name: "subscriptions.cancel", desc: "Cancel customer subscriptions", on: false },
            { name: "licenses.revoke", desc: "Force revoke license keys", on: false },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-mono text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <Switch defaultChecked={p.on} />
            </div>
          ))}
        </CardContent>
      </Card>

      <DataTable
        title="Plan-Based Feature Matrix"
        columns={[
          {
            header: "Feature",
            accessorKey: "feature",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.feature}</code>
            ),
          },
          { header: "Plan", accessorKey: "plan" },
          { header: "Limit", accessorKey: "limit" },
          {
            header: "Access",
            accessorKey: "access",
            cell: ({ row }) =>
              row.original.access === "enabled" ? (
                <span className="text-success font-medium text-xs">✓ Unlocked</span>
              ) : (
                <span className="text-muted-foreground text-xs">✗ Locked</span>
              ),
          },
        ]}
        data={features}
      />
    </div>
  );
}

export default AdminEntitlementsPage;
