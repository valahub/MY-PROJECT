
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
import { LogoText } from "@/components/Logo";
import { useMemo, useState } from "react";
import { CreditCard, Lock, Tag, Check, Globe, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  applyCheckoutCoupon,
  getUiErrorMessage,
  processCheckoutPayment,
} from "@/lib/ui-actions-api";

({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — ERP Vala" },
      { name: "description", content: "Complete your purchase with ERP Vala" },
    ],
  }),
});

// Geo pricing & currency table
const COUNTRIES = [
  {
    code: "US",
    name: "United States",
    currency: "USD",
    symbol: "$",
    rate: 1,
    taxRate: 0,
    taxLabel: "Sales Tax",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    symbol: "£",
    rate: 0.79,
    taxRate: 0.2,
    taxLabel: "VAT",
  },
  {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    symbol: "€",
    rate: 0.92,
    taxRate: 0.19,
    taxLabel: "VAT",
  },
  {
    code: "FR",
    name: "France",
    currency: "EUR",
    symbol: "€",
    rate: 0.92,
    taxRate: 0.2,
    taxLabel: "VAT",
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    symbol: "₹",
    rate: 83,
    taxRate: 0.18,
    taxLabel: "GST",
  },
  {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    symbol: "A$",
    rate: 1.52,
    taxRate: 0.1,
    taxLabel: "GST",
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    symbol: "C$",
    rate: 1.36,
    taxRate: 0.13,
    taxLabel: "HST",
  },
  {
    code: "JP",
    name: "Japan",
    currency: "JPY",
    symbol: "¥",
    rate: 149,
    taxRate: 0.1,
    taxLabel: "Tax",
  },
];

// Geo pricing tiers — emerging markets get discount
const GEO_DISCOUNT: Record<string, number> = { IN: 0.5, BR: 0.6, MX: 0.6 };

const BASE_PRICE_USD = 29;

