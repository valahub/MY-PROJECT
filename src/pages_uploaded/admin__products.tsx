
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Settings, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

({ component: AdminProducts });

const products = [
  {
    id: "pro_001",
    name: "Pro Plan",
    merchant: "Acme Software",
    type: "Subscription",
    status: "active",
    price: "$29/mo",
    customers: 845,
  },
  {
    id: "pro_002",
    name: "Enterprise License",
    merchant: "CloudStack Inc",
    type: "License",
    status: "active",
    price: "$499/yr",
    customers: 120,
  },
  {
    id: "pro_003",
    name: "Starter Kit",
    merchant: "DevTools Pro",
    type: "One-time",
    status: "active",
    price: "$99",
    customers: 2340,
  },
  {
    id: "pro_004",
    name: "Team Plan",
    merchant: "SaaS Builder",
    type: "Subscription",
    status: "draft",
    price: "$79/mo",
    customers: 0,
  },
  {
    id: "pro_005",
    name: "Basic Plugin",
    merchant: "Widget Corp",
    type: "One-time",
    status: "archived",
    price: "$19",
    customers: 567,
  },
  {
    id: "pro_006",
    name: "API Access",
    merchant: "API Hub",
    type: "Subscription",
    status: "active",
    price: "$49/mo",
    customers: 312,
  },
];

const columns = [
  { key: "name", header: "Product" },
  { key: "merchant", header: "Merchant" },
  { key: "type", header: "Type" },
  { key: "status", header: "Status", render: (p: any) => <StatusBadge status={p.status} /> },
  { key: "price", header: "Price" },
  { key: "customers", header: "Customers" },
];

function AdminProducts() {
  const [isAdding, setIsAdding] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);

  const handleAddProduct = async () => {
    setIsAdding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Product added successfully");
    } catch (error) {
      toast.error("Failed to add product");
    } finally {
      setIsAdding(false);
    }
  };

  const handleView = async (id: string) => {
    setViewingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Product ${id} details loaded`);
    } catch (error) {
      toast.error("Failed to load product details");
    } finally {
      setViewingId(null);
    }
  };

  const handleEdit = async (id: string) => {
    setEditingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Product ${id} updated successfully`);
    } catch (error) {
      toast.error("Failed to update product");
    } finally {
      setEditingId(null);
    }
  };

  const handleManage = async (id: string) => {
    setManagingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Managing product ${id}`);
    } catch (error) {
      toast.error("Failed to open product management");
    } finally {
      setManagingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={handleAddProduct} disabled={isAdding}>
          {isAdding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isAdding ? "Adding..." : "Add Product"}
        </Button>
      </div>
      <DataTable
        columns={[
          { key: "name", header: "Product" },
          { key: "merchant", header: "Merchant" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status", render: (p: any) => <StatusBadge status={p.status} /> },
          { key: "price", header: "Price" },
          { key: "customers", header: "Customers" },
          {
            key: "actions",
            header: "",
            render: (p: any) => (
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
              </div>
            ),
          },
        ]}
        data={products}
        searchKey="name"
      />
    </div>
  );
}

export default AdminProducts;
