
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Lock, Unlock, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: MerchantEntitlementsPage,
  head: () => ({ meta: [{ title: "Entitlements — Merchant — ERP Vala" }] }),
});

const features = [
  {
    id: "FT-001",
    name: "API Access",
    key: "api_access",
    starter: "1K/mo",
    pro: "100K/mo",
    enterprise: "Unlimited",
  },
  {
    id: "FT-002",
    name: "Advanced Analytics",
    key: "advanced_analytics",
    starter: "—",
    pro: "✓",
    enterprise: "✓",
  },
  {
    id: "FT-003",
    name: "White Label",
    key: "white_label",
    starter: "—",
    pro: "—",
    enterprise: "✓",
  },
  {
    id: "FT-004",
    name: "Team Members",
    key: "team_members",
    starter: "3",
    pro: "25",
    enterprise: "Unlimited",
  },
  {
    id: "FT-005",
    name: "Custom Domains",
    key: "custom_domains",
    starter: "—",
    pro: "1",
    enterprise: "10",
  },
  { id: "FT-006", name: "SSO / SAML", key: "sso", starter: "—", pro: "—", enterprise: "✓" },
];

function MerchantEntitlementsPage() {
  const [isAddingFeature, setIsAddingFeature] = useState(false);

  const handleAddFeature = async () => {
    setIsAddingFeature(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Feature added successfully");
    } catch (error) {
      toast.error("Failed to add feature");
    } finally {
      setIsAddingFeature(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plan Entitlements</h1>
        <Button onClick={handleAddFeature} disabled={isAddingFeature}>
          {isAddingFeature ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isAddingFeature ? "Adding..." : "Add Feature"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Features" value="24" icon={Layers} />
        <StatCard title="Locked" value="8" icon={Lock} />
        <StatCard title="Available" value="16" icon={Unlock} />
        <StatCard title="Premium Only" value="6" icon={Sparkles} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Entitlements Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="text-muted-foreground">
            Define which features each plan unlocks. Customers automatically gain or lose access
            when they upgrade, downgrade, or cancel a subscription.
          </p>
          <div className="rounded-md bg-muted/30 p-3 font-mono text-xs">
            GET /api/v1/entitlements?customer_id=CUS-001
            <br />→ {`{ "api_access": true, "advanced_analytics": true, "team_members": 25 }`}
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Feature Matrix"
        columns={[
          { header: "Feature", accessorKey: "name" },
          {
            header: "Key",
            accessorKey: "key",
            cell: ({ row }) => (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.original.key}</code>
            ),
          },
          { header: "Starter", accessorKey: "starter" },
          { header: "Pro", accessorKey: "pro" },
          { header: "Enterprise", accessorKey: "enterprise" },
        ]}
        data={features}
      />
    </div>
  );
}

export default MerchantEntitlementsPage;