function CheckoutPage() {
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [country, setCountry] = useState("US");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [appliedCouponLabel, setAppliedCouponLabel] = useState<string | null>(null);
  const [appliedCheckoutCoupon, setAppliedCheckoutCoupon] = useState<{
    type: "percentage" | "flat";
    value: number;
    label: string;
  } | null>(null);

  const geo = COUNTRIES.find((c) => c.code === country)!;

  // Geo pricing
  const localBase = useMemo(() => {
    const geoDiscount = GEO_DISCOUNT[country] ?? 1;
    return BASE_PRICE_USD * geoDiscount * geo.rate;
  }, [country, geo.rate]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const c = appliedCheckoutCoupon;
    if (!c) return 0;
    if (c.type === "percentage") return localBase * (c.value / 100);
    return c.value * geo.rate;
  }, [appliedCheckoutCoupon, appliedCoupon, localBase, geo.rate]);

  const subtotal = Math.max(0, localBase - couponDiscount);
  const tax = subtotal * geo.taxRate;
  const total = subtotal + tax;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: geo.currency,
      maximumFractionDigits: geo.currency === "JPY" || geo.currency === "INR" ? 0 : 2,
    }).format(n);

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

  const validatePayment = () => {
    const e: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, "");
    if (!digits) e.cardNumber = "Required";
    else if (!/^\d{13,19}$/.test(digits)) e.cardNumber = "Invalid card number";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) e.expiry = "MM/YY format";
    else {
      const [mm, yy] = expiry.split("/").map(Number);
      if (mm < 1 || mm > 12) e.expiry = "Invalid month";
      const now = new Date();
      const exp = new Date(2000 + yy, mm - 1, 1);
      if (exp < new Date(now.getFullYear(), now.getMonth(), 1)) e.expiry = "Card expired";
    }
    if (!/^\d{3,4}$/.test(cvc)) e.cvc = "3-4 digits";
    if (!cardName.trim()) e.cardName = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyCoupon = async () => {
    if (couponLoading) return;
    setCouponLoading(true);
    try {
      const { code, coupon } = await applyCheckoutCoupon(couponInput);
      setAppliedCoupon(code);
      setAppliedCheckoutCoupon(coupon);
      setAppliedCouponLabel(coupon.label);
      toast.success(`Coupon applied: ${coupon.label}`);
    } catch (error) {
      toast.error(getUiErrorMessage(error, "Coupon validation failed."));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCheckoutCoupon(null);
    setAppliedCouponLabel(null);
    setCouponInput("");
    toast.info("Coupon removed");
  };

  const formatCardNumber = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 19)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handlePay = async () => {
    if (processing) return;
    setPaymentError(null);
    if (!validatePayment()) return;
    setProcessing(true);
    try {
      const result = await processCheckoutPayment({
        cardNumber,
        email,
        amount: total,
        currency: geo.currency,
      });
      setOrderId(result.orderId);
      setProcessing(false);
      setStep("success");
    } catch (error) {
      setProcessing(false);
      setPaymentError(getUiErrorMessage(error, "Payment failed. Please retry."));
      toast.error(getUiErrorMessage(error, "Payment failed. Please retry."));
    }
  };

  if (step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold">Payment Successful!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your subscription to Pro Plan is now active.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Confirmation sent to {email || "your email"}.
            </p>
            <div className="mt-6 rounded-md bg-muted p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="text-sm font-mono font-medium">
                {orderId || `ORD-${Date.now().toString().slice(-8)}`}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Amount Charged</p>
              <p className="text-sm font-semibold">{fmt(total)}</p>
            </div>
            <Button
              className="mt-6 w-full"
              onClick={() => {
                setStep("details");
                setAppliedCoupon(null);
                setAppliedCheckoutCoupon(null);
                setAppliedCouponLabel(null);
                setCouponInput("");
              }}
            >
              Return to Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <LogoText />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Secure Checkout
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b bg-card/50 px-6 py-2">
        <div className="mx-auto flex max-w-4xl items-center gap-2 text-xs">
          <span
            className={step === "details" ? "font-semibold text-primary" : "text-muted-foreground"}
          >
            1. Details
          </span>
          <span className="text-muted-foreground">→</span>
          <span
            className={step === "payment" ? "font-semibold text-primary" : "text-muted-foreground"}
          >
            2. Payment
          </span>
          <span className="text-muted-foreground">→</span>
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
                  <div className="flex items-center gap-2 rounded-md border p-3 bg-primary/5">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Credit / Debit Card</span>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Card Number *</Label>
                      <Input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="4242 4242 4242 4242"
                      />
                      {errors.cardNumber && (
                        <p className="text-xs text-destructive">{errors.cardNumber}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry *</Label>
                        <Input
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                        />
                        {errors.expiry && (
                          <p className="text-xs text-destructive">{errors.expiry}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>CVC *</Label>
                        <Input
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="123"
                        />
                        {errors.cvc && <p className="text-xs text-destructive">{errors.cvc}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Name on Card *</Label>
                      <Input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                      />
                      {errors.cardName && (
                        <p className="text-xs text-destructive">{errors.cardName}</p>
                      )}
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
                      <span className="text-xs text-muted-foreground">— {appliedCouponLabel}</span>
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
                      disabled={couponLoading}
                    >
                      {couponLoading ? (
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
                <Button variant="outline" onClick={() => setStep("details")} disabled={processing}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => void handlePay()} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    `Pay ${fmt(total)}`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="w-full md:w-80">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Pro Plan</p>
                <p className="text-sm text-muted-foreground">Monthly subscription</p>
                {GEO_DISCOUNT[country] && (
                  <p className="mt-1 text-xs text-info">🌍 Geo pricing applied for {geo.name}</p>
                )}
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
                    <span>−{fmt(couponDiscount)}</span>
                  </div>
                )}
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
                Billed monthly in {geo.currency}. Cancel anytime. 14-day free trial included.
              </p>
              <div className="rounded-md bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Powered by</p>
                <p className="text-sm font-semibold">ERP Vala</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
