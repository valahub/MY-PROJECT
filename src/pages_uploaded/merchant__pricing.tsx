import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

({ component: MerchantPricing });

const initialPrices = [
  {
    id: "pri_001",
    product: "Pro Plan",
    description: "Monthly",
    amount: "$29.00",
    interval: "month",
    trialDays: 14,
    status: "active",
  },
  {
    id: "pri_002",
    product: "Pro Plan",
    description: "Yearly",
    amount: "$290.00",
    interval: "year",
    trialDays: 14,
    status: "active",
  },
  {
    id: "pri_003",
    product: "Enterprise License",
    description: "Annual License",
    amount: "$499.00",
    interval: "year",
    trialDays: 30,
    status: "active",
  },
  {
    id: "pri_004",
    product: "Team Plan",
    description: "Monthly",
    amount: "$79.00",
    interval: "month",
    trialDays: 7,
    status: "draft",
  },
  {
    id: "pri_005",
    product: "API Add-on",
    description: "Monthly usage",
    amount: "$49.00",
    interval: "month",
    trialDays: 0,
    status: "active",
  },
  {
    id: "pri_006",
    product: "White Label",
    description: "Annual License",
    amount: "$999.00",
    interval: "year",
    trialDays: 0,
    status: "active",
  },
];

function MerchantPricing() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState(initialPrices);
  const [deleteTarget, setDeleteTarget] = useState<(typeof initialPrices)[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (p: (typeof initialPrices)[0]) => {
    toast.info(`Editing ${p.product} — ${p.description} (mock)`);
    navigate("/merchant/pricing/create");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPrices((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success(`${deleteTarget.product} — ${deleteTarget.description} deleted`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Failed to delete price");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pricing</h1>
        <Link to="/merchant/pricing/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Price
          </Button>
        </Link>
      </div>
      <div className="grid gap-4">
        {prices.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{p.product}</p>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{p.amount}</p>
                  <p className="text-xs text-muted-foreground">
                    per {p.interval}
                    {p.trialDays > 0 ? ` · ${p.trialDays}-day trial` : ""}
                  </p>
                </div>
                <StatusBadge status={p.status} />
                <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                  Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this price?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Permanently remove{" "}
                  <span className="font-semibold text-foreground">
                    {deleteTarget.product} — {deleteTarget.description}
                  </span>
                  ? Existing subscriptions on this price will not be affected.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MerchantPricing;
