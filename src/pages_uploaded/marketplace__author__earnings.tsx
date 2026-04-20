
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Wallet, CreditCard } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

({ component: EarningsPage });

const monthly = [
  { month: "Jul", earnings: 8420 },
  { month: "Aug", earnings: 9120 },
  { month: "Sep", earnings: 10240 },
  { month: "Oct", earnings: 9840 },
  { month: "Nov", earnings: 11200 },
  { month: "Dec", earnings: 12450 },
];

const breakdown = [
  { type: "Regular License Sales", amount: 9840, items: 412 },
  { type: "Extended License Sales", amount: 2200, items: 11 },
  { type: "Author Bonus (Elite)", amount: 410, items: 0 },
  { type: "Affiliate Earnings", amount: 0, items: 0 },
];

function EarningsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Earnings</h1>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard title="Available Balance" value="$8,240.50" icon={Wallet} />
        <StatCard title="Pending Clearance" value="$3,120.00" icon={DollarSign} />
        <StatCard
          title="This Month"
          value="$12,450"
          change="+18.2% MoM"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard title="Lifetime" value="$184,500" icon={CreditCard} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Earnings (last 6 months)</CardTitle>
          <Button
            onClick={() => toast.success("Withdrawal request submitted")}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            Withdraw $8,240
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#EB0045"
                strokeWidth={2}
                dot={{ fill: "#EB0045", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">December breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2">Source</th>
                <th className="text-right">Items</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr key={b.type} className="border-b">
                  <td className="py-2">{b.type}</td>
                  <td className="text-right">{b.items}</td>
                  <td className="text-right font-medium">${b.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2">Total</td>
                <td className="text-right">423</td>
                <td className="text-right">$12,450</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
