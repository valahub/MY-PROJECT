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
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

({
  component: CreatePricingPage,
  head: () => ({ meta: [{ title: "Create Price — Merchant — ERP Vala" }] }),
});

function CreatePricingPage() {
  const navigate = useNavigate();
  const [product, setProduct] = useState("");
  const [billingType, setBillingType] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [interval, setInterval] = useState("");
  const [trialDays, setTrialDays] = useState("0");
  const [enableTierLimits, setEnableTierLimits] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [tiers, setTiers] = useState([
    { from: "0", to: "100", price: "Included" },
    { from: "101", to: "1000", price: "$0.05/unit" },
    { from: "1001", to: "∞", price: "$0.02/unit" },
  ]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!product) e.product = "Select a product";
    if (!billingType) e.billingType = "Select billing type";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = "Enter a valid amount";
    if (billingType === "subscription" && !interval) e.interval = "Select billing interval";
    if (isNaN(Number(trialDays)) || Number(trialDays) < 0) e.trialDays = "Invalid trial days";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreatePrice = async () => {
    if (!validate()) return;
    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Price created successfully");
      navigate({ to: "/merchant/pricing" });
    } catch (error) {
      toast.error("Failed to create price");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddTier = () => {
    setIsAddingTier(true);
    try {
      setTiers([...tiers, { from: "", to: "", price: "" }]);
      toast.success("Tier added");
    } catch (error) {
      toast.error("Failed to add tier");
    } finally {
      setIsAddingTier(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/merchant/pricing">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Price</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pro-plan">Pro Plan</SelectItem>
                <SelectItem value="enterprise">Enterprise License</SelectItem>
                <SelectItem value="starter">Starter Kit</SelectItem>
                <SelectItem value="team">Team Plan</SelectItem>
                <SelectItem value="api">API Add-on</SelectItem>
              </SelectContent>
            </Select>
            {errors.product && <p className="text-xs text-destructive">{errors.product}</p>}
          </div>

          <div className="space-y-2">
            <Label>Billing Type *</Label>
            <Select value={billingType} onValueChange={setBillingType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>
            {errors.billingType && <p className="text-xs text-destructive">{errors.billingType}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="29.00"
                min="0"
                step="0.01"
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                  <SelectItem value="inr">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {billingType === "subscription" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Billing Interval *</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {errors.interval && <p className="text-xs text-destructive">{errors.interval}</p>}
              </div>
              <div className="space-y-2">
                <Label>Trial Period (days)</Label>
                <Input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  min="0"
                />
                {errors.trialDays && <p className="text-xs text-destructive">{errors.trialDays}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Tier Limits</Label>
              <p className="text-xs text-muted-foreground">Set usage-based tier pricing</p>
            </div>
            <Switch checked={enableTierLimits} onCheckedChange={setEnableTierLimits} />
          </div>
          {enableTierLimits && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Usage Tiers</p>
              {tiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <Input defaultValue={tier.from} placeholder="From" />
                  <Input defaultValue={tier.to} placeholder="To" />
                  <Input defaultValue={tier.price} placeholder="Price" />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTier}
                disabled={isAddingTier}
              >
                {isAddingTier ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-3 w-3" />
                )}
                {isAddingTier ? "Adding..." : "Add Tier"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link to="/merchant/pricing">
          <Button variant="outline" disabled={isCreating}>
            Cancel
          </Button>
        </Link>
        <Button onClick={handleCreatePrice} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isCreating ? "Creating..." : "Create Price"}
        </Button>
      </div>
    </div>
  );
}

export default CreatePricingPage;
