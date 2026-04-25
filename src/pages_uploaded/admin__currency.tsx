import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, RefreshCw, DollarSign, TrendingUp, Loader2, Plus, Edit, Trash2, Search, X, Star, Power } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { currencyService, type Currency, type PricingRule, type CurrencyKPI, type CurrencyFilters, type PricingRuleFilters } from "@/lib/api/admin-services";

({
  component: AdminCurrencyPage,
  head: () => ({ meta: [{ title: "Multi-Currency — Admin — ERP Vala" }] }),
});

function AdminCurrencyPage() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"currencies" | "pricing">("currencies");
  const [selectedItem, setSelectedItem] = useState<Currency | PricingRule | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [kpi, setKpi] = useState<CurrencyKPI | null>(null);
  const [filters, setFilters] = useState<CurrencyFilters | PricingRuleFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "currencies") {
        const response = currencyService.list(filters as CurrencyFilters, { page: 1, limit: 50 });
        if (response.success && response.data) {
          setCurrencies(response.data);
        }
      } else {
        const rules = currencyService.listPricingRules(filters as PricingRuleFilters);
        setPricingRules(rules);
      }
      const kpiData = currencyService.getKPI();
      setKpi(kpiData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "currencies") {
        currencyService.fetchRates();
        loadData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      await currencyService.fetchRates();
      toast.success("Exchange rates refreshed successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to refresh rates");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSetBaseCurrency = async (id: string) => {
    try {
      await currencyService.setBaseCurrency(id, "admin");
      toast.success("Base currency changed successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to set base currency");
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await currencyService.toggleActive(id, "admin");
      toast.success("Currency status updated");
      loadData();
    } catch (error) {
      toast.error("Failed to update currency status");
    }
  };

  const handleRefreshSingleRate = async (id: string) => {
    try {
      await currencyService.refreshRate(id, "admin");
      toast.success("Rate refreshed successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to refresh rate");
    }
  };

  const handleEditRate = async (id: string) => {
    const rate = prompt("Enter new rate:");
    if (rate && !isNaN(parseFloat(rate))) {
      try {
        await currencyService.update(id, { rate: parseFloat(rate) }, "admin");
        toast.success("Rate updated successfully");
        loadData();
      } catch (error) {
        toast.error("Failed to update rate");
      }
    }
  };

  const handleAddPricingRule = async () => {
    const regionId = prompt("Enter region ID:");
    const currencyCode = prompt("Enter currency code:");
    const multiplier = prompt("Enter multiplier (0.1 - 5.0):");
    
    if (regionId && currencyCode && multiplier) {
      const mult = parseFloat(multiplier);
      if (mult > 0 && mult <= 5) {
        try {
          await currencyService.createPricingRule({ regionId, currencyCode, multiplier: mult }, "admin");
          toast.success("Pricing rule added successfully");
          loadData();
        } catch (error) {
          toast.error("Failed to add pricing rule");
        }
      } else {
        toast.error("Multiplier must be between 0.1 and 5.0");
      }
    }
  };

  const handleEditPricingRule = async (id: string) => {
    const multiplier = prompt("Enter new multiplier (0.1 - 5.0):");
    if (multiplier) {
      const mult = parseFloat(multiplier);
      if (mult > 0 && mult <= 5) {
        try {
          await currencyService.updatePricingRule(id, { multiplier: mult }, "admin");
          toast.success("Pricing rule updated successfully");
          loadData();
        } catch (error) {
          toast.error("Failed to update pricing rule");
        }
      } else {
        toast.error("Multiplier must be between 0.1 and 5.0");
      }
    }
  };

  const handleDeletePricingRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing rule?")) return;
    
    try {
      await currencyService.deletePricingRule(id, "admin");
      toast.success("Pricing rule deleted successfully");
      setSelectedItem(null);
      loadData();
    } catch (error) {
      toast.error("Failed to delete pricing rule");
    }
  };

  const handleTogglePricingRule = async (id: string, currentActive: boolean) => {
    try {
      await currencyService.updatePricingRule(id, { isActive: !currentActive }, "admin");
      toast.success("Pricing rule updated successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to update pricing rule");
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFilters({ ...filters, search: value || undefined });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Multi-Currency Engine</h1>
        <Button variant="outline" onClick={handleRefreshRates} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isRefreshing ? "Refreshing..." : "Refresh Rates"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Currencies" value={kpi?.totalCurrencies?.toString() || "0"} icon={DollarSign} />
        <StatCard title="Geo Regions" value={kpi?.geoRegions?.toString() || "0"} icon={Globe} />
        <StatCard
          title="Conversion Rate"
          value={kpi?.conversionRateStatus || "N/A"}
          icon={RefreshCw}
          change={kpi?.lastRateUpdate ? `Updated ${new Date(kpi.lastRateUpdate).toLocaleTimeString()}` : undefined}
          changeType={kpi?.conversionRateStatus === "live" ? "positive" : "negative"}
        />
        <StatCard
          title="FX Adjustments"
          value={kpi?.fxAdjustments24h?.toString() || "0"}
          icon={TrendingUp}
          change="Last 24h"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between rounded-md border p-3">
            <span>Provider</span>
            <span className="font-medium">Open Exchange Rates</span>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>Update Frequency</span>
            <span className="font-medium">Every 5 minutes</span>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>Base Currency</span>
            <span className="font-medium">{kpi?.baseCurrency || "N/A"}</span>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>Status</span>
            <span className={`font-medium ${kpi?.conversionRateStatus === "live" ? "text-green-600" : "text-yellow-600"}`}>
              {kpi?.conversionRateStatus === "live" ? "Live" : "Stale"}
            </span>
          </div>
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
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {activeTab === "currencies" && (
              <>
                <Button
                  variant={filters.isBase === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters({ ...filters, isBase: filters.isBase === true ? undefined : true })}
                >
                  Base Only
                </Button>
                <Button
                  variant={filters.isActive === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters({ ...filters, isActive: filters.isActive === true ? undefined : true })}
                >
                  Active Only
                </Button>
              </>
            )}
            {(filters.search || filters.isBase !== undefined || filters.isActive !== undefined) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "currencies" ? "default" : "outline"}
          onClick={() => setActiveTab("currencies")}
        >
          Currencies
        </Button>
        <Button
          variant={activeTab === "pricing" ? "default" : "outline"}
          onClick={() => setActiveTab("pricing")}
        >
          Local Pricing Rules
        </Button>
      </div>

      {activeTab === "currencies" && (
        <DataTable
          title="Live Exchange Rates"
          columns={[
            {
              header: "Code",
              accessorKey: "code",
              cell: ({ row }: { row: { original: Currency } }) => (
                <span className="font-mono font-medium">{row.original.code}</span>
              ),
            },
            { header: "Name", accessorKey: "name" },
            {
              header: "Rate",
              accessorKey: "rate",
              cell: ({ row }: { row: { original: Currency } }) => (
                <span>{row.original.rate.toFixed(4)}</span>
              ),
            },
            {
              header: "Final Rate",
              accessorKey: "finalRate",
              cell: ({ row }: { row: { original: Currency } }) => (
                <span className={row.original.adjustment !== 0 ? "text-blue-600 font-medium" : ""}>
                  {row.original.finalRate.toFixed(4)}
                  {row.original.adjustment !== 0 && ` (${row.original.adjustment > 0 ? '+' : ''}${row.original.adjustment})`}
                </span>
              ),
            },
            {
              header: "Base",
              accessorKey: "isBase",
              cell: ({ row }: { row: { original: Currency } }) => (
                row.original.isBase ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <span>-</span>
              ),
            },
            {
              header: "Active",
              accessorKey: "isActive",
              cell: ({ row }: { row: { original: Currency } }) => (
                <span className={row.original.isActive ? "text-green-600" : "text-muted-foreground"}>
                  {row.original.isActive ? "Yes" : "No"}
                </span>
              ),
            },
            {
              header: "Updated",
              accessorKey: "lastUpdated",
              cell: ({ row }: { row: { original: Currency } }) => formatDate(row.original.lastUpdated),
            },
            {
              header: "",
              accessorKey: "id",
              cell: ({ row }: { row: { original: Currency } }) => (
                <div className="flex gap-2">
                  {!row.original.isBase && (
                    <Button size="sm" variant="outline" onClick={() => handleSetBaseCurrency(row.original.id)}>
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleToggleActive(row.original.id)}>
                    <Power className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEditRate(row.original.id)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRefreshSingleRate(row.original.id)}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              ),
            },
          ]}
          data={currencies}
        />
      )}

      {activeTab === "pricing" && (
        <>
          <div className="flex justify-end">
            <Button onClick={handleAddPricingRule}>
              <Plus className="mr-2 h-4 w-4" />
              Add Pricing Rule
            </Button>
          </div>
          <DataTable
            title="Local Pricing Rules"
            columns={[
              { header: "Region", accessorKey: "regionName" },
              { header: "Currency", accessorKey: "currencyCode" },
              {
                header: "Multiplier",
                accessorKey: "multiplier",
                cell: ({ row }: { row: { original: PricingRule } }) => (
                  <span className="font-medium">{row.original.multiplier.toFixed(2)}x</span>
                ),
              },
              {
                header: "Tax Included",
                accessorKey: "taxIncluded",
                cell: ({ row }: { row: { original: PricingRule } }) => (
                  <span className={row.original.taxIncluded ? "text-green-600" : "text-muted-foreground"}>
                    {row.original.taxIncluded ? `Yes (${row.original.taxRate ? (row.original.taxRate * 100).toFixed(0) + '%' : 'N/A'})` : "No"}
                  </span>
                ),
              },
              {
                header: "Example",
                accessorKey: "examplePrice",
                cell: ({ row }: { row: { original: PricingRule } }) => (
                  <span className="font-mono">${row.original.examplePrice.toFixed(2)}</span>
                ),
              },
              {
                header: "Active",
                accessorKey: "isActive",
                cell: ({ row }: { row: { original: PricingRule } }) => (
                  <span className={row.original.isActive ? "text-green-600" : "text-muted-foreground"}>
                    {row.original.isActive ? "Yes" : "No"}
                  </span>
                ),
              },
              {
                header: "",
                accessorKey: "id",
                cell: ({ row }: { row: { original: PricingRule } }) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditPricingRule(row.original.id)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleTogglePricingRule(row.original.id, row.original.isActive)}>
                      <Power className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeletePricingRule(row.original.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={pricingRules}
          />
        </>
      )}

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
          </DialogHeader>
          {selectedItem && "code" in selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Code</label>
                <p className="text-sm">{(selectedItem as Currency).code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{(selectedItem as Currency).name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Symbol</label>
                <p className="text-sm">{(selectedItem as Currency).symbol}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rate</label>
                <p className="text-sm">{(selectedItem as Currency).rate.toFixed(4)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Adjustment</label>
                <p className="text-sm">{(selectedItem as Currency).adjustment.toFixed(4)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Final Rate</label>
                <p className="text-sm">{(selectedItem as Currency).finalRate.toFixed(4)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Base</label>
                <p className="text-sm">{(selectedItem as Currency).isBase ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Active</label>
                <p className="text-sm">{(selectedItem as Currency).isActive ? "Yes" : "No"}</p>
              </div>
            </div>
          )}
          {selectedItem && "regionName" in selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Region</label>
                <p className="text-sm">{(selectedItem as PricingRule).regionName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Currency</label>
                <p className="text-sm">{(selectedItem as PricingRule).currencyCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Multiplier</label>
                <p className="text-sm">{(selectedItem as PricingRule).multiplier.toFixed(2)}x</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tax Included</label>
                <p className="text-sm">{(selectedItem as PricingRule).taxIncluded ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tax Rate</label>
                <p className="text-sm">{(selectedItem as PricingRule).taxRate ? ((selectedItem as PricingRule).taxRate! * 100).toFixed(2) + "%" : "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Example Price ($100 base)</label>
                <p className="text-sm">${(selectedItem as PricingRule).examplePrice.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Priority</label>
                <p className="text-sm">{(selectedItem as PricingRule).priority}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminCurrencyPage;
