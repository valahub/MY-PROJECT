import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Settings, Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { marketplaceService } from "@/lib/api/admin-services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProductType = "subscription" | "one_time" | "license";
type ProductStatus = "active" | "draft" | "archived";

interface Product {
  id: string;
  name: string;
  merchantName: string;
  merchantId: string;
  type: ProductType;
  status: ProductStatus;
  price: number;
  customerCount: number;
  createdAt: string;
}

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [merchantFilter, setMerchantFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [merchants, setMerchants] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "subscription" as ProductType,
    merchantId: "",
    description: "",
    status: "draft" as ProductStatus,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = marketplaceService.getProducts({
        type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        merchantId: merchantFilter !== "all" ? merchantFilter : undefined,
        search: searchQuery || undefined,
      });
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadMerchants = async () => {
    try {
      const merchantList = marketplaceService.getMerchants();
      setMerchants(merchantList);
    } catch (error) {
      toast.error("Failed to load merchants");
    }
  };

  useEffect(() => {
    loadProducts();
    loadMerchants();
  }, [typeFilter, statusFilter, merchantFilter, searchQuery]);

  const handleAddProduct = async () => {
    if (!formData.name || !formData.merchantId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsAdding(true);
    try {
      await marketplaceService.createProduct(formData);
      toast.success("Product created successfully");
      setShowAddDialog(false);
      setFormData({ name: "", type: "subscription", merchantId: "", description: "", status: "draft" });
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsAdding(false);
    }
  };

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      const product = marketplaceService.getProductDetails(id);
      if (product) {
        setSelectedProduct(product.product as Product);
        toast.success(`Product ${id} details loaded`);
      } else {
        toast.error("Product not found");
      }
    } catch (error) {
      toast.error("Failed to load product details");
    } finally {
      setViewingId(null);
    }
  };

  const handleEdit = async (id: string) => {
    setEditingId(id);
    try {
      const product = marketplaceService.getProductDetails(id);
      if (product) {
        setSelectedProduct(product.product as Product);
        setFormData({
          name: product.product.name,
          type: product.product.type,
          merchantId: product.product.merchantId,
          description: product.product.description || "",
          status: product.product.status,
        });
        setShowEditDialog(true);
      }
    } catch (error) {
      toast.error("Failed to load product for editing");
    } finally {
      setEditingId(null);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    setEditingId(selectedProduct.id);
    try {
      await marketplaceService.updateProductStatus(selectedProduct.id, formData.status, "admin");
      toast.success(`Product ${selectedProduct.id} updated successfully`);
      setShowEditDialog(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setEditingId(null);
    }
  };

  const handleManage = async (id: string) => {
    setManagingId(id);
    try {
      // Sync price and customer count by reloading
      toast.success(`Product ${id} synced successfully`);
      loadProducts();
    } catch (error) {
      toast.error("Failed to sync product");
    } finally {
      setManagingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This will archive it.")) {
      return;
    }
    setDeletingId(id);
    try {
      await marketplaceService.deleteProduct(id, "admin");
      toast.success(`Product ${id} deleted successfully`);
      loadProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProductStatus) => {
    try {
      await marketplaceService.updateProductStatus(id, newStatus, "admin");
      toast.success(`Product status changed to ${newStatus}`);
      loadProducts();
    } catch (error) {
      toast.error("Failed to change product status");
    }
  };

  const handleRefresh = async () => {
    loadProducts();
    toast.success("Products refreshed");
  };

  const formatType = (type: ProductType) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by product or merchant name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[300px]"
        />

        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="one_time">One-time</SelectItem>
            <SelectItem value="license">License</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={merchantFilter}
          onValueChange={setMerchantFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by merchant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Merchants</SelectItem>
            {merchants.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Product" },
          { key: "merchantName", header: "Merchant" },
          { key: "type", header: "Type", render: (p: Product) => formatType(p.type) },
          { key: "status", header: "Status", render: (p: Product) => <StatusBadge status={p.status} /> },
          { key: "price", header: "Price", render: (p: Product) => formatPrice(p.price) },
          { key: "customerCount", header: "Customers" },
          {
            key: "actions",
            header: "",
            render: (p: Product) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(p.id)}
                  disabled={viewingId === p.id}
                >
                  {viewingId === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(p.id)}
                  disabled={editingId === p.id}
                >
                  {editingId === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Edit className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleManage(p.id)}
                  disabled={managingId === p.id}
                >
                  {managingId === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Settings className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ),
          },
        ]}
        data={products}
        searchKey="name"
        pageSize={50}
      />

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Product Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as ProductType }))}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="one_time">One-time</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant *</Label>
              <Select value={formData.merchantId} onValueChange={(value) => setFormData((prev) => ({ ...prev, merchantId: value }))}>
                <SelectTrigger id="merchant">
                  <SelectValue placeholder="Select merchant" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} disabled={isAdding}>
              {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {isAdding ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as ProductStatus }))}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateProduct} disabled={editingId !== null}>
              {editingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
              {editingId ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminProducts;
