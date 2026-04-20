import { Link } from "react-router-dom";
import { ITEMS, coverFor } from "@/lib/marketplace-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  addMarketplaceCartItem,
  getUiErrorMessage,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: Compare });

function Compare() {
  const [compareItems, setCompareItems] = useState(ITEMS.slice(0, 3));

  const addToCartAction = useSelfHealingAction(
    async (payload: { itemId: string }, signal) => {
      if (signal.aborted) throw new Error("Add to cart aborted");
      return addMarketplaceCartItem(payload.itemId, "regular");
    },
    {
      id: "marketplace-compare-add-to-cart",
      retry: { maxAttempts: 2, backoffMs: 500 },
      onSuccess: () => toast.success("Added to cart"),
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not add to cart.")),
    },
  );

  const handleAddToCart = async (itemId: string) => {
    await addToCartAction.trigger({ itemId });
  };

  const handleRemove = (itemId: string) => {
    setCompareItems(compareItems.filter((i) => i.id !== itemId));
    toast.success("Item removed from comparison");
  };

  const items = compareItems;
  const rows: { label: string; render: (i: (typeof items)[number]) => React.ReactNode }[] = [
    { label: "Price", render: (i) => <span className="font-bold">${i.price}</span> },
    { label: "Author", render: (i) => i.author },
    { label: "Rating", render: (i) => `${i.rating} ★ (${i.reviews})` },
    { label: "Sales", render: (i) => i.sales.toLocaleString() },
    { label: "Version", render: (i) => `v${i.version}` },
    { label: "Last update", render: (i) => i.lastUpdate },
    { label: "Lifetime updates", render: () => <Check className="h-4 w-4 text-success" /> },
    { label: "6-month support", render: () => <Check className="h-4 w-4 text-success" /> },
    { label: "Extended license", render: (i) => <span>${i.price * 10}</span> },
    { label: "Source files", render: () => <Check className="h-4 w-4 text-success" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Compare Items</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Side-by-side comparison of selected items.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 w-44 align-bottom"></th>
              {items.map((i) => (
                <th key={i.id} className="p-3 align-bottom min-w-[220px]">
                  <Card>
                    <CardContent className="p-3">
                      <div
                        className="h-24 w-full rounded flex items-center justify-center text-white font-bold mb-2"
                        style={{ background: coverFor(i.id) }}
                      >
                        {i.title.slice(0, 1)}
                      </div>
                      <Link
                        to="/marketplace/item/$slug"}
                        className="font-semibold text-sm hover:text-primary line-clamp-2 block text-left"
                      >
                        {i.title}
                      </Link>
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-primary hover:bg-primary/90"
                        disabled={addToCartAction.isLoading}
                        onClick={() => void handleAddToCart(i.id)}
                      >
                        Add to cart
                      </Button>
                      <button
                        onClick={() => handleRemove(i.id)}
                        className="text-xs text-muted-foreground mt-2 hover:text-destructive flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    </CardContent>
                  </Card>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b">
                <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                {items.map((i) => (
                  <td key={i.id} className="p-3">
                    {row.render(i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
