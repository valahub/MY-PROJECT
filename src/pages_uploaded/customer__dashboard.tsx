
import { StatCard } from "@/components/StatCard";
import { CreditCard, Receipt, Key, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

({ component: CustomerDashboard });

function CustomerDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Subscriptions" value="2" icon={CreditCard} />
        <StatCard title="Open Invoices" value="1" icon={Receipt} />
        <StatCard title="Active Licenses" value="3" icon={Key} />
        <StatCard title="Total Spent" value="$1,240" icon={DollarSign} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                action: "Payment processed",
                detail: "Pro Plan — $29.00",
                date: "Jul 15, 2024",
                status: "completed",
              },
              {
                action: "License activated",
                detail: "Enterprise License — Device #2",
                date: "Jul 10, 2024",
                status: "active",
              },
              {
                action: "Invoice generated",
                detail: "INV-2024-001 — $29.00",
                date: "Jul 1, 2024",
                status: "paid",
              },
              {
                action: "Subscription renewed",
                detail: "API Add-on — $49.00",
                date: "Jun 18, 2024",
                status: "completed",
              },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-muted-foreground">{a.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
