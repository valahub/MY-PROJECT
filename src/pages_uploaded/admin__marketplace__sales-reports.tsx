
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, ShoppingBag, Users, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Area,
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
import { toast } from "sonner";

({
  component: SalesReports,
});

const monthly = [
  { month: "Jul", sales: 8420, gmv: 184000 },
  { month: "Aug", sales: 9210, gmv: 210000 },
  { month: "Sep", sales: 10240, gmv: 245000 },
  { month: "Oct", sales: 11420, gmv: 268000 },
  { month: "Nov", sales: 12840, gmv: 302000 },
  { month: "Dec", sales: 14210, gmv: 348000 },
];

const byCategory = [
  { name: "WordPress", value: 142000 },
  { name: "HTML Templates", value: 78000 },
  { name: "PHP Scripts", value: 52000 },
  { name: "Mobile", value: 41000 },
  { name: "JavaScript", value: 22000 },
  { name: "Other", value: 13000 },
];

const COLORS = ["#EB0045", "#0033A1", "#00A7E1", "#2ED9C3", "#00205C", "#D9D8D6"];

function SalesReports() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Sales report exported (CSV)");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        <Button variant="outline" disabled={isExporting} onClick={handleExport}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          title="GMV (Dec)"
          value="$348,000"
          change="+15.2%"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Sales (Dec)"
          value="14,210"
          change="+10.7%"
          changeType="positive"
          icon={ShoppingBag}
        />
        <StatCard
          title="Avg Order Value"
          value="$24.50"
          change="+$1.20"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="New Buyers"
          value="2,430"
          change="+18.4%"
          changeType="positive"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GMV trend (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                <Area
                  type="monotone"
                  dataKey="gmv"
                  stroke="#0033A1"
                  fill="#0033A130"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#EB0045" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={byCategory}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={(e: any) => e.name}
              >
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top selling items (this month)</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Item</th>
                <th className="text-left p-2">Author</th>
                <th className="text-right p-2">Sales</th>
                <th className="text-right p-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  item: "Mega Addons for Elementor",
                  author: "ThemeNest",
                  sales: 1240,
                  revenue: 35960,
                },
                { item: "BizPro Admin Dashboard", author: "ThemeNest", sales: 920, revenue: 35880 },
                {
                  item: "Landwind — 30 Tailwind Pages",
                  author: "ThemeNest",
                  sales: 1820,
                  revenue: 43680,
                },
                { item: "NovaPress SaaS Theme", author: "PixelStack", sales: 480, revenue: 28320 },
                { item: "FoodGo Flutter App", author: "AppForge", sales: 240, revenue: 18960 },
              ].map((r, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{r.item}</td>
                  <td className="p-2 text-muted-foreground">{r.author}</td>
                  <td className="p-2 text-right">{r.sales.toLocaleString()}</td>
                  <td className="p-2 text-right font-semibold">${r.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default SalesReports;