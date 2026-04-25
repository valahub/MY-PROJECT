// Author Dashboard - Main Author Page
// Extended from existing structure with working item management

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Package,
  TrendingUp,
  DollarSign,
  FileText,
  Plus,
} from "lucide-react";
import { authorItemsApiService } from "@/lib/marketplace/author-items-api";
import type { ItemEntity, ItemStatus } from "@/lib/marketplace/author-items-schema";
import { useAuth } from "@/contexts/AuthContext";

function AuthorDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await authorItemsApiService.getMyItems(user.id);
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (error) {
      console.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const totalItems = items.length;
  const draftItems = items.filter(i => i.status === "draft").length;
  const pendingItems = items.filter(i => i.status === "pending").length;
  const approvedItems = items.filter(i => i.status === "approved").length;
  const rejectedItems = items.filter(i => i.status === "rejected").length;
  const totalSales = items.reduce((sum, i) => sum + i.sales, 0);
  const totalRevenue = items.reduce((sum, i) => sum + (i.sales * i.price), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Author Dashboard</h1>
          <p className="text-muted-foreground">Manage your marketplace items</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/author/items">
              <Package className="mr-2 h-4 w-4" />
              My Items
            </Link>
          </Button>
          <Button asChild>
            <Link to="/author/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Top Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <Button asChild className="w-full h-full flex-col gap-2 py-8">
              <Link to="/author/upload">
                <Upload className="h-8 w-8" />
                <span>Upload New Item</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="pt-6">
            <Button asChild variant="outline" className="w-full h-full flex-col gap-2 py-8">
              <Link to="/author/items">
                <Package className="h-8 w-8" />
                <span>My Items</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Submission Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Draft</span>
              <Badge variant="secondary">{draftItems}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending</span>
              <Badge variant="outline">{pendingItems}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Approved</span>
              <Badge variant="default">{approvedItems}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Rejected</span>
              <Badge variant="destructive">{rejectedItems}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Items</span>
              <span className="font-semibold">{totalItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Sales</span>
              <span className="font-semibold">{totalSales}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Revenue</span>
              <span className="font-semibold">${totalRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Items" value={totalItems} icon={Package} />
        <StatCard title="Total Sales" value={totalSales} icon={TrendingUp} />
        <StatCard title="Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Pending Review" value={pendingItems} icon={FileText} />
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items yet. Upload your first item to get started.</p>
              <Button asChild className="mt-4">
                <Link to="/author/upload">Upload Item</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.category} / {item.subcategory}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        item.status === "approved"
                          ? "default"
                          : item.status === "rejected"
                          ? "destructive"
                          : item.status === "pending"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                    <span className="text-sm font-medium">${item.price}</span>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/author/items/${item.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthorDashboard;
