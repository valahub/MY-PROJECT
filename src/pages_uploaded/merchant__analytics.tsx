
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { DollarSign, Users, TrendingUp, ArrowDownRight, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import { useState } from "react";
import { toast } from "sonner";

({ component: MerchantAnalytics });

const revenueByMonth = [
  { month: "Jul", revenue: 5200, net: 4900 },
  { month: "Aug", revenue: 5800, net: 5500 },
  { month: "Sep", revenue: 6500, net: 6200 },
  { month: "Oct", revenue: 6100, net: 5800 },
  { month: "Nov", revenue: 7200, net: 6900 },
  { month: "Dec", revenue: 8100, net: 7800 },
];

const mrrTrend = [
  { month: "Jul", mrr: 18500 },
  { month: "Aug", mrr: 19800 },
  { month: "Sep", mrr: 21200 },
  { month: "Oct", mrr: 22500 },
  { month: "Nov", mrr: 23800 },
  { month: "Dec", mrr: 24510 },
];

const arrTrend = [
  { month: "Jul", arr: 222000 },
  { month: "Aug", arr: 237600 },
  { month: "Sep", arr: 254400 },
  { month: "Oct", arr: 270000 },
  { month: "Nov", arr: 285600 },
  { month: "Dec", arr: 294120 },
];

const churnData = [
  { month: "Jul", rate: 4.2, churned: 8, recovered: 2 },
  { month: "Aug", rate: 3.8, churned: 7, recovered: 3 },
  { month: "Sep", rate: 3.1, churned: 6, recovered: 2 },
  { month: "Oct", rate: 2.5, churned: 5, recovered: 3 },
  { month: "Nov", rate: 2.2, churned: 5, recovered: 2 },
  { month: "Dec", rate: 1.9, churned: 4, recovered: 2 },
];

const productBreakdown = [
  { name: "Pro Plan", value: 45 },
  { name: "Enterprise", value: 25 },
  { name: "Starter Kit", value: 15 },
  { name: "API Add-on", value: 10 },
  { name: "Other", value: 5 },
];

const countryRevenue = [
  { country: "United States", revenue: 3200 },
  { country: "United Kingdom", revenue: 1800 },
  { country: "Germany", revenue: 1200 },
  { country: "Canada", revenue: 900 },
  { country: "Australia", revenue: 600 },
  { country: "Other", revenue: 400 },
];

const retentionCohorts = [
  { cohort: "Jul", m0: 100, m1: 92, m2: 88, m3: 85, m4: 82, m5: 80 },
  { cohort: "Aug", m0: 100, m1: 94, m2: 90, m3: 87, m4: 84, m5: null },
  { cohort: "Sep", m0: 100, m1: 95, m2: 91, m3: 88, m4: null, m5: null },
  { cohort: "Oct", m0: 100, m1: 93, m2: 89, m3: null, m4: null, m5: null },
  { cohort: "Nov", m0: 100, m1: 96, m2: null, m3: null, m4: null, m5: null },
  { cohort: "Dec", m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null },
];

const PRIMARY = "#EB0045";
const SECONDARY = "#0033A1";
const INFO = "#00A7E1";
const SUCCESS = "#2ED9C3";
const NAVY = "#00205C";
const COLORS = [SECONDARY, INFO, SUCCESS, PRIMARY, NAVY];

function MerchantAnalytics() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? "Exporting..." : "Export Report"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$39,700"
          change="+14.2%"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="MRR"
          value="$24,510"
          change="+3.0% MoM"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="ARR"
          value="$294,120"
          change="+9.9% YoY"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Churn Rate"
          value="1.9%"
          change="-0.3% vs last month"
          changeType="positive"
          icon={ArrowDownRight}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value="298"
          change="+18.2%"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="ARPU"
          value="$133.22"
          change="+4.1%"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="LTV"
          value="$1,598"
          change="+$120 vs Q3"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Net Revenue Retention"
          value="108%"
          change="Healthy expansion"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="mrr">MRR/ARR</TabsTrigger>
          <TabsTrigger value="churn">Churn</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="geo">Geography</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Net Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                  <Bar
                    dataKey="revenue"
                    name="Gross Revenue"
                    fill={SECONDARY}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net Revenue"
                    stroke={SUCCESS}
                    strokeWidth={2}
                    dot={{ fill: SUCCESS, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mrr" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Recurring Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mrrTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, "MRR"]} />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      stroke={INFO}
                      fill={`${INFO}20`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Annual Recurring Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={arrTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, "ARR"]} />
                    <Area
                      type="monotone"
                      dataKey="arr"
                      stroke={NAVY}
                      fill={`${NAVY}20`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="churn" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Churn Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={churnData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(v: any, name: any) =>
                        name === "rate" ? [`${v}%`, "Churn Rate"] : [v, name]
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke={PRIMARY}
                      strokeWidth={2}
                      dot={{ fill: PRIMARY, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Churned vs Recovered</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={churnData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="churned" name="Churned" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="recovered"
                      name="Recovered"
                      fill={SUCCESS}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, value }: any) => `${name} ${value}%`}
                    >
                      {productBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryRevenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <YAxis type="category" dataKey="country" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill={SECONDARY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Retention Cohorts (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium">Cohort</th>
                      <th className="p-2 text-center font-medium">M0</th>
                      <th className="p-2 text-center font-medium">M1</th>
                      <th className="p-2 text-center font-medium">M2</th>
                      <th className="p-2 text-center font-medium">M3</th>
                      <th className="p-2 text-center font-medium">M4</th>
                      <th className="p-2 text-center font-medium">M5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retentionCohorts.map((row) => (
                      <tr key={row.cohort} className="border-b">
                        <td className="p-2 font-medium">{row.cohort}</td>
                        {[row.m0, row.m1, row.m2, row.m3, row.m4, row.m5].map((val, i) => (
                          <td key={i} className="p-2 text-center">
                            {val !== null ? (
                              <span
                                className="inline-block rounded px-2 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: `rgba(46, 217, 195, ${(val / 100) * 0.5})`,
                                  color: val > 50 ? NAVY : "#666",
                                }}
                              >
                                {val}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MerchantAnalytics;
