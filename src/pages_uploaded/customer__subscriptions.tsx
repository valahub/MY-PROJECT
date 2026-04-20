
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useEffect, useState } from "react";
import {
  cancelSubscription,
  getCustomerSubscriptions,
  getUiErrorMessage,
  type CustomerSubscription,
  updateSubscriptionPayment,
  upgradeSubscription,
} from "@/lib/ui-actions-api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

({
  component: CustomerSubscriptions,
});

function CustomerSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowActionLoading, setRowActionLoading] = useState<
    Record<string, "upgrade" | "payment" | "cancel" | null>
  >({});

  const loadSubscriptions = async () => {
    try {
      setSubscriptions(await getCustomerSubscriptions());
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Failed to load subscriptions."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscriptions();
  }, []);

  const runAction = async (subId: string, action: "upgrade" | "payment" | "cancel") => {
    if (rowActionLoading[subId]) return;
    setRowActionLoading((prev) => ({ ...prev, [subId]: action }));
    try {
      const next =
        action === "upgrade"
          ? await upgradeSubscription(subId)
          : action === "payment"
            ? await updateSubscriptionPayment(subId)
            : await cancelSubscription(subId);
      setSubscriptions(next);
      toast.success(
        action === "upgrade"
          ? "Plan updated."
          : action === "payment"
            ? "Payment method updated."
            : "Subscription canceled.",
      );
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Action failed. Please retry."));
    } finally {
      setRowActionLoading((prev) => ({ ...prev, [subId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Subscriptions</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading subscriptions...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Subscriptions</h1>
      {subscriptions.map((sub) => {
        const busy = rowActionLoading[sub.id];
        const disabledForState = sub.status !== "active";
        return (
          <Card key={sub.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{sub.product}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{sub.price}</p>
              </div>
              <StatusBadge status={sub.status} />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Next billing</p>
                  <p className="text-sm font-medium">{sub.nextBill}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="text-sm font-medium">{sub.started}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment method</p>
                  <p className="text-sm font-medium">{sub.paymentMethod}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!busy || disabledForState}
                  onClick={() => runAction(sub.id, "upgrade")}
                >
                  {busy === "upgrade" && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  Update Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!busy || disabledForState}
                  onClick={() => runAction(sub.id, "payment")}
                >
                  {busy === "payment" && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  Update Payment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={!!busy || sub.status === "canceled"}
                  onClick={() => runAction(sub.id, "cancel")}
                >
                  {busy === "cancel" && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
