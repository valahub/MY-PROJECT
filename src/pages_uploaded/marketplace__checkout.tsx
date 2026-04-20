import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { Lock, Tag, Check, Globe, Loader2, QrCode, ExternalLink, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  applyCheckoutCoupon,
  getMarketplaceCart,
  getUiErrorMessage,
  verifyWiseCheckoutPayment,
  type MarketplaceCartItem,
} from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";
import {
  BINANCE_PAY_ID,
  PAYMENT_DISPLAY_IDENTITY,
  WISE_PAYMENT_LINK,
  getWiseQrSrc,
} from "@/lib/payment-config";
import { validateWiseVerificationInputs } from "@/lib/payment-validation";
import { coverFor } from "@/lib/marketplace-data";

({
  component: MarketplaceCheckout,
  head: () => ({
    meta: [
      { title: "Marketplace Checkout - ERP Vala" },
      { name: "description", content: "Complete your marketplace purchase" },
    ],
  }),
});

const COUNTRIES = [
  {
    code: "US",
    name: "United States",
    currency: "USD",
    rate: 1,
    taxRate: 0,
    taxLabel: "Sales Tax",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    rate: 0.79,
    taxRate: 0.2,
    taxLabel: "VAT",
  },
  { code: "DE", name: "Germany", currency: "EUR", rate: 0.92, taxRate: 0.19, taxLabel: "VAT" },
  { code: "FR", name: "France", currency: "EUR", rate: 0.92, taxRate: 0.2, taxLabel: "VAT" },
  { code: "IN", name: "India", currency: "INR", rate: 83, taxRate: 0.18, taxLabel: "GST" },
  { code: "AU", name: "Australia", currency: "AUD", rate: 1.52, taxRate: 0.1, taxLabel: "GST" },
  { code: "CA", name: "Canada", currency: "CAD", rate: 1.36, taxRate: 0.13, taxLabel: "HST" },
  { code: "JP", name: "Japan", currency: "JPY", rate: 149, taxRate: 0.1, taxLabel: "Tax" },
];

const GEO_DISCOUNT: Record<string, number> = { IN: 0.5, BR: 0.6, MX: 0.6 };

