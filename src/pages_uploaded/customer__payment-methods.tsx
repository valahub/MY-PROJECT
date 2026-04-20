
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({
  component: CustomerPaymentMethods,
});

const paymentMethods = [
  { id: "pm_001", type: "Visa", last4: "4242", expiry: "12/2026", isDefault: true },
  { id: "pm_002", type: "Mastercard", last4: "5555", expiry: "08/2025", isDefault: false },
];

function CustomerPaymentMethods() {
  const [isAdding, setIsAdding] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddPaymentMethod = async () => {
    setIsAdding(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Payment method added successfully");
    } catch (error) {
      toast.error("Failed to add payment method");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefault(id);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Default payment method updated");
    } catch (error) {
      toast.error("Failed to set default payment method");
    } finally {
      setSettingDefault(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Payment method removed");
    } catch (error) {
      toast.error("Failed to remove payment method");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <Button onClick={handleAddPaymentMethod} disabled={isAdding}>
          {isAdding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAdding ? "Adding..." : "Add Payment Method"}
        </Button>
      </div>
      {paymentMethods.map((pm) => (
        <Card key={pm.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-md border p-2">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {pm.type} •••• {pm.last4}
                </p>
                <p className="text-sm text-muted-foreground">Expires {pm.expiry}</p>
              </div>
              {pm.isDefault && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Default
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!pm.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(pm.id)}
                  disabled={settingDefault === pm.id}
                >
                  {settingDefault === pm.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : null}
                  {settingDefault === pm.id ? "Setting..." : "Set as Default"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(pm.id)}
                disabled={deletingId === pm.id}
              >
                {deletingId === pm.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default CustomerPaymentMethods;
