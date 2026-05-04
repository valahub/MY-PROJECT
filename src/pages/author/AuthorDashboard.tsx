// Author Dashboard - Main Author Page
// UI-only audit fixes: skeleton, tooltips, clickable KPI cards, currency formatting,
// empty/error states, breadcrumb. No business-logic changes.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Upload,
  Package,
  TrendingUp,
  DollarSign,
  FileText,
  Plus,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { authorItemsApiService } from "@/lib/marketplace/author-items-api";
import type { ItemEntity } from "@/lib/marketplace/author-items-schema";
import { useAuth } from "@/contexts/AuthContext";

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const compactNum = (n: number) =>
  new Intl.NumberFormat("en-US").format(n || 0);

function AuthorDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadItems = async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await authorItemsApiService.getMyItems(user.id);
      if (res.success && res.data) {
        setItems(res.data);
      } else if (!res.success) {
        setLoadError(res.error || "Failed to load items");
      }
    } catch {
      setLoadError("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const totalItems = items.length;
  const draftItems = items.filter((i) => i.status === "draft").length;
  const pendingItems = items.filter((i) => i.status === "pending").length;
  const approvedItems = items.filter((i) => i.status === "approved").length;
  const rejectedItems = items.filter((i) => i.status === "rejected").length;
  const totalSales = items.reduce((sum, i) => sum + i.sales, 0);
  const totalRevenue = items.reduce((sum, i) => sum + i.sales * i.price, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-medium">Couldn't load your dashboard</h3>
        <p className="text-sm text-muted-foreground mb-4">{loadError}</p>
        <Button onClick={loadItems} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/author">Author</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Author Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your marketplace items</p>
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
          <Card className="border-dashed transition-shadow hover:shadow-md">
            <CardContent className="pt-6">
              <Button asChild className="w-full h-full flex-col gap-2 py-8">
                <Link to="/author/upload" aria-label="Upload a new item">
                  <Upload className="h-8 w-8" />
                  <span>Upload New Item</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed transition-shadow hover:shadow-md">
            <CardContent className="pt-6">
              <Button
                asChild
                variant="outline"
                className="w-full h-full flex-col gap-2 py-8"
              >
                <Link to="/author/items" aria-label="View my items">
                  <Package className="h-8 w-8" />
                  <span>My Items</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Submission Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Draft</span>
                <Badge variant="secondary" className="tabular-nums">{draftItems}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <Badge variant="outline" className="tabular-nums">{pendingItems}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Approved</span>
                <Badge variant="default" className="tabular-nums">{approvedItems}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rejected</span>
                <Badge variant="destructive" className="tabular-nums">{rejectedItems}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Items</span>
                <span className="font-semibold tabular-nums">{compactNum(totalItems)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Sales</span>
                <span className="font-semibold tabular-nums">{compactNum(totalSales)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Revenue</span>
                <span className="font-semibold tabular-nums">{currency(totalRevenue)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats — clickable KPI cards with tooltips */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/author/items"
                className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform hover:-translate-y-0.5"
                aria-label="View all items"
              >
                <StatCard title="Total Items" value={compactNum(totalItems)} icon={Package} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>All items you've created</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/author/items"
                className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform hover:-translate-y-0.5"
                aria-label="View sales"
              >
                <StatCard title="Total Sales" value={compactNum(totalSales)} icon={TrendingUp} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Cumulative sales across all items</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/author/items"
                className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform hover:-translate-y-0.5"
                aria-label="View revenue"
              >
                <StatCard title="Revenue" value={currency(totalRevenue)} icon={DollarSign} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Gross revenue (sales × price)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/author/items"
                className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform hover:-translate-y-0.5"
                aria-label="View pending review items"
              >
                <StatCard title="Pending Review" value={compactNum(pendingItems)} icon={FileText} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Items awaiting reviewer approval</TooltipContent>
          </Tooltip>
        </div>

        {/* Recent Items */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Items</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-foreground">No items yet</p>
                <p className="text-sm mb-4">Upload your first item to get started.</p>
                <Button asChild>
                  <Link to="/author/upload">
                    <Upload className="mr-2 h-4 w-4" /> Upload Item
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.category} / {item.subcategory}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
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
                      <span className="text-sm font-medium tabular-nums w-16 text-right">
                        {currency(item.price)}
                      </span>
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
    </TooltipProvider>
  );
}

export default AuthorDashboard;
