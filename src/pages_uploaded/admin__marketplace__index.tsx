import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, Users, DollarSign, ClipboardCheck, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getMarketplaceManagerSummary,
  getUiErrorMessage,
  runMarketplaceConsistencyCheck,
  type MarketplaceManagerSummary,
} from "@/lib/ui-actions-api";

({
  component: MarketplaceAdminOverview,
});

const sales = [
  { month: "Jul", gmv: 184000, take: 55000 },
  { month: "Aug", gmv: 210000, take: 63000 },
  { month: "Sep", gmv: 245000, take: 73500 },
  { month: "Oct", gmv: 268000, take: 80400 },
  { month: "Nov", gmv: 302000, take: 90600 },
  { month: "Dec", gmv: 348000, take: 104400 },
];

function MarketplaceAdminOverview() {
  const [summary, setSummary] = useState<MarketplaceManagerSummary | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    void getMarketplaceManagerSummary()
      .then(setSummary)
      .catch((error) => toast.error(getUiErrorMessage(error, "Failed to load manager summary.")));
  }, []);

  const runConsistency = async () => {
    setIsScanning(true);
    try {
      const findings = await runMarketplaceConsistencyCheck(true);
      toast.success(`Consistency scan complete: ${findings.length} finding(s)`);
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Consistency scan failed."));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" /> Marketplace Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            CodeCanyon-style admin for the ERP Vala Marketplace
          </p>
        </div>
        <Link to="/marketplace" target="_blank">
          <Button variant="outline">View public marketplace →</Button>
        </Link>
        <Button variant="outline" onClick={() => void runConsistency()} disabled={isScanning}>
          {isScanning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isScanning ? "Scanning..." : "Run Consistency Scan"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="GMV (Dec)"
          value={`$${(summary?.gmv ?? 348000).toLocaleString()}`}
          change="+15.2% MoM"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Take Rate Revenue"
          value={`$${(summary?.takeRateRevenue ?? 104400).toLocaleString()}`}
          change="30% take"
          changeType="neutral"
          icon={DollarSign}
        />
        <StatCard
          title="Active Items"
          value={(summary?.activeItems ?? 91310).toLocaleString()}
          change="+248 this week"
          changeType="positive"
          icon={Package}
        />
        <StatCard
          title="Active Authors"
          value={(summary?.activeAuthors ?? 6420).toLocaleString()}
          change="+58 this week"
          changeType="positive"
          icon={Users}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Reviews"
          value={(summary?.pendingReviews ?? 148).toLocaleString()}
          change="6 critical"
          changeType="negative"
          icon={ClipboardCheck}
        />
        <StatCard
          title="Reported Items"
          value={(summary?.reportedItems ?? 23).toLocaleString()}
          change="↑ 4 today"
          changeType="negative"
          icon={AlertTriangle}
        />
        <StatCard
          title="Pending Payouts"
          value={`$${(summary?.pendingPayoutAmount ?? 84250).toLocaleString()}`}
          change="412 authors"
          changeType="neutral"
          icon={DollarSign}
        />
        <StatCard
          title="Refund Rate"
          value={`${(summary?.refundRatePct ?? 1.8).toFixed(2)}%`}
          change="-0.2% MoM"
          changeType="positive"
          icon={DollarSign}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GMV vs Platform Take (6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
              <Area
                type="monotone"
                dataKey="gmv"
                stroke="#0033A1"
                fill="#0033A120"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="take"
                stroke="#EB0045"
                fill="#EB004520"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/marketplace/queue" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="font-semibold">Review Queue</div>
              <div className="text-xs text-muted-foreground">Approve / reject pending items</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/marketplace/featured" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="font-semibold">Featured Slots</div>
              <div className="text-xs text-muted-foreground">Manage homepage featured items</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/marketplace/payouts" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="font-semibold">Author Payouts</div>
              <div className="text-xs text-muted-foreground">Process monthly withdrawals</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/marketplace/refunds" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="font-semibold">Refunds</div>
              <div className="text-xs text-muted-foreground">Approve buyer refund requests</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/marketplace/takedowns" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="font-semibold">DMCA Takedowns</div>
              <div className="text-xs text-muted-foreground">Handle copyright complaints</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/marketplace/levels" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="font-semibold">Author Levels</div>
              <div className="text-xs text-muted-foreground">Tier thresholds & commissions</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/marketplace/sales-reports" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="font-semibold">Sales Reports</div>
              <div className="text-xs text-muted-foreground">GMV, AOV, top items</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/marketplace/settings" className="block">
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="font-semibold">Marketplace Settings</div>
              <div className="text-xs text-muted-foreground">Commission, fees, policy</div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
