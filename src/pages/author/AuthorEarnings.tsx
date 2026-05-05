// Author Earnings Page — UI-only earnings & withdrawal panel
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { authorItemsApiService } from "@/lib/marketplace/author-items-api";
import type { ItemEntity } from "@/lib/marketplace/author-items-schema";

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const COMMISSION = 0.3; // 30% platform fee

export default function AuthorEarnings() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    authorItemsApiService
      .getMyItems(user.id)
      .then((r) => r.success && r.data && setItems(r.data))
      .finally(() => setLoading(false));
  }, [user]);

  const gross = items.reduce((s, i) => s + i.sales * i.price, 0);
  const net = gross * (1 - COMMISSION);
  const fees = gross - net;
  const available = Math.max(0, net - 0); // demo

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > available) {
      toast.error("Amount exceeds available balance");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success(`Withdrawal request for ${currency(amount)} submitted`);
      setWithdrawAmount("");
      setSubmitting(false);
    }, 600);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/author">Author</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Earnings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-sm text-muted-foreground">Your revenue, fees, and withdrawals</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{currency(gross)}</div>
            <p className="text-xs text-muted-foreground">Before platform fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <Badge variant="outline">{Math.round(COMMISSION * 100)}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{currency(fees)}</div>
            <p className="text-xs text-muted-foreground">Marketplace commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{currency(available)}</div>
            <p className="text-xs text-muted-foreground">Ready to withdraw</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Request Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-3 sm:items-end max-w-xl">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={available}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Max available: <span className="tabular-nums">{currency(available)}</span>
              </p>
            </div>
            <Button type="submit" disabled={submitting || available <= 0}>
              {submitting ? "Submitting…" : "Withdraw"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earnings by Item</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No earnings data yet.</p>
          ) : (
            <div className="space-y-3">
              {items
                .filter((i) => i.sales > 0)
                .sort((a, b) => b.sales * b.price - a.sales * a.price)
                .map((i) => {
                  const itemGross = i.sales * i.price;
                  const itemNet = itemGross * (1 - COMMISSION);
                  return (
                    <div key={i.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate" title={i.title}>{i.title}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {i.sales.toLocaleString()} sales × {currency(i.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold tabular-nums">{currency(itemNet)}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">{currency(itemGross)} gross</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
