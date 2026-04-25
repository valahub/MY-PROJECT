
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, Loader2, Plus, Search, X, DollarSign, Package, Users, ShoppingBag, AlertTriangle, CheckCircle, XCircle, Ban, Check, Star, Shield, FileText, Settings, TrendingUp, Award, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService, type MarketplaceItem, type MarketplaceAuthor, type MarketplaceOrder, type MarketplacePayout, type MarketplaceReport, type MarketplaceKPI, type FeaturedSlot, type DMCARequest, type SalesReport, type MarketplaceSettings } from "@/lib/api/admin-services";

({ component: AdminMarketplace, head: () => ({ meta: [{ title: "Marketplace — Admin — ERP Vala" }] }) });

function AdminMarketplace() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"items" | "authors" | "orders" | "payouts" | "reports" | "advanced">("items");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | MarketplaceAuthor | MarketplaceOrder | MarketplacePayout | MarketplaceReport | FeaturedSlot | DMCARequest | SalesReport | MarketplaceSettings | null>(null);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [authors, setAuthors] = useState<MarketplaceAuthor[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [payouts, setPayouts] = useState<MarketplacePayout[]>([]);
  const [reports, setReports] = useState<MarketplaceReport[]>([]);
  const [kpi, setKpi] = useState<MarketplaceKPI | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlot[]>([]);
  const [dmcaRequests, setDmcaRequests] = useState<DMCARequest[]>([]);
  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      setItems(marketplaceService.listItems({}));
      setAuthors(marketplaceService.listAuthors({}));
      setOrders(marketplaceService.listOrders({}));
      setPayouts(marketplaceService.listPayouts({}));
      setReports(marketplaceService.listReports({}));
      const kpiData = marketplaceService.getKPI();
      setKpi(kpiData);
      setFeaturedSlots(marketplaceService.getFeaturedSlots());
      setSettings(marketplaceService.getSettings());
    } catch (error) {
      toast.error("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveItem = async (id: string) => {
    try {
      await marketplaceService.updateItem(id, { status: "approved" }, "admin");
      toast.success("Item approved successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to approve item");
    }
  };

  const handleRejectItem = async (id: string) => {
    try {
      await marketplaceService.updateItem(id, { status: "rejected" }, "admin");
      toast.success("Item rejected successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to reject item");
    }
  };

  const handleVerifyAuthor = async (id: string) => {
    try {
      await marketplaceService.updateAuthor(id, { status: "verified" }, "admin");
      toast.success("Author verified successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to verify author");
    }
  };

  const handleBanAuthor = async (id: string) => {
    if (!confirm("Are you sure you want to ban this author? All their items will be hidden.")) return;
    
    try {
      await marketplaceService.updateAuthor(id, { status: "banned" }, "admin");
      toast.success("Author banned successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to ban author");
    }
  };

  const handleRefundOrder = async (id: string) => {
    if (!confirm("Are you sure you want to refund this order?")) return;
    
    try {
      await marketplaceService.refundOrder(id, "admin");
      toast.success("Order refunded successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to refund order");
    }
  };

  const handleProcessPayout = async (id: string) => {
    try {
      await marketplaceService.processPayout(id, "admin");
      toast.success("Payout processed successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to process payout");
    }
  };

  const handleResolveReport = async (id: string) => {
    try {
      await marketplaceService.resolveReport(id, "admin");
      toast.success("Report resolved successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to resolve report");
    }
  };

  const handleAddFeaturedSlot = async (itemId: string) => {
    try {
      await marketplaceService.addFeaturedSlot(
        {
          itemId,
          priority: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        "admin"
      );
      toast.success("Item featured successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to feature item");
    }
  };

  const handleRemoveFeaturedSlot = async (slotId: string) => {
    try {
      await marketplaceService.removeFeaturedSlot(slotId, "admin");
      toast.success("Featured slot removed");
      loadData();
    } catch (error) {
      toast.error("Failed to remove featured slot");
    }
  };

  const handleCreateDMCARequest = async (itemId: string) => {
    const requesterName = prompt("Enter requester name:");
    const requesterEmail = prompt("Enter requester email:");
    const description = prompt("Enter description:");

    if (requesterName && requesterEmail && description) {
      try {
        await marketplaceService.createDMCARequest(
          {
            itemId,
            requesterName,
            requesterEmail,
            description,
          },
          "admin"
        );
        toast.success("DMCA request created");
        loadData();
      } catch (error) {
        toast.error("Failed to create DMCA request");
      }
    }
  };

  const handleProcessDMCA = async (requestId: string, action: "approved" | "rejected") => {
    const actionTaken = action === "approved" ? prompt("Action taken (item_removed/author_warned/author_banned/none):") || "none" : "none";
    try {
      await marketplaceService.processDMCARequest(
        requestId,
        action,
        actionTaken as "item_removed" | "author_warned" | "author_banned" | "none",
        "admin"
      );
      toast.success(`DMCA request ${action}`);
      loadData();
    } catch (error) {
      toast.error("Failed to process DMCA request");
    }
  };

  const handleGenerateSalesReport = async () => {
    const periodStart = prompt("Start date (YYYY-MM-DD):") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const periodEnd = prompt("End date (YYYY-MM-DD):") || new Date().toISOString().split("T")[0];

    try {
      const report = marketplaceService.generateSalesReport(
        new Date(periodStart).toISOString(),
        new Date(periodEnd).toISOString()
      );
      setSelectedItem(report);
      toast.success("Sales report generated");
    } catch (error) {
      toast.error("Failed to generate sales report");
    }
  };

  const handleUpdateSettings = async () => {
    const commissionRate = parseFloat(prompt("Default commission rate (0-1):") || settings?.defaultCommissionRate.toString());
    const featuredSlotsCount = parseInt(prompt("Featured slots count:") || settings?.featuredSlotsCount.toString());
    const maxFileSize = parseInt(prompt("Max file size (MB):") || settings?.maxFileSize.toString());
    const refundPolicyDays = parseInt(prompt("Refund policy days:") || settings?.refundPolicyDays.toString());

    try {
      await marketplaceService.updateSettings(
        {
          defaultCommissionRate: commissionRate,
          featuredSlotsCount,
          maxFileSize,
          refundPolicyDays,
        },
        "admin"
      );
      toast.success("Settings updated");
      loadData();
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Simple search filter based on active tab
    if (activeTab === "items") {
      setItems(marketplaceService.listItems({ search: value || undefined }));
    } else if (activeTab === "authors") {
      setAuthors(marketplaceService.listAuthors({ search: value || undefined }));
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace Manager</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="GMV" value={formatCurrency(kpi?.gmv || 0, "USD")} icon={DollarSign} />
        <StatCard title="Take Rate Revenue" value={formatCurrency(kpi?.takeRateRevenue || 0, "USD")} icon={ShoppingBag} />
        <StatCard title="Active Items" value={kpi?.activeItems?.toString() || "0"} icon={Package} />
        <StatCard title="Active Authors" value={kpi?.activeAuthors?.toString() || "0"} icon={Users} />
        <StatCard title="Pending Reviews" value={kpi?.pendingReviews?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Reported Items" value={kpi?.reportedItems?.toString() || "0"} icon={AlertTriangle} />
        <StatCard title="Pending Payouts" value={formatCurrency(kpi?.pendingPayouts || 0, "USD")} icon={DollarSign} />
        <StatCard title="Refund Rate" value={`${((kpi?.refundRate || 0) * 100).toFixed(1)}%`} icon={XCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant={activeTab === "items" ? "default" : "outline"} onClick={() => setActiveTab("items")}>
          Items
        </Button>
        <Button variant={activeTab === "authors" ? "default" : "outline"} onClick={() => setActiveTab("authors")}>
          Authors
        </Button>
        <Button variant={activeTab === "orders" ? "default" : "outline"} onClick={() => setActiveTab("orders")}>
          Orders
        </Button>
        <Button variant={activeTab === "payouts" ? "default" : "outline"} onClick={() => setActiveTab("payouts")}>
          Payouts
        </Button>
        <Button variant={activeTab === "reports" ? "default" : "outline"} onClick={() => setActiveTab("reports")}>
          Reports
        </Button>
        <Button variant={activeTab === "advanced" ? "default" : "outline"} onClick={() => setActiveTab("advanced")}>
          Advanced
        </Button>
      </div>

      {activeTab === "items" && (
        <DataTable
          title="Marketplace Items"
          columns={[
            { header: "Name", accessorKey: "name" },
            { header: "Author", accessorKey: "authorName" },
            { header: "Category", accessorKey: "category" },
            {
              header: "Price",
              accessorKey: "price",
              cell: ({ row }: { row: { original: MarketplaceItem } }) => (
                <span className="font-mono">{formatCurrency(row.original.price, row.original.currency)}</span>
              ),
            },
            {
              header: "Status",
              accessorKey: "status",
              cell: ({ row }: { row: { original: MarketplaceItem } }) => (
                <span className={
                  row.original.status === "approved" ? "text-green-600" :
                  row.original.status === "pending" ? "text-yellow-600" :
                  row.original.status === "rejected" ? "text-red-600" :
                  "text-muted-foreground"
                }>
                  {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </span>
              ),
            },
            {
              header: "Sales",
              accessorKey: "totalSales",
              cell: ({ row }: { row: { original: MarketplaceItem } }) => (
                <span className="font-medium">{row.original.totalSales}</span>
              ),
            },
            {
              header: "Rating",
              accessorKey: "rating",
              cell: ({ row }: { row: { original: MarketplaceItem } }) => (
                <span>{row.original.rating.toFixed(1)} ⭐</span>
              ),
            },
            {
              header: "",
              accessorKey: "id",
              cell: ({ row }: { row: { original: MarketplaceItem } }) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedItem(row.original)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  {row.original.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleApproveItem(row.original.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectItem(row.original.id)}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          data={items}
        />
      )}

      {activeTab === "authors" && (
        <DataTable
          title="Marketplace Authors"
          columns={[
            { header: "Name", accessorKey: "name" },
            { header: "Email", accessorKey: "email" },
            {
              header: "Status",
              accessorKey: "status",
              cell: ({ row }: { row: { original: MarketplaceAuthor } }) => (
                <span className={
                  row.original.status === "verified" ? "text-green-600" :
                  row.original.status === "banned" ? "text-red-600" :
                  "text-yellow-600"
                }>
                  {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </span>
              ),
            },
            {
              header: "Items",
              accessorKey: "itemCount",
              cell: ({ row }: { row: { original: MarketplaceAuthor } }) => (
                <span className="font-medium">{row.original.itemCount}</span>
              ),
            },
            {
              header: "Total Sales",
              accessorKey: "totalSales",
              cell: ({ row }: { row: { original: MarketplaceAuthor } }) => (
                <span className="font-medium">{row.original.totalSales}</span>
              ),
            },
            {
              header: "Revenue",
              accessorKey: "totalRevenue",
              cell: ({ row }: { row: { original: MarketplaceAuthor } }) => (
                <span className="font-mono">{formatCurrency(row.original.totalRevenue, "USD")}</span>
              ),
            },
            {
              header: "Pending Payout",
              accessorKey: "pendingPayout",
              cell: ({ row }: { row: { original: MarketplaceAuthor } }) => (
                <span className="font-mono text-blue-600">{formatCurrency(row.original.pendingPayout, "USD")}</span>
              ),
            },
            {
              header: "",
              accessorKey: "id",
              cell: ({ row }: { row: { original: MarketplaceAuthor } }) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedItem(row.original)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  {row.original.status === "unverified" && (
                    <Button size="sm" variant="outline" onClick={() => handleVerifyAuthor(row.original.id)}>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                  {row.original.status === "verified" && (
                    <Button size="sm" variant="destructive" onClick={() => handleBanAuthor(row.original.id)}>
                      <Ban className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={authors}
        />
      )}

      {activeTab === "orders" && (
        <DataTable
          title="Marketplace Orders"
          columns={[
            { header: "Order ID", accessorKey: "id" },
            { header: "Item", accessorKey: "itemName" },
            { header: "Customer", accessorKey: "customerEmail" },
            {
              header: "Amount",
              accessorKey: "amount",
              cell: ({ row }: { row: { original: MarketplaceOrder } }) => (
                <span className="font-mono">{formatCurrency(row.original.amount, row.original.currency)}</span>
              ),
            },
            {
              header: "Author Earnings",
              accessorKey: "authorEarnings",
              cell: ({ row }: { row: { original: MarketplaceOrder } }) => (
                <span className="font-mono text-green-600">{formatCurrency(row.original.authorEarnings, row.original.currency)}</span>
              ),
            },
            {
              header: "Platform Revenue",
              accessorKey: "platformRevenue",
              cell: ({ row }: { row: { original: MarketplaceOrder } }) => (
                <span className="font-mono text-blue-600">{formatCurrency(row.original.platformRevenue, row.original.currency)}</span>
              ),
            },
            {
              header: "Status",
              accessorKey: "status",
              cell: ({ row }: { row: { original: MarketplaceOrder } }) => (
                <span className={
                  row.original.status === "completed" ? "text-green-600" :
                  row.original.status === "refunded" ? "text-red-600" :
                  "text-yellow-600"
                }>
                  {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </span>
              ),
            },
            {
              header: "Date",
              accessorKey: "createdAt",
              cell: ({ row }: { row: { original: MarketplaceOrder } }) => formatDate(row.original.createdAt),
            },
            {
              header: "",
              accessorKey: "id",
              cell: ({ row }: { row: { original: MarketplaceOrder } }) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedItem(row.original)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  {row.original.status === "completed" && (
                    <Button size="sm" variant="outline" onClick={() => handleRefundOrder(row.original.id)}>
                      <XCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={orders}
        />
      )}

      {activeTab === "payouts" && (
        <DataTable
          title="Author Payouts"
          columns={[
            { header: "Payout ID", accessorKey: "id" },
            { header: "Author", accessorKey: "authorName" },
            {
              header: "Amount",
              accessorKey: "amount",
              cell: ({ row }: { row: { original: MarketplacePayout } }) => (
                <span className="font-mono">{formatCurrency(row.original.amount, row.original.currency)}</span>
              ),
            },
            {
              header: "Status",
              accessorKey: "status",
              cell: ({ row }: { row: { original: MarketplacePayout } }) => (
                <span className={
                  row.original.status === "paid" ? "text-green-600" :
                  row.original.status === "processing" ? "text-yellow-600" :
                  "text-blue-600"
                }>
                  {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </span>
              ),
            },
            {
              header: "Order Count",
              accessorKey: "orderCount",
              cell: ({ row }: { row: { original: MarketplacePayout } }) => (
                <span className="font-medium">{row.original.orderCount}</span>
              ),
            },
            {
              header: "Period Start",
              accessorKey: "periodStart",
              cell: ({ row }: { row: { original: MarketplacePayout } }) => formatDate(row.original.periodStart),
            },
            {
              header: "Period End",
              accessorKey: "periodEnd",
              cell: ({ row }: { row: { original: MarketplacePayout } }) => formatDate(row.original.periodEnd),
            },
            {
              header: "",
              accessorKey: "id",
              cell: ({ row }: { row: { original: MarketplacePayout } }) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedItem(row.original)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  {row.original.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => handleProcessPayout(row.original.id)}>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={payouts}
        />
      )}

      {activeTab === "reports" && (
        <DataTable
          title="Item Reports"
          columns={[
            { header: "Report ID", accessorKey: "id" },
            { header: "Item", accessorKey: "itemName" },
            { header: "Reporter", accessorKey: "reporterName" },
            {
              header: "Type",
              accessorKey: "type",
              cell: ({ row }: { row: { original: MarketplaceReport } }) => (
                <span className="font-medium">{row.original.type.replace("_", " ").toUpperCase()}</span>
              ),
            },
            { header: "Description", accessorKey: "description" },
            {
              header: "Status",
              accessorKey: "status",
              cell: ({ row }: { row: { original: MarketplaceReport } }) => (
                <span className={
                  row.original.status === "resolved" ? "text-green-600" :
                  row.original.status === "investigating" ? "text-yellow-600" :
                  "text-red-600"
                }>
                  {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </span>
              ),
            },
            {
              header: "Date",
              accessorKey: "createdAt",
              cell: ({ row }: { row: { original: MarketplaceReport } }) => formatDate(row.original.createdAt),
            },
            {
              header: "",
              accessorKey: "id",
              cell: ({ row }: { row: { original: MarketplaceReport } }) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedItem(row.original)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                  {row.original.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => handleResolveReport(row.original.id)}>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={reports}
        />
      )}

      {activeTab === "advanced" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Featured Slots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{featuredSlots.length} / {settings?.featuredSlotsCount || 5}</p>
                <p className="text-sm text-muted-foreground">Active slots</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  DMCA Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{dmcaRequests.filter((r) => r.status === "pending").length}</p>
                <p className="text-sm text-muted-foreground">Pending requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Commission Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{((settings?.defaultCommissionRate || 0) * 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Default rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Author Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{settings?.authorLevels.length || 4}</p>
                <p className="text-sm text-muted-foreground">Tier levels</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Featured Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featuredSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No featured items</p>
                  ) : (
                    featuredSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{slot.itemName}</p>
                          <p className="text-sm text-muted-foreground">by {slot.authorName}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleRemoveFeaturedSlot(slot.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DMCA Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dmcaRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No DMCA requests</p>
                  ) : (
                    dmcaRequests.map((request) => (
                      <div key={request.id} className="p-3 border rounded">
                        <p className="font-medium">{request.itemName}</p>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Status: {request.status}</p>
                        <div className="flex gap-2 mt-2">
                          {request.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleProcessDMCA(request.id, "approved")}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleProcessDMCA(request.id, "rejected")}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGenerateSalesReport} className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marketplace Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Commission Rate:</strong> {((settings?.defaultCommissionRate || 0) * 100).toFixed(0)}%</p>
                  <p><strong>Featured Slots:</strong> {settings?.featuredSlotsCount || 5}</p>
                  <p><strong>Max File Size:</strong> {settings?.maxFileSize || 100} MB</p>
                  <p><strong>Refund Policy:</strong> {settings?.refundPolicyDays || 30} days</p>
                  <p><strong>Auto Rotate:</strong> {settings?.autoRotateFeatured ? "Yes" : "No"}</p>
                  <p><strong>Require Scan:</strong> {settings?.requireQualityScan ? "Yes" : "No"}</p>
                </div>
                <Button onClick={handleUpdateSettings} className="w-full mt-4">
                  <Settings className="mr-2 h-4 w-4" />
                  Update Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
          </DialogHeader>
          {selectedItem && "authorName" in selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{(selectedItem as MarketplaceItem).name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Author</label>
                <p className="text-sm">{(selectedItem as MarketplaceItem).authorName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-sm">{(selectedItem as MarketplaceItem).category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price</label>
                <p className="text-sm">{formatCurrency((selectedItem as MarketplaceItem).price, (selectedItem as MarketplaceItem).currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{(selectedItem as MarketplaceItem).status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Version</label>
                <p className="text-sm">{(selectedItem as MarketplaceItem).version}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Downloads</label>
                <p className="text-sm">{(selectedItem as MarketplaceItem).downloads}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rating</label>
                <p className="text-sm">{(selectedItem as MarketplaceItem).rating.toFixed(1)} ⭐ ({(selectedItem as MarketplaceItem).reviewCount} reviews)</p>
              </div>
            </div>
          )}
          {selectedItem && "commissionRate" in selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{(selectedItem as MarketplaceAuthor).name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{(selectedItem as MarketplaceAuthor).email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{(selectedItem as MarketplaceAuthor).status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Commission Rate</label>
                <p className="text-sm">{((selectedItem as MarketplaceAuthor).commissionRate * 100).toFixed(0)}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Sales</label>
                <p className="text-sm">{(selectedItem as MarketplaceAuthor).totalSales}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Revenue</label>
                <p className="text-sm">{formatCurrency((selectedItem as MarketplaceAuthor).totalRevenue, "USD")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Pending Payout</label>
                <p className="text-sm">{formatCurrency((selectedItem as MarketplaceAuthor).pendingPayout, "USD")}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminMarketplace;
