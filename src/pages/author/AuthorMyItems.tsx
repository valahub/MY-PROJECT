// Author My Items Page
// Table view of all author's items with status and actions

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  Loader2,
  Edit,
  Trash2,
  Upload,
  Eye,
  X,
  Send,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { authorItemsApiService } from "@/lib/marketplace/author-items-api";
import type { ItemEntity, ItemStatus } from "@/lib/marketplace/author-items-schema";
import { useAuth } from "@/contexts/AuthContext";

function AuthorMyItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
    toast.success("Items refreshed");
  };

  const handleDelete = async (item: ItemEntity) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      const res = await authorItemsApiService.deleteItem(item.id, user?.id || "");
      if (res.success) {
        toast.success("Item deleted successfully");
        loadItems();
      } else {
        toast.error(res.error || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleSubmit = async (item: ItemEntity) => {
    try {
      const res = await authorItemsApiService.submitItem(item.id, user?.id || "");
      if (res.success) {
        toast.success("Item submitted for approval");
        loadItems();
      } else {
        toast.error(res.error || "Failed to submit item");
      }
    } catch (error) {
      toast.error("Failed to submit item");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ItemStatus) => {
    const variants: Record<ItemStatus, "default" | "secondary" | "outline" | "destructive"> = {
      approved: "default",
      draft: "secondary",
      pending: "outline",
      rejected: "destructive",
      soft_rejected: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Items</h1>
          <p className="text-muted-foreground">Manage your marketplace items</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button asChild>
            <Link to="/author/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "draft" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("draft")}
              >
                Draft
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("pending")}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("approved")}
              >
                Approved
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("rejected")}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <DataTable
        title="Your Items"
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "Category", accessorKey: "category" },
          { header: "Price", accessorKey: "price" },
          { header: "Status", accessorKey: "status" },
          { header: "Sales", accessorKey: "sales" },
          { header: "Updated", accessorKey: "updated" },
          { header: "Actions", accessorKey: "actions" },
        ]}
        data={filteredItems.map((item) => ({
          id: item.id,
          name: (
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.version}</div>
            </div>
          ),
          category: (
            <div>
              <div className="text-sm">{item.category}</div>
              <div className="text-xs text-muted-foreground">{item.subcategory}</div>
            </div>
          ),
          price: `$${item.price.toFixed(2)}`,
          status: getStatusBadge(item.status),
          sales: item.sales,
          updated: new Date(item.updatedAt).toLocaleDateString(),
          actions: (
            <div className="flex items-center gap-2">
              {item.status === "approved" && (
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/marketplace/item/${item.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to={`/author/items/${item.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              {item.status === "draft" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSubmit(item)}
                >
                  Submit
                </Button>
              )}
              {(item.status === "draft" || item.status === "rejected") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ),
        }))}
      />

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {items.length === 0
                ? "You haven't uploaded any items yet."
                : "No items match your search."}
            </p>
            {items.length === 0 && (
              <Button asChild>
                <Link to="/author/upload">Upload Your First Item</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AuthorMyItems;
