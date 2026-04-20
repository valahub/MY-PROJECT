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
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

({
  component: CreateDiscountPage,
  head: () => ({ meta: [{ title: "Create Discount — Merchant — ERP Vala" }] }),
});

function CreateDiscountPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [hasUsageLimit, setHasUsageLimit] = useState(false);
  const [usageLimit, setUsageLimit] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = "Coupon code is required";
    if (!/^[A-Z0-9_-]+$/i.test(code)) e.code = "Only letters, numbers, hyphens, underscores";
    if (code.length > 30) e.code = "Max 30 characters";
    if (!type) e.type = "Select discount type";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = "Enter a valid amount";
    if (type === "percentage" && Number(amount) > 100) e.amount = "Max 100%";
    if (hasExpiry && !expiryDate) e.expiryDate = "Select expiry date";
    if (hasUsageLimit && (!usageLimit || Number(usageLimit) <= 0))
      e.usageLimit = "Enter valid limit";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateDiscount = async () => {
    if (!validate()) return;
    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Discount created successfully");
      navigate({ to: "/merchant/discounts" });
    } catch (error) {
      toast.error("Failed to create discount");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/merchant/discounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Discount</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discount Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Coupon Code *</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SAVE20"
            />
            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Discount Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={type === "percentage" ? "20" : "50.00"}
                min="0"
                step={type === "percentage" ? "1" : "0.01"}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Apply to Products</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="pro">Pro Plan only</SelectItem>
                <SelectItem value="enterprise">Enterprise only</SelectItem>
                <SelectItem value="starter">Starter Kit only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Set Expiry Date</Label>
              <p className="text-xs text-muted-foreground">Discount expires after date</p>
            </div>
            <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
          </div>
          {hasExpiry && (
            <div className="space-y-2">
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Set Usage Limit</Label>
              <p className="text-xs text-muted-foreground">Max number of redemptions</p>
            </div>
            <Switch checked={hasUsageLimit} onCheckedChange={setHasUsageLimit} />
          </div>
          {hasUsageLimit && (
            <div className="space-y-2">
              <Label>Max Uses *</Label>
              <Input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="500"
                min="1"
              />
              {errors.usageLimit && <p className="text-xs text-destructive">{errors.usageLimit}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link to="/merchant/discounts">
          <Button variant="outline" disabled={isCreating}>
            Cancel
          </Button>
        </Link>
        <Button onClick={handleCreateDiscount} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isCreating ? "Creating..." : "Create Discount"}
        </Button>
      </div>
    </div>
  );
}

export default CreateDiscountPage;
