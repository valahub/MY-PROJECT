
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingBag, RefreshCcw, TrendingUp, Loader2, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  exportMarketplaceManagerData,
  getMarketplaceManagerSummary,
  getUiErrorMessage,
  type MarketplaceManagerSummary,
} from "@/lib/ui-actions-api";

({
  component: MarketplaceReports,
});

const byCategory = [
  { name: "WordPress", value: 142000, color: "#0033A1" },
  { name: "HTML Templates", value: 88000, color: "#EB0045" },
  { name: "PHP Scripts", value: 56000, color: "#00A7E1" },
  { name: "Mobile", value: 38000, color: "#2ED9C3" },
  { name: "JavaScript", value: 24000, color: "#00205C" },
];

const byCountry = [
  { country: "USA", sales: 12400 },
  { country: "UK", sales: 8200 },
  { country: "Germany", sales: 6800 },
  { country: "India", sales: 5400 },
  { country: "Australia", sales: 4100 },
  { country: "Canada", sales: 3800 },
  { country: "France", sales: 3200 },
  { country: "Brazil", sales: 2400 },
];

function MarketplaceReports() {
  const [summary, setSummary] = useState<MarketplaceManagerSummary | null>(null);
  const [isExportingSubmissions, setIsExportingSubmissions] = useState(false);
  const [isExportingRefunds, setIsExportingRefunds] = useState(false);

  useEffect(() => {
    void getMarketplaceManagerSummary()
      .then(setSummary)
      .catch((error) => toast.error(getUiErrorMessage(error, "Failed to load report summary.")));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isExportingSubmissions}
            onClick={async () => {
              setIsExportingSubmissions(true);
              try {
                const result = await exportMarketplaceManagerData("submissions");
                toast.success(`Submissions export: ${result.count}`);
              } catch (error) {
                toast.error(getUiErrorMessage(error, "Export failed."));
              } finally {
                setIsExportingSubmissions(false);
              }
            }}
          >
            {isExportingSubmissions ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExportingSubmissions ? "Exporting..." : "Export submissions"}
          </Button>
          <Button
            variant="outline"
            disabled={isExportingRefunds}
            onClick={async () => {
              setIsExportingRefunds(true);
              try {
                const result = await exportMarketplaceManagerData("refunds");
                toast.success(`Refunds export: ${result.count}`);
              } catch (error) {
                toast.error(getUiErrorMessage(error, "Export failed."));
              } finally {
                setIsExportingRefunds(false);
              }
            }}
          >
            {isExportingRefunds ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExportingRefunds ? "Exporting..." : "Export refunds"}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          title="GMV YTD"
          value={`$${(((summary?.gmv ?? 2840000) as number) / 1000000).toFixed(2)}M`}
          change="+22% YoY"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Orders"
          value={((summary?.activeItems ?? 48210) as number).toLocaleString()}
          change="+18% YoY"
          changeType="positive"
          icon={ShoppingBag}
        />
        <StatCard
          title="Refund Rate"
          value={`${(summary?.refundRatePct ?? 1.8).toFixed(2)}%`}
          change="-0.2% YoY"
          changeType="positive"
          icon={RefreshCcw}
        />
        <StatCard
          title="Avg Order"
          value={`$${Math.max(1, (summary?.gmv ?? 2840000) / Math.max(1, summary?.activeItems ?? 48210)).toFixed(2)}`}
          change="+$3.20"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label={(d) => `$${(d.value / 1000).toFixed(0)}k`}
                >
                  {byCategory.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byCountry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="sales" fill="#00A7E1" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
