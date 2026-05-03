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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statusOptions: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Items</h1>
            <p className="text-sm text-muted-foreground">Manage your marketplace items</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh items"
            >
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
                  placeholder="Search items by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                  aria-label="Search items"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <Button
                    key={opt.key}
                    variant={filterStatus === opt.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table or Empty State */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                {items.length === 0
                  ? "You haven't uploaded any items yet."
                  : "No items match your search or filter."}
              </p>
              {items.length === 0 ? (
                <Button asChild>
                  <Link to="/author/upload">
                    <Upload className="mr-2 h-4 w-4" /> Upload Your First Item
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <DataTable
            title="Your Items"
            searchable={false}
            columns={[
              {
                key: "title",
                header: "Item",
                render: (item: ItemEntity) => (
                  <div className="min-w-0">
                    <div className="font-medium truncate max-w-[280px]" title={item.title}>
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">v{item.version}</div>
                  </div>
                ),
              },
              {
                key: "category",
                header: "Category",
                render: (item: ItemEntity) => (
                  <div>
                    <div className="text-sm">{item.category}</div>
                    <div className="text-xs text-muted-foreground">{item.subcategory}</div>
                  </div>
                ),
              },
              {
                key: "price",
                header: "Price",
                render: (item: ItemEntity) => (
                  <span className="tabular-nums">${item.price.toFixed(2)}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (item: ItemEntity) => getStatusBadge(item.status),
              },
              {
                key: "sales",
                header: "Sales",
                render: (item: ItemEntity) => (
                  <span className="tabular-nums">{item.sales.toLocaleString()}</span>
                ),
              },
              {
                key: "updated",
                header: "Updated",
                render: (item: ItemEntity) => (
                  <span className="text-sm text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (item: ItemEntity) => (
                  <div className="flex items-center gap-1">
                    {item.status === "approved" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <Link to={`/marketplace/item/${item.id}`} aria-label={`View ${item.title}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link to={`/author/items/${item.id}/edit`} aria-label={`Edit ${item.title}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    {item.status === "draft" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmit(item)}
                            aria-label={`Submit ${item.title} for approval`}
                          >
                            <Send className="mr-1 h-3.5 w-3.5" /> Submit
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Submit for approval</TooltipContent>
                      </Tooltip>
                    )}
                    {(item.status === "draft" || item.status === "rejected") && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item)}
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ),
              },
            ]}
            data={filteredItems}
          />
        )}

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Status legend:</span>
          <span className="flex items-center gap-1.5">
            <Badge variant="secondary">draft</Badge> not submitted
          </span>
          <span className="flex items-center gap-1.5">
            <Badge variant="outline">pending</Badge> in review
          </span>
          <span className="flex items-center gap-1.5">
            <Badge variant="default">approved</Badge> live on marketplace
          </span>
          <span className="flex items-center gap-1.5">
            <Badge variant="destructive">rejected</Badge> action required
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AuthorMyItems;
