import { Link } from "react-router-dom";
import { coverFor } from "@/lib/marketplace-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  applyCheckoutCoupon,
  getMarketplaceCart,
  getUiErrorMessage,
  removeMarketplaceCartItem,
  updateMarketplaceCartItemLicense,
  type MarketplaceCartItem,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: CartPage });

function CartPage() {
  const [cart, setCart] = useState<MarketplaceCartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [loadingCart, setLoadingCart] = useState(true);

  const loadCart = async () => {
    setLoadingCart(true);
    try {
      setCart(await getMarketplaceCart());
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Failed to load cart."));
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    void loadCart();
  }, []);

  const updateLicenseAction = useSelfHealingAction(
    async (payload: { itemId: string; license: "regular" | "extended" }, signal) => {
      if (signal.aborted) throw new Error("License update aborted");
      return updateMarketplaceCartItemLicense(payload.itemId, payload.license);
    },
    {
      id: "marketplace-cart-update-license",
      retry: { maxAttempts: 2, backoffMs: 600 },
      onSuccess: (next) => setCart(next),
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not update license.")),
    },
  );

  const removeItemAction = useSelfHealingAction(
    async (payload: { itemId: string }, signal) => {
      if (signal.aborted) throw new Error("Remove action aborted");
      return removeMarketplaceCartItem(payload.itemId);
    },
    {
      id: "marketplace-cart-remove-item",
      retry: { maxAttempts: 2, backoffMs: 600 },
      onSuccess: (next) => setCart(next),
      onError: (error) => toast.error(getUiErrorMessage(error, "Could not remove item.")),
    },
  );

  const applyCouponAction = useSelfHealingAction(
    async (payload: { code: string }, signal) => {
      if (signal.aborted) throw new Error("Coupon action aborted");
      return applyCheckoutCoupon(payload.code);
    },
    {
      id: "marketplace-cart-apply-coupon",
      retry: { maxAttempts: 2, backoffMs: 600 },
      onSuccess: ({ code, coupon: discount }) =>
        toast.success(`Applied ${code} (${discount.label})`),
      onError: (error) => toast.error(getUiErrorMessage(error, "Coupon validation failed.")),
    },
  );

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + (i.license === "extended" ? i.price * 10 : i.price), 0),
    [cart],
  );
  const fee = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + fee;

  const remove = async (id: string) => {
    await removeItemAction.trigger({ itemId: id });
  };

  const setLicense = async (id: string, lic: "regular" | "extended") => {
    await updateLicenseAction.trigger({ itemId: id, license: lic });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart ({cart.length})</h1>

      {loadingCart ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Loading cart...
          </CardContent>
        </Card>
      ) : cart.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Link to="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cart.map((item) => (
              <Card key={item.itemId}>
                <CardContent className="p-4 flex gap-4">
                  <div
                    className="h-20 w-28 rounded flex-shrink-0 flex items-center justify-center text-white font-bold"
                    style={{ background: coverFor(item.itemId) }}
                  >
                    {item.title.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <Link
                      to={`/marketplace/item/${item.itemId}`}
                      className="font-semibold hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">by {item.author}</div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <button
                        onClick={() => setLicense(item.itemId, "regular")}
                        className={`px-2 py-1 rounded border ${item.license === "regular" ? "bg-primary text-white border-primary" : "border-border"}`}
                      >
                        Regular ${item.price}
                      </button>
                      <button
                        onClick={() => setLicense(item.itemId, "extended")}
                        className={`px-2 py-1 rounded border ${item.license === "extended" ? "bg-primary text-white border-primary" : "border-border"}`}
                      >
                        Extended ${item.price * 10}
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-between">
                    <div className="font-bold">
                      ${item.license === "extended" ? item.price * 10 : item.price}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(item.itemId)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Handling fee (10%)</span>
                  <span>${fee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={applyCouponAction.isLoading}
                  onClick={() => void applyCouponAction.trigger({ code: coupon })}
                >
                  Apply
                </Button>
              </div>
              <Link to="/marketplace/checkout" className="block mt-4">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Proceed to Checkout
                </Button>
              </Link>
              <Link to="/marketplace" className="block mt-2">
                <Button variant="ghost" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default CartPage;
