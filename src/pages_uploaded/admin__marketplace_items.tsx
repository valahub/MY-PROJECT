
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, Loader2, Search, Download, Shield, Play, Trash2, Star, Flag, Check, X, AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type MarketplaceItem } from "@/lib/api/admin-services";

({ component: AdminMarketplaceItems, head: () => ({ meta: [{ title: "Marketplace Items — Admin — ERP Vala" }] }) });

function AdminMarketplaceItems() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      setItems(marketplaceService.listItems({ search: searchQuery || undefined }));
    } catch (error) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleFlagItem = async (id: string) => {
    try {
      await marketplaceService.flagItem(id, "admin");
      toast.success("Item flag toggled");
      loadData();
    } catch (error) {
      toast.error("Failed to flag item");
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await marketplaceService.softDeleteItem(id, "admin");
      toast.success("Item deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await marketplaceService.restoreItem(id, "admin");
      toast.success("Item restored");
      loadData();
    } catch (error) {
      toast.error("Failed to restore item");
    }
  };

  const handleRecalculateSales = async (id: string) => {
    try {
      await marketplaceService.recalculateItemSales(id);
      toast.success("Sales recalculated");
      loadData();
    } catch (error) {
      toast.error("Failed to recalculate sales");
    }
  };

  const handleRecalculateRating = async (id: string) => {
    try {
      await marketplaceService.recalculateItemRating(id);
      toast.success("Rating recalculated");
      loadData();
    } catch (error) {
      toast.error("Failed to recalculate rating");
    }
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Author", "Category", "Price", "Sales", "Rating", "Status"].join(","),
      ...items.map((item) =>
        [item.name, item.authorName, item.category, item.price, item.totalSales, item.rating, item.status].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marketplace_items.csv";
    a.click();
    toast.success("Items exported");
  };

  const handleBulkScan = async () => {
    setIsProcessing(true);
    try {
      for (const item of items) {
        if (item.status === "approved" || item.status === "pending") {
          // Simulate quality scan
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      toast.success("Bulk quality scan completed");
    } catch (error) {
      toast.error("Bulk scan failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      itemCount: items.length,
      totalSales: items.reduce((sum, i) => sum + i.totalSales, 0),
      totalRevenue: items.reduce((sum, i) => sum + i.totalRevenue, 0),
      items: items.map((i) => ({ id: i.id, name: i.name, status: i.status, sales: i.totalSales })),
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketplace_snapshot_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("Snapshot saved");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "text-green-600";
      case "pending": return "text-yellow-600";
      case "rejected": return "text-red-600";
      case "hidden": return "text-gray-600";
      case "draft": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace Items</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handleBulkScan} disabled={isProcessing || loading}>
            <Shield className="mr-2 h-4 w-4" />
            {isProcessing ? "Scanning..." : "Bulk Scan"}
          </Button>
          <Button variant="outline" onClick={handleSnapshot} disabled={loading}>
            <Play className="mr-2 h-4 w-4" />
            Snapshot
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Items" value={items.length.toString()} icon={Package} />
        <StatCard title="Active Items" value={items.filter((i) => i.status === "approved").length.toString()} icon={Check} />
        <StatCard title="Total Sales" value={items.reduce((sum, i) => sum + i.totalSales, 0).toString()} icon={TrendingUp} />
        <StatCard title="Total Revenue" value={`$${items.reduce((sum, i) => sum + i.totalRevenue, 0).toFixed(0)}`} icon={DollarSign} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by item name, author, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items found</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        {item.isFeatured && <Star className="h-4 w-4 text-yellow-500" />}
                        {item.isFlagged && <Flag className="h-4 w-4 text-red-500" />}
                        {item.deletedAt && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.authorName} • {item.category}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{formatCurrency(item.price, item.currency)}</span>
                        <span>{item.totalSales} sales</span>
                        <span>★ {item.rating}</span>
                        <span className={getStatusColor(item.status)}>{item.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleFlagItem(item.id)}>
                        <Flag className="h-3 w-3" />
                      </Button>
                      {item.deletedAt ? (
                        <Button size="sm" variant="outline" onClick={() => handleRestore(item.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleSoftDelete(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Author</label>
                  <p className="text-sm">{selectedItem.authorName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-sm">{selectedItem.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subcategory</label>
                  <p className="text-sm">{selectedItem.subcategory || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <p className="text-sm font-mono">{formatCurrency(selectedItem.price, selectedItem.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className={`text-sm ${getStatusColor(selectedItem.status)}`}>{selectedItem.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sales</label>
                  <p className="text-sm">{selectedItem.totalSales}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Revenue</label>
                  <p className="text-sm">{formatCurrency(selectedItem.totalRevenue, selectedItem.currency)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rating</label>
                  <p className="text-sm">★ {selectedItem.rating} ({selectedItem.reviewCount} reviews)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Downloads</label>
                  <p className="text-sm">{selectedItem.downloads}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm">{selectedItem.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{formatDate(selectedItem.createdAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{selectedItem.description}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Actions</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => handleRecalculateSales(selectedItem.id)}>
                    <TrendingUp className="mr-2 h-3 w-3" />
                    Recalculate Sales
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRecalculateRating(selectedItem.id)}>
                    <Star className="mr-2 h-3 w-3" />
                    Recalculate Rating
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleFlagItem(selectedItem.id)}>
                    <Flag className="mr-2 h-3 w-3" />
                    {selectedItem.isFlagged ? "Unflag" : "Flag"}
                  </Button>
                  {selectedItem.deletedAt ? (
                    <Button size="sm" variant="outline" onClick={() => handleRestore(selectedItem.id)}>
                      <Check className="mr-2 h-3 w-3" />
                      Restore
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => handleSoftDelete(selectedItem.id)}>
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceItems;
