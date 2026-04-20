
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Package, CreditCard, TrendingUp, ArrowDownRight, RefreshCw, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { useState } from "react";
import { toast } from "sonner";

({ component: AdminDashboard });

const revenueData = [
  { month: "Jan", revenue: 42000 },
  { month: "Feb", revenue: 48000 },
  { month: "Mar", revenue: 55000 },
  { month: "Apr", revenue: 51000 },
  { month: "May", revenue: 62000 },
  { month: "Jun", revenue: 71000 },
  { month: "Jul", revenue: 68000 },
  { month: "Aug", revenue: 75000 },
  { month: "Sep", revenue: 82000 },
  { month: "Oct", revenue: 79000 },
  { month: "Nov", revenue: 88000 },
  { month: "Dec", revenue: 95000 },
];

const mrrData = [
  { month: "Jul", mrr: 52000, arr: 624000 },
  { month: "Aug", mrr: 58000, arr: 696000 },
  { month: "Sep", mrr: 63000, arr: 756000 },
  { month: "Oct", mrr: 61000, arr: 732000 },
  { month: "Nov", mrr: 68000, arr: 816000 },
  { month: "Dec", mrr: 74000, arr: 888000 },
];

const churnData = [
  { month: "Jul", rate: 3.5 },
  { month: "Aug", rate: 3.1 },
  { month: "Sep", rate: 2.8 },
  { month: "Oct", rate: 2.9 },
  { month: "Nov", rate: 2.4 },
  { month: "Dec", rate: 2.1 },
];

const merchantGrowth = [
  { month: "Jul", merchants: 280 },
  { month: "Aug", merchants: 295 },
  { month: "Sep", merchants: 310 },
  { month: "Oct", merchants: 322 },
  { month: "Nov", merchants: 335 },
  { month: "Dec", merchants: 342 },
];

// Brand colors
const PRIMARY = "#EB0045";
const SECONDARY = "#0033A1";
const INFO = "#00A7E1";
const SUCCESS = "#2ED9C3";
const NAVY = "#00205C";

function AdminDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Dashboard data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFilter = async () => {
    setIsFiltering(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Filter applied successfully");
    } catch (error) {
      toast.error("Failed to apply filter");
    } finally {
      setIsFiltering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Global Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" onClick={handleFilter} disabled={isFiltering}>
            {isFiltering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Filter className="mr-2 h-4 w-4" />
            )}
            {isFiltering ? "Filtering..." : "Filter"}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$816,000"
          change="+12.5% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="MRR"
          value="$74,000"
          change="+8.8% MoM"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="Active Merchants"
          value="342"
          change="+8 new this month"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Churn Rate"
          value="2.1%"
          change="-0.3% vs last month"
          changeType="positive"
          icon={ArrowDownRight}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ARR"
          value="$888,000"
          change="+9.9% growth"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Total Products"
          value="1,847"
          change="+23 this month"
          changeType="positive"
          icon={Package}
        />
        <StatCard
          title="Active Subscriptions"
          value="12,459"
          change="+5.2% growth"
          changeType="positive"
          icon={CreditCard}
        />
        <StatCard
          title="Active Users"
          value="18,234"
          change="+1,204 this month"
          changeType="positive"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={SECONDARY}
                  fill={`${SECONDARY}20`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MRR & ARR Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mrrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                <Bar dataKey="mrr" name="MRR" fill={INFO} radius={[4, 4, 0, 0]} />
                <Bar dataKey="arr" name="ARR" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Churn Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: any) => [`${v}%`, "Churn Rate"]} />
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
            <CardTitle>Merchant Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={merchantGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="merchants"
                  stroke={SUCCESS}
                  fill={`${SUCCESS}20`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