function MarketplaceCheckout() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [country, setCountry] = useState("US");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [appliedCouponLabel, setAppliedCouponLabel] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [verificationNote, setVerificationNote] = useState<string | null>(null);
  const [cart, setCart] = useState<MarketplaceCartItem[]>([]);
  const [appliedCheckoutCoupon, setAppliedCheckoutCoupon] = useState<{
    type: "percentage" | "flat";
    value: number;
    label: string;
  } | null>(null);

  const geo = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + (i.license === "extended" ? i.price * 10 : i.price), 0),
    [cart],
  );

  const localBase = useMemo(() => {
    const geoDiscount = GEO_DISCOUNT[country] ?? 1;
    return subtotal * geoDiscount * geo.rate;
  }, [subtotal, country, geo.rate]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || !appliedCheckoutCoupon) return 0;
    if (appliedCheckoutCoupon.type === "percentage") {
      return localBase * (appliedCheckoutCoupon.value / 100);
    }
    return appliedCheckoutCoupon.value * geo.rate;
  }, [appliedCheckoutCoupon, appliedCoupon, localBase, geo.rate]);

  const afterDiscount = Math.max(0, localBase - couponDiscount);
  const fee = Math.round(afterDiscount * 0.1 * 100) / 100;
  const tax = afterDiscount * geo.taxRate;
  const total = afterDiscount + fee + tax;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: geo.currency,
      maximumFractionDigits: geo.currency === "JPY" || geo.currency === "INR" ? 0 : 2,
    }).format(n);

  const wiseQrSrc = useMemo(() => getWiseQrSrc(Math.round(total)), [total]);

  useEffect(() => {
    let mounted = true;
    void getMarketplaceCart()
      .then((items) => {
        if (!mounted) return;
        if (items.length > 0) {
          setCart(items);
        } else {
          toast.error("Your cart is empty");
          navigate("/marketplace");
        }
      })
      .catch((error) => {
        toast.error(getUiErrorMessage(error, "Failed to load your cart."));
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const couponAction = useSelfHealingAction(
    async (payload: { code: string }, signal) => {
      if (signal.aborted) throw new Error("Coupon action aborted");
      return applyCheckoutCoupon(payload.code);
    },
    {
      id: "marketplace-checkout-apply-coupon",
      timeoutMs: 10_000,
      retry: { maxAttempts: 2, backoffMs: 700 },
      onSuccess: ({ code, coupon }) => {
        setAppliedCoupon(code);
        setAppliedCheckoutCoupon(coupon);
        setAppliedCouponLabel(coupon.label);
        toast.success(`Coupon applied: ${coupon.label}`);
      },
      onError: (error) => {
        toast.error(getUiErrorMessage(error, "Coupon validation failed."));
      },
    },
  );

  const verifyWiseAction = useSelfHealingAction(
    async (
      payload: {
        reference: string;
        proof: string;
        email: string;
        amount: number;
        currency: string;
      },
      signal,
    ) => {
      if (signal.aborted) throw new Error("Wise verification action aborted");
      return verifyWiseCheckoutPayment(payload);
    },
    {
      id: "marketplace-checkout-verify-wise-payment",
      timeoutMs: 15_000,
      retry: { maxAttempts: 2, backoffMs: 800 },
      onSuccess: (result) => {
        setOrderId(result.orderId);
        setVerificationNote(
          `Reference ${result.reference} verified. Order activated and downloads unlocked.`,
        );
        setStep("success");
      },
      onError: (error) => {
        const message = getUiErrorMessage(error, "Payment verification failed. Please retry.");
        setPaymentError(message);
        toast.error(message);
      },
    },
  );

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    if (!email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    if (!zip.trim()) e.zip = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateWiseVerification = () => {
    const e = validateWiseVerificationInputs(transactionReference, paymentProof);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyCoupon = async () => {
    if (couponAction.isLoading) return;
    await couponAction.trigger({ code: couponInput });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCheckoutCoupon(null);
    setAppliedCouponLabel(null);
    setCouponInput("");
    toast.info("Coupon removed");
  };

  const handleWiseVerification = async () => {
    if (verifyWiseAction.isLoading) return;
    setPaymentError(null);
    if (!validateWiseVerification()) return;
    await verifyWiseAction.trigger({
      reference: transactionReference,
      proof: paymentProof,
      email,
      amount: total,
      currency: geo.currency,
    });
  };

  if (step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold">Payment Verified!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your marketplace purchase is complete.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {verificationNote || "Order activated and downloads unlocked."}
            </p>
            <div className="mt-6 rounded-md bg-muted p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="text-sm font-mono font-medium">
                {orderId || `MKT-${Date.now().toString().slice(-8)}`}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Amount Verified</p>
              <p className="text-sm font-semibold">{fmt(total)}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <Link to="/customer/marketplace-downloads" className="flex-1">
                <Button className="w-full">View Downloads</Button>
              </Link>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/marketplace")}
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/marketplace" className="font-semibold text-lg">
            ERP Vala Marketplace
          </Link>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Secure Checkout
          </div>
        </div>
      </header>

      <div className="border-b bg-card/50 px-6 py-2">
        <div className="mx-auto flex max-w-4xl items-center gap-2 text-xs">
          <span
            className={step === "details" ? "font-semibold text-primary" : "text-muted-foreground"}
          >
            1. Details
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span
            className={step === "payment" ? "font-semibold text-primary" : "text-muted-foreground"}
          >
            2. Payment
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className="text-muted-foreground">3. Confirmation</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-4 md:flex-row md:p-8">
        <div className="flex-1 space-y-6">
          {step === "details" && (
            <>
              <h2 className="text-lg font-semibold">Your Details</h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name} ({c.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Pricing in {geo.currency}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP / Postal Code *</Label>
                    <Input
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="10001"
                    />
                    {errors.zip && <p className="text-xs text-destructive">{errors.zip}</p>}
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => validateDetails() && setStep("payment")}>
                Continue to Payment
              </Button>
            </>
          )}

          {step === "payment" && (
            <>
              <h2 className="text-lg font-semibold">Payment Method</h2>
              <Card>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 p-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <span className="text-sm font-medium">Wise (Primary Payment Option)</span>
                    </div>
                    <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      PRIMARY
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                    <div className="rounded-md border p-3 text-center">
                      <img
                        src={wiseQrSrc}
                        alt="Wise payment QR code"
                        className="mx-auto h-[200px] w-[200px] rounded-md border"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">Scan to pay via Wise</p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Wise payment link</Label>
                        <a
                          href={WISE_PAYMENT_LINK}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                        >
                          <ExternalLink className="h-4 w-4" /> {WISE_PAYMENT_LINK}
                        </a>
                      </div>

                      <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                        <p className="font-medium">Visible payout identity</p>
                        <p>Account Name: {PAYMENT_DISPLAY_IDENTITY.accountName}</p>
                        <p>Bank Name: {PAYMENT_DISPLAY_IDENTITY.bankName}</p>
                        <p>Account Number: {PAYMENT_DISPLAY_IDENTITY.accountNumberMasked}</p>
                        <p>IFSC: {PAYMENT_DISPLAY_IDENTITY.ifscMasked}</p>
                        <p>Branch Details: {PAYMENT_DISPLAY_IDENTITY.branchDetailsMasked}</p>
                      </div>

                      <div className="rounded-md border border-info/40 bg-info/10 p-3 text-xs text-muted-foreground">
                        Use Wise link or QR to pay without exposing sensitive banking data.
                      </div>
                      <div className="rounded-md border border-amber-400/40 bg-amber-100/40 p-3 text-xs text-muted-foreground">
                        For all crypto payments, use Binance ID:{" "}
                        <span className="font-semibold text-foreground">{BINANCE_PAY_ID}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Transaction reference *</Label>
                      <Input
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        placeholder="Example: WISE-TXN-123456"
                      />
                      {errors.transactionReference && (
                        <p className="text-xs text-destructive">{errors.transactionReference}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Payment proof (link / screenshot ID) *</Label>
                      <Input
                        value={paymentProof}
                        onChange={(e) => setPaymentProof(e.target.value)}
                        placeholder="Paste proof URL or reference"
                      />
                      {errors.paymentProof && (
                        <p className="text-xs text-destructive">{errors.paymentProof}</p>
                      )}
                    </div>
                    <div className="rounded-md border border-success/40 bg-success/10 p-3 text-xs">
                      <div className="flex items-center gap-1 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" /> Post-payment workflow
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        Pay on Wise &rarr; submit proof/reference &rarr; verify payment &rarr;
                        activate order & unlock downloads.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Discount Code</Label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/10 p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">{appliedCoupon}</span>
                      <span className="text-xs text-muted-foreground">- {appliedCouponLabel}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeCoupon}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Try SAVE20, WELCOME10, FLAT5"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void applyCoupon();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => void applyCoupon()}
                      disabled={couponAction.isLoading}
                    >
                      {couponAction.isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Tag className="mr-1 h-3 w-3" />
                      )}
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {paymentError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {paymentError}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  disabled={verifyWiseAction.isLoading}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => void handleWiseVerification()}
                  disabled={verifyWiseAction.isLoading}
                >
                  {verifyWiseAction.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    `Verify Payment & Activate Order (${fmt(total)})`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="w-full md:w-80">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.itemId} className="flex gap-3">
                    <div
                      className="h-12 w-16 rounded flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                      style={{ background: coverFor(item.itemId) }}
                    >
                      {item.title.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.license} license</div>
                    </div>
                    <div className="text-sm font-semibold">
                      ${item.license === "extended" ? item.price * 10 : item.price}
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{fmt(localBase)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount ({appliedCoupon})</span>
                    <span>-{fmt(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Handling fee (10%)</span>
                  <span>{fmt(fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    {geo.taxLabel} ({(geo.taxRate * 100).toFixed(0)}%)
                  </span>
                  <span>{fmt(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                By completing this purchase, you agree to the ERP Vala Marketplace terms. All sales
                are final unless refund is approved.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceCheckout;