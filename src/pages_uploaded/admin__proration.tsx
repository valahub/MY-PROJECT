import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowUpDown, Calculator, TrendingUp, TrendingDown, Eye, Download, Loader2, Search, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService } from "@/lib/api/admin-services";

type ProrationType = "upgrade" | "downgrade" | "cycle_change";

interface ProrationLog {
  id: string;
  customerName: string;
  fromPlan: string;
  toPlan: string;
  type: string;
  credit: number;
  charge: number;
  netAmount: number;
  createdAt: string;
}

function AdminProrationPage() {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [selectedProration, setSelectedProration] = useState<ProrationLog | null>(null);
  const [prorations, setProrations] = useState<ProrationLog[]>([]);
  const [kpi, setKpi] = useState<{
    adjustments30d: number;
    netUpgradeRevenue: number;
    netDowngradeLoss: number;
    avgCalculationTime: number;
    currency: string;
  } | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProrations = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getProrationLogs({
        type: typeFilter || undefined,
      });
      // Filter locally by search query
      const filtered = searchQuery
        ? data.filter(
            (p) =>
              p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.fromPlan.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.toPlan.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : data;
      setProrations(filtered);
    } catch (error) {
      toast.error("Failed to load proration data");
    } finally {
      setLoading(false);
    }
  };

  const loadKPI = async () => {
    try {
      const kpiData = marketplaceService.getProrationKPIs();
      setKpi(kpiData);
    } catch (error) {
      toast.error("Failed to load KPI data");
    }
  };

  useEffect(() => {
    loadProrations();
    loadKPI();
  }, [typeFilter, searchQuery]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Proration data exported successfully");
    } catch (error) {
      toast.error("Failed to export proration data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    setViewingId(id);
    try {
      const proration = marketplaceService.getProrationLogs({}).find((p) => p.id === id);
      if (proration) {
        setSelectedProration(proration);
      } else {
        toast.error("Proration not found");
      }
    } catch (error) {
      toast.error("Failed to load proration details");
    } finally {
      setViewingId(null);
    }
  };

  const handleOverride = async (id: string, overrideAmount: number, reason: string) => {
    try {
      await marketplaceService.overrideProration(id, overrideAmount, reason, "admin");
      toast.success("Proration overridden successfully");
      setSelectedProration(null);
      loadProrations();
    } catch (error) {
      toast.error("Failed to override proration");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (value: string) => {
    setTypeFilter(value);
  };

  const clearFilters = () => {
    setTypeFilter("");
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proration Engine</h1>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Adjustments (30d)"
          value={kpi?.adjustments30d?.toString() || "0"}
          icon={ArrowUpDown}
        />
        <StatCard
          title="Net Upgrade Revenue"
          value={formatCurrency(kpi?.netUpgradeRevenue || 0, kpi?.currency || "USD")}
          icon={TrendingUp}
          changeType="positive"
        />
        <StatCard
          title="Net Downgrade Loss"
          value={formatCurrency(kpi?.netDowngradeLoss || 0, kpi?.currency || "USD")}
          icon={TrendingDown}
          changeType="negative"
        />
        <StatCard
          title="Avg Calc Time"
          value={`${(kpi?.avgCalculationTime || 0).toFixed(2)}s`}
          icon={Calculator}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proration Formula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-md border p-3 font-mono text-xs bg-muted/30">
            credit = old_price × (days_remaining / billing_cycle_days)
          </div>
          <div className="rounded-md border p-3 font-mono text-xs bg-muted/30">
            charge = new_price × (days_remaining / billing_cycle_days)
          </div>
          <div className="rounded-md border p-3 font-mono text-xs bg-muted/30">
            net_amount = charge − credit
          </div>
          <p className="text-xs text-muted-foreground">
            All adjustments are calculated to the second of plan change and applied on next invoice.
          </p>
        </CardContent>
      </Card>

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
                  placeholder="Search customer, plan..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter || ""} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
                <SelectItem value="downgrade">Downgrade</SelectItem>
                <SelectItem value="cycle_change">Cycle Change</SelectItem>
              </SelectContent>
            </Select>
            {(typeFilter || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Recent Proration Adjustments"
        columns={[
          { header: "Customer", accessorKey: "customerName" },
          { header: "From Plan", accessorKey: "fromPlan" },
          { header: "To Plan", accessorKey: "toPlan" },
          {
            header: "Type",
            accessorKey: "type",
            cell: ({ row }: { row: { original: ProrationLog } }) => (
              <span
                className={
                  row.original.type === "upgrade"
                    ? "text-green-600 text-xs font-medium"
                    : row.original.type === "downgrade"
                    ? "text-red-600 text-xs font-medium"
                    : "text-muted-foreground text-xs font-medium"
                }
              >
                {row.original.type}
              </span>
            ),
          },
          {
            header: "Credit",
            accessorKey: "credit",
            cell: ({ row }: { row: { original: ProrationLog } }) => formatCurrency(row.original.credit),
          },
          {
            header: "Charge",
            accessorKey: "charge",
            cell: ({ row }: { row: { original: ProrationLog } }) => formatCurrency(row.original.charge),
          },
          {
            header: "Net",
            accessorKey: "netAmount",
            cell: ({ row }: { row: { original: ProrationLog } }) => (
              <span
                className={
                  row.original.netAmount >= 0
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"
                }
              >
                {formatCurrency(row.original.netAmount)}
              </span>
            ),
          },
          {
            header: "Date",
            accessorKey: "createdAt",
            cell: ({ row }: { row: { original: ProrationLog } }) => formatDate(row.original.createdAt),
          },
          {
            header: "",
            accessorKey: "id",
            cell: ({ row }: { row: { original: ProrationLog } }) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(row.original.id)}
                disabled={viewingId === row.original.id}
              >
                {viewingId === row.original.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Eye className="mr-1 h-3 w-3" />
                )}
                {viewingId === row.original.id ? "Loading..." : "View"}
              </Button>
            ),
          },
        ]}
        data={prorations}
      />

      <Dialog open={!!selectedProration} onOpenChange={() => setSelectedProration(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proration Details</DialogTitle>
          </DialogHeader>
          {selectedProration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="text-sm">{selectedProration.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm capitalize">{selectedProration.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">From Plan</label>
                  <p className="text-sm">{selectedProration.fromPlan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">To Plan</label>
                  <p className="text-sm">{selectedProration.toPlan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credit Amount</label>
                  <p className="text-sm">{formatCurrency(selectedProration.credit)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Charge Amount</label>
                  <p className="text-sm">{formatCurrency(selectedProration.charge)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Net Amount</label>
                  <p className={`text-sm font-medium ${selectedProration.netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(selectedProration.netAmount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm">{formatDate(selectedProration.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProration(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminProrationPage;
