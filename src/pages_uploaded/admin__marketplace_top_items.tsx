
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Loader2, TrendingUp, Award, DollarSign, RefreshCw, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type TopSellingItem } from "@/lib/api/admin-services";

({ component: AdminMarketplaceTopItems, head: () => ({ meta: [{ title: "Marketplace Top Items — Admin — ERP Vala" }] }) });

function AdminMarketplaceTopItems() {
  const [loading, setLoading] = useState(true);
  const [topItems, setTopItems] = useState<TopSellingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TopSellingItem | null>(null);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [limit, setLimit] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      setTopItems(marketplaceService.getTopSellingItems(period, limit));
    } catch (error) {
      toast.error("Failed to load top items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, limit]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800";
    if (rank === 2) return "bg-gray-200 text-gray-800";
    if (rank === 3) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Top Selling Items</h1>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border rounded"
            value={period}
            onChange={(e) => setPeriod(e.target.value as "today" | "week" | "month" | "all")}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <select
            className="px-3 py-2 border rounded"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
          >
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="50">Top 50</option>
            <option value="100">Top 100</option>
          </select>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top {limit} Items ({period === "today" ? "Today" : period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time"})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : topItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales data for this period</p>
          ) : (
            <div className="space-y-2">
              {topItems.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between p-3 border rounded hover:bg-muted">
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold px-3 py-1 rounded ${getRankBadge(item.rank)}`}>
                      #{item.rank}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.itemName}</p>
                        {item.isTrending && <Flame className="h-4 w-4 text-orange-500" />}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{item.authorName}</span>
                        <span>{item.category}</span>
                        <span>★ {item.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.salesCount} sales</p>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(item.revenue, "USD")}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rank</label>
                <p className="text-2xl font-bold">#{selectedItem.rank}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item</label>
                <p className="text-sm font-medium">{selectedItem.itemName}</p>
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
                <label className="text-sm font-medium text-muted-foreground">Sales Count</label>
                <p className="text-sm font-medium">{selectedItem.salesCount}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Revenue</label>
                <p className="text-sm font-medium">{formatCurrency(selectedItem.revenue, "USD")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rating</label>
                <p className="text-sm">★ {selectedItem.rating.toFixed(1)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Trending</label>
                <p className="text-sm">{selectedItem.isTrending ? "Yes 🔥" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Period</label>
                <p className="text-sm">{formatDate(selectedItem.periodStart)} - {formatDate(selectedItem.periodEnd)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplaceTopItems;
