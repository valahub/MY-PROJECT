import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, DollarSign, Activity, BarChart3, LineChart, PieChart } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { productsApiService } from "@/lib/products/products-api";
import type { ProductEntity, ProductMetricsEntity } from "@/lib/products/products-schema";

({
  component: ProductAnalyticsPage,
  head: () => ({ meta: [{ title: "Product Analytics — Admin — ERP Vala" }] }),
});

function ProductAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductEntity | null>(null);
  const [metrics, setMetrics] = useState<ProductMetricsEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProduct(id);
      loadAnalytics(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      const res = await productsApiService.getProduct(productId);
      if (res.success && res.data) {
        setProduct(res.data);
      } else {
        toast.error(res.error || "Failed to load product");
      }
    } catch (error) {
      toast.error("Failed to load product");
    }
  };

  const loadAnalytics = async (productId: string) => {
    try {
      const res = await productsApiService.getProductAnalytics(productId);
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (error) {
      console.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Link to="/merchant/products">
          <Button className="mt-4">Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/merchant/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{product.name} - Analytics</h1>
          <p className="text-sm text-muted-foreground">Performance metrics and insights</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.revenue.toFixed(2) || product.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.customers || product.customers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((metrics?.conversionRate || product.conversionRate) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Visitor to customer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((metrics?.churnRate || product.churnRate) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Customer attrition</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Revenue chart visualization</p>
                <p className="text-xs">Data available after first sale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Customer growth chart</p>
                <p className="text-xs">Data available after first signup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Subscriptions</span>
              <span className="font-medium">{metrics?.activeSubscriptions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trial Conversions</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Subscription Value</span>
              <span className="font-medium">${product.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monthly Recurring Revenue</span>
              <span className="font-medium">${(product.revenue * 0.7).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Product Type</span>
              <span className="font-medium capitalize">{product.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{product.status}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Approval Status</span>
              <span className="font-medium capitalize">{product.approvalStatus}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="font-medium">{product.version}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refunds and Returns */}
      <Card>
        <CardHeader>
          <CardTitle>Refunds & Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Refunds</p>
              <p className="text-2xl font-bold">{metrics?.refunds || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Refund Rate</p>
              <p className="text-2xl font-bold">
                {metrics && metrics.customers > 0 
                  ? ((metrics.refunds / metrics.customers) * 100).toFixed(1) + "%"
                  : "0%"
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Refund Amount</p>
              <p className="text-2xl font-bold">${(metrics?.refunds || 0) * product.price * 0.5}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <Link to={`/merchant/products/${product.id}/edit`}>Edit Product</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/paddle/product/${product.id}`}>View Billing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/product/${product.id}`}>View Product Page</Link>
            </Button>
            <Button variant="outline" onClick={() => loadAnalytics(product.id)}>
              <Activity className="h-4 w-4 mr-2" /> Refresh Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductAnalyticsPage;
