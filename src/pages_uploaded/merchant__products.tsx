import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package } from "lucide-react";

({
  component: MerchantProductsPage,
  head: () => ({
    meta: [{ title: "Products — Merchant" }],
  }),
});

function MerchantProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link to="/merchant/products/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Your Catalog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No products yet. Click <strong>New Product</strong> to add your first one.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
