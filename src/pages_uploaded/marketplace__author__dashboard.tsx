import { Link } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingBag, Star, Eye, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ITEMS } from "@/lib/marketplace-data";
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
} from "recharts";

({
  component: AuthorDashboard,
});

const sales30 = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  sales: Math.floor(40 + Math.random() * 80),
  earnings: Math.floor(800 + Math.random() * 1600),
}));

const topItems = ITEMS.filter((i) => i.author === "PixelStack").slice(0, 5);

function AuthorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, PixelStack</h1>
          <p className="text-sm text-muted-foreground">Here's how your portfolio is performing.</p>
        </div>
        <Link to="/marketplace/author/upload">
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-1" /> Upload Item
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="This month earnings"
          value="$12,450"
          change="+18.2% MoM"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Sales"
          value="842"
          change="+124 this week"
          changeType="positive"
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Items"
          value="24"
          change="2 in review"
          changeType="neutral"
          icon={Package}
        />
        <StatCard
          title="Avg Rating"
          value="4.7"
          change="48 new reviews"
          changeType="positive"
          icon={Star}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={sales30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0033A1"
                  fill="#0033A120"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sales30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: any) => `$${v}`} />
                <Bar dataKey="earnings" fill="#2ED9C3" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top performing items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topItems.map((i) => (
              <div key={i.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <div className="flex-1">
                  <div className="font-medium text-sm">{i.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.sales.toLocaleString()} sales · {i.rating} ★
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${(i.sales * i.price * 0.5).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Eye className="h-3 w-3" /> {(i.sales * 12).toLocaleString()} views
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthorDashboard;
