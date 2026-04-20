
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Eye, MousePointerClick, ShoppingBag, TrendingUp } from "lucide-react";
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

({
  component: AuthorAnalytics,
});

const traffic = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  views: 200 + Math.floor(Math.random() * 400),
  sales: 5 + Math.floor(Math.random() * 25),
}));
const sources = [
  { name: "Search", value: 45, color: "#0033A1" },
  { name: "Direct", value: 25, color: "#EB0045" },
  { name: "Referral", value: 18, color: "#00A7E1" },
  { name: "Social", value: 12, color: "#2ED9C3" },
];

function AuthorAnalytics() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          title="Page Views"
          value="48,210"
          change="+12% week"
          changeType="positive"
          icon={Eye}
        />
        <StatCard
          title="Click-through"
          value="6.8%"
          change="+0.4%"
          changeType="positive"
          icon={MousePointerClick}
        />
        <StatCard
          title="Conversion"
          value="3.2%"
          change="+0.2%"
          changeType="positive"
          icon={ShoppingBag}
        />
        <StatCard
          title="Avg Order"
          value="$48.20"
          change="+$2.10"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Views & sales (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={traffic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#0033A1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sales" fill="#EB0045" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label
                >
                  {sources.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AuthorAnalytics;
