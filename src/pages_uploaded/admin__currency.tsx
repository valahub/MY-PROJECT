
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, RefreshCw, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: AdminCurrencyPage,
  head: () => ({ meta: [{ title: "Multi-Currency — Admin — ERP Vala" }] }),
});

const rates = [
  { code: "USD", name: "US Dollar", rate: "1.0000", base: "Base", updated: "Live" },
  { code: "EUR", name: "Euro", rate: "0.9234", base: "USD", updated: "5min ago" },
  { code: "GBP", name: "British Pound", rate: "0.7891", base: "USD", updated: "5min ago" },
  { code: "INR", name: "Indian Rupee", rate: "83.2400", base: "USD", updated: "5min ago" },
  { code: "AUD", name: "Australian Dollar", rate: "1.5234", base: "USD", updated: "5min ago" },
  { code: "CAD", name: "Canadian Dollar", rate: "1.3567", base: "USD", updated: "5min ago" },
  { code: "JPY", name: "Japanese Yen", rate: "148.2300", base: "USD", updated: "5min ago" },
  { code: "BRL", name: "Brazilian Real", rate: "4.9700", base: "USD", updated: "5min ago" },
];

const localPricing = [
  {
    region: "United States",
    currency: "USD",
    baseMultiplier: "1.00x",
    taxIncluded: "No",
    example: "$99.00",
  },
  {
    region: "European Union",
    currency: "EUR",
    baseMultiplier: "0.95x",
    taxIncluded: "Yes (VAT)",
    example: "€89.00",
  },
  {
    region: "United Kingdom",
    currency: "GBP",
    baseMultiplier: "0.90x",
    taxIncluded: "Yes (VAT)",
    example: "£79.00",
  },
  {
    region: "India",
    currency: "INR",
    baseMultiplier: "0.60x",
    taxIncluded: "Yes (GST)",
    example: "₹4,999",
  },
  {
    region: "Brazil",
    currency: "BRL",
    baseMultiplier: "0.75x",
    taxIncluded: "No",
    example: "R$369",
  },
];

function AdminCurrencyPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Exchange rates refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh rates");
    } finally {
      setIsRefreshing(false);
    }
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
        <StatCard title="Currencies" value="32" icon={DollarSign} />
        <StatCard title="Geo Regions" value="195" icon={Globe} />
        <StatCard
          title="Conversion Rate"
          value="Live"
          icon={RefreshCw}
          change="Updated 5min ago"
          changeType="positive"
        />
        <StatCard
          title="FX Adjustments"
          value="+$2,340"
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
            <span className="font-medium">USD</span>
          </div>
          <div className="flex justify-between rounded-md border p-3">
            <span>Round to</span>
            <span className="font-medium">2 decimal places</span>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="Live Exchange Rates"
        columns={[
          {
            header: "Code",
            accessorKey: "code",
            cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span>,
          },
          { header: "Currency", accessorKey: "name" },
          { header: "Rate", accessorKey: "rate" },
          { header: "Base", accessorKey: "base" },
          { header: "Updated", accessorKey: "updated" },
        ]}
        data={rates}
      />

      <DataTable
        title="Local Pricing Rules"
        columns={[
          { header: "Region", accessorKey: "region" },
          { header: "Currency", accessorKey: "currency" },
          { header: "Multiplier", accessorKey: "baseMultiplier" },
          { header: "Tax Included", accessorKey: "taxIncluded" },
          { header: "Example", accessorKey: "example" },
        ]}
        data={localPricing}
      />
    </div>
  );
}

export default AdminCurrencyPage;
