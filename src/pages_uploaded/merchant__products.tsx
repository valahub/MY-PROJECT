import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, Search, Filter, Eye, Edit, Settings, CreditCard, BarChart3, Users, Receipt, Copy, Archive, Trash2, MoreHorizontal, Check, Clock, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { productsApiService } from "@/lib/products/products-api";
import type { ProductEntity, ProductStatus, ProductType, ApprovalStatus } from "@/lib/products/products-schema";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

({
  component: MerchantProductsPage,
  head: () => ({
    meta: [{ title: "Products — Merchant" }],
  }),
});

function MerchantProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productsApiService.getProducts(user?.id);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleArchive = async (productId: string) => {
    if (!user) return;
    try {
      const res = await productsApiService.archiveProduct(productId, user.id);
      if (res.success) {
        toast.success("Product archived");
        loadProducts();
      } else {
        toast.error(res.error || "Failed to archive product");
      }
    } catch (error) {
      toast.error("Failed to archive product");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await productsApiService.deleteProduct(productId, user.id);
      if (res.success) {
        toast.success("Product deleted");
        loadProducts();
      } else {
        toast.error(res.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleClone = async (productId: string) => {
    if (!user) return;
    try {
      const res = await productsApiService.cloneProduct(productId, user.id);
      if (res.success) {
        toast.success("Product cloned");
        loadProducts();
      } else {
        toast.error(res.error || "Failed to clone product");
      }
    } catch (error) {
      toast.error("Failed to clone product");
    }
  };

  const handleBulkArchive = async () => {
    if (!user || selectedProducts.size === 0) return;
    try {
      const res = await productsApiService.bulkUpdateStatus(Array.from(selectedProducts), "archived");
      if (res.success) {
        toast.success("Products archived");
        setSelectedProducts(new Set());
        loadProducts();
      } else {
        toast.error(res.error || "Failed to archive products");
      }
    } catch (error) {
      toast.error("Failed to archive products");
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedProducts.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) return;
    try {
      const res = await productsApiService.bulkDelete(Array.from(selectedProducts), user.id);
      if (res.success) {
        toast.success("Products deleted");
        setSelectedProducts(new Set());
        loadProducts();
      } else {
        toast.error(res.error || "Failed to delete products");
      }
    } catch (error) {
      toast.error("Failed to delete products");
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    const matchesType = typeFilter === "all" || product.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Active</Badge>;
      case "draft":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
      case "archived":
        return <Badge variant="outline"><Archive className="h-3 w-3 mr-1" /> Archived</Badge>;
    }
  };

  const getApprovalBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const getTypeBadge = (type: ProductType) => {
    switch (type) {
      case "subscription":
        return <Badge variant="outline">Subscription</Badge>;
      case "one-time":
        return <Badge variant="outline">One-time</Badge>;
      case "license":
        return <Badge variant="outline">License</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <Link to="/merchant/products/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProductStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ProductType | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="license">License</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedProducts.size} products selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                  <Archive className="h-4 w-4 mr-1" /> Archive
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Your Catalog ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "No products match your filters"
                  : "No products yet. Click <strong>New Product</strong> to add your first one."}
              </p>
              {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
                <Link to="/merchant/products/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Product
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">
                      <Checkbox
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Approval</th>
                    <th className="text-left p-4">Price</th>
                    <th className="text-left p-4">Revenue</th>
                    <th className="text-left p-4">Customers</th>
                    <th className="text-left p-4">Version</th>
                    <th className="text-left p-4">Last Updated</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.description.slice(0, 50)}...</div>
                        </div>
                      </td>
                      <td className="p-4">{getTypeBadge(product.type)}</td>
                      <td className="p-4">{getStatusBadge(product.status)}</td>
                      <td className="p-4">{getApprovalBadge(product.approvalStatus)}</td>
                      <td className="p-4">${product.price.toFixed(2)}</td>
                      <td className="p-4">${product.revenue.toFixed(2)}</td>
                      <td className="p-4">{product.customers}</td>
                      <td className="p-4">{product.version}</td>
                      <td className="p-4">{new Date(product.updatedAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/product/${product.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/merchant/products/${product.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/paddle/product/${product.id}`)}>
                              <CreditCard className="h-4 w-4 mr-2" /> Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/products/${product.id}/analytics`)}>
                              <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/paddle/product/${product.id}/subscriptions`)}>
                              <Users className="h-4 w-4 mr-2" /> Subscriptions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/paddle/product/${product.id}/transactions`)}>
                              <Receipt className="h-4 w-4 mr-2" /> Transactions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleClone(product.id)}>
                              <Copy className="h-4 w-4 mr-2" /> Clone
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchive(product.id)}>
                              <Archive className="h-4 w-4 mr-2" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MerchantProductsPage;
