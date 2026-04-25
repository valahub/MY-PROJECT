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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService } from "@/lib/api/admin-services";

({ component: AdminDashboard });

// Brand colors
const PRIMARY = "#EB0045";
const SECONDARY = "#0033A1";
const INFO = "#00A7E1";
const SUCCESS = "#2ED9C3";
const NAVY = "#00205C";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "all">("all");
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    netRevenue: 0,
    totalRefunds: 0,
    refundRate: 0,
    mrr: 0,
    arr: 0,
    activeMerchants: 0,
    activeUsers: 0,
    activeSubscriptions: 0,
    totalProducts: 0,
    churnRate: 0,
  });
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number; netRevenue: number; refunds: number }>>([]);
  const [mrrData, setMrrData] = useState<Array<{ month: string; mrr: number; arr: number }>>([]);
  const [churnData, setChurnData] = useState<Array<{ month: string; rate: number }>>([]);
  const [merchantGrowth, setMerchantGrowth] = useState<Array<{ month: string; merchants: number }>>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiData, revChart, mrrChart, churnChart, merchantChart] = await Promise.all([
        marketplaceService.getDashboardKPIs(dateRange),
        marketplaceService.getRevenueChartData(12),
        marketplaceService.getMRRChartData(6),
        marketplaceService.getChurnChartData(6),
        marketplaceService.getMerchantGrowthChartData(6),
      ]);

      setKpis(kpiData);
      setRevenueData(revChart);
      setMrrData(mrrChart);
      setChurnData(churnChart);
      setMerchantGrowth(merchantChart);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      marketplaceService.clearKPICache();
      await loadData();
      toast.success("Dashboard data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReconcile = async () => {
    setIsRefreshing(true);
    try {
      await marketplaceService.reconcileKPIs();
      await loadData();
      toast.success("KPIs reconciled successfully");
    } catch (error) {
      toast.error("Failed to reconcile KPIs");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Global Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || loading}>
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="outline" onClick={handleReconcile} disabled={isRefreshing || loading}>
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Filter className="mr-2 h-4 w-4" />
            )}
            {isRefreshing ? "Reconciling..." : "Reconcile"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(kpis.totalRevenue)}
              change="Live data"
              changeType="positive"
              icon={DollarSign}
            />
            <StatCard
              title="Net Revenue"
              value={formatCurrency(kpis.netRevenue)}
              change="After refunds"
              changeType="positive"
              icon={DollarSign}
            />
            <StatCard
              title="Total Refunds"
              value={formatCurrency(kpis.totalRefunds)}
              change={`${kpis.refundRate.toFixed(1)}% rate`}
              changeType={kpis.refundRate < 5 ? "positive" : "negative"}
              icon={ArrowDownRight}
            />
            <StatCard
              title="MRR"
              value={formatCurrency(kpis.mrr)}
              change="Monthly Recurring"
              changeType="positive"
              icon={TrendingUp}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="ARR"
              value={formatCurrency(kpis.arr)}
              change="Annual Recurring"
              changeType="positive"
              icon={DollarSign}
            />
            <StatCard
              title="Active Merchants"
              value={formatNumber(kpis.activeMerchants)}
              change="Active accounts"
              changeType="positive"
              icon={Users}
            />
            <StatCard
              title="Active Subscriptions"
              value={formatNumber(kpis.activeSubscriptions)}
              change="Active plans"
              changeType="positive"
              icon={CreditCard}
            />
            <StatCard
              title="Churn Rate"
              value={`${kpis.churnRate.toFixed(1)}%`}
              change="Subscription churn"
              changeType={kpis.churnRate < 5 ? "positive" : "negative"}
              icon={ArrowDownRight}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Products"
              value={formatNumber(kpis.totalProducts)}
              change="Approved items"
              changeType="positive"
              icon={Package}
            />
            <StatCard
              title="Active Users"
              value={formatNumber(kpis.activeUsers)}
              change="Total accounts"
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
                    <Tooltip formatter={(v: any) => [`${v.toFixed(1)}%`, "Churn Rate"]} />
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
        </>
      )}
    </div>
  );
}

export default AdminDashboard;