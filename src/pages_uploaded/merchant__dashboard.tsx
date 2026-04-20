
import { StatCard } from "@/components/StatCard";
import { DollarSign, Users, CreditCard, TrendingUp, ArrowDownRight, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

({ component: MerchantDashboard });

const revenueData = [
  { month: "Jan", revenue: 4200, refunds: 120 },
  { month: "Feb", revenue: 5800, refunds: 200 },
  { month: "Mar", revenue: 6500, refunds: 150 },
  { month: "Apr", revenue: 5100, refunds: 180 },
  { month: "May", revenue: 7200, refunds: 90 },
  { month: "Jun", revenue: 8100, refunds: 210 },
];

const mrrArrData = [
  { month: "Jan", mrr: 18200, arr: 218400 },
  { month: "Feb", mrr: 19500, arr: 234000 },
  { month: "Mar", mrr: 21000, arr: 252000 },
  { month: "Apr", mrr: 22300, arr: 267600 },
  { month: "May", mrr: 23800, arr: 285600 },
  { month: "Jun", mrr: 24510, arr: 294120 },
];

const customerData = [
  { month: "Jan", customers: 120, new: 28 },
  { month: "Feb", customers: 145, new: 32 },
  { month: "Mar", customers: 178, new: 41 },
  { month: "Apr", customers: 210, new: 38 },
  { month: "May", customers: 252, new: 50 },
  { month: "Jun", customers: 298, new: 54 },
];

const churnData = [
  { month: "Jan", rate: 4.2, churned: 5 },
  { month: "Feb", rate: 3.8, churned: 6 },
  { month: "Mar", rate: 3.1, churned: 5 },
  { month: "Apr", rate: 2.9, churned: 6 },
  { month: "May", rate: 2.4, churned: 6 },
  { month: "Jun", rate: 1.9, churned: 6 },
];

const PRIMARY = "#EB0045";
const SECONDARY = "#0033A1";
const INFO = "#00A7E1";
const SUCCESS = "#2ED9C3";
const NAVY = "#00205C";

function MerchantDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Revenue"
          value="$8,100"
          change="+12.5% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="MRR"
          value="$24,510"
          change="+8.3% MoM"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="ARR"
          value="$294,120"
          change="+3.0% this quarter"
          changeType="positive"
          icon={Repeat}
        />
        <StatCard
          title="Churn Rate"
          value="1.9%"
          change="-0.5% vs last month"
          changeType="positive"
          icon={ArrowDownRight}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Customers"
          value="298"
          change="+54 this month"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Active Subscriptions"
          value="845"
          change="+5.2% growth"
          changeType="positive"
          icon={CreditCard}
        />
        <StatCard
          title="Total Refunds"
          value="$210"
          change="2.6% of revenue"
          changeType="neutral"
          icon={DollarSign}
        />
        <StatCard
          title="Net Revenue"
          value="$7,890"
          change="+11.8%"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                <Bar dataKey="revenue" name="Revenue" fill={SECONDARY} radius={[4, 4, 0, 0]} />
                <Bar dataKey="refunds" name="Refunds" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MRR & ARR Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mrrArrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="mrr"
                  name="MRR"
                  stroke={INFO}
                  strokeWidth={2}
                  dot={{ fill: INFO, r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="arr"
                  name="ARR"
                  stroke={NAVY}
                  strokeWidth={2}
                  dot={{ fill: NAVY, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="customers"
                  name="Total"
                  stroke={SUCCESS}
                  fill={`${SUCCESS}20`}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  name="New"
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
            <CardTitle>Churn Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D9D8D6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(v: any, name: any) =>
                    name === "rate" ? [`${v}%`, "Churn Rate"] : [v, "Churned"]
                  }
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="rate"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  dot={{ fill: PRIMARY, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PRIMARY;