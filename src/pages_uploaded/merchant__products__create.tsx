import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { productsApiService } from "@/lib/products/products-api";
import type { ProductCreateInput, ProductType, ProductStatus, ProductVisibility, BillingCycle } from "@/lib/products/products-schema";
import { useAuth } from "@/contexts/AuthContext";

({
  component: CreateProductPage,
  head: () => ({ meta: [{ title: "Create Product — Merchant — ERP Vala" }] }),
});

function CreateProductPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "subscription" as ProductType,
    status: "draft" as ProductStatus,
    visibility: "private" as ProductVisibility,
    paddleProductId: "",
    paddlePriceId: "",
    price: 0,
    currency: "USD",
    trialDays: 0,
    features: [] as string[],
    demoUrl: "",
    documentationUrl: "",
    supportEmail: "",
  });
  
  const [featureInput, setFeatureInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Product name is required";
    if (!formData.paddleProductId) e.paddleProductId = "Paddle Product ID is required";
    if (!formData.paddlePriceId) e.paddlePriceId = "Paddle Price ID is required";
    if (formData.price < 0) e.price = "Price must be positive";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const input: ProductCreateInput = {
        name: formData.name,
        description: formData.description,
        merchantId: user.id,
        type: formData.type,
        status: formData.status,
        visibility: formData.visibility,
        paddleProductId: formData.paddleProductId,
        paddlePriceId: formData.paddlePriceId,
        price: formData.price,
        currency: formData.currency,
        trialDays: formData.trialDays,
        features: formData.features,
        demoUrl: formData.demoUrl,
        documentationUrl: formData.documentationUrl,
        supportEmail: formData.supportEmail,
      };

      const res = await productsApiService.createProduct(input);
      if (res.success) {
        toast.success("Product created successfully");
        navigate("/merchant/products");
      } else {
        toast.error(res.error || "Failed to create product");
      }
    } catch (error) {
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/merchant/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Product</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Product Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. CRM Pro"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Product description..."
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Product Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as ProductType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as ProductStatus }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visibility *</Label>
            <Select 
              value={formData.visibility} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, visibility: v as ProductVisibility }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paddle Integration (Required)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Paddle Product ID *</Label>
            <Input
              value={formData.paddleProductId}
              onChange={(e) => setFormData(prev => ({ ...prev, paddleProductId: e.target.value }))}
              placeholder="prod_1234567890"
            />
            {errors.paddleProductId && <p className="text-xs text-destructive">{errors.paddleProductId}</p>}
          </div>

          <div className="space-y-2">
            <Label>Paddle Price ID *</Label>
            <Input
              value={formData.paddlePriceId}
              onChange={(e) => setFormData(prev => ({ ...prev, paddlePriceId: e.target.value }))}
              placeholder="price_1234567890"
            />
            {errors.paddlePriceId && <p className="text-xs text-destructive">{errors.paddlePriceId}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Price ($) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="29.99"
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label>Currency *</Label>
              <Input
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                placeholder="USD"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Trial Days</Label>
            <Input
              type="number"
              min="0"
              value={formData.trialDays}
              onChange={(e) => setFormData(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 0 }))}
              placeholder="14"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="Add a feature..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <Button type="button" onClick={addFeature}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{feature}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFeature(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Demo URL</Label>
            <Input
              value={formData.demoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
              placeholder="https://demo.example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Documentation URL</Label>
            <Input
              value={formData.documentationUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, documentationUrl: e.target.value }))}
              placeholder="https://docs.example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input
              type="email"
              value={formData.supportEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, supportEmail: e.target.value }))}
              placeholder="support@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link to="/merchant/products">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </div>
  );
}

export default CreateProductPage;
