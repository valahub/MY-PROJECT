import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Lock, Unlock, Shield, Layers, Loader2, Plus, Search, X, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService } from "@/lib/api/admin-services";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  type: string;
  enabled: boolean;
}

interface Entitlement {
  id: string;
  featureFlagName: string;
  planName: string;
  enabled: boolean;
  limitValue?: number;
  limitUnit?: string;
  enforcement: string;
}

interface PlanFeature {
  id: string;
  featureName: string;
  planName: string;
  access: "locked" | "unlocked";
  limit?: number;
  limitUnit?: string;
}

function AdminEntitlementsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeatureFlag | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [kpi, setKpi] = useState<{
    featureFlagsCount: number;
    activePlans: number;
    lockedFeatures: number;
    openFeatures: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getFeatureFlags();
      setFeatureFlags(data);
      const kpiData = marketplaceService.getEntitlementsKPIs();
      setKpi(kpiData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddFeatureFlag = async () => {
    const key = prompt("Enter feature flag key:");
    const name = prompt("Enter feature flag name:");
    const type = prompt("Enter type (api, ui, integration, analytics, custom):") as any;
    
    if (key && name && type) {
      setIsAdding(true);
      try {
        await marketplaceService.toggleFeatureFlag(key, true, "admin");
        toast.success("Feature flag added successfully");
        loadData();
      } catch (error) {
        toast.error("Failed to add feature flag");
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleToggleFeatureFlag = async (id: string, currentEnabled: boolean) => {
    try {
      await marketplaceService.toggleFeatureFlag(id, !currentEnabled, "admin");
      toast.success("Feature flag updated successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to update feature flag");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      await marketplaceService.toggleFeatureFlag(id, false, "admin");
      toast.success("Item deleted successfully");
      setSelectedItem(null);
      loadData();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
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
        <StatCard title="Feature Flags" value={kpi?.featureFlagsCount?.toString() || "0"} icon={Layers} />
        <StatCard title="Active Plans" value={kpi?.activePlans?.toString() || "0"} icon={Shield} />
        <StatCard title="Locked Features" value={kpi?.lockedFeatures?.toString() || "0"} icon={Lock} />
        <StatCard title="Open Features" value={kpi?.openFeatures?.toString() || "0"} icon={Unlock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Feature Flags"
        columns={[
          { header: "Key", accessorKey: "key" },
          { header: "Name", accessorKey: "name" },
          { header: "Type", accessorKey: "type" },
          {
            header: "Enabled",
            accessorKey: "enabled",
            cell: ({ row }: { row: { original: FeatureFlag } }) => (
              <span className={row.original.enabled ? "text-green-600" : "text-muted-foreground"}>
                {row.original.enabled ? "Yes" : "No"}
              </span>
            ),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: FeatureFlag } }) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleToggleFeatureFlag(row.original.id, row.original.enabled)}>
                  {row.original.enabled ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedItem(row.original)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(row.original.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ),
          },
        ]}
        data={featureFlags}
      />

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Flag Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Key</label>
                <p className="text-sm">{selectedItem.key}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{selectedItem.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-sm">{selectedItem.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Enabled</label>
                <p className="text-sm">{selectedItem.enabled ? "Yes" : "No"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminEntitlementsPage;
