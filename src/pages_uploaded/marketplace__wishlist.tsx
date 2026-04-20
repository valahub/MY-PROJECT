import { Link } from "react-router-dom";
import { coverFor } from "@/lib/marketplace-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  addMarketplaceCartItem,
  getMarketplaceWishlist,
  getUiErrorMessage,
  removeMarketplaceWishlistItem,
  type MarketplaceWishlistItem,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: Wishlist });

function Wishlist() {
  const [items, setItems] = useState<MarketplaceWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      setItems(await getMarketplaceWishlist());
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Failed to load wishlist."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWishlist();
  }, []);

  const removeAction = useSelfHealingAction(
    async (payload: { itemId: string }, signal) => {
      if (signal.aborted) throw new Error("Remove wishlist action aborted");
      return removeMarketplaceWishlistItem(payload.itemId);
    },
    {
      id: "marketplace-wishlist-remove-item",
      retry: { maxAttempts: 2, backoffMs: 600 },
      onSuccess: (next) => {
        setItems(next);
        toast.success("Removed from wishlist");
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not remove wishlist item.")),
    },
  );

  const addToCartAction = useSelfHealingAction(
    async (payload: { itemId: string }, signal) => {
      if (signal.aborted) throw new Error("Add to cart from wishlist aborted");
      await addMarketplaceCartItem(payload.itemId, "regular");
      return removeMarketplaceWishlistItem(payload.itemId);
    },
    {
      id: "marketplace-wishlist-add-to-cart",
      retry: { maxAttempts: 2, backoffMs: 600 },
      onSuccess: (next) => {
        setItems(next);
        toast.success("Added to cart");
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not add this item to cart.")),
    },
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <h1 className="text-2xl font-bold">My Wishlist ({items.length})</h1>
      </div>
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">Loading wishlist...</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
            <Link to="/marketplace">
              <Button>Browse items</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((i) => (
            <Card key={i.itemId}>
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="h-16 w-24 rounded flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: coverFor(i.itemId) }}
                >
                  {i.title.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to="/marketplace/item/$slug"
                    className="font-semibold hover:text-primary"
                  >
                    {i.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    by {i.author} · {i.rating} ★ ({i.reviews})
                  </div>
                </div>
                <div className="font-bold">${i.price}</div>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  disabled={addToCartAction.isLoading || removeAction.isLoading}
                  onClick={() => void addToCartAction.trigger({ itemId: i.itemId })}
                >
                  <ShoppingCart className="h-3 w-3 mr-1" /> Add to cart
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={addToCartAction.isLoading || removeAction.isLoading}
                  onClick={() => void removeAction.trigger({ itemId: i.itemId })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
