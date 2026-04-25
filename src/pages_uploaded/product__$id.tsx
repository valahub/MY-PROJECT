import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Star, Download, ShieldCheck, Calendar, Tag, Users, CreditCard, BarChart3, MessageSquare, FileText, Settings, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { productsApiService } from "@/lib/products/products-api";
import type { ProductEntity, ProductPlanEntity } from "@/lib/products/products-schema";
import { useAuth } from "@/contexts/AuthContext";

({
  component: ProductDetailPage,
  head: () => ({ meta: [{ title: "Product Detail — ERP Vala" }] }),
});

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductEntity | null>(null);
  const [plans, setPlans] = useState<ProductPlanEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ProductPlanEntity | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct(id);
      loadPlans(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    setIsLoading(true);
    try {
      const res = await productsApiService.getProduct(productId);
      if (res.success && res.data) {
        setProduct(res.data);
        setSelectedPlan(null);
      } else {
        toast.error(res.error || "Failed to load product");
        navigate("/marketplace");
      }
    } catch (error) {
      toast.error("Failed to load product");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async (productId: string) => {
    try {
      const res = await productsApiService.getProductPlans(productId);
      if (res.success && res.data) {
        setPlans(res.data);
        if (res.data.length > 0) {
          setSelectedPlan(res.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load plans");
    }
  };

  const handlePurchase = () => {
    if (!user) {
      toast.error("Please log in to purchase");
      navigate("/auth/login");
      return;
    }
    // Redirect to Paddle checkout
    if (selectedPlan) {
      window.location.href = `https://checkout.paddle.com/checkout/${selectedPlan.paddlePriceId}`;
    } else if (product) {
      window.location.href = `https://checkout.paddle.com/checkout/${product.paddlePriceId}`;
    }
  };

  const handleDownload = () => {
    if (!user) {
      toast.error("Please log in to download");
      return;
    }
    // Check if user has purchased or has active subscription
    // For now, just show a message
    toast.info("Download access requires a valid purchase or subscription");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Link to="/marketplace">
          <Button className="mt-4">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const canDownload = user && (product.visibility === "public" || product.merchantId === user.id);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/marketplace">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-sm text-muted-foreground">Version {product.version}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="outline">{product.type}</Badge>
                <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status}</Badge>
                <Badge variant={product.approvalStatus === "approved" ? "default" : product.approvalStatus === "rejected" ? "destructive" : "secondary"}>
                  {product.approvalStatus}
                </Badge>
              </div>
              <p className="text-muted-foreground">{product.description}</p>
              {product.demoUrl && (
                <Button variant="outline" asChild>
                  <a href={product.demoUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> View Demo
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="features">
            <TabsList>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>
            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  {plans.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {plans.map((plan) => (
                        <Card key={plan.id} className={selectedPlan?.id === plan.id ? "border-primary" : ""}>
                          <CardHeader>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <p className="text-2xl font-bold">${plan.price.toFixed(2)}/{plan.billingCycle}</p>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 mb-4">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="text-sm">• {feature}</li>
                              ))}
                            </ul>
                            <Button
                              className="w-full"
                              onClick={() => setSelectedPlan(plan)}
                              variant={selectedPlan?.id === plan.id ? "default" : "outline"}
                            >
                              {selectedPlan?.id === plan.id ? "Selected" : "Select Plan"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No additional plans available</p>
                      <p className="text-2xl font-bold">${product.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">One-time purchase</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="changelog" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary pl-4">
                      <p className="font-medium">v{product.version}</p>
                      <p className="text-sm text-muted-foreground">{new Date(product.updatedAt).toLocaleDateString()}</p>
                      <p className="text-sm mt-1">Current version</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="support" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Support Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.supportEmail && (
                    <div>
                      <p className="text-sm font-medium">Support Email</p>
                      <p className="text-sm text-muted-foreground">{product.supportEmail}</p>
                    </div>
                  )}
                  {product.documentationUrl && (
                    <div>
                      <p className="text-sm font-medium">Documentation</p>
                      <Button variant="link" asChild className="p-0 h-auto">
                        <a href={product.documentationUrl} target="_blank" rel="noopener noreferrer">
                          View Documentation
                        </a>
                      </Button>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Support Duration</p>
                    <p className="text-sm text-muted-foreground">Included with purchase</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold">
                  ${selectedPlan ? selectedPlan.price.toFixed(2) : product.price.toFixed(2)}
                  {selectedPlan && <span className="text-sm font-normal">/{selectedPlan.billingCycle}</span>}
                </p>
              </div>
              {product.trialDays > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {product.trialDays} days free trial
                  </p>
                </div>
              )}
              <Button className="w-full" onClick={handlePurchase}>
                <CreditCard className="h-4 w-4 mr-2" /> Purchase Now
              </Button>
              {canDownload && (
                <Button variant="outline" className="w-full" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="font-medium">{product.customers}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="font-medium">${product.revenue.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user && product.merchantId === user.id && (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/merchant/products/${product.id}/edit`}>
                      <Settings className="h-4 w-4 mr-2" /> Edit Product
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/admin/products/${product.id}/analytics`}>
                      <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                    </Link>
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/paddle/product/${product.id}`}>
                  <CreditCard className="h-4 w-4 mr-2" /> Billing
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
